import { IResult, IStruct } from '../../../shared/models/Types';
import { IIoC } from '../../../shared/tools';
import { ILoggerService } from '../../logger/models/Logger';
import { IPipeline } from '../../pipeline/models/Pipeline';
import { IComponent, ITransformOption } from '../models/Component';
import { IController } from '../models/Controller';
import { IProcessorService } from '../models/Processor';

/**
 * @fileoverview Base Controller - Abstract Bridge Component
 * Abstract base controller that implements the Bridge pattern to decouple
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
 * @since 1.0.4
 * @version 1.0.5
 */
export abstract class BaseController implements IController {
    /**
     * IoC container instance for dependency management
     * Protected IoC container providing dependency injection capabilities.
     * Allows controllers to resolve services, managers, and other dependencies
     * without tight coupling to their implementations.
     * @protected
     * @type {IIoC}
     */
    protected assistant?: IIoC | null;

    /**
     * Logger service instance for recording pipeline operations and errors
     * @public
     * @type {ILoggerService | null}
     */
    public logger?: ILoggerService | null;

    /**
     * Current pipeline context containing arguments, template, and execution state
     * @protected
     * @type {IPipeline}
     */
    protected pipeline?: IPipeline;

    /**
     * Component configuration object
     * Stores the component-specific configuration including name, version,
     * engine requirements, setup parameters, and component definitions. This configuration
     * drives the behavior of the specific infrastructure component implementation.
     * @protected
     * @type {IComponent}
     */
    protected config: IComponent;

    /**
     * Constructs a new BaseController instance
     * Initializes the base controller with default or provided configuration.
     * When no configuration is provided, initializes with a clearly defined invalid state
     * to ensure proper configuration before use.
     * @constructor
     * @param {IComponent} [config] - Optional initial component configuration
     * @param {Object} [dependency] - Optional dependency injection object
     */
    constructor(config?: IComponent, dependency?: { assistant: IIoC, logger: ILoggerService }) {
        this.config = config || {};
        this.assistant = dependency?.assistant ?? null;
        this.logger = dependency?.logger ?? null;
    }

    /**
     * Configures the controller with the provided component configuration
     * Sets up the controller with component-specific configuration including
     * deployment parameters, setup instructions, input/output definitions, and metadata.
     * This method must be called before executing any deployment operations.
     * @public
     * @param {IComponent} config - The component configuration object containing
     *                              deployment parameters, setup instructions, and metadata
     * @param {Object} [dependency] - Optional dependency injection object
     * @returns {BaseController} Returns the configured controller instance for method chaining
     */
    public configure(config: IComponent, dependency?: { assistant: IIoC, logger: ILoggerService }): BaseController {
        this.config = config;
        dependency?.assistant && (this.assistant = dependency.assistant);
        dependency?.logger && (this.logger = dependency.logger);
        return this;
    }

    /**
     * Sets up component configuration parameters for deployment
     * Processes component setup parameters and converts them into configuration
     * values suitable for infrastructure deployment. Handles different parameter types including
     * secrets, environment variables, and static values.
     * @public
     * @param {IStruct} input - Input parameters for setup configuration
     * @param {IPipeline} [pipeline] - Optional pipeline context for setup operations
     * @returns {Promise<IResult>} Promise resolving to setup result with output configuration
     */
    public async setup(input: IStruct, pipeline?: IPipeline): Promise<IResult> {
        if (!Array.isArray(this.config.setup)) {
            return {};
        }
        let output = await pipeline?.stack?.transformSetup({ component: this.config, key: 'setup', flow: pipeline?.id }) || {};
        return { output };
    }

    /**
     * Deploys the component using the current configuration
     * Abstract method that must be implemented by concrete controller classes.
     * Handles the actual deployment of infrastructure components based on the configured
     * parameters and input values. Each implementation should provide specific deployment
     * logic for its target infrastructure type.
     * @abstract
     * @public
     * @param {IStruct} [input] - Optional input parameters for deployment
     * @param {IPipeline} [pipeline] - Optional pipeline context for deployment operations
     * @returns {Promise<IResult>} Promise resolving to deployment result with success status and outputs
     * @throws {Error} When deployment fails due to configuration, network, or infrastructure errors
     */
    public abstract deploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult>;

