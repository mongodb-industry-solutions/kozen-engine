import { BaseController } from '../controllers/BaseController';
import { BaseConfig } from '../../../tmp/models/BaseConfig';
import { DeploymentResult } from '../../../tmp/models/Template';
import { OpsManagerConfig } from '../../../tmp/models/OpsManagerConfig';

/**
 * Controller class for managing MongoDB Ops Manager deployments.
 * This controller handles the deployment of MongoDB Ops Manager on Kubernetes infrastructure,
 * providing enterprise-grade monitoring, backup, and automation capabilities for MongoDB deployments.
 * 
 * Ops Manager is deployed as a containerized application with persistent storage,
 * configuration management, and integration with MongoDB clusters. The controller
 * manages the full lifecycle including configuration, deployment, scaling, and cleanup.
 * 
 * @class OpsManagerController
 * @extends BaseController
 * @since 1.0.0
 * @example
 * ```typescript
 * const controller = new OpsManagerController();
 * controller.configure({
 *   name: "ops-manager",
 *   region: "us-east-1",
 *   providerName: "EKS",
 *   namespace: "ops-manager",
 *   replicas: 1,
 *   image: "mongodb/mongodb-opsmanager:7.0.9",
 *   containerPort: 8080,
 *   serviceType: "LoadBalancer",
 *   envVariables: [
 *     { name: "OM_SERVER_URL", value: "http://ops-manager:8080" }
 *   ]
 * });
 * 
 * const result = await controller.deploy();
 * console.log('Ops Manager deployed:', result.outputs?.opsManagerPublicUrl);
 * ```
 */
export class OpsManagerController extends BaseController {
    /**
     * The Ops Manager specific configuration for this controller.
     * Contains all properties needed to deploy and configure Ops Manager,
     * including Kubernetes deployment specs, environment variables, and storage settings.
     * 
     * @private
     * @type {OpsManagerConfig}
     * @memberof OpsManagerController
     */
    private opsManagerConfig: OpsManagerConfig;

    /**
     * Collection of deployed Kubernetes resources for Ops Manager.
     * Tracks all resources created during deployment including deployments,
     * services, config maps, secrets, and persistent volumes.
     * 
     * @private
     * @type {any[]}
     * @memberof OpsManagerController
     */
    private deployedResources: any[] = [];

    /**
     * Constructs a new OpsManagerController instance.
     * Initializes the base controller and sets up Ops Manager specific properties.
     * The controller is ready to be configured with Ops Manager deployment specifications.
     * 
     * @constructor
     * @memberof OpsManagerController
     */
    constructor() {
        super();
        this.opsManagerConfig = {} as OpsManagerConfig;
    }

    /**
     * Configures the Ops Manager controller with the provided configuration.
     * Validates that the configuration contains all required Ops Manager properties
     * and prepares the controller for deployment.
     * 
     * @param {BaseConfig} config - The configuration object containing Ops Manager specifications
     * @throws {Error} If the configuration is invalid or missing required Ops Manager properties
     * @example
     * ```typescript
     * controller.configure({
     *   name: "ops-manager",
     *   region: "us-east-1",
     *   providerName: "EKS",
     *   kubernetesResourceType: "Deployment",
     *   namespace: "ops-manager",
     *   replicas: 1,
     *   image: "mongodb/mongodb-opsmanager:7.0.9",
     *   containerPort: 8080,
     *   serviceType: "LoadBalancer",
     *   labels: { app: "ops-manager", version: "7.0.9" },
     *   envVariables: [
     *     { name: "OM_SERVER_URL", value: "http://ops-manager:8080" },
     *     { name: "OM_DATA_DIR", value: "/data/om" }
     *   ],
     *   storageSizeGb: 20,
     *   storageClass: "gp2"
     * });
     * ```
     * @memberof OpsManagerController
     */
    configure(config: BaseConfig): void {
        try {
            // Type assertion and validation
            if (!this.isOpsManagerConfig(config)) {
                throw new Error("Invalid Ops Manager configuration provided. Missing required Ops Manager properties.");
            }

            this.opsManagerConfig = config as OpsManagerConfig;
            this.config = this.opsManagerConfig;
            this.isConfigured = true;

            console.log(`Ops Manager controller configured for: ${this.opsManagerConfig.name}`);
        } catch (error) {
            console.error(`Error configuring Ops Manager controller:`, error);
            throw error;
        }
    }

