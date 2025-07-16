import { LogLevel, LogEntry, LogOutputType, LogProcessor, LoggerConfig, LogInput, LogOptions } from './types';
import { ConsoleLogProcessor } from './processors/ConsoleLogProcessor';

/**
 * Simplified Logger class with configurable output format and pluggable processors
 * Now supports flow-based logging with automatic flow ID generation and simplified input structure
 */
export class Logger {
  private currentLevel: LogLevel;     // Current minimum log level to display
  private category?: string;          // Category/module name for this logger instance
  private outputType: LogOutputType;  // Output format (json or object)
  protected processor: LogProcessor;  // Log processor that handles the actual output/storage

  constructor(config: LoggerConfig = {}) {
    this.currentLevel = config.level ?? LogLevel.INFO;
    this.category = config.category;
    this.outputType = config.type ?? 'object';
    this.processor = config.processor ?? new ConsoleLogProcessor();
  }

  /**
   * Configures the logger settings - allows changing behavior at runtime
   * @param config - Logger configuration object
   */
  setting(config: LoggerConfig): void {
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
  getLevel(): LogLevel {
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
  getOutputType(): LogOutputType {
    return this.outputType;
  }

  /**
   * Checks if a log level should be output
   * @param level - The level to check
   * @returns True if the level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    if (this.currentLevel === LogLevel.NONE) return false;
    if (this.currentLevel === LogLevel.ALL) return true;
    return level <= this.currentLevel;
  }

  /**
   * Gets the level name as string
   * @param level - The log level
   * @returns The level name
   */
  private getLevelName(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR: return 'ERROR';
      case LogLevel.WARN: return 'WARN';
      case LogLevel.DEBUG: return 'DEBUG';
      case LogLevel.INFO: return 'INFO';
      case LogLevel.ALL: return 'VERBOSE';
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
   * Normalizes input to LogOptions format
   * @param input - The input to normalize (string, number, or LogOptions)
   * @returns Normalized LogOptions object
   */
  private normalizeInput(input: LogInput): LogOptions {
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
  private createLogEntry(level: LogLevel, options: LogOptions): LogEntry {
    const entry: LogEntry = {
      level: this.getLevelName(level),
      message: options.message,
      date: new Date().toISOString(),
      flow: options.flow || this.generateFlowId(),
      category: this.category,
      data: options.data
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
  protected process(entry: LogEntry, level: LogLevel): void {
    this.processor.process(entry, level, this.outputType);
  }

  /**
   * Internal method to log a message with the specified level
   * @param level - The log level to use
   * @param input - The log input (string, number, or LogOptions object)
   */
  private logWithLevel(level: LogLevel, input: LogInput): void {
    if (!this.shouldLog(level)) return;

    const options = this.normalizeInput(input);
    const entry = this.createLogEntry(level, options);
    this.process(entry, level);
  }

  /**
   * Logs an error message - highest priority, usually for critical issues
   * @param input - The error input: string/number for simple message, or LogOptions object for complex logging
   * @example
   * logger.error('Simple error message');
   * logger.error({ message: 'Database error', data: { code: 500, query: 'SELECT * FROM users' }, flow: 'auth-flow' });
   */
  error(input: LogInput): void {
    this.logWithLevel(LogLevel.ERROR, input);
  }

  /**
   * Logs a warning message - for potentially harmful situations
   * @param input - The warning input: string/number for simple message, or LogOptions object for complex logging
   * @example
   * logger.warn('Deprecated function used');
   * logger.warn({ message: 'Memory usage high', data: { usage: '85%', threshold: '80%' } });
   */
  warn(input: LogInput): void {
    this.logWithLevel(LogLevel.WARN, input);
  }

  /**
   * Logs a debug message - detailed information for diagnosing problems
   * @param input - The debug input: string/number for simple message, or LogOptions object for complex logging
   * @example
   * logger.debug('Processing user request');
   * logger.debug({ message: 'Variable state', data: { userId: 123, step: 'validation' } });
   */
  debug(input: LogInput): void {
    this.logWithLevel(LogLevel.DEBUG, input);
  }

  /**
   * Logs an info message - general information about application flow
   * @param input - The info input: string/number for simple message, or LogOptions object for complex logging
   * @example
   * logger.info('User logged in successfully');
   * logger.info({ message: 'User session started', data: { userId: 'user123', sessionId: 'sess456' } });
   */
  info(input: LogInput): void {
    this.logWithLevel(LogLevel.INFO, input);
  }

  /**
   * Logs a general message - alias for info() method for compatibility
   * @param input - The log input: string/number for simple message, or LogOptions object for complex logging
   * @example
   * logger.log('General message');
   * logger.log({ message: 'Process completed', data: { duration: '2.5s', items: 150 } });
   */
  log(input: LogInput): void {
    this.logWithLevel(LogLevel.INFO, input);
  }
} 