import { IStruct } from "../../../shared/models/Types";
import { IIoC } from "../../../shared/tools";
import { ILoggerService } from "../../logger/models/Logger";
import { IOutputResult, ITransformOption } from "../models/Component";
import { IProcessorService } from "../models/Processor";

/**
 * @fileoverview Base Service - Foundation Class for All Services
 * Abstract base class that provides common functionality and dependency injection
 * capabilities for all service classes in the application. This class establishes a consistent
 * pattern for service implementation and ensures proper IoC container integration.
 * All service classes should extend this base class to maintain consistency in dependency
 * management and to benefit from shared functionality across the service layer.
 *
 * @abstract
 * @class BaseService
 * @author MDB SAT
 * @since 1.0.4
 * @version 1.0.5
 *
 * @example
 * ```typescript
 * // Implementing a custom service
 * export class MyCustomService extends BaseService {
 *   public async processData(data: any): Promise<any> {
 *     // Access IoC container through inherited assistant property
 *     const logger = await this.assistant.resolve<Logger>('Logger');
 *
 *     logger.info('Processing data...');
 *     // Custom service logic here
 *
 *     return processedData;
 *   }
 * }
 * ```
 */
export class BaseService {
    /**
     * IoC container instance for dependency management
     * 
     * @protected
     * @type {IIoC}
     * Protected IoC container providing dependency injection capabilities
     * to derived service classes. This allows services to resolve dependencies without
     * tight coupling to specific implementations, promoting modularity and testability.
     * 
     * The assistant property enables services to:
     * - Resolve other services and dependencies
     * - Maintain loose coupling between components
     * - Support dependency injection patterns
     * - Enable easy mocking for unit testing
     */
    protected assistant?: IIoC | null;

    /**
     * Prefix string used for dynamic delegate resolution and service naming
     * @protected
     * @type {string}
     */
    protected prefix?: string;

    /**
     * Logger service instance for recording service operations and errors
     * @type {ILoggerService | null}
     */
    public logger?: ILoggerService | null;

    constructor(dependency?: { assistant: IIoC, logger: ILoggerService }) {
        this.assistant = dependency?.assistant ?? null;
        this.logger = dependency?.logger ?? null;
        // this.assistant?.resolve<ILoggerService>('LoggerService').then(obj => this.logger = obj);
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
     * Transforms component input by processing variables through ProcessorService
     * @protected
     * @param {ITransformOption} options - Component containing input definitions
     * @returns {Promise<IOutputResult>} Promise resolving to processed input variables
     */
    public async transformOutput(options: ITransformOption): Promise<IOutputResult> {
        let { component, key = "output", flow, output = {} } = options;
        if (!this.assistant) {
            throw new Error("Incorrect dependency injection configuration.");
        }
        const srvVar = await this.assistant.resolve<IProcessorService>('ProcessorService');
        const meta = (srvVar && Array.isArray(component[key]) && await srvVar.map(component[key], flow)) as IOutputResult;
        output.items = { ...output.items, ...meta?.items };
        output.warns = { ...output.warns, ...meta?.warns };
        return meta || {};
    }

    /**
     * Get the controller strategy
     * @param {string} type
     * @returns {IStackManager} controller
     */
    public async getDelegate<T = any>(type: string): Promise<T> {
        if (!this.prefix) {
            throw new Error("Incorrect prefix configuration for: " + type);
        }
        if (!this.assistant) {
            throw new Error("Incorrect dependency injection configuration for: " + type);
        }
        return await this.assistant.resolve<T>(this.prefix + type);
    }
}