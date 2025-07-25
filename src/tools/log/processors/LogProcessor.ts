import { ILogEntry, ILoggerConfig, ILogLevel, ILogOutputType, ILogProcessor } from "../types";

export class LogProcessor implements ILogProcessor {

    public level: ILogLevel;
    public skip?: string;

    constructor(opt?: ILoggerConfig) {
        const { level = ILogLevel.INFO, skip } = opt || {};
        this.level = level;
        this.skip = skip;
    }

    protected compare(skip?: string, input?: string) {
        if (!skip || !input) {
            return false;
        }
        try {
            return (new RegExp(skip)).test(input);
        }
        catch (_) {
            return input === skip;
        }
    }

    /**
     * Checks if a log level should be output
     * @param level - The level to check
     * @returns True if the level should be logged
     */
    protected shouldLog(entry: ILogEntry): boolean {
        let level: ILogLevel = (typeof entry?.level === 'string' ? ILogLevel[entry?.level as keyof typeof ILogLevel] : entry?.level) ?? ILogLevel.INFO;

        if (this.level === ILogLevel.NONE) return false;
        if (this.compare(this.skip, entry.message)) {
            return false;
        }
        if (this.level === ILogLevel.ALL) return true;
        return level <= this.level;
    }

    public process(entry: ILogEntry, level: ILogLevel, outputType: ILogOutputType): void {
        // Example implementation: Save log entry to a database (stubbed)
        if (!this.shouldLog({ ...entry, level })) return;

        // Simulate DB insert
        console.log(`[DBLogProcessor] Saving log to DB:`, {
            message: entry.message,
            level,
            outputType
        });
        // In a real implementation, insert into DB here
    }
}