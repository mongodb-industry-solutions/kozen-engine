import { IIoC } from "../tools";
import { ILogger } from "../tools/log/types";

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
 */
export class BaseService {
    /**
     * IoC container instance for dependency management
     * 
     * @protected
     * @type {IIoC}
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
     * @type {ILogger | null}
     */
    public logger?: ILogger | null;

    constructor(dependency?: { assistant: IIoC, logger: ILogger }) {
        this.assistant = dependency?.assistant ?? null;
        this.logger = dependency?.logger ?? null;
        // this.assistant?.resolve<ILogger>('logger:service').then(obj => this.logger = obj);
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