import { MongoClient } from 'mongodb';
import { ILogEntry, ILogLevel, ILogOutputType, ILoggerConfigMDB } from '../types';
import { LogProcessor } from './LogProcessor';

/**
 * MongoDB log processor - stores logs in a MongoDB database
 */
export class MongoDBLogProcessor extends LogProcessor {
  /**
   * MongoDB connection string for database connectivity
   * @private
   */
  private uri: string;

  /**
   * Target database name for log storage
   * @private
   */
  private database: string;

  /**
   * Target collection name within database for log entries
   * @private
   */
  private collection: string;

  /**
   * Creates new MongoDBLogProcessor instance with database connection configuration
   * @param connectionString - MongoDB connection URI, defaults to 'mongodb://localhost:27017'
   * @param database - Target database name, defaults to 'logs'
   * @param collection - Target collection name, defaults to 'application_logs'
   */
  constructor(options: ILoggerConfigMDB) {
    super(options);
    const { uri = 'mongodb://localhost:27017', database = 'logs', collection = 'application_logs' } = options;
    this.uri = uri;
    this.database = database;
    this.collection = collection;
  }

  /**
   * Processes logs by storing them in MongoDB
   * @param entry - The log entry to store
   * @param level - The numeric log level
   * @param outputType - The output format (not used for MongoDB storage)
   */
  async process(entry: ILogEntry, level: ILogLevel, outputType: ILogOutputType): Promise<void> {

    if (!this.shouldLog({ ...entry, level })) return;
    // In a real implementation, this would connect to MongoDB and insert the log
    // For this demo, we'll simulate the operation
    const mongoDocument = {
      ...entry,
      // database: this.database,
      // collection: this.collection,
      levelNumeric: level,
      createdAt: new Date().toISOString()
    };

    try {
      // Real implementation would be:
      const client = new MongoClient(this.uri);
      const collection = client.db(this.database).collection(this.collection);
      await collection.insertOne(mongoDocument);
    }
    catch (error) {
      console.log({
        src: 'Tool:Log:Processor:MDB',
        message: 'Invalid log processing: ' + (error as Error).message,
        data: {
          uri: this.uri,
          database: this.database,
          collection: this.collection
        }
      })
    }
  }

  /**
   * Gets the MongoDB connection configuration
   * @returns Configuration object
   */
  getConfig() {
    return {
      connectionString: this.uri,
      database: this.database,
      collection: this.collection
    };
  }

  /**
   * Updates the MongoDB configuration
   * @param config - New configuration options
   */
  setConfig(config: { connectionString?: string; database?: string; collection?: string }) {
    if (config.connectionString) this.uri = config.connectionString;
    if (config.database) this.database = config.database;
    if (config.collection) this.collection = config.collection;
  }
} 