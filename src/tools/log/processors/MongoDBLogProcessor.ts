import { LogProcessor, LogEntry, LogLevel, LogOutputType } from '../types';

/**
 * MongoDB log processor - stores logs in a MongoDB database
 */
export class MongoDBLogProcessor implements LogProcessor {
  private connectionString: string;
  private database: string;
  private collection: string;

  constructor(connectionString: string = 'mongodb://localhost:27017', database: string = 'logs', collection: string = 'application_logs') {
    this.connectionString = connectionString;
    this.database = database;
    this.collection = collection;
  }

  /**
   * Processes logs by storing them in MongoDB
   * @param entry - The log entry to store
   * @param level - The numeric log level
   * @param outputType - The output format (not used for MongoDB storage)
   */
  process(entry: LogEntry, level: LogLevel, outputType: LogOutputType): void {
    // In a real implementation, this would connect to MongoDB and insert the log
    // For this demo, we'll simulate the operation
    const mongoDocument = {
      ...entry,
      levelNumeric: level,
      database: this.database,
      collection: this.collection,
      storedAt: new Date().toISOString()
    };

    // Simulate MongoDB insertion
    console.log(`[MongoDB] Storing log in ${this.database}.${this.collection}:`, mongoDocument);
    
    // Real implementation would be:
    // const client = new MongoClient(this.connectionString);
    // await client.db(this.database).collection(this.collection).insertOne(mongoDocument);
  }

  /**
   * Gets the MongoDB connection configuration
   * @returns Configuration object
   */
  getConfig() {
    return {
      connectionString: this.connectionString,
      database: this.database,
      collection: this.collection
    };
  }

  /**
   * Updates the MongoDB configuration
   * @param config - New configuration options
   */
  setConfig(config: { connectionString?: string; database?: string; collection?: string }) {
    if (config.connectionString) this.connectionString = config.connectionString;
    if (config.database) this.database = config.database;
    if (config.collection) this.collection = config.collection;
  }
} 