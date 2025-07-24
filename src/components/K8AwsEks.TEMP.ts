import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as eks from "@pulumi/eks";
import * as kubernetes from "@pulumi/kubernetes";
import { InlineProgramArgs, LocalWorkspaceOptions, UpResult } from "@pulumi/pulumi/automation";
import { BaseController } from '../BaseController';
import { BaseConfig } from '../../models/BaseConfig';
import { AwsEksConfig } from '../../models/AwsEksConfig';
import { DeploymentResult } from '../../models/Template';
import { PulumiStackManager } from "../../services/PulumiStackManager";


export class AwsEksController extends BaseController {
    private awsEksConfig: AwsEksConfig;
    private stackManager: PulumiStackManager | null = null;

    constructor() {
        super();
        this.awsEksConfig = {} as AwsEksConfig;
    }

    configure(config: BaseConfig): void {
        try {
            if (!this.isAwsEksConfig(config)) {
                throw new Error("Invalid AWS EKS configuration provided. Missing required AWS EKS-specific properties.");
            }
            
            this.awsEksConfig = config as AwsEksConfig;

            this.config = this.awsEksConfig;
            this.isConfigured = true;
            console.log('AWS EKS controller configured successfully with:', this.awsEksConfig);
        } catch (error) {
            console.error(`Error configuring AWS EKS controller:`, error);
            throw error;
        }
    }

    private _createPulumiProgram(): pulumi.automation.PulumiFn {
        return async () => {
            const awsConfig = new pulumi.Config("aws");

            const awsProvider = new awsx.Provider("k8s-aws-provider", {
                accessKey: awsConfig.requireSecret("accessKey"),
                secretKey: awsConfig.requireSecret("secretKey"),
                region: awsConfig.require("region") as aws.Region,
            });
            const vpc = new awsx.ec2.DefaultVpc("default-vpc", {}, { provider: awsProvider });

            // Get current AWS caller identity
            const current = aws.getCallerIdentity();
            const currentOutput = pulumi.output(current);
            
            const cluster = new eks.Cluster(this.awsEksConfig.name, {
                ...this.awsEksConfig,
                vpcId: vpc.vpcId,
                privateSubnetIds: vpc.privateSubnetIds,
                // Set authentication mode to support access entries
                authenticationMode: "API_AND_CONFIG_MAP",
                // Add access entries to match the working cluster
                accessEntries: {
                    // The EKS component automatically adds an entry for the current user.
                    // "current-user": {
                    //     principalArn: currentOutput.apply(c => c.arn),
                    //     type: "STANDARD", 
                    //     kubernetesGroups: ["cluster-admins"],
                    // },
                    // SSO role access entry
                    "sso-admin-role": {
                        principalArn: "arn:aws:iam::275662791714:role/aws-reserved/sso.amazonaws.com/AWSReservedSSO_AdministratorAccess_33cfb77ad9632b7c",
                        type: "STANDARD",
                        kubernetesGroups: ["cluster-admins"], // Changed from "system:masters"
                    },
                },
            }, { provider: awsProvider });

            const cloudwatchPodIdentity = new aws.eks.PodIdentityAssociation("cloudwatch-pod-identity", {
                clusterName: cluster.eksCluster.name,
                namespace: "amazon-cloudwatch",
                serviceAccount: "cloudwatch-agent",
                roleArn: pulumi.interpolate`arn:aws:iam::${currentOutput.accountId}:role/ci-benchmark-eks-karpenter`,
            }, { provider: awsProvider });

            const karpenterPodIdentity = new aws.eks.PodIdentityAssociation("karpenter-pod-identity", {
                clusterName: cluster.eksCluster.name,
                namespace: "karpenter",
                serviceAccount: "karpenter",
                roleArn: pulumi.interpolate`arn:aws:iam::${currentOutput.accountId}:role/ci-benchmark-eks-karpenter`,
            }, { provider: awsProvider });

            // Create Kubernetes provider to interact with the cluster
            const k8sProvider = new kubernetes.Provider("k8s-provider", {
                kubeconfig: cluster.kubeconfig,
            });

            // Create a ClusterRoleBinding for the SSO role
            const ssoAdminBinding = new kubernetes.rbac.v1.ClusterRoleBinding("sso-admin-binding", {
                metadata: {
                    name: "sso-admin-cluster-admin-binding",
                },
                roleRef: {
                    apiGroup: "rbac.authorization.k8s.io",
                    kind: "ClusterRole",
                    name: "cluster-admin", // This is a built-in role with full cluster access
                },
                subjects: [{
                    kind: "Group",
                    name: "cluster-admins", // Match the group name used above
                    apiGroup: "rbac.authorization.k8s.io",
                }],
            }, { provider: k8sProvider, dependsOn: cluster });

            // This binding is redundant if the user is part of the 'cluster-admins' group via access entries.
            // // Create a ClusterRoleBinding specifically for the SSO user
            // const ssoUserBinding = new kubernetes.rbac.v1.ClusterRoleBinding("sso-user-binding", {
            //     metadata: {
            //         name: "sso-user-cluster-admin-binding",
            //     },
            //     roleRef: {
            //         apiGroup: "rbac.authorization.k8s.io",
            //         kind: "ClusterRole",
            //         name: "cluster-admin",
            //     },
            //     subjects: [{
            //         kind: "User",
            //         name: "arn:aws:sts::275662791714:assumed-role/AWSReservedSSO_AdministratorAccess_33cfb77ad9632b7c/rodrigo.sagastegui-mongodb.com",
            //         apiGroup: "rbac.authorization.k8s.io",
            //     }],
            // }, { provider: k8sProvider, dependsOn: cluster });

            // Export the kubeconfig
            return {
                kubeconfig: cluster.kubeconfig,
                clusterName: cluster.eksCluster.name,
                clusterEndpoint: cluster.eksCluster.endpoint,
                cloudwatchPodIdentity: cloudwatchPodIdentity.associationId,
                karpenterPodIdentity: karpenterPodIdentity.associationId,
            };
        };
    }

