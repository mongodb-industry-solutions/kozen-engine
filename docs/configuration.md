# Configuration Guide

## Overview

Kozen Engine uses a flexible, JSON-based configuration system that enables dynamic pipeline creation and execution. The configuration consists of two main files: the main configuration file (`cfg/config.json`) and template definitions (`cfg/templates/*.json`).

## Main Configuration File (`cfg/config.json`)

The main configuration file defines global settings, service dependencies, and execution parameters.

### Complete Configuration Example

```json
{
  "name": "kozen-pipeline",
  "engine": "kozen",
  "version": "4.0.0",
  "description": "Dynamic Infrastructure and Testing Pipeline",
  "dependencies": [
    {
      "key": "StackManagerPulumi",
      "target": "StackManagerPulumi",
      "type": "class",
      "lifetime": "singleton"
    },
    {
      "key": "TemplateManagerFile",
      "target": "TemplateManagerFile",
      "type": "class",
      "lifetime": "singleton"
    },
    {
      "key": "SecretManagerAWS",
      "target": "SecretManagerAWS",
      "type": "class",
      "lifetime": "singleton"
    },
    {
      "key": "Logger",
      "target": "Logger",
      "type": "class",
      "lifetime": "singleton",
      "args": [
        {
          "level": "info",
          "category": "KozenEngine"
        }
      ]
    }
  ]
}
```

### Configuration Schema

| Property       | Type          | Required | Description                   |
| -------------- | ------------- | -------- | ----------------------------- |
| `name`         | string        | Yes      | Pipeline identifier           |
| `engine`       | string        | Yes      | Engine type (usually "kozen") |
| `version`      | string        | Yes      | Configuration version         |
| `description`  | string        | No       | Pipeline description          |
| `dependencies` | IDependency[] | Yes      | IoC service registrations     |

## Service Dependencies Configuration

The `dependencies` array configures the IoC container with service registrations.

### Service Configuration Schema

```typescript
interface IDependency {
  key?: string; // Registration key
  target?: any; // Class, function, value, or string
  type?: "class" | "value" | "function" | "alias" | "ref" | "auto";
  lifetime?: "singleton" | "transient" | "scoped";
  args?: JsonValue[]; // Constructor arguments
  dependencies?: IDependency[]; // Nested dependencies
}
```

### Core Service Registrations

#### Stack Manager Services

```json
{
  "key": "StackManagerPulumi",
  "target": "StackManagerPulumi",
  "type": "class",
  "lifetime": "singleton"
}
```

#### Template Manager Services

```json
{
  "key": "TemplateManagerFile",
  "target": "TemplateManagerFile",
  "type": "class",
  "lifetime": "singleton"
}
```

#### Secret Manager Services

```json
{
  "key": "SecretManagerAWS",
  "target": "SecretManagerAWS",
  "type": "class",
  "lifetime": "singleton"
}
```

### Advanced Service Configuration

#### Service with Constructor Arguments

```json
{
  "key": "Logger",
  "target": "Logger",
  "type": "class",
  "lifetime": "singleton",
  "args": [
    {
      "level": "debug",
      "category": "CustomLogger",
      "type": "json"
    }
  ]
}
```

#### Service with Nested Dependencies

```json
{
  "key": "PipelineManager",
  "target": "PipelineManager",
  "type": "class",
  "lifetime": "singleton",
  "dependencies": [
    {
      "key": "templateManager",
      "target": "TemplateManagerFile",
      "type": "class",
      "lifetime": "singleton"
    },
    {
      "key": "stackManager",
      "target": "StackManagerPulumi",
      "type": "class",
      "lifetime": "singleton"
    }
  ]
}
```

## Environment Variables

Kozen Engine supports environment variable resolution for secure configuration.

### Required Environment Variables

#### AWS Configuration

```bash
# AWS Credentials for AWS services
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# AWS Profiles (alternative to keys)
AWS_PROFILE=your-profile-name
```

#### Pulumi Configuration

```bash
# Pulumi Backend Configuration
PULUMI_BACKEND_URL=s3://your-pulumi-state-bucket
PULUMI_CONFIG_PASSPHRASE=your-encryption-passphrase

# Pulumi Organization (for cloud backends)
PULUMI_ORG=your-organization
```

#### MongoDB Configuration

```bash
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/kozen-data
MONGODB_DATABASE=kozen
MONGODB_COLLECTION=pipeline-data

# MongoDB Atlas (alternative)
MONGODB_ATLAS_URI=mongodb+srv://user:pass@cluster.mongodb.net/kozen
```

#### Application Configuration

