import { LogProcessor, LogEntry, LogLevel, LogOutputType } from '../types';

/**
 * Console log processor - outputs logs to the standard console (default implementation)
 */
export class ConsoleLogProcessor implements LogProcessor {
  /**
   * Processes logs by outputting them to the console
   * @param entry - The log entry to output
   * @param level - The numeric log level for console method selection
   * @param outputType - The output format type
   */
  process(entry: LogEntry, level: LogLevel, outputType: LogOutputType): void {
    if (outputType === 'json') {
      // Output as JSON string - useful for log aggregation systems
      const jsonString = JSON.stringify(entry);
      console.log(jsonString);
    } else {
      // Output as JavaScript object - easier to read in development
      switch (level) {
        case LogLevel.ERROR:
          console.error(entry);
          break;
        case LogLevel.WARN:
          console.warn(entry);
          break;
        case LogLevel.DEBUG:
          console.debug(entry);
          break;
        case LogLevel.INFO:
          console.info(entry);
          break;
        default:
          console.log(entry);
      }
    }
  }
} 