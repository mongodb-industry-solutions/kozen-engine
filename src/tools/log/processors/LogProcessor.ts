import { ILogEntry, ILoggerConfig, ILogLevel, ILogOutputType, ILogProcessor } from "../types";

export class LogProcessor implements ILogProcessor {

    public level: ILogLevel;

    constructor(opt?: ILoggerConfig) {
        const { level = ILogLevel.INFO } = opt || {};
        this.level = level;
    }

    /**
     * Checks if a log level should be output
     * @param level - The level to check
     * @returns True if the level should be logged
     */
    protected shouldLog(level: ILogLevel): boolean {
        if (this.level === ILogLevel.NONE) return false;
        if (this.level === ILogLevel.ALL) return true;
        return level <= this.level;
    }

    public process(entry: ILogEntry, level: ILogLevel, outputType: ILogOutputType): void {
        // Example implementation: Save log entry to a database (stubbed)
        if (!this.shouldLog(level)) return;

        // Simulate DB insert
        console.log(`[DBLogProcessor] Saving log to DB:`, {
            message: entry.message,
            level,
            outputType
        });
        // In a real implementation, insert into DB here
    }
}