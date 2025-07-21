import { ConsoleLogProcessor } from './processors/ConsoleLogProcessor';
import { ILogEntry, ILoggerConfig, ILogInput, ILogLevel, ILogOutputType, ILogProcessor } from './types';

/**
 * Simplified Logger class with configurable output format and pluggable processors
 * Now supports flow-based logging with automatic flow ID generation and simplified input structure
 */
export class Logger {
  /**
   * Current minimum log level threshold for message filtering
   * @private
   */
  private currentLevel: ILogLevel;

  /**
   * Optional category identifier for logging context organization
   * @private
   */
  private category?: string;

  /**
   * Output format type controlling serialization behavior
   * @private
   */
  private outputType: ILogOutputType;

  /**
   * Processor instance responsible for log message output handling
   * @protected
   */
  protected processor: ILogProcessor;

  /**
   * Creates new Logger instance with optional configuration settings
   * @param config - Optional logger configuration with level, category, type and processor settings
   */
  constructor(config: ILoggerConfig = {}) {
    this.currentLevel = config.level ?? ILogLevel.ALL;
    this.category = config.category;
    this.outputType = config.type ?? 'object';
    this.processor = config.processor ?? new ConsoleLogProcessor();
  }

  /**
   * Configures the logger settings - allows changing behavior at runtime
   * @param config - Logger configuration object
   */
  setting(config: ILoggerConfig): void {
    if (config.level !== undefined) {
      this.currentLevel = config.level;
    }
    if (config.category !== undefined) {
      this.category = config.category;
    }
    if (config.type !== undefined) {
      this.outputType = config.type;
    }
    if (config.processor !== undefined) {
      this.processor = config.processor;
    }
  }

  /**
   * Gets the current logging level
   * @returns The current log level
   */
  getLevel(): ILogLevel {
    return this.currentLevel;
  }

  /**
   * Gets the current category
   * @returns The current category or undefined
   */
  getCategory(): string | undefined {
    return this.category;
  }

  /**
   * Gets the current output type
   * @returns The current output type
   */
  getOutputType(): ILogOutputType {
    return this.outputType;
  }

  /**
   * Checks if a log level should be output
   * @param level - The level to check
   * @returns True if the level should be logged
   */
  private shouldLog(level: ILogLevel): boolean {
    if (this.currentLevel === ILogLevel.NONE) return false;
    if (this.currentLevel === ILogLevel.ALL) return true;
    return level <= this.currentLevel;
  }

  /**
   * Gets the level name as string
   * @param level - The log level
   * @returns The level name
   */
  private getLevelName(level: ILogLevel): string {
    switch (level) {
      case ILogLevel.ERROR: return 'ERROR';
      case ILogLevel.WARN: return 'WARN';
      case ILogLevel.DEBUG: return 'DEBUG';
      case ILogLevel.INFO: return 'INFO';
      case ILogLevel.ALL: return 'VERBOSE';
      default: return 'LOG';
    }
  }

  /**
   * Generates a unique flow ID with format YYYYMMDDDHHMMSSXX
   * @returns A unique flow identifier
   */
  private generateFlowId(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}${random}`;
  }

  /**
   * Normalizes input to ILogEntry format
   * @param input - The input to normalize (string, number, or ILogEntry)
   * @returns Normalized ILogEntry object
   */
  private normalizeInput(input: ILogInput): ILogEntry {
    if (typeof input === 'string' || typeof input === 'number') {
      return {
        message: String(input)
      };
    }
    return input;
  }

  /**
   * Creates a log entry with all the necessary information
   * @param level - The log level (ERROR, WARN, DEBUG, INFO)
   * @param options - The normalized log options
   * @returns Complete log entry object
   */
  private createILogEntry(level: ILogLevel, options: ILogEntry): ILogEntry {
    const entry: ILogEntry = {
      ...options,
      level: this.getLevelName(level),
      date: options.date || new Date().toISOString(),
      flow: options.flow || this.generateFlowId(),
    };

    // Remove undefined fields to keep the log clean
    if (!entry.category) delete entry.category;
    if (!entry.data) delete entry.data;

    return entry;
  }

  /**
   * Processes the log entry using the configured processor
   * This method is protected to allow extending classes to override the processing behavior
   * @param entry - The log entry to process
   * @param level - The numeric log level for processor logic
   */
  protected process(entry: ILogEntry, level: ILogLevel): void {
    this.processor.process(entry, level, this.outputType);
  }

  /**
   * Internal method to log a message with the specified level
   * @param level - The log level to use
   * @param input - The log input (string, number, or ILogEntry object)
   */
  protected logWithLevel(level: ILogLevel, input: ILogInput): void {
    if (!this.shouldLog(level)) return;

    const options = this.normalizeInput(input);
    const entry = this.createILogEntry(level, options);
    this.process(entry, level);
  }

  /**
   * Logs an error message - highest priority, usually for critical issues
   * @param input - The error input: string/number for simple message, or ILogEntry object for complex logging
   * @example
   * logger.error('Simple error message');
   * logger.error({ message: 'Database error', data: { code: 500, query: 'SELECT * FROM users' }, flow: 'auth-flow' });
   */
  error(input: ILogInput): void {
    this.logWithLevel(ILogLevel.ERROR, input);
  }

  /**
   * Logs a warning message - for potentially harmful situations
   * @param input - The warning input: string/number for simple message, or ILogEntry object for complex logging
   * @example
   * logger.warn('Deprecated function used');
   * logger.warn({ message: 'Memory usage high', data: { usage: '85%', threshold: '80%' } });
   */
  warn(input: ILogInput): void {
    this.logWithLevel(ILogLevel.WARN, input);
  }

  /**
   * Logs a debug message - detailed information for diagnosing problems
   * @param input - The debug input: string/number for simple message, or ILogEntry object for complex logging
   * @example
   * logger.debug('Processing user request');
   * logger.debug({ message: 'Variable state', data: { userId: 123, step: 'validation' } });
   */
  debug(input: ILogInput): void {
    this.logWithLevel(ILogLevel.DEBUG, input);
  }

  /**
   * Logs an info message - general information about application flow
   * @param input - The info input: string/number for simple message, or ILogEntry object for complex logging
   * @example
   * logger.info('User logged in successfully');
   * logger.info({ message: 'User session started', data: { userId: 'user123', sessionId: 'sess456' } });
   */
  info(input: ILogInput): void {
    this.logWithLevel(ILogLevel.INFO, input);
  }

  /**
   * Logs a general message - alias for info() method for compatibility
   * @param level - The log level to use
   * @param input - The log input: string/number for simple message, or ILogEntry object for complex logging
   * @example
   * logger.log('General message');
   * logger.log({ message: 'Process completed', data: { duration: '2.5s', items: 150 } });
   */
  log(input: ILogInput, level: ILogLevel = ILogLevel.INFO): void {
    this.logWithLevel(level, input);
  }
} 