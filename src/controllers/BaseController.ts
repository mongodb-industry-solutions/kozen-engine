import { IComponent } from '../models/Component';
import { IPipeline } from '../models/Pipeline';
import { IConfigValue } from '../models/Stack';
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
 * @author MDB SAT
 * @since 1.0.0
 * @version 4.0.0
 */
export abstract class BaseController {
    /**
     * @description IoC container instance for dependency management
     * Protected IoC container providing dependency injection capabilities.
     * Allows controllers to resolve services, managers, and other dependencies
     * without tight coupling to their implementations.
     * @protected
     * @type {IIoC}
     * 
     * @example
     * ```typescript
     * // Resolving dependencies in derived controllers
     * const secretManager = await this.assistant.resolve<SecretManager>('SecretManager');
     * ```
     */
    protected assistant!: IIoC;

    /**
     * @description Component configuration object
     * Stores the component-specific configuration including name, version,
     * engine requirements, setup parameters, and component definitions. This configuration
     * drives the behavior of the specific infrastructure component implementation.
     * @protected
     * @type {IComponent}
     */
    protected config: IComponent;

    /**
     * @description Constructs a new BaseController instance
     * Initializes the base controller with default or provided configuration.
     * When no configuration is provided, initializes with a clearly defined invalid state
     * to ensure proper configuration before use.
     * @constructor
     * @param {IComponent} [config] - Optional initial component configuration
     */
    constructor(config?: IComponent) {
        this.config = config || {};
    }

    /**
     * @description Configures the controller with the provided component configuration
     * Sets up the controller with component-specific configuration including
     * deployment parameters, setup instructions, input/output definitions, and metadata.
     * This method must be called before executing any deployment operations.
     * @public
     * @param {IComponent} config - The component configuration object containing
     *                              deployment parameters, setup instructions, and metadata
     * @returns {BaseController} Returns the configured controller instance for method chaining
     *
     */
    configure(config: IComponent): BaseController {
        this.config = config;
        return this;
    }

    /**
     * @description Sets up component configuration parameters for deployment
     * Processes component setup parameters and converts them into configuration
     * values suitable for infrastructure deployment. Handles different parameter types including
     * secrets, environment variables, and static values.
     * @public
     * @param {IStruct} [input] - Optional input parameters for setup configuration
     * @returns {Promise<void | IConfigValue[]>} Promise resolving to configuration values or void
     * 
     */
    public async setup(input: IStruct, pipeline?: IPipeline): Promise<IResult> {
        if (!Array.isArray(this.config.setup)) {
            return {};
        }
        let output = await pipeline?.stack?.transformSetup(this.config, {}, 'setup') || {};
        return { output };
    }


    /**
     * @description Deploys the component using the current configuration
     * Abstract method that must be implemented by concrete controller classes.
     * Handles the actual deployment of infrastructure components based on the configured
     * parameters and input values. Each implementation should provide specific deployment
     * logic for its target infrastructure type.
     * @abstract
     * @public
     * @param {IStruct} [input] - Optional input parameters for deployment
     * @returns {Promise<IResult>} Promise resolving to deployment result with success status and outputs
     * @throws {Error} When deployment fails due to configuration, network, or infrastructure errors
     * 
     */
    abstract deploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult>;

    /**
     * @description Undeploys the component, removing all deployed resources
     * Removes previously deployed infrastructure resources and cleans up
     * any associated configurations. Default implementation provides no-op behavior;
     * derived classes should override with specific cleanup logic.
     * @public
     * @param {IStruct} [input] - Optional input parameters for undeployment
     * @returns {Promise<IResult | void>} Promise resolving to undeployment result or void
     * @throws {Error} When undeployment fails due to access issues or resource dependencies
     * 
     */
    public async undeploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult | void> { }

    /**
     * @description Destroys the component and all associated resources permanently
     * Permanently removes infrastructure resources without possibility of recovery.
     * This operation is typically more aggressive than undeploy and should be used with caution.
     * Default implementation provides no-op behavior.
     * @public
     * @param {IStruct} [input] - Optional input parameters for destruction
     * @returns {Promise<IResult | void>} Promise resolving to destruction result or void
     * @throws {Error} When destruction fails due to access issues or resource protection
     */
    public async destroy(input?: IStruct, pipeline?: IPipeline): Promise<IResult | void> { }

    /**
     * @description Validates the current configuration and component state
     * Performs comprehensive validation of component configuration, dependencies,
     * and deployment prerequisites without making actual infrastructure changes. Helps identify
     * configuration issues before attempting deployment.
     * @public
     * @param {IStruct} [input] - Optional input parameters for validation
     * @returns {Promise<IResult | void>} Promise resolving to validation result or void
     * @throws {Error} When validation encounters configuration or dependency errors
     */
    public async validate(input?: IStruct, pipeline?: IPipeline): Promise<IResult | void> { }

    /**
     * @description Checks the current status of the deployed component. 
     * Queries the current operational state of deployed infrastructure components
     * including health status, configuration state, and performance metrics. Provides
     * comprehensive status information for monitoring and troubleshooting.
     * @public
     * @param {IStruct} [input] - Optional input parameters for status checking
     * @returns {Promise<IResult | void>} Promise resolving to component status information or void
     * @throws {Error} When status check fails due to network issues or access problems
     * 
     */
    public async status(input?: IStruct, pipeline?: IPipeline): Promise<IResult | void> { }
}
