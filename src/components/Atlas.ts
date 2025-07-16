import * as pulumi from "@pulumi/pulumi";
import * as mongodbatlas from "@pulumi/mongodbatlas";
import { InlineProgramArgs, LocalWorkspaceOptions, UpResult } from "@pulumi/pulumi/automation";
import { BaseController } from '../controllers/BaseController';
import { BaseConfig } from '../../../tmp/models/BaseConfig';
import { AtlasConfig } from '../../../tmp/models/AtlasConfig';
import { DeploymentResult } from '../../../tmp/models/Template';
import { StackManager } from "../../../tmp/services/StackManager";

/**
 * Controller class for managing MongoDB Atlas cluster deployments.
 * This controller handles the creation, configuration, and management of MongoDB Atlas clusters
 * using the Atlas API. It supports various cluster types, replication configurations,
 * and advanced features like backup and auto-scaling.
 * 
 * The controller integrates with Pulumi to manage Atlas resources as infrastructure as code,
 * providing declarative cluster management with state tracking and automated rollbacks.
 * 
 * @class AtlasController
 * @extends BaseController
 * @since 1.0.0
 * @example
 * ```typescript
 * const controller = new AtlasController();
 * controller.configure({
 *   name: "production-cluster",
 *   region: "us-east-1",
 *   providerName: "AWS",
 *   clusterType: "REPLICASET",
 *   mongoDbMajorVersion: "8.0",
 *   providerInstanceSizeName: "M10",
 *   cloudBackup: true
 * });
 * 
 * const result = await controller.deploy();
 * console.log('Atlas cluster deployed:', result.outputs?.atlasConnectionUrl);
 * ```
 */
export class AtlasController extends BaseController {
    private atlasConfig: AtlasConfig;
    private stackManager: StackManager | null = null;

    /**
     * Constructs a new AtlasController instance.
     * Initializes the base controller and sets up Atlas-specific properties.
     * The controller is ready to be configured with Atlas cluster specifications.
     * 
     * @constructor
     * @memberof AtlasController
     */
    constructor() {
        super();
        this.atlasConfig = {} as AtlasConfig;
    }

    /**
     * Configures the Atlas controller with the provided configuration.
     * Validates that the configuration contains all required Atlas-specific properties
     * and prepares the controller for cluster deployment.
     * 
     * @param {BaseConfig} config - The configuration object containing Atlas cluster specifications
     * @throws {Error} If the configuration is invalid or missing required Atlas properties
     * @example
     * ```typescript
     * controller.configure({
     *   name: "my-cluster",
     *   region: "us-east-1",
     *   providerName: "AWS",
     *   clusterType: "REPLICASET",
     *   replicationSpecs: [{
     *     numShards: 1,
     *     regionsConfigs: [{
     *       regionName: "US_EAST_1",
     *       electableNodes: 3,
     *       priority: 7,
     *       readOnlyNodes: 0
     *     }]
     *   }],
     *   mongoDbMajorVersion: "8.0",
     *   providerInstanceSizeName: "M10",
     *   cloudBackup: true,
     *   autoScalingDiskGbEnabled: true
     * });
     * ```
     * @memberof AtlasController
     */
    configure(config: BaseConfig): void {
        try {
            if (!this.isAtlasConfig(config)) {
                throw new Error("Invalid Atlas configuration provided. Missing required Atlas-specific properties.");
            }
            
            this.atlasConfig = config as AtlasConfig;

            // --- FIX STARTS HERE ---
            // If the top-level region is missing, derive it from the replication specs.
            // This satisfies the BaseController's validation requirement.
            if (!this.atlasConfig.region && this.atlasConfig.replicationSpecs?.[0]?.regionsConfigs?.[0]?.regionName) {
                this.atlasConfig.region = this.atlasConfig.replicationSpecs[0].regionsConfigs[0].regionName;
                console.log(`Derived primary region '${this.atlasConfig.region}' from replication specs.`);
            }
            // --- FIX ENDS HERE ---

            this.config = this.atlasConfig;
            this.isConfigured = true;
            console.log(`Atlas controller configured for cluster: ${this.atlasConfig.name}`);
        } catch (error) {
            console.error(`Error configuring Atlas controller:`, error);
            throw error;
        }
    }

    /**
     * Creates a dynamic Pulumi program to deploy an Atlas cluster based on the current configuration.
     * @returns A Pulumi program function (PulumiFn).
     */
    private _createPulumiProgram(): pulumi.automation.PulumiFn {
        // Capture the controller's config to use inside the Pulumi program closure.
        const clusterConfig = this.atlasConfig;

        return async () => {
            // This code is executed by the Pulumi engine.
            const atlasPulumiConfig = new pulumi.Config("mongodb-atlas");

            // --- FIX STARTS HERE ---
            // Explicitly read all required secrets from the config.
            const publicKey = atlasPulumiConfig.requireSecret("publicKey");
            const privateKey = atlasPulumiConfig.requireSecret("privateKey");
            const projectId = atlasPulumiConfig.requireSecret("projectId");

            // Create an explicit Atlas provider instance. This removes any ambiguity
            // about which credentials are being used.
            const atlasProvider = new mongodbatlas.Provider("kozen-atlas-provider", {
                publicKey: publicKey,
                privateKey: privateKey,
            });

            // Create the cluster using the configuration and pass the explicit provider.
            const cluster = new mongodbatlas.Cluster(clusterConfig.name, {
                ...clusterConfig, // Spread the config from the JSON template
                projectId: projectId, // Override projectId with the one from config
            }, { provider: atlasProvider }); // Pass the explicit provider here.
            // --- FIX ENDS HERE ---

            // Define stack outputs
            return {
                atlasConnectionUrl: cluster.connectionStrings.apply(cs => cs[0]?.standardSrv || ""),
                clusterId: cluster.id,
            };
        };
    }

