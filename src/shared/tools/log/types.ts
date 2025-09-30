/**
 * Log levels enum for controlling log output
 */
export enum ILogLevel {
  NONE = 0,      // No logs
  ERROR = 1,     // Only errors
  WARN = 2,      // Errors and warnings
  DEBUG = 3,     // Errors, warnings, and debug
  INFO = 4,      // All logs (default)
  ALL = -1       // All logs including verbose
}

/**
 * Log output types
 */
export type ILogOutputType = 'json' | 'object';

/**
 * Log entry structure - represents a single log message with all its information
 */
export interface ILogEntry {
  level?: string | ILogLevel;  // Log level as string (ERROR, WARN, DEBUG, INFO, VERBOSE)
  message?: string;          // The main log message
  date?: string;            // ISO timestamp when the log was created (renamed from timestamp for readability)
  flow?: string;            // Unique workflow/process identifier in format YYYYMMDDDHHMMSSXX
  category?: string;        // Optional category/module name to identify the source of the log
  data?: any;               // Additional data/context provided by the caller (objects, arrays, etc.)
  src?: string;             // Additional data/context provided by the caller
}

/**
 * Log input type - can be either a string (simple message) or ILogEntry object
 */
export type ILogInput = string | number | ILogEntry;

/**
 * Log processor interface - defines how logs should be processed/stored
 */
export interface ILogProcessor {
  /**
   * Minimum log level to display (NONE=0, ERROR=1, WARN=2, DEBUG=3, INFO=4, ALL=-1)
   */
  level?: ILogLevel;

  /**
   * Processes a log entry according to the specific implementation
   * @param entry - The log entry to process
   * @param level - The numeric log level for additional processing logic
   * @param outputType - The desired output format (json or object)
   */
  process(entry: ILogEntry, level: ILogLevel, outputType: ILogOutputType): void;
}

/**
 * Logger configuration interface - defines how the logger should behave
 */
export interface ILoggerConfig {
  enabled?: boolean;
  skip?: string;             // Regular expression to skip
  level?: ILogLevel;         // Minimum log level to display (NONE=0, ERROR=1, WARN=2, DEBUG=3, INFO=4, ALL=-1)
  category?: string;         // Category/module name that will be added to all logs from this logger instance
  type?: ILogOutputType;     // Output format: 'json' = JSON string, 'object' = JavaScript object (default)
  processor?: ILogProcessor; // Custom log processor (defaults to ConsoleLogProcessor)
}

export interface ILoggerConfigMDB extends ILoggerConfig {
  uri: string;
  database: string;
  collection: string;
}