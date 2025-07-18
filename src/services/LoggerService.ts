import { ILoggerServiceConfig } from '../models/Logger';
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
export class LoggerService {
    /** Internal logger instance configured with hybrid processor */
    private readonly logger: Logger;

    /** Hybrid processor combining console and MongoDB output destinations */
    private readonly hybridProcessor: HybridLogProcessor;

    /**
     * Creates new LoggerService instance with console and MongoDB processors
     * @param config - Optional configuration for log level, category and MongoDB settings
     */
    constructor(config: ILoggerServiceConfig = {}) {
        const {
            level = LogLevel.INFO,
            category = 'APPLICATION',
            mongoUri = 'mongodb://localhost:27017',
            mongoDatabase = 'kozen',
            mongoCollection = 'application_logs'
        } = config;

        // Create processors for dual output destination
        const consoleProcessor = new ConsoleLogProcessor();
        const mongoProcessor = new MongoDBLogProcessor(mongoUri, mongoDatabase, mongoCollection);

        // Combine processors for simultaneous console and database logging
        this.hybridProcessor = new HybridLogProcessor([consoleProcessor, mongoProcessor]);

        // Initialize logger with hybrid processor and configuration
        this.logger = new Logger({
            level,
            category,
            type: 'object',
            processor: this.hybridProcessor
        });
    }

    /**
     * Logs error message with highest priority for critical issues
     * @param input - Error message string or structured log options object
     */
    error(input: LogInput): void {
        this.logger.error(input);
    }

    /**
     * Logs warning message for potentially harmful situations requiring attention
     * @param input - Warning message string or structured log options object
     */
    warn(input: LogInput): void {
        this.logger.warn(input);
    }

    /**
     * Logs debug message with detailed information for troubleshooting problems
     * @param input - Debug message string or structured log options object
     */
    debug(input: LogInput): void {
        this.logger.debug(input);
    }

    /**
     * Logs informational message about normal application flow and operations
     * @param input - Info message string or structured log options object
     */
    info(input: LogInput): void {
        this.logger.info(input);
    }

    /**
     * Updates logger configuration at runtime for dynamic behavior changes
     * @param config - New configuration options for level, category and MongoDB
     */
    updateConfig(config: ILoggerServiceConfig): void {
        this.logger.setting({
            level: config.level,
            category: config.category
        });
    }

    /**
     * Gets current logging level for external validation and debugging
     * @returns Current LogLevel enum value for filtering threshold
     */
    getCurrentLevel(): LogLevel {
        return this.logger.getLevel();
    }

    /**
     * Gets current category identifier for context organization and filtering
     * @returns Current category string or undefined if not set
     */
    getCurrentCategory(): string | undefined {
        return this.logger.getCategory();
    }

    /**
     * Adds additional processor to hybrid configuration for extended output destinations
     * @param processor - LogProcessor implementation for custom log handling
     */
    addProcessor(processor: LogProcessor): void {
        this.hybridProcessor.addProcessor(processor);
    }
} 