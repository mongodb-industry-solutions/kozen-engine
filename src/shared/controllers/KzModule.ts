import { IArgs } from "../models/Args";
import { IConfig } from "../models/Config";
import { IModule } from "../models/Module";
import { VCategory } from "../models/Types";
import { IDependency, IIoC, ILogInput, ILogLevel, IoC } from "../tools";
import { ILogger } from "../tools/log/types";

/**
 * Base class for Kozen modules, providing structure for initialization and registration of dependencies.
 * Modules can override the init and register methods to customize behavior
 * @abstract
 * @class Kozen Module Controller
 * @author MDB SAT
 * @since 1.0.4
 * @version 1.0.5
 */
export class KzModule implements IModule {

    /**
     * IoC container instance for dependency injection and service resolution
     * @type {IIoC | null}
     * @protected
     */
    protected assistant?: IIoC | null;

    /**
     * Logger service instance for recording CLI operations and errors
     * @type {ILogger | null}
     * @public
     */
    public get logger(): ILogger | null {
        return this.assistant?.logger as unknown as ILogger || null;
    }

    /**
     * Gets the IoC helper instance for dependency resolution
     * @returns {IIoC | null | undefined} The IoC container instance
     * @public
     */
    public get helper(): IIoC | null | undefined {
        return this.assistant;
    }

    /**
     * Creates a new CLIController instance with dependency injection support
     * 
     * @constructor
     * @param {Object} [dependency] - Optional dependency injection configuration
     * @param {IIoC} [dependency.assistant] - IoC container for service resolution
     * @param {ILogger} [dependency.logger] - Logger service for operation tracking
     */
    constructor(dependency?: { assistant: IIoC }) {
        this.assistant = dependency?.assistant ?? new IoC();
    }

    /**
     * Generates a unique pipeline identifier from configuration options
     * Combines project and stack identifiers to create a unique pipeline ID
     *
     * @param {IConfig} [opt] - Configuration object containing project and stack information
     * @returns {string} Generated pipeline ID in format 'project-stack' or fallback ID
     * @public
     */
    public getId(opt?: IConfig) {
        return opt?.id || `${opt?.project ?? ''}-${opt?.stack ?? ''}`;
    }

    /**
     * Waits for all pending logger operations to complete before continuing
     * Ensures all log entries are properly written before the application exits
     *
     * @returns {Promise<void>} Promise that resolves when all pending log operations are complete
     * @public
     */
    public async wait(): Promise<void> {
        if (this.logger?.stack) {
            await Promise.all(this.logger.stack)
        }
    }

    /**
     * Logs a message using the controller's logger service with automatic categorization
     * Automatically sets category and flow ID if not specified in the input
     *
     * @param {ILogInput} input - Log message string or structured log object with metadata
     * @param {ILogLevel} [level=ILogLevel.INFO] - Log level for the message
     * @returns {Promise<void>} Promise that resolves when logging operation completes
     * @public
     */
    public async log(input: ILogInput, level: ILogLevel = ILogLevel.INFO) {
        if (typeof input === 'object') {
            input.category = input.category || VCategory.cli.tool;
            input.flow = input.flow || this.getId(input as unknown as IConfig);
        }
        this.logger?.log(input, level);
    }

    public async init<T = IArgs>(argv?: string[] | IArgs): Promise<{ args?: T, config?: IConfig | null }> {
        return {};
    }

    public async register(config: IConfig | null, opts?: any): Promise<Record<string, IDependency> | null> {
        return Promise.resolve(null);
    }
}