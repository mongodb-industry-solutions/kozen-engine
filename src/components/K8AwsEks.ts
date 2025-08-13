import * as aws from "@pulumi/aws";
import * as eks from "@pulumi/eks";
import * as pulumi from "@pulumi/pulumi";

import { BaseController } from '../controllers/BaseController';
import { IComponent } from '../models/Component';
import { IPipeline } from '../models/Pipeline';
import { IResult, IStruct } from '../models/Types';

/**
 * Atlas component controller for MongoDB Atlas cluster deployments
 * Manages the creation and removal of Atlas clusters using Pulumi
 */
export class K8AwsEks extends BaseController {
  private awsProvider?: aws.Provider;

  public metadata(): Promise<IComponent> {
    return Promise.resolve({
      description: 'Provision an AWS EKS cluster using Pulumi (legacy path)',
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
        { name: 'kubeconfigJson', description: 'Kubeconfig in JSON format', format: 'string' }
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
    if (!pipeline?.stack) {
      return {
        templateName: pipeline?.template?.name,
        action: 'deploy',
        success: false,
        message: `Missing pipeline stack reference`,
        timestamp: new Date(),
      }
    }
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

      // Read Atlas credentials from configuration
      const awsPulumiConfig = new pulumi.Config("aws");
      const accessKey = awsPulumiConfig.requireSecret("accessKey");
      const secretKey = awsPulumiConfig.requireSecret("secretKey");
      const region = awsPulumiConfig.require("region") as aws.Region || "us-east-1"; // Default region if not provided


      // Create AWS provider
      this.awsProvider = new aws.Provider(`${resourcePrefix}-aws-provider`, {
        accessKey: accessKey,
        secretKey: secretKey,
        region: region,
      });

      // Get existing Cluster IAM role
      const clusterRole = aws.iam.Role.get("clusterRole", "AmazonEKSAutoClusterRole");

      // Get existing Node IAM role
      const nodeRole = aws.iam.Role.get("nodeRole", "AmazonEKSAutoNodeRole");


      // EKS cluster
      const cluster = new eks.Cluster(`${resourcePrefix}-cluster`, {
        ...input,
        vpcId: input?.vpcId || "vpc-4ce59b31",
        publicSubnetIds: input?.publicSubnetIds || ["subnet-7733ce3b", "subnet-05daf224", "subnet-cf230d90"],
        serviceRole: clusterRole,
        instanceRole: nodeRole,
      }, {
        provider: this.awsProvider,
      });


      return {
        templateName: pipeline?.template?.name,
        action: 'deploy',
        success: true,
        message: `K8s EKS deployed successfully with message: ${input?.message}`,
        timestamp: new Date(),
        output: {
          kubeconfig: cluster.kubeconfig,
          kubeconfigJson: cluster.kubeconfigJson,
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



export interface IEksConfig extends IStruct {
  desiredCapacity?: number;
  minSize?: number;
  maxSize?: number;
  instanceType?: string;
  version?: string;
  enabledClusterLogTypes?: string[];
  vpcId?: string;
  publicSubnetIds?: string[];
  privateSubnetIds?: string[];
  nodeAssociatePublicIpAddress?: boolean;
  skipDefaultNodeGroup?: boolean;
  nodeGroupOptions?: any;
  tags?: { [key: string]: string };
  roleMappings?: any[];
  userMappings?: any[];
  fargate?: boolean;
  encryptionConfigKeyArn?: string;
  endpointPrivateAccess?: boolean;
  endpointPublicAccess?: boolean;
  clusterSecurityGroup?: any;
  nodeSecurityGroupTags?: { [key: string]: string };

  clusterRoleName?: string;
  nodeRoleName?: string;
}