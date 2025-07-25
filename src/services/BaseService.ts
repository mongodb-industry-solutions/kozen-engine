import { IComponent, ITransformOption } from "../models/Component";
import { ILoggerService } from "../models/Logger";
import { IVarProcessorService } from "../models/Processor";
import { IStruct } from "../models/Types";
import { IIoC } from "../tools";

/**
 * @fileoverview Base Service - Foundation Class for All Services
 * @description Abstract base class that provides common functionality and dependency injection
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
     * @description Protected IoC container providing dependency injection capabilities
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


    public logger?: ILoggerService | null;

    constructor(dependency?: { assistant: IIoC, logger: ILoggerService }) {
        this.assistant = dependency?.assistant ?? null;
        this.logger = dependency?.logger ?? null;
        // this.assistant?.resolve<ILoggerService>('LoggerService').then(obj => this.logger = obj);
    }

    /**
     * Transforms component input by processing variables through VarProcessorService
     * @protected
     * @param {IComponent} component - Component containing input definitions
     * @param {IStruct} output - Current output scope for variable resolution
     * @param {string} [key="input"] - Property key to process (default: "input")
     * @returns {Promise<IStruct>} Promise resolving to processed input variables
     */
    public async transformInput(options: ITransformOption): Promise<IStruct> {
        const { component, output = {}, key = "input", flow } = options;
        if (!this.assistant) {
            throw new Error("Incorrect dependency injection configuration.");
        }
        const srvVar = await this.assistant.resolve<IVarProcessorService>('VarProcessorService');
        const input = (srvVar && Array.isArray(component[key]) && await srvVar.process(component[key], output, flow));
        return input || {};
    }
}