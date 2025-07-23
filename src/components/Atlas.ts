import * as pulumi from "@pulumi/pulumi";
import * as mongodbatlas from "@pulumi/mongodbatlas";

import { BaseController } from '../controllers/BaseController';
import { IPipeline } from '../models/Pipeline';
import { IResult, IStruct } from '../models/Types';

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
      const publicKey = atlasPulumiConfig.requireSecret("publicKey");
      const privateKey = atlasPulumiConfig.requireSecret("privateKey");
      const projectId = atlasPulumiConfig.requireSecret("projectId");

      // Create a unique resource name with the prefix
      const resourcePrefix = this.getPrefix(pipeline);
      
      // Atlas provider
      this.atlasProvider = new mongodbatlas.Provider(`${resourcePrefix}-atlas-provider`, {
        publicKey: publicKey,
        privateKey: privateKey,
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



export interface IAtlasConfig extends IStruct {

    providerName?: string;
    /**
     * The type of MongoDB cluster to deploy.
     * - REPLICASET: A standard replica set cluster (recommended for most use cases)
     * - SHARDED: A sharded cluster for horizontal scaling (for large datasets)
     * 
     * @type {"REPLICASET" | "SHARDED"}
     * @example "REPLICASET"
     */
    clusterType: "REPLICASET" | "SHARDED";

    /**
     * Array of replication specifications that define the cluster's topology.
     * Each specification defines the number of shards and the configuration
     * for each region where the cluster will be deployed.
     * 
     * @type {Array<{numShards: number, regionsConfigs: Array<{regionName: string, electableNodes: number, priority: number, readOnlyNodes: number}>}>}
     * @example
     * ```typescript
     * replicationSpecs: [{
     *   numShards: 1,
     *   regionsConfigs: [{
     *     regionName: "US_EAST_1",
     *     electableNodes: 3,
     *     priority: 7,
     *     readOnlyNodes: 0
     *   }]
     * }]
     * ```
     */
    replicationSpecs: Array<{
        /**
         * Number of shards for this replication specification.
         * For REPLICASET clusters, this should be 1.
         * For SHARDED clusters, this can be multiple shards.
         * 
         * @type {number}
         * @minimum 1
         * @example 1
         */
        numShards: number;

        /**
         * Array of region configurations for this replication specification.
         * Defines how the cluster nodes are distributed across different regions.
         * 
         * @type {Array<{regionName: string, electableNodes: number, priority: number, readOnlyNodes: number}>}
         */
        regionsConfigs: Array<{
            /**
             * The Atlas region name where nodes will be deployed.
             * Must be a valid MongoDB Atlas region identifier.
             * 
             * @type {string}
             * @example "US_EAST_1" | "US_WEST_2" | "EU_WEST_1"
             */
            regionName: string;

            /**
             * Number of electable nodes (voting members) in this region.
             * These nodes can become primary and participate in elections.
             * 
             * @type {number}
             * @minimum 1
             * @example 3
             */
            electableNodes: number;

            /**
             * Election priority for nodes in this region.
             * Higher values have higher priority to become primary.
             * 
             * @type {number}
             * @minimum 0
             * @maximum 100
             * @example 7
             */
            priority: number;

            /**
             * Number of read-only nodes in this region.
             * These nodes cannot become primary but can serve read operations.
             * 
             * @type {number}
             * @minimum 0
             * @example 0
             */
            readOnlyNodes: number;
        }>;
    }>;

    /**
     * Whether to enable cloud backup for this cluster.
     * When enabled, Atlas will automatically create backups of your data.
     * 
     * @type {boolean}
     * @default true
     * @example true
     */
    cloudBackup: boolean;

    /**
     * Whether to enable automatic disk scaling for this cluster.
     * When enabled, Atlas will automatically increase storage capacity as needed.
     * 
     * @type {boolean}
     * @default true
     * @example true
     */
    autoScalingDiskGbEnabled: boolean;

    /**
     * The major version of MongoDB to deploy.
     * Should be a valid MongoDB version number.
     * 
     * @type {string}
     * @example "8.0" | "7.0" | "6.0"
     */
    mongoDbMajorVersion: string;

    /**
     * The instance size name for the cluster nodes.
     * This determines the compute and memory resources allocated to each node.
     * 
     * @type {string}
     * @example "M10" | "M20" | "M30" | "M40" | "M50" | "M60" | "M80"
     */
    providerInstanceSizeName: string;

    /**
     * Optional array of labels to apply to the cluster for organization and billing.
     * Labels are key-value pairs that help categorize and manage resources.
     * 
     * @type {Array<{key: string, value: string}>}
     * @optional
     * @example
     * ```typescript
     * labels: [
     *   { key: "environment", value: "production" },
     *   { key: "team", value: "backend" },
     *   { key: "cost-center", value: "engineering" }
     * ]
     * ```
     */
    labels?: Array<{ key: string; value: string }>;
} 