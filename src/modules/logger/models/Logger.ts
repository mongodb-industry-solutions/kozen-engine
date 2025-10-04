
import { IArgs } from "../../../shared/models/Args";
import { ILoggerConfig } from "../../../shared/tools";
import { ILogEntry, ILogger, ILoggerConfigMDB } from "../../../shared/tools/log/types";

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
export interface ILoggerService extends ILogger {
    /**
     * Updates logger configuration at runtime for dynamic behavior changes
     * @param {ILoggerConfigService} config - New configuration options for level and MongoDB settings
     */
    configure(config: ILoggerConfigService): void;
}


/**
 * Secret management CLI arguments interface
 * @interface ILogArgs
 * @extends IArgs
 */
export interface ILogArgs extends IArgs, ILogEntry {
    /**
     * The path of the file containing the content of the data property
     * @type {string}
     */
    file?: string;
}