// Base processors
export { ConsoleLogProcessor } from './ConsoleLogProcessor';
export { FileLogProcessor } from './FileLogProcessor';
export { MongoDBLogProcessor } from './MongoDBLogProcessor';

// Specialized processors
export { HybridLogProcessor } from './HybridLogProcessor';

// Re-export types for convenience
export type { ILogEntry, ILogLevel, ILogOutputType, ILogProcessor } from '../types';

