# Modular Logging System

This directory contains a modular and extensible logging system built with TypeScript.

## 📁 Directory Structure

```
src/tools/log/
├── types.ts                    # System interfaces and types
├── Logger.ts                   # Main Logger class
├── processors/                 # Log processors
│   ├── index.ts               # Processor exports
│   ├── ConsoleLogProcessor.ts # Console processor (default)
│   ├── MongoDBLogProcessor.ts # MongoDB processor
│   ├── FileLogProcessor.ts    # File processor
│   └── HybridLogProcessor.ts  # Multi-processor combiner
├── index.ts                   # Main module exports
└── README.md                  # This documentation
```

## 🔧 Main Components

### 1. **Logger.ts**
The main logging system class that:
- Manages different log levels (ERROR, WARN, DEBUG, INFO, ALL, NONE)
- Supports categories to identify log sources
- Allows dynamic runtime configuration
- Uses interchangeable processors for output

### 2. **types.ts**
Defines all interfaces and types:
- `LogLevel`: Enum with logging levels
- `LogEntry`: Structure of a log entry
- `LogProcessor`: Interface for custom processors
- `LoggerConfig`: Logger configuration
- `LogOutputType`: Output format type ('json' | 'object')

### 3. **Processors (processors/)**
Interchangeable implementations for log handling:

#### **ConsoleLogProcessor**
- Default processor
- Outputs logs to standard console
- Supports different console methods based on level

#### **MongoDBLogProcessor**
- Stores logs in MongoDB database
- Configurable (connection, database, collection)
- Adds additional metadata for analysis

#### **FileLogProcessor**
- Writes logs to files
- Configurable (file path)
- Supports JSON or human-readable format

#### **HybridLogProcessor**
- Combines multiple processors
- Allows sending logs to multiple destinations simultaneously
- Robust error handling

## 🚀 Basic Usage

```typescript
import { Logger, LogLevel, ConsoleLogProcessor } from '../tools/log';

// Basic logger with console
const logger = new Logger({
  level: LogLevel.INFO,
  category: 'APP',
  type: 'object'
});

logger.info('Application started');
logger.error('Critical error', { code: 500, details: 'Something went wrong' });
```

## 🎯 Advanced Usage

```typescript
import { 
  Logger, 
  LogLevel, 
  MongoDBLogProcessor,
  HybridLogProcessor,
  ConsoleLogProcessor 
} from '../tools/log';

// Logger with multiple destinations
const hybridProcessor = new HybridLogProcessor([
  new ConsoleLogProcessor(),
  new MongoDBLogProcessor('mongodb://localhost:27017', 'app', 'logs')
]);

const logger = new Logger({
  level: LogLevel.DEBUG,
  category: 'PAYMENT',
  type: 'json',
  processor: hybridProcessor
});

// This log goes to both console and MongoDB
logger.error('Payment failed', { 
  transactionId: 'tx-123',
  amount: 99.99,
  userId: 'user456'
});
```

## 🔄 Dynamic Configuration

```typescript
const logger = new Logger({ level: LogLevel.ERROR });

// Change configuration at runtime
logger.setting({
  level: LogLevel.DEBUG,
  category: 'DYNAMIC',
  type: 'json',
  processor: new MongoDBLogProcessor()
});
```

## 🏗️ Custom Processors

```typescript
import { LogProcessor, LogEntry, LogLevel, LogOutputType } from '../tools/log';

class EmailLogProcessor implements LogProcessor {
  process(entry: LogEntry, level: LogLevel, outputType: LogOutputType): void {
    if (level === LogLevel.ERROR) {
      // Send email for critical errors
      this.sendEmail(entry);
    }
  }

  private sendEmail(entry: LogEntry): void {
    // Email sending implementation
  }
}
```

## 📝 Log Levels

| Level | Value | Description |
|-------|-------|-------------|
| NONE  | 0     | No logs |
| ERROR | 1     | Only critical errors |
| WARN  | 2     | Errors and warnings |
| DEBUG | 3     | Errors, warnings, and debug |
| INFO  | 4     | All normal logs (default) |
| ALL   | -1    | All logs including verbose |

## 🎪 Available Demos

- `npm run logger` - Basic logging system demo
- `npm run categories` - Categories and usage demo
- `npm run processors` - Processors and extensible architecture demo

## 🏆 Architecture Benefits

1. **Separation of Concerns**: Logger handles logic, processors handle storage
2. **Extensibility**: Easy to add new processors
3. **Flexibility**: Dynamic behavior switching
4. **Testability**: Easy testing with mock processors
5. **Configuration**: Runtime changes
6. **Organization**: Modular and maintainable code 