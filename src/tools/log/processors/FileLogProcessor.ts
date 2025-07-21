import { ILogEntry, ILogLevel, ILogOutputType, ILogProcessor } from '../types';

/**
 * File log processor - appends logs to a file
 */
export class FileLogProcessor implements ILogProcessor {
  /**
   * File system path where log entries are written
   * @private
   */
  private filePath: string;

  /**
   * Creates new FileLogProcessor instance with specified output file path
   * @param filePath - Target file path for log output, defaults to './application.log'
   */
  constructor(filePath: string = './application.log') {
    this.filePath = filePath;
  }

  /**
   * Processes logs by appending them to a file
   * @param entry - The log entry to write
   * @param level - The numeric log level
   * @param outputType - The output format
   */
  process(entry: ILogEntry, level: ILogLevel, outputType: ILogOutputType): void {
    const logLine = this.formatLogLine(entry, outputType);

    // Simulate file writing
    console.log(`[FILE] Writing to ${this.filePath}: ${logLine}`);

    // Real implementation would be:
    // import * as fs from 'fs';
    // fs.appendFileSync(this.filePath, logLine + '\n');
  }

  /**
   * Gets the current file path
   * @returns The file path where logs are written
   */
  getFilePath(): string {
    return this.filePath;
  }

  /**
   * Sets a new file path for logging
   * @param filePath - The new file path
   */
  setFilePath(filePath: string): void {
    this.filePath = filePath;
  }

  /**
   * Creates a formatted log line based on the output type
   * @param entry - The log entry
   * @param outputType - The output format type
   * @returns Formatted log line
   */
  private formatLogLine(entry: ILogEntry, outputType: ILogOutputType): string {
    if (outputType === 'json') {
      return JSON.stringify(entry);
    }

    // Human-readable format
    const date = entry.date;
    const level = `[${entry.level}]`;
    const category = entry.category ? `[${entry.category}]` : '';
    const flow = `[${entry.flow}]`;
    const message = entry.message;
    const data = entry.data ? ` ${JSON.stringify(entry.data)}` : '';

    return `${date} ${level} ${category} ${flow} ${message}${data}`.trim();
  }
} 