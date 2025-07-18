# Infrastructure as Code (IaC) Pipeline

A comprehensive, enterprise-grade Infrastructure as Code pipeline system built with TypeScript, featuring template-based deployment, multi-provider support, and configurable architecture.

## 🚀 Features

- **Template-Based Deployment**: Define infrastructure using JSON templates
- **Multi-Provider Support**: AWS, MongoDB Atlas, Kubernetes, and more
- **Dependency Injection**: Built-in IoC container with auto-registration
- **Extensible Architecture**: Plugin-based component system
- **Comprehensive Logging**: Multi-destination logging (console, file, MongoDB)
- **Secret Management**: Integrated AWS Secret Manager support
- **CLI Interface**: Simple command-line interface for all operations
- **TypeScript**: Full TypeScript support with comprehensive type definitions

## 📋 Quick Start

### Prerequisites

- Node.js 16.0.0 or higher
- TypeScript 5.0.0 or higher
- AWS CLI configured (optional)
- MongoDB instance (optional, for template/log storage)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd iac-pipeline

# Install dependencies
npm install

# Build the project
npm run build
```

### Basic Usage

```bash
# Deploy infrastructure
npm run dev -- --template=atlas.basic --config=cfg/config.json --action=deploy

# Validate template
npm run dev -- --template=atlas.basic --config=cfg/config.json --action=validate

# Remove infrastructure
npm run dev -- --template=atlas.basic --config=cfg/config.json --action=undeploy
```

### Production Usage

```bash
# After building
node dist/bin/pipeline.js --template=atlas.basic --config=cfg/config.json --action=deploy
```

## 🏗️ Project Architecture

### Directory Structure

```
iac/
├── bin/                          # CLI entry points
│   └── pipeline.ts               # Main CLI application
├── src/                          # Source code
│   ├── components/               # Infrastructure components
│   │   ├── Atlas.ts              # MongoDB Atlas component
│   │   ├── Kubernetes.ts         # Kubernetes component
│   │   ├── OpsManager.ts         # Operations Manager component
│   │   ├── HelloWorld.ts         # Example component
│   │   └── SimpleLogger.ts       # Example logger component
│   ├── controllers/              # Application controllers
│   │   ├── BaseController.ts     # Base controller class
│   │   └── PipelineController.ts # Pipeline operations controller
│   ├── models/                   # Data models and interfaces
│   │   ├── AtlasConfig.ts        # Atlas configuration interface
│   │   ├── BaseConfig.ts         # Base configuration interface
│   │   ├── PipelineArgs.ts       # CLI arguments interface
│   │   ├── ExecutionResult.ts    # Execution result interface
│   │   ├── KubernetesConfig.ts   # Kubernetes configuration interface
│   │   ├── LogsConfig.ts         # Logging configuration interface
│   │   ├── ManagerConfigs.ts     # Manager configuration interfaces
│   │   ├── OpsManagerConfig.ts   # Ops Manager configuration interface
│   │   ├── PipelineConfig.ts     # Main pipeline configuration interface
│   │   ├── SecretsConfig.ts      # Secrets configuration interface
│   │   ├── StackConfig.ts        # Stack configuration interface
│   │   ├── Template.ts           # Template definition interface
│   │   ├── TemplateConfig.ts     # Template configuration interface
│   │   ├── ValidationEngine.ts   # Validation engine
│   │   └── WorkspaceConfig.ts    # Workspace configuration interface
│   ├── services/                 # Business logic services
│   │   ├── DataProcessor.ts      # Data processing service
│   │   ├── ExecutionTracker.ts   # Execution tracking service
│   │   ├── PipelineManager.ts    # Main pipeline orchestrator
│   │   ├── StackManager.ts       # Stack management service
│   │   ├── TemplateManager.ts    # Template loading service
│   │   ├── WorkspaceManager.ts   # Workspace management service
│   │   └── SecretManager.ts      # Secret management service
│   ├── tools/                    # Utility libraries
│   │   ├── ioc/                  # Dependency injection container
│   │   │   ├── IoC.ts            # IoC container implementation
│   │   │   ├── types.ts          # IoC type definitions
│   │   │   └── README.md         # IoC documentation
│   │   └── log/                  # Logging system
│   │       ├── Logger.ts         # Logger implementation
│   │       ├── types.ts          # Logging type definitions
│   │       ├── processors/       # Log processors
│   │       │   ├── ConsoleLogProcessor.ts
│   │       │   ├── FileLogProcessor.ts
│   │       │   ├── HybridLogProcessor.ts
│   │       │   └── MongoDBLogProcessor.ts
│   │       └── README.md         # Logging documentation
│   └── index.ts                  # Main entry point for npm package
├── cfg/                          # Configuration files
│   └── config.json               # Default configuration
├── templates/                    # Template definitions
│   └── simple.example.json       # Example template
├── package.json                  # Project configuration
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

### Layer Architecture

