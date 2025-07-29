# Configuration Guide

## Overview

Kozen Engine uses a flexible, JSON-based configuration system that enables dynamic pipeline creation and execution. The configuration consists of two main files: the main configuration file (`cfg/config.json`) and template definitions (`cfg/templates/*.json`).

## Main Configuration File (`cfg/config.json`)

The main configuration file defines global settings, service dependencies, and execution parameters using the IoC (Inversion of Control) container pattern.

### Current Configuration Structure

```json
{
  "name": "kozen-iac",
  "version": "1.0.0",
  "engine": ">=1.0.0",
  "description": "Infrastructure as Code Pipeline with configurable templates",
  "dependencies": [
    {
      "target": "StackManager",
      "type": "class",
      "lifetime": "transient",
      "path": "../../services",
      "args": [
        {
          "workspace": {
            "url": "s3://kozen-pulumi-stacks",
            "runtime": "nodejs"
          }
        }
      ],
      "dependencies": [
        {
          "key": "assistant",
          "target": "IoC",
          "type": "ref"
        },
        {
          "key": "logger",
          "target": "LoggerService",
          "type": "ref"
        }
      ]
    }
  ]
}
```

### Configuration Schema

| Property       | Type          | Required | Description                  |
| -------------- | ------------- | -------- | ---------------------------- |
| `name`         | string        | Yes      | Pipeline identifier          |
| `version`      | string        | Yes      | Configuration version        |
| `engine`       | string        | Yes      | Engine version compatibility |
| `description`  | string        | No       | Pipeline description         |
| `dependencies` | IDependency[] | Yes      | IoC service registrations    |

## Service Dependencies Configuration

The `dependencies` array configures the IoC container with service registrations. All services follow a consistent dependency injection pattern.

### Service Configuration Schema

```typescript
interface IDependency {
  target: string; // Service class name
  type: "class" | "value" | "function" | "ref" | "auto";
  lifetime: "singleton" | "transient" | "scoped";
  path?: string; // Module path for classes
  args?: JsonValue[]; // Constructor arguments
  dependencies?: Array<{
    // Injected dependencies
    key: string;
    target: string;
    type: "ref";
  }>;
}
```

## Core Service Registrations

### Stack Manager Services

#### Generic Stack Manager

```json
{
  "target": "StackManager",
  "type": "class",
  "lifetime": "transient",
  "path": "../../services",
  "args": [
    {
      "workspace": {
        "url": "s3://kozen-pulumi-stacks",
        "runtime": "nodejs"
      }
    }
  ],
  "dependencies": [
    {
      "key": "assistant",
      "target": "IoC",
      "type": "ref"
    },
    {
      "key": "logger",
      "target": "LoggerService",
      "type": "ref"
    }
  ]
}
```

#### Pulumi Stack Manager

```json
{
  "target": "StackManagerPulumi",
  "type": "class",
  "lifetime": "transient",
  "path": "../../services",
  "args": [null],
  "dependencies": [
    {
      "key": "assistant",
      "target": "IoC",
      "type": "ref"
    },
    {
      "key": "logger",
      "target": "LoggerService",
      "type": "ref"
    }
  ]
}
```

#### Node Stack Manager

```json
{
  "target": "StackManagerNode",
  "type": "class",
  "lifetime": "transient",
  "path": "../../services",
  "args": [null],
  "dependencies": [
    {
      "key": "assistant",
      "target": "IoC",
      "type": "ref"
    },
    {
      "key": "logger",
      "target": "LoggerService",
      "type": "ref"
    }
  ]
}
```

### Template Manager Services

#### File-based Template Manager

```json
{
  "target": "TemplateManagerFile",
  "type": "class",
  "path": "../../services",
  "args": [null],
  "dependencies": [
    {
      "key": "assistant",
      "target": "IoC",
      "type": "ref"
    },
    {
      "key": "logger",
      "target": "LoggerService",
      "type": "ref"
    }
  ]
}
```

#### MongoDB Template Manager

```json
{
  "target": "TemplateManagerMDB",
  "type": "class",
  "path": "../../services",
  "args": [null],
  "dependencies": [
    {
      "key": "assistant",
      "target": "IoC",
      "type": "ref"
    },
    {
      "key": "logger",
      "target": "LoggerService",
      "type": "ref"
    }
  ]
}
```

#### Generic Template Manager (with configuration)

```json
{
  "target": "TemplateManager",
  "type": "class",
  "lifetime": "singleton",
  "path": "../../services",
  "args": [
    {
      "type": "File",
      "file": {
        "path": "./cfg/templates"
      },
      "mdb": {
        "enabled": true,
        "database": "kozen",
        "collection": "templates",
        "uri": "MDB_URI"
      }
    }
  ],
  "dependencies": [
    {
      "key": "assistant",
      "target": "IoC",
      "type": "ref"
    },
    {
      "key": "logger",
      "target": "LoggerService",
      "type": "ref"
    }
  ]
}
```

### Secret Manager Services

#### AWS Secret Manager

