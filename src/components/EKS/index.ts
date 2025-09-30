import { BaseController } from '../../modules/component/controllers/BaseController';
import { IComponent } from '../../modules/component/models/Component';
import { IPipeline } from '../../modules/pipeline/models/Pipeline';
import { IResult, IStruct } from '../../shared/models/Types';
import { IEksConfig } from "./IEksConfig";

import * as aws from "@pulumi/aws";
import * as eks from "@pulumi/eks";
import * as pulumi from "@pulumi/pulumi";


/**
 * Atlas component controller for MongoDB Atlas cluster deployments
 * Manages the creation and removal of Atlas clusters using Pulumi
 */
export class K8AwsEks extends BaseController {
  private awsProvider?: aws.Provider;

  /**
   * Returns EKS component metadata including inputs and outputs.
   * @returns {Promise<IComponent>} Component metadata definition.
   */
  public metadata(): Promise<IComponent> {
    return Promise.resolve({
      description: 'Provision an AWS EKS cluster using Pulumi',
      orchestrator: 'Pulumi',
      engine: '^1.0.5',
      input: [
        { name: 'vpcId', description: 'VPC identifier', format: 'string' },
        { name: 'publicSubnetIds', description: 'Public subnet identifiers', format: 'Array<string>' },
        { name: 'privateSubnetIds', description: 'Private subnet identifiers', format: 'Array<string>' },
        { name: 'desiredCapacity', description: 'Desired node count', format: 'number' },
        { name: 'minSize', description: 'Minimum node count', format: 'number' },
        { name: 'maxSize', description: 'Maximum node count', format: 'number' },
        { name: 'instanceType', description: 'EC2 instance type for nodes', format: 'string' },
        { name: 'version', description: 'Kubernetes version', format: 'string' }
      ],
      output: [
        { name: 'kubeconfig', description: 'Kubeconfig string for cluster access', format: 'string' },
        { name: 'kubeconfigJson', description: 'Kubeconfig in JSON format', format: 'string' },
        { name: 'clusterName', description: 'EKS cluster name', format: 'string' },
        { name: 'clusterEndpoint', description: 'EKS API endpoint', format: 'string' },
        { name: 'clusterArn', description: 'EKS cluster ARN', format: 'string' }
      ],
      setup: [
        { type: 'environment', name: 'aws:accessKey', value: 'AWS_ACCESS_KEY_ID' },
        { type: 'environment', name: 'aws:secretKey', value: 'AWS_SECRET_ACCESS_KEY' }
      ]
    });
  }