    private _getStackManager(): PulumiStackManager {
        if (!this.isConfigured) {
            throw new Error("Controller is not configured.");
        }

        // Create a unique project name for each cluster to avoid conflicts.
        const projectName = `kozen-eks-${this.awsEksConfig.name}`;
        const stackName = process.env.ENVIRONMENT || "dev";

        const args: InlineProgramArgs = {
            stackName: stackName,
            projectName: projectName,
            program: this._createPulumiProgram(),
        };

        const workspaceOpts: LocalWorkspaceOptions = {
            projectSettings: {
                name: args.projectName,
                runtime: "nodejs",
                backend: { url: process.env.PULUMI_BACKEND_URL || "s3://kozen-pulumi-stacks" },
            },
        };

        return new PulumiStackManager({ args, workspaceOpts });
    }

    async deploy(): Promise<DeploymentResult> {
        if (!this.isReady()) {
            throw new Error("AWS EKS controller is not properly configured. Call configure() first.");
        }

        try {
            console.log(`Deploying AWS EKS cluster: ${this.awsEksConfig.name}`);
            this.stackManager = this._getStackManager();
            const result: UpResult = await this.stackManager.up();

            console.log(`AWS EKS cluster ${this.awsEksConfig.name} deployed successfully`);
            return {
                componentName: this.awsEksConfig.name,
                success: true,
                outputs: this.extractOutputs(result.outputs),
            };
        } catch (error) {
            console.error(`Error deploying AWS EKS cluster ${this.awsEksConfig.name}:`, error);
            return {
                componentName: this.awsEksConfig.name,
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }


    async undeploy(): Promise<void> {
        if (!this.isReady()) {
            throw new Error("AWS EKS controller is not properly configured.");
        }

        try {
            console.log(`Undeploying AWS EKS cluster: ${this.awsEksConfig.name}`);
            // Ensure stack manager is initialized for undeploying, even if deploy wasn't called.
            this.stackManager = this._getStackManager();
            await this.stackManager.destroy();
            console.log(`AWS EKS cluster ${this.awsEksConfig.name} undeployed successfully`);
        } catch (error) {
            console.error(`Error undeploying AWS EKS cluster ${this.awsEksConfig.name}:`, error);
            throw error;
        }
    }


    private isAwsEksConfig(config: BaseConfig): config is AwsEksConfig {
        return 'name' in config &&
            'vpcId' in config &&
            'privateSubnetIds' in config &&
            'fargate' in config;
    }

    protected extractOutputs(result: any): { [key: string]: any } {
        const outputs: { [key: string]: any } = {};

        if (result && result.kubeconfig) {
            outputs.kubeconfig = result.kubeconfig;
        }
        if (result && result.clusterName) {
            outputs.clusterName = result.clusterName;
        }
        if (result && result.clusterEndpoint) {
            outputs.clusterEndpoint = result.clusterEndpoint;
        }

        return outputs;
    }

}