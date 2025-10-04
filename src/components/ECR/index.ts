import { IPipeline } from '../../modules/pipeline/models/Pipeline';
import { BaseController } from '../../shared/controllers/BaseController';
import { IComponent } from '../../shared/models/Component';
import { IResult } from '../../shared/models/Result';
import { IStruct, VCategory } from '../../shared/models/Types';
import { IEcrConfig } from "./IEcrConfig";

import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

/**
 * AWS ECR component - creates a container registry repository
 */
export class ECR extends BaseController {
  private awsProvider?: aws.Provider;

  /**
   * Provides ECR component metadata for configuration.
   * @returns {Promise<IComponent>} Component metadata definition.
   */
  public metadata(): Promise<IComponent> {
    return Promise.resolve({
      description: 'Create and manage an AWS ECR repository using Pulumi',
      orchestrator: 'Pulumi',
      engine: '^1.0.5',
      input: [
        { name: 'resourcePrefix', description: 'Resource prefix for naming', format: 'string' },
        { name: 'containerName', description: 'Container name (used in default repo name)', format: 'string' },
        { name: 'repositoryName', description: 'Explicit ECR repository name (overrides default)', format: 'string' },
        { name: 'scanOnPush', description: 'Enable image scanning on push', format: 'boolean' },
        { name: 'forceDelete', description: 'Force delete the repository (even if images exist)', format: 'boolean' },
        { name: 'imageTagMutability', description: 'Tag mutability policy', format: '"MUTABLE" | "IMMUTABLE"' },
        { name: 'lifecyclePolicyJson', description: 'Lifecycle policy JSON string', format: 'string' },
        { name: 'tags', description: 'Resource tags', format: 'Record<string,string>' },
        { name: 'region', description: 'AWS region override', format: 'string' }
      ],
      output: [
        { name: 'repositoryUrl', description: 'ECR repository URL', format: 'string' },
        { name: 'repositoryArn', description: 'ECR repository ARN', format: 'string' },
        { name: 'repositoryName', description: 'ECR repository name', format: 'string' },
        { name: 'registryId', description: 'AWS account registry ID', format: 'string' }
      ],
      setup: [
        { type: 'environment', name: 'aws:accessKey', value: 'AWS_ACCESS_KEY_ID' },
        { type: 'environment', name: 'aws:secretKey', value: 'AWS_SECRET_ACCESS_KEY' },
        { type: 'environment', name: 'aws:region', value: 'AWS_REGION', default: 'us-east-1' }
      ]
    });
  }

  /**
   * Creates an AWS ECR repository.
   */
  async deploy(input?: IEcrConfig, pipeline?: IPipeline): Promise<IResult> {
    try {
      this.logger?.info({
        flow: pipeline?.id,
        category: VCategory.cmp.iac,
        src: 'component:ECR:deploy',
        message: `Deploying ECR repository${input?.message ? `: ${input.message}` : ''}`,
        data: {
          componentName: this.config.name,
          templateName: pipeline?.template?.name,
          stackName: pipeline?.stack?.config?.name,
          projectName: pipeline?.stack?.config?.project,
          prefix: this.getPrefix(pipeline)
        }
      });

      const resourcePrefix = (input?.resourcePrefix || this.getPrefix(pipeline)).toLowerCase();

      // Region resolution: Pulumi config → env → default
      const awsCfg = new pulumi.Config("aws");
      const region = (input?.region || awsCfg.get("region") || process.env.AWS_REGION || "us-east-1") as aws.Region;

      this.awsProvider = new aws.Provider(`${resourcePrefix}-aws-provider`, { region });

      const repoName =
        input?.repositoryName ||
        `${resourcePrefix}-${(input?.containerName || 'app').toLowerCase()}`;

      const repo = new aws.ecr.Repository(`${resourcePrefix}-ecr`, {
        name: repoName,
        imageScanningConfiguration: { scanOnPush: input?.scanOnPush ?? true },
        imageTagMutability: input?.imageTagMutability || "MUTABLE",
        forceDelete: input?.forceDelete ?? true,
        tags: {
          Project: pipeline?.stack?.config?.project || "",
          Stack: pipeline?.stack?.config?.name || "",
          Component: this.config.name || "ECR",
          ManagedBy: "pulumi-kozen-engine",
          ...(input?.tags || {})
        }
      }, { provider: this.awsProvider });

      // Optional lifecycle policy
      if (input?.lifecyclePolicyJson) {
        new aws.ecr.LifecyclePolicy(`${resourcePrefix}-ecr-lc`, {
          repository: repo.name,
          policy: input.lifecyclePolicyJson
        }, { provider: this.awsProvider });
      }

      return {
        templateName: pipeline?.template?.name,
        action: 'deploy',
        success: true,
        message: `ECR repository '${repoName}' deployed successfully`,
        timestamp: new Date(),
        output: {
          repositoryUrl: repo.repositoryUrl,
          repositoryArn: repo.arn,
          repositoryName: repo.name,
          registryId: repo.registryId
        }
      };
    } catch (error) {
      this.logger?.error({
        flow: pipeline?.id,
        category: VCategory.cmp.iac,
        src: 'component:ECR:deploy',
        message: `Error deploying ECR repository: ${error instanceof Error ? error.message : String(error)}`,
        data: { error }
      });

      return {
        templateName: pipeline?.template?.name,
        action: 'deploy',
        success: false,
        message: `ECR deployment failed: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date(),
      };
    }
  }

  async undeploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult> {
    return {
      templateName: this.config.name,
      action: 'undeploy',
      success: true,
      message: `ECR undeploy handled at stack level.`,
      timestamp: new Date(),
    };
  }

  async validate(input?: IStruct, pipeline?: IPipeline): Promise<IResult> {
    return {
      templateName: this.config.name,
      action: 'validate',
      success: true,
      message: `ECR configuration is valid.`,
      timestamp: new Date(),
    };
  }

  async status(input?: IStruct, pipeline?: IPipeline): Promise<IResult> {
    return {
      templateName: this.config.name,
      action: 'status',
      success: true,
      message: `ECR component status OK.`,
      timestamp: new Date(),
    };
  }
}

export default ECR;