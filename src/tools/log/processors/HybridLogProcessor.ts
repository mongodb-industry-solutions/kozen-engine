import { LogProcessor, LogEntry, LogLevel, LogOutputType } from '../types';

/**
 * Hybrid log processor - combines multiple processors to output logs to multiple destinations
 */
export class HybridLogProcessor implements LogProcessor {
  private processors: LogProcessor[];

  constructor(processors: LogProcessor[]) {
    this.processors = processors;
  }

  /**
   * Processes log entry with all configured processors
   * @param entry - The log entry to process
   * @param level - The numeric log level
   * @param outputType - The output format type
   */
  process(entry: LogEntry, level: LogLevel, outputType: LogOutputType): void {
    // Process log entry with all configured processors
    this.processors.forEach(processor => {
      try {
        processor.process(entry, level, outputType);
      } catch (error) {
        // If one processor fails, continue with others
        console.error(`[HybridLogProcessor] Processor failed:`, error);
      }
    });
  }

  /**
   * Adds a new processor to the hybrid processor
   * @param processor - The processor to add
   */
  addProcessor(processor: LogProcessor): void {
    this.processors.push(processor);
  }

  /**
   * Removes a processor from the hybrid processor
   * @param processorIndex - The index of the processor to remove
   */
  removeProcessor(processorIndex: number): void {
    if (processorIndex >= 0 && processorIndex < this.processors.length) {
      this.processors.splice(processorIndex, 1);
    }
  }

  /**
   * Gets the list of all processors
   * @returns Array of processors
   */
  getProcessors(): LogProcessor[] {
    return [...this.processors];
  }

  /**
   * Gets the number of processors
   * @returns Number of processors
   */
  getProcessorCount(): number {
    return this.processors.length;
  }

  /**
   * Clears all processors
   */
  clearProcessors(): void {
    this.processors = [];
  }
} 