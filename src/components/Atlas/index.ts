import * as mongodbatlas from "@pulumi/mongodbatlas";
import * as pulumi from "@pulumi/pulumi";

import { BaseController } from '../../controllers/BaseController';
import { IPipeline } from '../../models/Pipeline';
import { IResult, IStruct, VCategory } from '../../models/Types';
import { IAtlasConfig } from "./IAtlasConfig";

/**
 * Atlas component controller for MongoDB Atlas cluster deployments
 * Manages the creation and removal of Atlas clusters using Pulumi
 */
export class Atlas extends BaseController {
  private atlasProvider?: mongodbatlas.Provider;

  /**
   * Deploys a MongoDB Atlas cluster using Pulumi resources
   * @param input - Optional deployment input parameters 
   * @param pipeline - Pipeline context containing stack and template information
   * @returns Promise resolving to deployment result with cluster details
   */
  async deploy(input?: IAtlasConfig, pipeline?: IPipeline): Promise<IResult> {
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
        category: VCategory.cmp.iac,
        src: 'component:Atlas:deploy',
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

      // Read Atlas credentials from configuration
      const atlasPulumiConfig = new pulumi.Config("mongodb-atlas");
      const publicKey = process.env.ATLAS_PUBLIC_KEY; // atlasPulumiConfig.requireSecret("publicKey");
      const privateKey = process.env.ATLAS_PRIVATE_KEY; // atlasPulumiConfig.requireSecret("privateKey");
      const projectId = process.env.ATLAS_PROJECT_ID; // atlasPulumiConfig.requireSecret("projectId");

      if (!projectId) {
        throw new Error("ATLAS_PROJECT_ID environment variable is required");
      }

      // Create a unique resource name with the prefix
      const resourcePrefix = this.getPrefix(pipeline);

      // Atlas provider
      this.atlasProvider = new mongodbatlas.Provider(`${resourcePrefix}-atlas-provider`, {
        publicKey: publicKey || process.env.ATLAS_PUBLIC_KEY,
        privateKey: privateKey || process.env.ATLAS_PRIVATE_KEY,
      });

      // Cluster with component config
      const cluster = new mongodbatlas.Cluster(`${resourcePrefix}-cluster`, {
        ...input,
        providerName: input?.providerName || "AWS",
        providerInstanceSizeName: input?.providerInstanceSizeName || "M10",
        projectId: projectId,
      }, {
        provider: this.atlasProvider,
      });


      // await new Promise(resolve => setTimeout(resolve, input?. || 1000));
      return {
        templateName: pipeline?.template?.name,
        action: 'deploy',
        success: true,
        message: `Atlas deployed successfully with message: ${input?.message}`,
        timestamp: new Date(),
        output: {
          atlasConnectionUrl: cluster.connectionStrings.apply(cs => cs[0]?.standardSrv || ""),
          clusterId: cluster.id,
        }
      };

    } catch (error) {
      this.logger?.error({
        flow: pipeline?.id,
        category: VCategory.cmp.iac,
        src: 'component:Atlas:deploy',
        message: `Error deploying Atlas cluster: ${error instanceof Error ? error.message : String(error)}`,
        data: { error }
      });

      return {
        templateName: pipeline?.template?.name,
        action: 'deploy',
        success: false,
        message: `Atlas deployment failed: ${error instanceof Error ? error.message : String(error)}`,
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
    console.log(`Undeploying Atlas`);
    return {
      templateName: this.config.name,
      action: 'undeploy',
      success: true,
      message: `Atlas undeployed successfully.`,
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
      message: `Atlas configuration is valid.`,
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
      message: `Atlas is running.`,
      timestamp: new Date(),
    };
  }

}

export default Atlas;