The project follows a clean architecture pattern with well-defined layers:

#### 1. **CLI Layer** (`bin/`)

- **Purpose**: Entry point for command-line operations
- **Responsibilities**:
  - Parse command-line arguments
  - Delegate to controllers
  - Handle basic error reporting
- **Key Files**: `pipeline.ts`

#### 2. **Controllers Layer** (`src/controllers/`)

- **Purpose**: Handle input/output validation and orchestrate service calls
- **Responsibilities**:
  - Validate CLI arguments and configuration
  - Coordinate service operations
  - Handle error responses
  - Manage application flow
- **Key Files**:
  - `PipelineController.ts` - Main pipeline operations
  - `BaseController.ts` - Base class for all controllers

#### 3. **Models Layer** (`src/models/`)

- **Purpose**: Define data structures, interfaces, and DTOs
- **Responsibilities**:
  - Type definitions for all data structures
  - Configuration interfaces
  - Validation rules
  - Template definitions
- **Key Files**:
  - `PipelineConfig.ts` - Main configuration interface
  - `Template.ts` - Template structure definition
  - `ExecutionResult.ts` - Operation result structure

#### 4. **Services Layer** (`src/services/`)

- **Purpose**: Implement business logic and core functionality
- **Responsibilities**:
  - Infrastructure orchestration
  - Template processing
  - Stack management
  - Execution tracking
  - Data processing
- **Key Files**:
  - `PipelineManager.ts` - Main orchestrator
  - `TemplateManager.ts` - Template loading and processing
  - `StackManager.ts` - Infrastructure stack management
  - `ExecutionTracker.ts` - Operation tracking and logging

#### 5. **Tools Layer** (`src/tools/`)

- **Purpose**: Provide reusable utility libraries
- **Responsibilities**:
  - Dependency injection container
  - Logging system
  - Common utilities
  - Framework-level functionality
- **Key Modules**:
  - `ioc/` - Dependency injection system
  - `log/` - Comprehensive logging framework

#### 6. **Components Layer** (`src/components/`)

- **Purpose**: Specialized infrastructure components
- **Responsibilities**:
  - Provider-specific implementations
  - Resource deployment logic
  - Configuration validation
  - Output extraction
- **Key Files**:
  - `Atlas.ts` - MongoDB Atlas deployment
  - `Kubernetes.ts` - Kubernetes resource management
  - `OpsManager.ts` - Operations Manager setup

## 🔧 Configuration

### Main Configuration File (`cfg/config.json`)

```json
{
  "stack": {
    "region": "us-east-1",
    "accessKey": "${AWS_ACCESS_KEY_ID}",
    "secretKey": "${AWS_SECRET_ACCESS_KEY}",
    "workspace": {
      "PULUMI_BACKEND_URL": "file://.pulumi",
      "PULUMI_CONFIG_PASSPHRASE": "${PULUMI_CONFIG_PASSPHRASE}",
      "ENVIRONMENT": "development",
      "projectName": "iac-pipeline",
      "runtime": "nodejs"
    }
  },
  "secrets": {
    "region": "us-east-1",
    "accessKeyId": "${AWS_ACCESS_KEY_ID}",
    "secretAccessKey": "${AWS_SECRET_ACCESS_KEY}"
  },
  "template": {
    "storageType": "local",
    "path": "./templates"
  },
  "logs": {
    "level": "info",
    "uri": "mongodb://localhost:27017/logs"
  },
  "dependencies": [
    {
      "key": "customLogger",
      "target": "Logger",
      "type": "class",
      "lifetime": "singleton",
      "args": [
        {
          "level": "debug",
          "category": "CustomLogger"
        }
      ]
    }
  ]
}
```

### Environment Variables

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Pulumi Configuration
PULUMI_BACKEND_URL=file://.pulumi
PULUMI_CONFIG_PASSPHRASE=your-passphrase

# Application Configuration
ENVIRONMENT=development
PROJECT_NAME=iac-pipeline
RUNTIME=nodejs
LOG_LEVEL=info
TEMPLATE_PATH=./templates
```

## 📝 Templates

Templates define infrastructure configurations in JSON format:

```json
{
  "name": "basic-infrastructure",
  "version": "1.0.0",
  "description": "Basic infrastructure template",
  "release": "stable",
  "requirements": [
    {
      "key": "AWSCredentials",
      "provider": "aws",
      "type": "credential",
      "description": "AWS access credentials"
    }
  ],
  "components": [
    {
      "name": "HelloWorldComponent",
      "type": "HelloWorld",
      "region": "us-east-1",
      "input": [
        {
          "name": "message",
          "description": "Greeting message",
          "value": "Hello from IaC Pipeline!"
        }
      ],
      "output": [
        {
          "name": "greeting",
          "description": "Generated greeting message"
        }
      ]
    }
  ],
  "executionMode": "synchronous"
}
```

## 🔌 Components

Components are specialized classes that extend `BaseController` and implement infrastructure-specific logic:

### Creating a Custom Component

```typescript
import { BaseController } from "../controllers/BaseController";
import { BaseConfig } from "../models/BaseConfig";
import { ExecutionResult } from "../models/ExecutionResult";