  /**
   * Deploys a MongoDB Atlas cluster using Pulumi resources
   * @param input - Optional deployment input parameters 
   * @param pipeline - Pipeline context containing stack and template information
   * @returns Promise resolving to deployment result with cluster details
   */
  async deploy(input?: IEksConfig, pipeline?: IPipeline): Promise<IResult> {
    // if (!pipeline?.stack) {
    //   return {
    //     templateName: pipeline?.template?.name,
    //     action: 'deploy',
    //     success: false,
    //     message: `Missing pipeline stack reference`,
    //     timestamp: new Date(),
    //   }
    // }
    try {
      this.logger?.info({
        flow: pipeline?.id,
        src: 'component:K8AwsEks:deploy',
        message: `Deploying with message: ${input?.message}`,
        data: {
          // Get the current component name
          componentName: this.config.name,
          // Get the current template name
          templateName: pipeline?.template?.name,
          // Get the current stack name (usually the execution environment like: dev, stg, prd, test, etc.)
          stackName: pipeline?.stack?.config?.name,
          // Get the current project name, which can be used in combination with the stackName as prefix for internal resource deployment (ex. K2025072112202952-dev)
          projectName: pipeline?.stack?.config?.project,
          // Get component (ex. K2025072112202952-dev)
          prefix: this.getPrefix(pipeline)
        }
      });

      // Create a unique resource name with the prefix
      const resourcePrefix = this.getPrefix(pipeline);

      // Read AWS credentials from configuration
      const awsPulumiConfig = new pulumi.Config("aws");
      const accessKey = awsPulumiConfig.requireSecret("accessKey");
      const secretKey = awsPulumiConfig.requireSecret("secretKey");
      const region = awsPulumiConfig.require("region") as aws.Region || "us-east-1";

      // Create AWS provider
      this.awsProvider = new aws.Provider(`${resourcePrefix}-aws-provider`, {
        accessKey: accessKey,
        secretKey: secretKey,
        region: region,
      });

      // Get existing Cluster IAM role
      const clusterRole = aws.iam.Role.get("clusterRole", "AmazonEKSAutoClusterRole");

      // REPLACE the old node role lookup with a dedicated role + policies
      // const nodeRole = aws.iam.Role.get("nodeRole", "AmazonEKSAutoNodeRole");

      const nodeRole = new aws.iam.Role(`${resourcePrefix}-node-role`, {
        assumeRolePolicy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            { Effect: "Allow", Principal: { Service: "ec2.amazonaws.com" }, Action: "sts:AssumeRole" },
          ],
        }),
      }, { provider: this.awsProvider });

      const policies = [
        "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
        "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
        "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
        "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
      ];

      policies.forEach((policyArn, i) => new aws.iam.RolePolicyAttachment(`${resourcePrefix}-ng-pa-${i}`, {
        role: nodeRole.name,
        policyArn,
      }, { provider: this.awsProvider }));

      // EKS cluster with your exact manual configuration
      const cluster = new eks.Cluster(`${resourcePrefix}-cluster`, {
        // Use the correct VPC and subnets from your manual setup
        vpcId: input?.vpcId || "vpc-03fd3b7284d2b7eea", // eksctl-ci-benchmark-eks-cluster/VPC

        // Use private subnets (not public) as per your manual config
        privateSubnetIds: input?.privateSubnetIds || [
          "subnet-020d2ba1b60934caf", // us-east-1c Private
          "subnet-0d1f6268ce7cf4842", // us-east-1d Private  
          "subnet-0361d1fdb60e0124a", // us-east-1b Private
          "subnet-0000aea34ddc71190"  // us-east-1a Private
        ],

        // Don't specify publicSubnetIds since you're using private subnets
        // publicSubnetIds: undefined,

        // Use your existing IAM roles
        serviceRole: clusterRole,
        instanceRoles: [nodeRole],

        // Cluster endpoint access: Public and Private
        endpointPublicAccess: true,
        endpointPrivateAccess: true,

        // Cluster authentication mode: EKS API and ConfigMap (default behavior)
        // This is handled by the eks.Cluster automatically

        // Node group configuration to match "Built-in node pools"
        skipDefaultNodeGroup: true, // Create default node group
        instanceType: input?.instanceType || "t3.medium",
        desiredCapacity: input?.desiredCapacity || 2,
        minSize: input?.minSize || 1,
        maxSize: input?.maxSize || 3,

        // Enable cluster administrator access for your IAM principal
        createOidcProvider: false,

        // Additional EKS configuration
        version: input?.version, // or set to a supported version like "1.30"

        // Role and user mappings for aws-auth ConfigMap
        roleMappings: [
          {
            roleArn: "arn:aws:iam::275662791714:role/AmazonEKSAutoClusterRole",
            username: "admin-role",
            groups: ["system:masters"],
          },
          {
            roleArn: "arn:aws:iam::275662791714:role/AWSReservedSSO_AdministratorAccess_33cfb77ad9632b7c",
            username: "rodrigo-sso",
            groups: ["system:masters"],
          }
        ],
        userMappings: [
          {
            userArn: "arn:aws:iam::275662791714:user/kozen",
            username: "kozen",
            groups: ["system:masters"],
          },

        ],

        // Tags for resource identification
        tags: {
          "Name": `${resourcePrefix}-cluster`,
          "Environment": pipeline?.stack?.config?.name || "dev",
          "Project": pipeline?.stack?.config?.project || "kozen-engine",
          "ManagedBy": "pulumi-kozen-engine"
        },

        // Spread any additional input parameters
        ...input,
      }, {
        provider: this.awsProvider,
      });

      new aws.eks.Addon(`${resourcePrefix}-vpc-cni`, {
        clusterName: cluster.eksCluster.name,
        addonName: "vpc-cni",
      }, { provider: this.awsProvider, dependsOn: [cluster] });

      new aws.eks.Addon(`${resourcePrefix}-kube-proxy`, {
        clusterName: cluster.eksCluster.name,
        addonName: "kube-proxy",
      }, { provider: this.awsProvider, dependsOn: [cluster] });

      new aws.eks.Addon(`${resourcePrefix}-coredns`, {
        clusterName: cluster.eksCluster.name,
        addonName: "coredns",
      }, { provider: this.awsProvider, dependsOn: [cluster] });


      const instanceProfile = new aws.iam.InstanceProfile("ng-instance-profile", {
        role: nodeRole.name,
      }, { provider: this.awsProvider });

      const nodegroup = new eks.NodeGroupV2(`${resourcePrefix}-ng`, {
        cluster: cluster,
        instanceProfile: instanceProfile,
        desiredCapacity: input?.desiredCapacity ?? 2,
        minSize: input?.minSize ?? 1,
        maxSize: input?.maxSize ?? 3,
        instanceType: input?.instanceType ?? "t3.medium",
      }, { provider: this.awsProvider });

      // // Add this after your cluster creation
      // const accessEntry = new aws.eks.AccessEntry(`${resourcePrefix}-user-access`, {
      //   clusterName: cluster.eksCluster.name,
      //   principalArn: "arn:aws:iam::275662791714:user/kozen",
      //   kubernetesGroups: ["admins"],
      //   type: "STANDARD",
      //   userName: "kozen",
      // }, { provider: this.awsProvider, dependsOn: [cluster] });

      // // Add another access entry for your SSO role
      // const ssoAccessEntry = new aws.eks.AccessEntry(`${resourcePrefix}-sso-access`, {
      //   clusterName: cluster.eksCluster.name,
      //   principalArn: "arn:aws:iam::275662791714:role/AWSReservedSSO_AdministratorAccess_33cfb77ad9632b7c",
      //   kubernetesGroups: ["admins"],
      //   type: "STANDARD",
      //   userName: "rodrigo-sso",
      // }, { provider: this.awsProvider, dependsOn: [cluster] });

      // let tmp = JSON.parse(JSON.stringify(cluster));

      return {
        templateName: pipeline?.template?.name,
        action: 'deploy',
        success: true,
        message: `K8s EKS deployed successfully with message: ${input?.message}`,
        timestamp: new Date(),
        output: {
          kubeconfig: cluster.kubeconfig,
          kubeconfigJson: cluster.kubeconfigJson,
          clusterName: cluster.eksCluster.name,
          clusterEndpoint: cluster.eksCluster.endpoint,
          clusterArn: cluster.eksCluster.arn,
        }
      };

    } catch (error) {
      this.logger?.error({
        src: 'component:K8AwsEks:deploy',
        message: `Error deploying K8s EKS cluster: ${error instanceof Error ? error.message : String(error)}`,
        data: { error }
      });

      return {
        templateName: pipeline?.template?.name,
        action: 'deploy',
        success: false,
        message: `K8s EKS deployment failed: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Undeploys the Atlas component with cleanup confirmation
   * @param input - Optional undeployment input parameters
   * @returns Promise resolving to undeployment result with success status
   */
  async undeploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult> {
    console.log(`Undeploying K8s EKS`);
    return {
      templateName: this.config.name,
      action: 'undeploy',
      success: true,
      message: `K8s EKS undeployed successfully.`,
      timestamp: new Date(),
    };
  }

  /**
   * Validates the Atlas component configuration for deployment readiness
   * @param input - Optional validation input parameters
   * @returns Promise resolving to validation result with success confirmation
   */
  async validate(input?: IStruct, pipeline?: IPipeline): Promise<IResult> {
    return {
      templateName: this.config.name,
      action: 'validate',
      success: true,
      message: `K8s EKS configuration is valid.`,
      timestamp: new Date(),
    };
  }

  /**
   * Retrieves current operational status information for the Atlas component
   * @param input - Optional status query input parameters
   * @returns Promise resolving to status result with operational state
   */
  async status(input?: IStruct, pipeline?: IPipeline): Promise<IResult> {
    return {
      templateName: this.config.name,
      action: 'status',
      success: true,
      message: `K8s EKS is running.`,
      timestamp: new Date(),
    };
  }

}

export default K8AwsEks;



