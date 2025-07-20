import { ILoggerConfig, ILoggerService } from '../models/Logger';
import {
    ConsoleLogProcessor,
    HybridLogProcessor,
    Logger,
    LogInput,
    LogLevel,
    LogProcessor,
    MongoDBLogProcessor
} from '../tools/log';

/**
 * Service class managing dual-output logging to console and MongoDB database
 * Provides simplified interface for application-wide logging with persistent storage
 * 
 * @example
 * ```typescript
 * // Basic usage with default configuration
 * const LoggerService = new LoggerService();
 * LoggerService.info('Application started successfully');
 * 
 * // Advanced usage with custom configuration
 * const customLogger = new LoggerService({
 *   level: LogLevel.DEBUG,
 *   category: 'PIPELINE',
 *   mongoUri: 'mongodb://localhost:27017',
 *   mongoDatabase: 'kozen',
 *   mongoCollection: 'pipeline_logs'
 * });
 * 
 * // Structured logging with additional data
 * customLogger.error({
 *   message: 'Pipeline execution failed',
 *   data: { pipelineId: 'atlas-basic', error: 'Connection timeout' }
 * });
 * ```
 */
export class LoggerService implements ILoggerService {
    /** Internal logger instance configured with hybrid processor */
    private readonly logger: Logger;

    /** Hybrid processor combining console and MongoDB output destinations */
    private readonly hybridProcessor: HybridLogProcessor;

    /**
     * Creates new LoggerService instance with console and MongoDB processors
     * @param config - Optional configuration for log level, category and MongoDB settings
     */
    constructor(config: ILoggerConfig = {}) {

        // Create processors for dual output destination
        const processors = [];
        config.console?.enabled && processors.push(new ConsoleLogProcessor());
        config.mdb?.enabled && processors.push(new MongoDBLogProcessor(
            config.mdb.uri,
            config.mdb.database || 'kozen',
            config.mdb.collection || 'logs'
        ));

        // Combine processors for simultaneous console and database logging
        this.hybridProcessor = new HybridLogProcessor(processors);

        // Initialize logger with hybrid processor and configuration
        this.logger = new Logger({
            level: LogLevel[config.console?.level as keyof typeof LogLevel] || LogLevel.INFO,
            category: config.category || 'KOZEN',
            type: config?.type || 'object',
            processor: this.hybridProcessor
        });
    }

    /**
     * Logs error message with highest priority for critical issues
     * @param input - Error message string or structured log options object
     */
    public error(input: LogInput): void {
        this.logger.error(input);
    }

    /**
     * Logs warning message for potentially harmful situations requiring attention
     * @param input - Warning message string or structured log options object
     */
    public warn(input: LogInput): void {
        this.logger.warn(input);
    }

    /**
     * Logs debug message with detailed information for troubleshooting problems
     * @param input - Debug message string or structured log options object
     */
    public debug(input: LogInput): void {
        this.logger.debug(input);
    }

    /**
     * Logs informational message about normal application flow and operations
     * @param input - Info message string or structured log options object
     */
    public info(input: LogInput): void {
        this.logger.info(input);
    }

    /**
     * Updates logger configuration at runtime for dynamic behavior changes
     * @param config - New configuration options for level, category and MongoDB
     */
    public configure(config: ILoggerConfig): void {
        this.logger.setting({
            level: config.level,
            category: config.category
        });
    }

    /**
     * Gets current logging level for external validation and debugging
     * @returns Current LogLevel enum value for filtering threshold
     */
    public get level(): LogLevel {
        return this.logger.getLevel();
    }

    /**
     * Gets current category identifier for context organization and filtering
     * @returns Current category string or undefined if not set
     */
    public get category(): string | undefined {
        return this.logger.getCategory();
    }

    /**
     * Adds additional processor to hybrid configuration for extended output destinations
     * @param processor - LogProcessor implementation for custom log handling
     */
    public add(processor: LogProcessor): void {
        this.hybridProcessor.addProcessor(processor);
    }
}

export default LoggerService;