```json
{
  "target": "SecretManagerAWS",
  "type": "class",
  "lifetime": "singleton",
  "path": "../../services",
  "args": [null],
  "dependencies": [
    {
      "key": "assistant",
      "target": "IoC",
      "type": "ref"
    },
    {
      "key": "logger",
      "target": "LoggerService",
      "type": "ref"
    }
  ]
}
```

#### MongoDB Secret Manager

```json
{
  "target": "SecretManagerMDB",
  "type": "class",
  "lifetime": "singleton",
  "path": "../../services",
  "args": [null],
  "dependencies": [
    {
      "key": "assistant",
      "target": "IoC",
      "type": "ref"
    },
    {
      "key": "logger",
      "target": "LoggerService",
      "type": "ref"
    }
  ]
}
```

#### Generic Secret Manager (with configuration)

```json
{
  "target": "SecretManager",
  "type": "class",
  "lifetime": "singleton",
  "path": "../../services",
  "args": [
    {
      "type": "AWS",
      "cloud": {
        "region": "us-east-1",
        "accessKeyId": "AWS_ACCESS_KEY_ID",
        "secretAccessKey": "AWS_SECRET_ACCESS_KEY"
      }
    }
  ],
  "dependencies": [
    {
      "key": "assistant",
      "target": "IoC",
      "type": "ref"
    },
    {
      "key": "logger",
      "target": "LoggerService",
      "type": "ref"
    }
  ]
}
```

### Core Pipeline Services

#### Pipeline Manager

```json
{
  "target": "PipelineManager",
  "type": "class",
  "lifetime": "singleton",
  "path": "../../services",
  "dependencies": [
    {
      "key": "assistant",
      "target": "IoC",
      "type": "ref"
    },
    {
      "key": "logger",
      "target": "LoggerService",
      "type": "ref"
    }
  ]
}
```

#### Logger Service

```json
{
  "target": "LoggerService",
  "type": "class",
  "lifetime": "singleton",
  "path": "../../services",
  "args": [
    {
      "mdb": {
        "enabled": true,
        "database": "kozen",
        "collection": "logs",
        "uri": "MDB_URI",
        "level": "DEBUG"
      },
      "console": {
        "enabled": true,
        "level": "all"
      }
    }
  ],
  "dependencies": [
    {
      "key": "assistant",
      "target": "IoC",
      "type": "ref"
    }
  ]
}
```

#### Variable Processor Service

```json
{
  "target": "ProcessorService",
  "type": "class",
  "lifetime": "singleton",
  "path": "../../services",
  "args": [{}],
  "dependencies": [
    {
      "key": "srvSecret",
      "target": "SecretManager",
      "type": "ref"
    },
    {
      "key": "assistant",
      "target": "IoC",
      "type": "ref"
    },
    {
      "key": "logger",
      "target": "LoggerService",
      "type": "ref"
    }
  ]
}
```

### Component Auto-Registration

```json
{
  "path": "../../components",
  "type": "auto",
  "lifetime": "singleton",
  "args": [{}],
  "dependencies": [
    {
      "key": "assistant",
      "target": "IoC",
      "type": "ref"
    },
    {
      "key": "logger",
      "target": "LoggerService",
      "type": "ref"
    }
  ]
}
```

## Environment Variables

Kozen Engine supports environment variable resolution for secure configuration and runtime parameters.

### Required Environment Variables

#### Pipeline Configuration

```bash
# Template Selection
KOZEN_TEMPLATE=demo
KOZEN_CONFIG=cfg/config.json
KOZEN_ACTION=deploy
KOZEN_STACK=dev
KOZEN_PROJECT=K2025072112202952
```

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
# MongoDB Connection for templates and logs
MDB_URI=mongodb://localhost:27017/kozen-data

# MongoDB Atlas (alternative)
MONGODB_ATLAS_URI=mongodb+srv://<user>:<pass>@<cluster>/<database>
```

#### Component-Specific Configuration

```bash
# Atlas Component Configuration
ATLAS_PUBLIC_KEY=your-atlas-public-key
ATLAS_PRIVATE_KEY=your-atlas-private-key
ATLAS_PROJECT_ID=your-atlas-project-id

# Demo Component Configuration
DEMO_NAME=my-demo-project
DEMO_DELAY=1000
```

#### Development Configuration

```bash
# Application Environment
NODE_ENV=development
LOG_LEVEL=debug

