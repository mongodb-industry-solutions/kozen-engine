import { IPipeline } from '../models/Pipeline';
import { IConfigValue } from '../models/Stack';
import { IComponent } from '../models/Template';
import { IResult, IStruct } from '../models/Types';
import { IIoC } from '../tools';

/**
 * @fileoverview Base Controller - Abstract Bridge Component
 * @description Abstract base controller that implements the Bridge pattern to decouple
 * infrastructure component abstractions from their specific implementations.
 * 
 * This class serves as a bridge between the high-level pipeline orchestration and
 * low-level infrastructure component implementations (AtlasController, KubernetesController,
 * OpsManagerController, etc.). It defines a common contract and provides shared functionality
 * for all infrastructure component controllers.
 * 
 * The Bridge pattern allows adding new infrastructure components without modifying existing
 * pipeline logic, and enables switching between different infrastructure implementations
 * at runtime through dependency injection.
 * 
 * @abstract
 * @class BaseController
 * @author MongoDB Solutions Assurance Team
 * @since 1.0.0
 * @version 4.0.0
 */
export abstract class BaseController {
    /**
     * IoC container instance for dependency management
     * 
     * @protected
     * @type {IIoC}
     * @description Protected IoC container providing dependency injection capabilities.
     * Allows controllers to resolve services, managers, and other dependencies
     * without tight coupling to their implementations.
     * 
     * @example
     * ```typescript
     * // Resolving dependencies in derived controllers
     * const secretManager = await this.assistant.resolve<SecretManager>('SecretManager');
     * const stackManager = await this.assistant.resolve<StackManager>('StackManager');
     * ```
     */
    protected assistant!: IIoC;

    /**
     * Component configuration object
     * 
     * @protected
     * @type {IComponent}
     * @description Stores the component-specific configuration including name, version,
     * engine requirements, setup parameters, and component definitions. This configuration
     * drives the behavior of the specific infrastructure component implementation.
     */
    protected config: IComponent;

    /**
     * Constructs a new BaseController instance
     * 
     * @constructor
     * @param {IComponent} [config] - Optional initial component configuration
     * 
     * @description Initializes the base controller with default or provided configuration.
     * When no configuration is provided, initializes with a clearly defined invalid state
     * to ensure proper configuration before use.
     */
    constructor(config?: IComponent) {
        // Initialize with a default, clearly invalid state to ensure proper configuration
        this.config = config || {
            name: '',
            version: '',
            engine: '',
            release: '',
            components: []
        };
    }

    /**
     * Configures the controller with the provided component configuration
     * 
     * @public
     * @param {IComponent} config - The component configuration object containing
     *                              deployment parameters, setup instructions, and metadata
     * @returns {BaseController} Returns the configured controller instance for method chaining
     * 
     * @description Sets up the controller with component-specific configuration including
     * deployment parameters, setup instructions, input/output definitions, and metadata.
     * This method must be called before executing any deployment operations.
     * 
     * @example
     * ```typescript
     * const controller = new AtlasController();
     * controller.configure({
     *   name: 'atlas-cluster',
     *   version: '1.0.0',
     *   engine: '>=1.0.0',
     *   release: 'stable',
     *   setup: [
     *     { name: 'clusterName', value: 'prod-cluster', type: 'string' }
     *   ],
     *   components: []
     * });
     * ```
     */
    configure(config: IComponent): BaseController {
        this.config = config;
        return this;
    }

    /**
     * Sets up component configuration parameters for deployment
     * 
     * @public
     * @param {IStruct} [input] - Optional input parameters for setup configuration
     * @returns {Promise<void | IConfigValue[]>} Promise resolving to configuration values or void
     * 
     * @description Processes component setup parameters and converts them into configuration
     * values suitable for infrastructure deployment. Handles different parameter types including
     * secrets, environment variables, and static values.
     */
    async setup(input: IStruct, pipeline?: IPipeline): Promise<IResult> {
        if (!Array.isArray(this.config.setup)) {
            return {};
        }
        const output: Record<string, any> = {};
        for (let item of this.config.setup) {
            output[item.name] = {
                value: input[item.name],
                secret: (item.type === "secret" || item.type === "protected")
            }
        }
        return { output };
    }