    /**
     * Undeploys the component, removing all deployed resources
     * Removes previously deployed infrastructure resources and cleans up
     * any associated configurations. Default implementation provides no-op behavior;
     * derived classes should override with specific cleanup logic.
     * @public
     * @param {IStruct} [input] - Optional input parameters for undeployment
     * @param {IPipeline} [pipeline] - Optional pipeline context for undeployment operations
     * @returns {Promise<IResult | void>} Promise resolving to undeployment result or void
     * @throws {Error} When undeployment fails due to access issues or resource dependencies
     */
    public async undeploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult | void> { }

    /**
     * Destroys the component and all associated resources permanently
     * Permanently removes infrastructure resources without possibility of recovery.
     * This operation is typically more aggressive than undeploy and should be used with caution.
     * Default implementation provides no-op behavior.
     * @public
     * @param {IStruct} [input] - Optional input parameters for destruction
     * @param {IPipeline} [pipeline] - Optional pipeline context for destruction operations
     * @returns {Promise<IResult | void>} Promise resolving to destruction result or void
     * @throws {Error} When destruction fails due to access issues or resource protection
     */
    public async destroy(input?: IStruct, pipeline?: IPipeline): Promise<IResult | void> { }

    /**
     * Validates the current configuration and component state
     * Performs comprehensive validation of component configuration, dependencies,
     * and deployment prerequisites without making actual infrastructure changes. Helps identify
     * configuration issues before attempting deployment.
     * @public
     * @param {IStruct} [input] - Optional input parameters for validation
     * @param {IPipeline} [pipeline] - Optional pipeline context for validation operations
     * @returns {Promise<IResult | void>} Promise resolving to validation result or void
     * @throws {Error} When validation encounters configuration or dependency errors
     */
    public async validate(input?: IStruct, pipeline?: IPipeline): Promise<IResult | void> { }

    /**
     * Checks the current status of the deployed component
     * Queries the current operational state of deployed infrastructure components
     * including health status, configuration state, and performance metrics. Provides
     * comprehensive status information for monitoring and troubleshooting.
     * @public
     * @param {IStruct} [input] - Optional input parameters for status checking
     * @param {IPipeline} [pipeline] - Optional pipeline context for status operations
     * @returns {Promise<IResult | void>} Promise resolving to component status information or void
     * @throws {Error} When status check fails due to network issues or access problems
     */
    public async status(input?: IStruct, pipeline?: IPipeline): Promise<IResult | void> { }

    /**
     * Generates unique prefix for resource naming using pipeline context
     * @protected
     * @param {IPipeline} [pipeline] - Optional pipeline context, defaults to instance pipeline
     * @returns {string} Generated prefix combining project and stack identifiers
     */
    protected getPrefix(pipeline?: IPipeline) {
        pipeline = pipeline ?? this.pipeline;
        // Get the current project name, which can be used in combination with the stackName as prefix for internal resource deployment (ex. K2025072112202952-dev)
        return pipeline?.id || `${pipeline?.stack?.config?.project}-${pipeline?.stack?.config?.name}`;
    }

    /**
     * Transforms component input by processing variables through ProcessorService
     * @protected
     * @param {ITransformOption} options - Component containing input definitions
     * @returns {Promise<IStruct>} Promise resolving to processed input variables
     */
    public async transformInput(options: ITransformOption): Promise<IStruct> {
        const { component, output = {}, key = "input", flow } = options;
        if (!this.assistant) {
            throw new Error("Incorrect dependency injection configuration.");
        }
        const srvVar = await this.assistant.resolve<IProcessorService>('ProcessorService');
        const input = (srvVar && Array.isArray(component[key]) && await srvVar.process(component[key], output, flow));
        return input || {};
    }

    /**
     * Retrieves metadata describing the component.
     * Provides a detailed object containing the component's metadata, such as its configuration, properties, and dependencies.
     * @public
     * @returns {Promise<IComponent>} - Promise resolving to the metadata object representing the component.
     */
    public abstract metadata(): Promise<IComponent>;
}