    /**
     * Initializes and returns the StackManager for the current configuration.
     * This ensures the manager is created with the correct program and settings.
     */
    private _getStackManager(): StackManager {
        if (!this.isConfigured) {
            throw new Error("Controller is not configured.");
        }

        // Create a unique project name for each cluster to avoid conflicts.
        const projectName = `kozen-atlas-${this.atlasConfig.name}`;
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

        return new StackManager({ args, workspaceOpts });
    }

    /**
     * Deploys a MongoDB Atlas cluster using the current configuration.
     * Creates the cluster with specified replication settings, enables features like
     * backup and auto-scaling, and handles IP whitelisting if inputs are provided.
     * 
     * @returns {Promise<DeploymentResult>} Promise resolving to deployment result with cluster outputs
     * @throws {Error} If the deployment fails or the controller is not properly configured
     * @example
     * ```typescript
     * const result = await controller.deploy();
     * if (result.success) {
     *   console.log('Cluster connection URL:', result.outputs.atlasConnectionUrl);
     *   console.log('Cluster public IP:', result.outputs.atlasPublicIp);
     * } else {
     *   console.error('Deployment failed:', result.error);
     * }
     * ```
     * @memberof AtlasController
     */
    async deploy(input): Promise<DeploymentResult> {
        if (!this.isReady()) {
            throw new Error("Atlas controller is not properly configured. Call configure() first.");
        }

        // input.ipValue

        try {
            console.log(`Deploying Atlas cluster: ${this.atlasConfig.name}`);
            this.stackManager = this._getStackManager();
            const result: UpResult = await this.stackManager.up();

            console.log(`Atlas cluster ${this.atlasConfig.name} deployed successfully`);
            return {
                componentName: this.atlasConfig.name,
                success: true,
                outputs: this.extractOutputs(result.outputs),
            };
        } catch (error) {
            console.error(`Error deploying Atlas cluster ${this.atlasConfig.name}:`, error);
            return {
                componentName: this.atlasConfig.name,
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Undeploys the MongoDB Atlas cluster and cleans up all associated resources.
     * Removes the cluster, any IP access lists, and other Atlas resources that were
     * created during deployment. This operation is irreversible and will delete all data.
     * 
     * @returns {Promise<void>} Promise that resolves when the cluster is fully removed
     * @throws {Error} If the undeployment fails or encounters critical errors
     * @example
     * ```typescript
     * await controller.undeploy();
     * console.log('Atlas cluster has been completely removed');
     * ```
     * @memberof AtlasController
     */
    async undeploy(): Promise<void> {
        if (!this.isReady()) {
            throw new Error("Atlas controller is not properly configured.");
        }

        try {
            console.log(`Undeploying Atlas cluster: ${this.atlasConfig.name}`);
            // Ensure stack manager is initialized for undeploying, even if deploy wasn't called.
            this.stackManager = this._getStackManager();
            await this.stackManager.destroy();
            console.log(`Atlas cluster ${this.atlasConfig.name} undeployed successfully`);
        } catch (error) {
            console.error(`Error undeploying Atlas cluster ${this.atlasConfig.name}:`, error);
            throw error;
        }
    }

    /**
     * Type guard function to check if the provided configuration is a valid AtlasConfig.
     * Validates that all required Atlas-specific properties are present in the configuration.
     * 
     * @private
     * @param {BaseConfig} config - The configuration object to validate
     * @returns {config is AtlasConfig} True if the config is a valid AtlasConfig
     * @example
     * ```typescript
     * if (this.isAtlasConfig(config)) {
     *   // config is now typed as AtlasConfig
     *   console.log('Cluster type:', config.clusterType);
     * }
     * ```
     * @memberof AtlasController
     */
    private isAtlasConfig(config: BaseConfig): config is AtlasConfig {
        return 'clusterType' in config && 
               'replicationSpecs' in config && 
               'cloudBackup' in config &&
               'mongoDbMajorVersion' in config &&
               'providerInstanceSizeName' in config;
    }

    /**
     * Extracts and maps outputs from Atlas deployment results to the expected output format.
     * Maps Atlas-specific output values to the names defined in the component's output configuration.
     * This method handles various output types including connection URLs and IP addresses.
     * 
     * @protected
     * @param {any} result - The deployment result containing Atlas cluster information
     * @returns {Object.<string, any>} Object containing mapped output values
     * @example
     * ```typescript
     * const outputs = this.extractOutputs({
     *   atlasConnectionUrl: "mongodb+srv://cluster.mongodb.net/test",
     *   atlasPublicIp: "203.0.113.1"
     * });
     * // Returns: { atlasConnectionUrl: "mongodb+srv://...", ipAddress: "203.0.113.1" }
     * ```
     * @memberof AtlasController
     */
    protected extractOutputs(result: any): { [key: string]: any } {
        const outputs: { [key: string]: any } = {};
        
        if (this.config.output) {
            this.config.output.forEach(outputDef => {
                switch (outputDef.name) {
                    case 'atlasConnectionUrl':
                        outputs[outputDef.name] = result.atlasConnectionUrl?.value;
                        break;
                    case 'atlasPublicIp':
                    case 'ipAddress':
                        // Note: Public IP is not a direct output of the Cluster resource.
                        // This would require additional resources like Network Peering to expose.
                        outputs[outputDef.name] = result.atlasPublicIp?.value || "N/A";
                        break;
                    default:
                        outputs[outputDef.name] = result[outputDef.name]?.value || null;
                }
            });
        }
        
        return outputs;
    }
}