export class MyCustomComponent extends BaseController {
  public async configure(config: BaseConfig): Promise<void> {
    // Component-specific configuration
    this.config = config;
    this.validateConfiguration();
  }

  public async deploy(): Promise<ExecutionResult> {
    // Implementation for deployment
    return {
      success: true,
      outputs: { deploymentId: "custom-123" },
    };
  }

  public async undeploy(): Promise<void> {
    // Implementation for cleanup
  }

  public async validate(): Promise<boolean> {
    // Implementation for validation
    return true;
  }

  protected validateConfiguration(): void {
    // Custom validation logic
  }
}
```

## 📊 Logging System

The logging system supports multiple destinations:

### Console Logging

```typescript
import { Logger, LogLevel } from "./src/tools/log";

const logger = new Logger({
  level: LogLevel.INFO,
  category: "MyComponent",
});

logger.info("Operation completed successfully");
logger.error("Operation failed", { error: "Details" });
```

### File Logging

```typescript
const logger = new Logger({
  level: LogLevel.DEBUG,
  category: "FileLogger",
  processors: [new FileLogProcessor("./logs/application.log")],
});
```

### MongoDB Logging

```typescript
const logger = new Logger({
  level: LogLevel.INFO,
  category: "MongoLogger",
  processors: [new MongoDBLogProcessor("mongodb://localhost:27017/logs")],
});
```

## 🔐 Secret Management

The system integrates with AWS Secret Manager:

```typescript
import { SecretManager } from "./src/services/SecretManager";

const secretManager = new SecretManager();
await secretManager.configure({
  region: "us-east-1",
  accessKeyId: "your-key",
  secretAccessKey: "your-secret",
});

const secret = await secretManager.getSecret("my-secret-name");
```

## 🚀 CLI Commands

### Available Commands

```bash
# Development commands
npm run dev                    # Run with ts-node
npm run build                  # Build TypeScript
npm run start                  # Run built version
npm run clean                  # Clean build artifacts

# Pipeline operations
npm run pipeline:deploy        # Deploy infrastructure
npm run pipeline:undeploy      # Remove infrastructure
npm run pipeline:validate      # Validate templates

# Specific provider operations
npm run pipeline:deploy:atlas  # Deploy Atlas template
npm run pipeline:deploy:k8s    # Deploy Kubernetes template
npm run pipeline:deploy:ops    # Deploy Ops Manager template

# Testing
npm run test                   # Run validation tests
npm run pipeline:validate:all  # Run all validation tests
```

### Command Line Arguments

```bash
pipeline --template=<template-name> --config=<config-file> --action=<action>

Options:
  --template=<name>    Template name to use (required)
  --config=<file>      Configuration file path (default: config.json)
  --action=<action>    Action to perform: deploy, undeploy, validate

Examples:
  pipeline --template=atlas.basic --config=cfg/config.json --action=deploy
  pipeline --template=kubernetes.standard --action=validate
  pipeline --template=ops.manager --config=production.json --action=undeploy
```

## 🧪 Development

### Adding New Components

1. Create a new component class in `src/components/`
2. Extend `BaseController`
3. Implement required methods
4. Add component to auto-discovery system

### Adding New Services

1. Create service class in `src/services/`
2. Add comprehensive JSDoc documentation
3. Register in IoC container
4. Add configuration interface in `src/models/`

### Testing

```bash
# Run basic validation
npm run test

# Test specific template
npm run dev -- --template=your-template --action=validate

# Run comprehensive validation
npm run pipeline:validate:all
```

### Building

```bash
# Development build
npm run build

# Clean build
npm run clean && npm run build
```

## 📚 API Documentation

### PipelineManager

Main orchestrator for infrastructure operations:

```typescript
const pipelineManager = new PipelineManager();
await pipelineManager.configure(config);

// Deploy infrastructure
const result = await pipelineManager.deploy("template-name");

// Validate template
const validation = await pipelineManager.validate("template-name");

// Remove infrastructure
const removal = await pipelineManager.undeploy("template-name");
```

### TemplateManager

Template loading and processing:

```typescript
const templateManager = new TemplateManager();
templateManager.configure({ storageType: "local", path: "./templates" });

const template = await templateManager.loadTemplate("my-template");
```

### ExecutionTracker

Operation tracking and logging:

```typescript
const tracker = new ExecutionTracker();
await tracker.configure({ level: "info" });

await tracker.log("info", "Operation started");
await tracker.trackExecution(executionResult);
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add comprehensive tests
4. Update documentation
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation in `src/tools/*/README.md`
- Review example templates in `templates/`

---

**Built with ❤️ by the MongoDB Solutions Assurance Team (SAT)**
