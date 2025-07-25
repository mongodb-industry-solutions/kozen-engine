import { ILogEntry, ILogLevel, ILogOutputType, ILogProcessor } from '../types';

/**
 * Hybrid log processor - combines multiple processors to output logs to multiple destinations
 */
export class HybridLogProcessor implements ILogProcessor {
  /**
   * Array of log processors for multi-destination output
   * @private
   */
  private processors: ILogProcessor[];

  /**
   * Creates new HybridLogProcessor instance combining multiple output processors
   * @param processors - Array of LogProcessor instances for simultaneous log handling
   */
  constructor(processors: ILogProcessor[]) {
    this.processors = processors;
  }

  /**
   * Processes log entry with all configured processors
   * @param entry - The log entry to process
   * @param level - The numeric log level
   * @param outputType - The output format type
   */
  process(entry: ILogEntry, level: ILogLevel, outputType: ILogOutputType): void {
    // Process log entry with all configured processors
    this.processors.forEach(processor => {
      try {
        processor.process(entry, level, outputType);
      } catch (error) {
        // If one processor fails, continue with others
        console.error({
          src: 'Tool:Log:Prosessor:Hybrid',
          message: (error as Error).message
        });
      }
    });
  }

  /**
   * Adds a new processor to the hybrid processor
   * @param processor - The processor to add
   */
  addProcessor(processor: ILogProcessor): void {
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
  getProcessors(): ILogProcessor[] {
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