```bash
# Application Environment
NODE_ENV=production
LOG_LEVEL=info

# Template Configuration
TEMPLATE_PATH=./cfg/templates
TEMPLATE_STORAGE=file

# Secret Management
SECRET_PROVIDER=aws
SECRET_REGION=us-east-1
```

### Environment Variable Usage in Configuration

Environment variables can be referenced in configuration files:

```json
{
  "key": "SecretManagerAWS",
  "target": "SecretManagerAWS",
  "type": "class",
  "lifetime": "singleton",
  "args": [
    {
      "region": "${AWS_REGION}",
      "accessKeyId": "${AWS_ACCESS_KEY_ID}",
      "secretAccessKey": "${AWS_SECRET_ACCESS_KEY}"
    }
  ]
}
```

## Template Configuration

Templates define the structure and behavior of pipelines.

### Basic Template Structure

```json
{
  "name": "basic-infrastructure",
  "description": "Basic infrastructure deployment template",
  "version": "1.0.0",
  "engine": "kozen",
  "release": "stable",
  "deploymentMode": "sync",
  "stack": {
    "orchestrator": "Pulumi",
    "project": "kozen-basic",
    "environment": {
      "stackName": "ENVIRONMENT"
    }
  },
  "components": [
    {
      "name": "AtlasController",
      "description": "MongoDB Atlas cluster deployment",
      "region": "us-east-1",
      "clusterType": "REPLICASET",
      "input": [
        {
          "name": "projectId",
          "type": "secret",
          "value": "mongodb-atlas/project-id"
        }
      ],
      "output": [
        {
          "name": "connectionString",
          "description": "Database connection string"
        }
      ]
    }
  ]
}
```

### Template Schema

| Property         | Type   | Required | Description                             |
| ---------------- | ------ | -------- | --------------------------------------- |
| `name`           | string | Yes      | Template identifier                     |
| `description`    | string | No       | Template description                    |
| `version`        | string | Yes      | Template version                        |
| `engine`         | string | Yes      | Engine compatibility                    |
| `release`        | string | No       | Release stability (stable, beta, alpha) |
| `deploymentMode` | string | No       | Execution mode (sync, async)            |
| `stack`          | object | No       | Stack configuration                     |
| `components`     | array  | Yes      | Component definitions                   |

## Component Configuration

Components are configured within templates with inputs, outputs, and setup parameters.

### Component Schema

```json
{
  "name": "ComponentName",
  "description": "Component description",
  "version": "1.0.0",
  "engine": "kozen",
  "input": [
    {
      "name": "inputName",
      "type": "environment|secret|reference|static",
      "value": "inputValue",
      "default": "defaultValue",
      "description": "Input description"
    }
  ],
  "setup": [
    {
      "name": "setupParameter",
      "type": "static",
      "value": "setupValue"
    }
  ],
  "output": [
    {
      "name": "outputName",
      "description": "Output description"
    }
  ]
}
```

### Variable Types in Components

#### Environment Variables

```json
{
  "name": "environment",
  "type": "environment",
  "value": "NODE_ENV",
  "default": "development"
}
```

#### Secret Variables

```json
{
  "name": "apiKey",
  "type": "secret",
  "value": "production/api-key"
}
```

#### Reference Variables (from previous components)

```json
{
  "name": "databaseUrl",
  "type": "reference",
  "value": "connectionString"
}
```

#### Static Variables

```json
{
  "name": "region",
  "type": "static",
  "value": "us-east-1"
}
```

## Advanced Configuration Patterns

### Multi-Environment Configuration

Create environment-specific configurations:

#### Development Configuration (`cfg/config.dev.json`)

```json
{
  "name": "kozen-dev",
  "engine": "kozen",
  "version": "4.0.0",
  "dependencies": [
    {
      "key": "TemplateManagerFile",
      "target": "TemplateManagerFile",
      "type": "class",
      "lifetime": "singleton"
    },
    {
      "key": "Logger",
      "target": "Logger",
      "type": "class",
      "lifetime": "singleton",
      "args": [
        {
          "level": "debug",
          "category": "Development"
        }
      ]
    }
  ]
}
```

#### Production Configuration (`cfg/config.prod.json`)

```json
{
  "name": "kozen-prod",
  "engine": "kozen",
  "version": "4.0.0",
  "dependencies": [
    {
      "key": "TemplateManagerMDB",
      "target": "TemplateManagerMDB",
      "type": "class",
      "lifetime": "singleton"
    },
    {
      "key": "Logger",
      "target": "Logger",
      "type": "class",
      "lifetime": "singleton",
      "args": [
        {
          "level": "warn",
          "category": "Production"
        }
      ]
    }
  ]
}
```

### Complex Pipeline Template