# Debug Configuration
DEBUG=kozen:*
```

## Template Configuration

Templates are now stored in the `cfg/templates/` directory with enhanced structure and variable types.

**📚 For complete template documentation, see [docs/templates.md](./templates.md)**

### Basic Template Example

```json
{
  "name": "demo",
  "description": "Simple demonstration template for testing",
  "version": "1.0.0",
  "engine": "1.0.0",
  "release": "20241201",
  "requires": [],
  "stack": {
    "orchestrator": "Node",
    "input": [
      {
        "type": "environment",
        "name": "PULUMI_CONFIG_PASSPHRASE"
      }
    ],
    "setup": [
      {
        "type": "environment",
        "name": "aws:region",
        "value": "AWS_REGION",
        "default": "us-east-1"
      }
    ],
    "components": [
      {
        "name": "DemoFirst",
        "input": [
          {
            "type": "environment",
            "name": "projectName",
            "value": "DEMO_NAME"
          },
          {
            "type": "value",
            "name": "message",
            "value": "Welcome to Kozen Engine! 🚀"
          }
        ],
        "output": [
          {
            "type": "reference",
            "name": "ipAddress",
            "value": "ipAddress",
            "description": "IP address of the component"
          }
        ]
      }
    ]
  }
}
```

## Debugging and Development Configuration

### VSCode Debug Configuration

The project includes pre-configured VSCode debug configurations in `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "🛠️ Develop",
      "runtimeExecutable": "npm",
      "console": "integratedTerminal",
      "runtimeArgs": ["run", "dev"],
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "type": "node",
      "request": "launch",
      "name": "🚀 Test Deploy",
      "runtimeExecutable": "npm",
      "console": "integratedTerminal",
      "runtimeArgs": ["run", "test:deploy"],
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Environment-Specific Configuration

Create `.env` files for different environments:

#### Development (`.env.development`)

```bash
NODE_ENV=development
KOZEN_TEMPLATE=demo
KOZEN_STACK=dev
KOZEN_PROJECT=DEV001
LOG_LEVEL=debug
```

#### Testing (`.env.test`)

```bash
NODE_ENV=test
KOZEN_TEMPLATE=demo
KOZEN_STACK=test
KOZEN_PROJECT=TEST001
LOG_LEVEL=info
```

#### Production (`.env.production`)

```bash
NODE_ENV=production
KOZEN_TEMPLATE=atlas.basic
KOZEN_STACK=prod
KOZEN_PROJECT=PROD001
LOG_LEVEL=warn
```

## Configuration Best Practices

### 1. Security

- **Environment Variables**: Use environment variables for sensitive data
- **Secret Management**: Leverage SecretManager services for credentials
- **Principle of Least Privilege**: Configure minimal required permissions

### 2. Service Configuration

- **Singleton Services**: Use singleton lifetime for stateless services
- **Dependency Injection**: Properly configure service dependencies
- **Service Isolation**: Keep services loosely coupled

### 3. Template Management

- **Version Control**: Version templates properly
- **Environment Separation**: Use different templates for different environments
- **Input Validation**: Validate template inputs early

### 4. Development Workflow

- **Local Development**: Use file-based template manager for development
- **Production**: Use MongoDB template manager for production
- **Testing**: Create test-specific configurations

## Multi-Environment Setup

### Development Configuration (`cfg/config.dev.json`)

```json
{
  "name": "kozen-dev",
  "version": "1.0.0",
  "engine": ">=1.0.0",
  "description": "Development configuration",
  "dependencies": [
    {
      "target": "TemplateManagerFile",
      "type": "class",
      "lifetime": "singleton",
      "path": "../../services",
      "dependencies": [
        {
          "key": "assistant",
          "target": "IoC",
          "type": "ref"
        },
        {
          "key": "logger",
          "target": "LoggerService",
          "type": "ref"
        }
      ]
    },
    {
      "target": "LoggerService",
      "type": "class",
      "lifetime": "singleton",
      "path": "../../services",
      "args": [
        {
          "console": {
            "enabled": true,
            "level": "debug"
          }
        }
      ]
    }
  ]
}
```

### Production Configuration (`cfg/config.prod.json`)

```json
{
  "name": "kozen-prod",
  "version": "1.0.0",
  "engine": ">=1.0.0",
  "description": "Production configuration",
  "dependencies": [
    {
      "target": "TemplateManagerMDB",
      "type": "class",
      "lifetime": "singleton",
      "path": "../../services",
      "dependencies": [
        {
          "key": "assistant",
          "target": "IoC",
          "type": "ref"
        },
        {
          "key": "logger",
          "target": "LoggerService",
          "type": "ref"
        }
      ]
    },
    {
      "target": "LoggerService",
      "type": "class",
      "lifetime": "singleton",
      "path": "../../services",
      "args": [
        {
          "mdb": {
            "enabled": true,
            "database": "kozen",
            "collection": "logs",
            "uri": "MDB_URI",
            "level": "WARN"
          }
        }
      ]
    }
  ]
}
```

## Troubleshooting

### Common Configuration Issues

1. **Service Registration Errors**

   - Verify service paths are correct
   - Check dependency injection configuration
   - Ensure all required dependencies are registered

2. **Environment Variable Issues**

   - Verify environment variables are set
   - Check variable names match configuration
   - Use default values where appropriate

3. **Template Loading Issues**

   - Verify template file paths
   - Check template JSON syntax
   - Ensure template structure matches schema

4. **MongoDB Connection Issues**
   - Verify MDB_URI environment variable
   - Check MongoDB connectivity
   - Ensure database and collection names are correct

**📚 For deployment and production configuration, see [docs/deployment.md](./deployment.md)**

This comprehensive configuration system provides the flexibility to create powerful, maintainable pipelines while ensuring security and performance best practices across different environments and deployment scenarios.