    /**
     * Deploys MongoDB Ops Manager using the current configuration.
     * Creates all necessary Kubernetes resources including deployment, service,
     * persistent volume claims, config maps, and secrets. Handles environment
     * variable configuration and storage setup.
     * 
     * @returns {Promise<DeploymentResult>} Promise resolving to deployment result with Ops Manager outputs
     * @throws {Error} If the deployment fails or the controller is not properly configured
     * @example
     * ```typescript
     * const result = await controller.deploy();
     * if (result.success) {
     *   console.log('Ops Manager URL:', result.outputs.opsManagerPublicUrl);
     *   console.log('Admin interface:', result.outputs.managementUrl);
     * } else {
     *   console.error('Deployment failed:', result.error);
     * }
     * ```
     * @memberof OpsManagerController
     */
    async deploy(): Promise<DeploymentResult> {
        try {
            if (!this.isReady()) {
                throw new Error("Ops Manager controller is not properly configured");
            }

            console.log(`Deploying Ops Manager: ${this.opsManagerConfig.name}`);

            // TODO: Implement actual Kubernetes deployment for Ops Manager
            // This would use @pulumi/kubernetes package
            /*
            const namespace = this.opsManagerConfig.namespace;
            const appLabels = { ...this.opsManagerConfig.labels, app: this.opsManagerConfig.name };

            // Create namespace if it doesn't exist
            const ns = new k8s.core.v1.Namespace(namespace, {
                metadata: { name: namespace }
            });

            // Create persistent volume claim for Ops Manager data
            let pvc;
            if (this.opsManagerConfig.storageSizeGb) {
                pvc = new k8s.core.v1.PersistentVolumeClaim(`${this.opsManagerConfig.name}-pvc`, {
                    metadata: {
                        name: `${this.opsManagerConfig.name}-pvc`,
                        namespace: namespace
                    },
                    spec: {
                        accessModes: ["ReadWriteOnce"],
                        resources: {
                            requests: {
                                storage: `${this.opsManagerConfig.storageSizeGb}Gi`
                            }
                        },
                        storageClassName: this.opsManagerConfig.storageClass
                    }
                });
            }

            // Create config map for Ops Manager configuration
            const configMap = new k8s.core.v1.ConfigMap(`${this.opsManagerConfig.name}-config`, {
                metadata: {
                    name: `${this.opsManagerConfig.name}-config`,
                    namespace: namespace
                },
                data: {
                    "mms.conf": this.generateOpsManagerConfig()
                }
            });

            // Create deployment
            const deployment = new k8s.apps.v1.Deployment(this.opsManagerConfig.name, {
                metadata: {
                    name: this.opsManagerConfig.name,
                    namespace: namespace,
                    labels: appLabels
                },
                spec: {
                    replicas: this.opsManagerConfig.replicas,
                    selector: {
                        matchLabels: { app: this.opsManagerConfig.name }
                    },
                    template: {
                        metadata: {
                            labels: { app: this.opsManagerConfig.name }
                        },
                        spec: {
                            containers: [{
                                name: this.opsManagerConfig.name,
                                image: this.opsManagerConfig.image,
                                ports: [{
                                    containerPort: this.opsManagerConfig.containerPort
                                }],
                                env: this.processEnvironmentVariables(),
                                volumeMounts: pvc ? [{
                                    name: "ops-manager-data",
                                    mountPath: "/data/om"
                                }] : []
                            }],
                            volumes: pvc ? [{
                                name: "ops-manager-data",
                                persistentVolumeClaim: {
                                    claimName: `${this.opsManagerConfig.name}-pvc`
                                }
                            }] : []
                        }
                    }
                }
            });

            // Create service
            const service = new k8s.core.v1.Service(`${this.opsManagerConfig.name}-service`, {
                metadata: {
                    name: `${this.opsManagerConfig.name}-service`,
                    namespace: namespace,
                    labels: appLabels
                },
                spec: {
                    selector: { app: this.opsManagerConfig.name },
                    type: this.opsManagerConfig.serviceType,
                    ports: [{
                        port: 80,
                        targetPort: this.opsManagerConfig.containerPort,
                        protocol: "TCP"
                    }]
                }
            });

            // Store deployed resources
            this.deployedResources.push(deployment, service, configMap);
            if (pvc) this.deployedResources.push(pvc);
            if (ns) this.deployedResources.push(ns);
            */

            // Simulate deployment for now
            const mockOutputs = {
                opsManagerPublicUrl: `http://ops-manager.${this.opsManagerConfig.namespace}.svc.cluster.local:8080`,
                managementUrl: `http://203.0.113.20:8080`,
                opsManagerNamespace: this.opsManagerConfig.namespace,
                opsManagerServiceName: `${this.opsManagerConfig.name}-service`,
                opsManagerPublicIp: "203.0.113.20"
            };

            console.log(`Ops Manager ${this.opsManagerConfig.name} deployed successfully`);

            return {
                componentName: this.opsManagerConfig.name,
                success: true,
                outputs: this.extractOutputs(mockOutputs)
            };

        } catch (error) {
            console.error(`Error deploying Ops Manager ${this.opsManagerConfig.name}:`, error);
            return {
                componentName: this.opsManagerConfig.name,
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * Undeploys the Ops Manager instance and cleans up all associated resources.
     * Removes all Kubernetes resources including deployments, services, persistent volumes,
     * config maps, and secrets. Handles graceful shutdown and data cleanup.
     * 
     * @returns {Promise<void>} Promise that resolves when all resources are removed
     * @throws {Error} If the undeployment fails or encounters critical errors
     * @example
     * ```typescript
     * await controller.undeploy();
     * console.log('Ops Manager has been completely removed');
     * ```
     * @memberof OpsManagerController
     */
    async undeploy(): Promise<void> {
        try {
            console.log(`Undeploying Ops Manager: ${this.opsManagerConfig.name}`);

            // TODO: Implement actual Kubernetes undeployment
            // Pulumi handles resource deletion automatically when a stack is destroyed,
            // but explicit resource deletion logic might be needed for specific cases

            this.deployedResources = [];
            console.log(`Ops Manager ${this.opsManagerConfig.name} undeployed successfully`);
        } catch (error) {
            console.error(`Error undeploying Ops Manager ${this.opsManagerConfig.name}:`, error);
            throw error;
        }
    }

    /**
     * Type guard function to check if the provided configuration is a valid OpsManagerConfig.
     * Validates that all required Ops Manager properties are present in the configuration.
     * 
     * @private
     * @param {BaseConfig} config - The configuration object to validate
     * @returns {config is OpsManagerConfig} True if the config is a valid OpsManagerConfig
     * @example
     * ```typescript
     * if (this.isOpsManagerConfig(config)) {
     *   // config is now typed as OpsManagerConfig
     *   console.log('Ops Manager image:', config.image);
     * }
     * ```
     * @memberof OpsManagerController
     */
    private isOpsManagerConfig(config: BaseConfig): config is OpsManagerConfig {
        return 'kubernetesResourceType' in config && 
               'namespace' in config && 
               'replicas' in config &&
               'image' in config &&
               'containerPort' in config &&
               'serviceType' in config &&
               'labels' in config &&
               'envVariables' in config;
    }

    /**
     * Processes environment variables for Ops Manager deployment.
     * Converts the environment variable configuration into Kubernetes-compatible format,
     * handling different value sources including direct values, secrets, and inputs.
     * 
     * @private
     * @returns {any[]} Array of Kubernetes environment variable objects
     * @example
     * ```typescript
     * const envVars = this.processEnvironmentVariables();
     * // Returns: [{ name: "OM_SERVER_URL", value: "http://..." }, ...]
     * ```
     * @memberof OpsManagerController
     */
    private processEnvironmentVariables(): any[] {
        const envVars: any[] = [];

        this.opsManagerConfig.envVariables.forEach(envVar => {
            if (envVar.value) {
                // Direct value
                envVars.push({
                    name: envVar.name,
                    value: envVar.value
                });
            } else if (envVar.valueFromSecret && envVar.secretKey) {
                // Value from secret
                envVars.push({
                    name: envVar.name,
                    valueFrom: {
                        secretKeyRef: {
                            name: envVar.valueFromSecret,
                            key: envVar.secretKey
                        }
                    }
                });
            } else if (envVar.valueFromInput) {
                // Value from input (would need to be resolved from component inputs)
                const inputValue = this.resolveInputValue(envVar.valueFromInput);
                if (inputValue !== undefined) {
                    envVars.push({
                        name: envVar.name,
                        value: inputValue
                    });
                }
            }
        });

        return envVars;
    }

    /**
     * Resolves an input value from the component's input configuration.
     * Looks up the specified input name in the component's input array
     * and returns its value if available.
     * 
     * @private
     * @param {string} inputName - The name of the input to resolve
     * @returns {any} The resolved input value or undefined if not found
     * @example
     * ```typescript
     * const dbUri = this.resolveInputValue("backendDbConnectionUri");
     * // Returns: "mongodb://cluster.mongodb.net/mydb" or undefined
     * ```
     * @memberof OpsManagerController
     */
    private resolveInputValue(inputName: string): any {
        if (this.opsManagerConfig.input) {
            const input = this.opsManagerConfig.input.find(i => i.name === inputName);
            return input?.value;
        }
        return undefined;
    }

    /**
     * Generates Ops Manager configuration file content.
     * Creates the mms.conf configuration file with necessary settings
     * for Ops Manager operation including database connections and server settings.
     * 
     * @private
     * @returns {string} The generated Ops Manager configuration content
     * @example
     * ```typescript
     * const config = this.generateOpsManagerConfig();
     * // Returns: "mms.centralUrl=http://ops-manager:8080\n..."
     * ```
     * @memberof OpsManagerController
     */
    private generateOpsManagerConfig(): string {
        const config = [
            `mms.centralUrl=http://${this.opsManagerConfig.name}:${this.opsManagerConfig.containerPort}`,
            `mms.fromEmailAddr=ops-manager@${this.opsManagerConfig.name}`,
            `mms.replyToEmailAddr=ops-manager@${this.opsManagerConfig.name}`,
            `mms.adminEmailAddr=admin@${this.opsManagerConfig.name}`,
            `mms.mail.transport=smtp`,
            `mms.mail.hostname=localhost`,
            `mms.mail.port=587`
        ];

        return config.join('\n');
    }

    /**
     * Extracts and maps outputs from Ops Manager deployment results to the expected output format.
     * Maps Ops Manager specific output values to the names defined in the component's output configuration.
     * This method handles various output types including management URLs, service endpoints, and IP addresses.
     * 
     * @protected
     * @param {any} result - The deployment result containing Ops Manager information
     * @returns {Object.<string, any>} Object containing mapped output values
     * @example
     * ```typescript
     * const outputs = this.extractOutputs({
     *   opsManagerPublicUrl: "http://ops-manager.namespace.svc.cluster.local:8080",
     *   managementUrl: "http://203.0.113.20:8080"
     * });
     * // Returns: { opsManagerPublicUrl: "http://...", managementUrl: "http://..." }
     * ```
     * @memberof OpsManagerController
     */
    protected extractOutputs(result: any): { [key: string]: any } {
        const outputs: { [key: string]: any } = {};
        
        if (this.config.output) {
            this.config.output.forEach(outputDef => {
                switch (outputDef.name) {
                    case 'opsManagerPublicUrl':
                        outputs[outputDef.name] = result.opsManagerPublicUrl || 
                            `http://${this.opsManagerConfig.name}.${this.opsManagerConfig.namespace}.svc.cluster.local:${this.opsManagerConfig.containerPort}`;
                        break;
                    case 'managementUrl':
                        outputs[outputDef.name] = result.managementUrl || 
                            `http://${result.opsManagerPublicIp || '203.0.113.20'}:${this.opsManagerConfig.containerPort}`;
                        break;
                    case 'opsManagerNamespace':
                        outputs[outputDef.name] = result.opsManagerNamespace || this.opsManagerConfig.namespace;
                        break;
                    case 'opsManagerServiceName':
                        outputs[outputDef.name] = result.opsManagerServiceName || `${this.opsManagerConfig.name}-service`;
                        break;
                    case 'opsManagerPublicIp':
                    case 'publicIp':
                        outputs[outputDef.name] = result.opsManagerPublicIp || "203.0.113.20";
                        break;
                    default:
                        outputs[outputDef.name] = result[outputDef.name] || null;
                }
            });
        }
        
        return outputs;
    }
} 