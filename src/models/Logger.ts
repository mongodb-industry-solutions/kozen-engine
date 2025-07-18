import { LogLevel } from "../tools";

/**
 * Configuration interface for LoggerService with MongoDB and console settings
 */
export interface ILoggerServiceConfig {
    /** Minimum log level threshold for filtering messages */
    level?: LogLevel;
    /** Category identifier for grouping related log entries */
    category?: string;
    /** MongoDB connection string for database connectivity */
    mongoUri?: string;
    /** MongoDB database name for log storage */
    mongoDatabase?: string;
    /** MongoDB collection name for log entries */
    mongoCollection?: string;
}