    /**
     * Deploys the component using the current configuration
     * 
     * @abstract
     * @public
     * @param {IStruct} [input] - Optional input parameters for deployment
     * @returns {Promise<IResult>} Promise resolving to deployment result with success status and outputs
     * @throws {Error} When deployment fails due to configuration, network, or infrastructure errors
     * 
     * @description Abstract method that must be implemented by concrete controller classes.
     * Handles the actual deployment of infrastructure components based on the configured
     * parameters and input values. Each implementation should provide specific deployment
     * logic for its target infrastructure type.
     * 
     * @example
     * ```typescript
     * // Implementation in derived class
     * public async deploy(input?: IStruct): Promise<IResult> {
     *   const deploymentResult = await this.performDeployment(input);
     *   return {
     *     success: true,
     *     output: { clusterId: deploymentResult.id },
     *     timestamp: new Date(),
     *     message: 'Component deployed successfully'
     *   };
     * }
     * ```
     */
    abstract deploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult>;

    /**
     * Undeploys the component, removing all deployed resources
     * 
     * @public
     * @param {IStruct} [input] - Optional input parameters for undeployment
     * @returns {Promise<IResult | void>} Promise resolving to undeployment result or void
     * @throws {Error} When undeployment fails due to access issues or resource dependencies
     * 
     * @description Removes previously deployed infrastructure resources and cleans up
     * any associated configurations. Default implementation provides no-op behavior;
     * derived classes should override with specific cleanup logic.
     * 
     * @example
     * ```typescript
     * // Override in derived class for custom cleanup
     * public async undeploy(input?: IStruct): Promise<IResult> {
     *   await this.cleanupResources();
     *   return {
     *     success: true,
     *     timestamp: new Date(),
     *     message: 'Component undeployed successfully'
     *   };
     * }
     * ```
     */
    public async undeploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult | void> { }

    /**
     * Destroys the component and all associated resources permanently
     * 
     * @public
     * @param {IStruct} [input] - Optional input parameters for destruction
     * @returns {Promise<IResult | void>} Promise resolving to destruction result or void
     * @throws {Error} When destruction fails due to access issues or resource protection
     * 
     * @description Permanently removes infrastructure resources without possibility of recovery.
     * This operation is typically more aggressive than undeploy and should be used with caution.
     * Default implementation provides no-op behavior.
     * 
     * @example
     * ```typescript
     * // Override for permanent resource destruction
     * public async destroy(input?: IStruct): Promise<IResult> {
     *   await this.permanentlyDeleteResources();
     *   return {
     *     success: true,
     *     timestamp: new Date(),
     *     message: 'Component destroyed permanently'
     *   };
     * }
     * ```
     */
    public async destroy(input?: IStruct, pipeline?: IPipeline): Promise<IResult | void> { }

    /**
     * Validates the current configuration and component state
     * 
     * @public
     * @param {IStruct} [input] - Optional input parameters for validation
     * @returns {Promise<IResult | void>} Promise resolving to validation result or void
     * @throws {Error} When validation encounters configuration or dependency errors
     * 
     * @description Performs comprehensive validation of component configuration, dependencies,
     * and deployment prerequisites without making actual infrastructure changes. Helps identify
     * configuration issues before attempting deployment.
     * 
     * @example
     * ```typescript
     * // Override for custom validation logic
     * public async validate(input?: IStruct): Promise<IResult> {
     *   const validationErrors = await this.checkConfiguration();
     *   return {
     *     success: validationErrors.length === 0,
     *     errors: validationErrors,
     *     timestamp: new Date(),
     *     message: validationErrors.length === 0 ? 'Validation passed' : 'Validation failed'
     *   };
     * }
     * ```
     */
    public async validate(input?: IStruct, pipeline?: IPipeline): Promise<IResult | void> { }

    /**
     * Checks the current status of the deployed component
     * 
     * @public
     * @param {IStruct} [input] - Optional input parameters for status checking
     * @returns {Promise<IResult | void>} Promise resolving to component status information or void
     * @throws {Error} When status check fails due to network issues or access problems
     * 
     * @description Queries the current operational state of deployed infrastructure components
     * including health status, configuration state, and performance metrics. Provides
     * comprehensive status information for monitoring and troubleshooting.
     * 
     * @example
     * ```typescript
     * // Override for custom status checking
     * public async status(input?: IStruct): Promise<IResult> {
     *   const healthStatus = await this.checkComponentHealth();
     *   return {
     *     success: true,
     *     output: {
     *       health: healthStatus.status,
     *       uptime: healthStatus.uptime,
     *       metrics: healthStatus.metrics
     *     },
     *     timestamp: new Date(),
     *     message: `Component is ${healthStatus.status}`
     *   };
     * }
     * ```
     */
    public async status(input?: IStruct, pipeline?: IPipeline): Promise<IResult | void> { }
}
