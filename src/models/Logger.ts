import { ILogInput, ILogLevel, ILogProcessor, ILoggerConfig } from "../tools";

/**
 * Configuration interface for LoggerService with MongoDB and console settings
 */
export interface ILoggerConfigService extends ILoggerConfig {
    mdb?: {
        enabled?: boolean;
        database: string;
        collection: string;
        uri: string;
        level: string;
    };

    console?: {
        enabled?: boolean;
        level: string;
    };

    [key: string]: any
}

export interface ILoggerService {
    /**
     * Logs an error message with the highest priority for critical issues.
     * @param input - The error message string or structured log options object.
     */
    error(input: ILogInput): void;

    /**
     * Logs a warning message for potentially harmful situations requiring attention.
     * @param input - The warning message string or structured log options object.
     */
    warn(input: ILogInput): void;

    /**
     * Logs a debug message with detailed information for troubleshooting problems.
     * @param input - The debug message string or structured log options object.
     */
    debug(input: ILogInput): void;

    /**
     * Logs an informational message about normal application flow and operations.
     * @param input - The info message string or structured log options object.
     */
    info(input: ILogInput): void;

    /**
     * Logs an informational message about normal application flow and operations.
     * @param input - The info message string or structured log options object.
     * @param level - The info message string or structured log options object.
     */
    log(input: ILogInput, level: ILogLevel): void;

    /**
     * Updates the logger configuration at runtime for dynamic behavior changes.
     * @param config - The new configuration options for level, category, and MongoDB settings.
     */
    configure(config: ILoggerConfigService): void;

    /**
     * Gets the current logging level for external validation and debugging.
     * @returns The current ILogLevel enum value for filtering threshold.
     */
    level: ILogLevel;

    /**
     * Gets the current category identifier for context organization and filtering.
     * @returns The current category string or undefined if not set.
     */
    category: string | undefined;

    /**
     * Adds an additional processor to the hybrid configuration for extended output destinations.
     * @param processor - The LogProcessor implementation for custom log handling.
     */
    add(processor: ILogProcessor): void;
}  
