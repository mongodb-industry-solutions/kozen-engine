import { ILogInput, ILogLevel, ILogProcessor, ILoggerConfig } from "../tools";
import { ILogEntry, ILoggerConfigMDB } from "../tools/log/types";
import { ICLIArgs } from "./Types";

/**
 * Configuration interface for LoggerService with MongoDB and console settings
 * @interface ILoggerConfigService
 * @extends ILoggerConfig
 */
export interface ILoggerConfigService extends ILoggerConfig {
    /**
     * MongoDB logging configuration options
     * @type {ILoggerConfigMDB}
     */
    mdb?: ILoggerConfigMDB;

    /**
     * Console logging configuration options
     * @type {ILoggerConfig}
     */
    console?: ILoggerConfig;

    /**
     * Additional configuration properties
     * @type {any}
     */
    [key: string]: any
}

/**
 * Logger service interface defining logging operations and configuration
 * @interface ILoggerService
 */
export interface ILoggerService {
    /**
     * Logs error messages with highest priority for critical issues
     * @param {ILogInput} input - Error message string or structured log object
     */
    error(input: ILogInput): void;

    /**
     * Logs warning messages for potentially harmful situations requiring attention
     * @param {ILogInput} input - Warning message string or structured log object
     */
    warn(input: ILogInput): void;

    /**
     * Logs debug messages with detailed information for troubleshooting problems
     * @param {ILogInput} input - Debug message string or structured log object
     */
    debug(input: ILogInput): void;

    /**
     * Logs informational messages about normal application flow and operations
     * @param {ILogInput} input - Info message string or structured log object
     */
    info(input: ILogInput): void;

    /**
     * Logs messages with specified level for flexible logging control
     * @param {ILogInput} input - Log message string or structured log object
     * @param {ILogLevel} level - Log level to use for message filtering
     */
    log(input: ILogInput, level: ILogLevel): void;

    /**
     * Updates logger configuration at runtime for dynamic behavior changes
     * @param {ILoggerConfigService} config - New configuration options for level and MongoDB settings
     */
    configure(config: ILoggerConfigService): void;

    /**
     * Current logging level for external validation and debugging
     * @type {ILogLevel}
     */
    level: ILogLevel;

    /**
     * Current category identifier for context organization and filtering
     * @type {string | undefined}
     */
    category: string | undefined;

    /**
     * Array of pending log processing promises for asynchronous operations
     * @type {Promise<void>[]}
     */
    stack: Promise<void>[];

    /**
     * Adds additional processor to hybrid configuration for extended output destinations
     * @param {ILogProcessor} processor - LogProcessor implementation for custom log handling
     */
    add(processor: ILogProcessor): void;
}


/**
 * Secret management CLI arguments interface
 * @interface ILogArgs
 * @extends ICLIArgs
 */
export interface ILogArgs extends ICLIArgs, ILogEntry {
    /**
     * 
     * @type {string}
     */
    dataFromPath?: string;
}