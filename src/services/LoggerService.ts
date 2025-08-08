import { ILoggerConfigService, ILoggerService } from '../models/Logger';
import { IIoC } from '../tools';
import {
    ConsoleLogProcessor,
    HybridLogProcessor,
    ILogInput,
    ILogLevel,
    ILogProcessor,
    Logger,
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
 *   level: ILogLevel.DEBUG,
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
    /**
     * Internal logger instance configured with hybrid processor for dual output
     * @private
     */
    private readonly logger: Logger;

    /**
     * Hybrid processor combining console and MongoDB output destinations
     * @private
     */
    private readonly hybridProcessor: HybridLogProcessor;

    /**
     * Array of pending log processing promises for asynchronous operations
     * @type {Promise<void>[]}
     */
    public stack: Promise<void>[];

    /**
     * Creates new LoggerService instance with console and MongoDB processors
     * @param config - Optional configuration for log level, category and MongoDB settings
     */
    constructor(config: ILoggerConfigService = {}, dep?: { assistant: IIoC }) {
        const level = config.level ?? ILogLevel.ALL;
        const skip = config.skip;
        this.stack = [];

        // Create processors for dual output destination
        const processors = [];
        config.console?.enabled && processors.push(new ConsoleLogProcessor({
            level: ILogLevel[(config.console?.level as unknown) as keyof typeof ILogLevel] ?? level,
            skip: config.console?.skip ?? skip
        }));
        config.mdb?.enabled && processors.push(new MongoDBLogProcessor({
            level: ILogLevel[(config.mdb?.level as unknown) as keyof typeof ILogLevel] ?? level,
            uri: process.env[config.mdb.uri] || config.mdb.uri,
            database: config.mdb.database || 'kozen',
            collection: config.mdb.collection || 'logs',
            skip: config.mdb?.skip ?? skip
        }));

        // Combine processors for simultaneous console and database logging
        this.hybridProcessor = new HybridLogProcessor(processors);

        // Initialize logger with hybrid processor and configuration
        this.logger = new Logger({
            level,
            skip,
            category: config.category || 'KOZEN',
            type: config?.type || 'object',
            processor: this.hybridProcessor
        });
    }

    toLevel(level: string) {
        return ILogLevel[level.toUpperCase() as keyof typeof ILogLevel] ?? ILogLevel.INFO;
    }

    /**
     * Logs error message with highest priority for critical issues
     * @param input - Error message string or structured log options object
     */
    public error(input: ILogInput): void {
        this.stack.push(this.logger.error(input));
    }

    /**
     * Logs warning message for potentially harmful situations requiring attention
     * @param input - Warning message string or structured log options object
     */
    public warn(input: ILogInput): void {
        this.stack.push(this.logger.warn(input));
    }

    /**
     * Logs debug message with detailed information for troubleshooting problems
     * @param input - Debug message string or structured log options object
     */
    public debug(input: ILogInput): void {
        this.stack.push(this.logger.debug(input));
    }

    /**
     * Logs informational message about normal application flow and operations
     * @param input - Info message string or structured log options object
     */
    public info(input: ILogInput): void {
        this.stack.push(this.logger.info(input));
    }

    /**
     * Logs informational message about normal application flow and operations
     * @param input - Info message string or structured log options object
     * @param level - The log level to use
     */
    public log(input: ILogInput, level?: ILogLevel): void {
        if (typeof input === 'object' && typeof input.level === 'string') {
            level = this.toLevel(input.level);
        }
        this.stack.push(this.logger.log(input, level));
    }

    /**
     * Updates logger configuration at runtime for dynamic behavior changes
     * @param config - New configuration options for level, category and MongoDB
     */
    public configure(config: ILoggerConfigService): void {
        this.logger.setting({
            level: config.level,
            category: config.category
        });
    }

    /**
     * Gets current logging level for external validation and debugging
     * @returns Current ILogLevel enum value for filtering threshold
     */
    public get level(): ILogLevel {
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
    public add(processor: ILogProcessor): void {
        this.hybridProcessor.addProcessor(processor);
    }
}

export default LoggerService;