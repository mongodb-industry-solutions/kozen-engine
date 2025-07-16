import { LogProcessor, LogEntry, LogLevel, LogOutputType } from '../types';

/**
 * File log processor - appends logs to a file
 */
export class FileLogProcessor implements LogProcessor {
  private filePath: string;

  constructor(filePath: string = './application.log') {
    this.filePath = filePath;
  }

  /**
   * Processes logs by appending them to a file
   * @param entry - The log entry to write
   * @param level - The numeric log level
   * @param outputType - The output format
   */
  process(entry: LogEntry, level: LogLevel, outputType: LogOutputType): void {
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
  private formatLogLine(entry: LogEntry, outputType: LogOutputType): string {
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