```json
{
  "name": "full-pipeline",
  "description": "Complete infrastructure deployment and testing pipeline",
  "version": "2.0.0",
  "engine": "kozen",
  "release": "stable",
  "deploymentMode": "sync",
  "stack": {
    "orchestrator": "Pulumi",
    "project": "kozen-full-pipeline"
  },
  "components": [
    {
      "name": "AtlasController",
      "description": "Deploy MongoDB Atlas cluster",
      "input": [
        {
          "name": "projectId",
          "type": "secret",
          "value": "mongodb-atlas/project-id"
        },
        {
          "name": "environment",
          "type": "environment",
          "value": "NODE_ENV",
          "default": "development"
        }
      ],
      "output": [
        {
          "name": "connectionString",
          "description": "Database connection string"
        },
        {
          "name": "clusterId",
          "description": "Atlas cluster identifier"
        }
      ]
    },
    {
      "name": "KubernetesController",
      "description": "Deploy application to Kubernetes",
      "input": [
        {
          "name": "databaseUrl",
          "type": "reference",
          "value": "connectionString"
        },
        {
          "name": "appImage",
          "type": "static",
          "value": "myapp:latest"
        }
      ],
      "output": [
        {
          "name": "serviceUrl",
          "description": "Application service URL"
        }
      ]
    },
    {
      "name": "E2ETestComponent",
      "description": "Execute end-to-end tests",
      "input": [
        {
          "name": "targetUrl",
          "type": "reference",
          "value": "serviceUrl"
        },
        {
          "name": "testSuite",
          "type": "static",
          "value": "production"
        }
      ],
      "output": [
        {
          "name": "testResults",
          "description": "Test execution results"
        }
      ]
    }
  ]
}
```

## Configuration Validation

### CLI Validation

Validate configuration before execution:

```bash
# Validate configuration file
npm run dev -- --config=cfg/config.json --action=validate

# Validate specific template
npm run dev -- --template=basic-infrastructure --config=cfg/config.json --action=validate
```

### Programmatic Validation

```typescript
import { PipelineManager } from "kozen-engine";

const pipeline = new PipelineManager();
await pipeline.configure(config);

// Validate configuration
const validation = await pipeline.validate("template-name");

if (!validation.success) {
  console.error("Configuration validation failed:", validation.errors);
}
```

## Configuration Best Practices

### 1. Security

- **Never commit secrets**: Use environment variables or secret management
- **Principle of least privilege**: Grant minimal required permissions
- **Separate environments**: Use different configurations for dev/staging/prod

### 2. Maintainability

- **Modular templates**: Break complex pipelines into smaller templates
- **Consistent naming**: Use descriptive, consistent naming conventions
- **Documentation**: Include descriptions for all components and variables

### 3. Performance

- **Singleton services**: Use singleton lifetime for stateless services
- **Lazy loading**: Configure auto-registration for large component sets
- **Resource limits**: Set appropriate resource limits in configurations

### 4. Error Handling

- **Default values**: Provide sensible defaults for optional parameters
- **Validation**: Validate inputs early and provide clear error messages
- **Graceful degradation**: Design for partial failure scenarios

## Configuration Examples by Use Case

### Infrastructure Only

```json
{
  "name": "infrastructure-only",
  "components": [
    {
      "name": "AtlasController",
      "input": [
        {
          "name": "projectId",
          "type": "secret",
          "value": "atlas/project-id"
        }
      ]
    },
    {
      "name": "KubernetesController",
      "input": [
        {
          "name": "databaseUrl",
          "type": "reference",
          "value": "connectionString"
        }
      ]
    }
  ]
}
```

### Testing Only

```json
{
  "name": "testing-pipeline",
  "components": [
    {
      "name": "E2ETestComponent",
      "input": [
        {
          "name": "targetUrl",
          "type": "environment",
          "value": "TEST_TARGET_URL"
        }
      ]
    },
    {
      "name": "PerformanceTestComponent",
      "input": [
        {
          "name": "targetUrl",
          "type": "environment",
          "value": "TEST_TARGET_URL"
        },
        {
          "name": "concurrentUsers",
          "type": "static",
          "value": 100
        }
      ]
    }
  ]
}
```

### Development Environment

```json
{
  "name": "development-setup",
  "components": [
    {
      "name": "AtlasController",
      "clusterType": "REPLICASET",
      "providerInstanceSizeName": "M0"
    },
    {
      "name": "DemoFirst",
      "input": [
        {
          "name": "message",
          "type": "static",
          "value": "Development environment ready"
        }
      ]
    }
  ]
}
```

This comprehensive configuration system provides the flexibility to create powerful, maintainable pipelines while ensuring security and performance best practices.
