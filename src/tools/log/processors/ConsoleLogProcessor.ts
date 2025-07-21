import { ILogEntry, ILogLevel, ILogOutputType } from '../types';
import { LogProcessor } from './LogProcessor';

/**
 * Console log processor - outputs logs to the standard console (default implementation)
 */
export class ConsoleLogProcessor extends LogProcessor {
  /**
   * Processes logs by outputting them to the console
   * @param entry - The log entry to output
   * @param level - The numeric log level for console method selection
   * @param outputType - The output format type
   */
  process(entry: ILogEntry, level: ILogLevel, outputType: ILogOutputType): void {
    if (outputType === 'json') {
      // Output as JSON string - useful for log aggregation systems
      const jsonString = JSON.stringify(entry);
      console.log(jsonString);
    } else {
      // Output as JavaScript object - easier to read in development
      switch (level) {
        case ILogLevel.ERROR:
          console.error(entry);
          break;
        case ILogLevel.WARN:
          console.warn(entry);
          break;
        case ILogLevel.DEBUG:
          console.debug(entry);
          break;
        case ILogLevel.INFO:
          console.info(entry);
          break;
        default:
          console.log(entry);
      }
    }
  }
} 