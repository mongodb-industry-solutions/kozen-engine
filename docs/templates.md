# Template System

## Overview

The Kozen Engine template system enables the creation of reusable, configurable pipeline definitions. Templates define the structure, components, and data flow for infrastructure deployment and testing operations. The system supports dynamic variable resolution, component chaining, and flexible storage backends. Component execution parallelization is handled through composition components that group and orchestrate the execution of their internal components.

![Template System Architecture](./images/kozen-architecture-Template.drawio.svg)

## Template Architecture

### Core Concepts

- **Template**: A JSON-based pipeline definition
- **Components**: Individual units of work within a template
- **Variables**: Dynamic inputs resolved at runtime
- **Outputs**: Data produced by components for subsequent use
- **Stack Configuration**: Infrastructure orchestration settings
- **Composition Components**: Components that group and parallelize execution of other components

### Template Lifecycle

1. **Template Loading**: Template retrieved from storage (file system or MongoDB)
2. **Variable Resolution**: Input variables processed through ProcessorService
3. **Component Execution**: Components executed according to orchestration strategy
4. **Output Collection**: Results gathered and stored
5. **Data Analytics**: Execution data stored in MongoDB for visualization

## Template Structure

### Basic Template Schema

```json
{
  "name": "string",
  "description": "string",
  "version": "string",
  "engine": "string",
  "release": "string",
  "requires": [],
  "stack": {
    "orchestrator": "Node|Pulumi",
    "input": [],
    "setup": [],
    "components": [
      {
        "name": "string",
        "input": [],
        "setup": [],
        "output": []
      }
    ]
  }
}
```

### Template Properties

| Property      | Type   | Required | Description                           |
| ------------- | ------ | -------- | ------------------------------------- |
| `name`        | string | Yes      | Unique template identifier            |
| `description` | string | No       | Human-readable description            |
| `version`     | string | Yes      | Semantic version (e.g., "1.0.0")      |
| `engine`      | string | Yes      | Engine version compatibility          |
| `release`     | string | No       | Release identifier (e.g., "20241201") |
| `requires`    | array  | No       | Template dependencies (default: [])   |
| `stack`       | object | Yes      | Stack configuration and components    |

### Stack Configuration

The stack object contains orchestration settings and component definitions:

| Property       | Type   | Required | Description                             |
| -------------- | ------ | -------- | --------------------------------------- |
| `orchestrator` | string | Yes      | Orchestration engine ("Node", "Pulumi") |
| `input`        | array  | No       | Stack-level input variables             |
| `setup`        | array  | No       | Stack-level setup configuration         |
| `components`   | array  | Yes      | Component definitions                   |

## Variable Types

### Environment Variables

References environment variables from the execution context:

```json
{
  "type": "environment",
  "name": "projectName",
  "value": "PROJECT_NAME",
  "default": "default-project"
}
```

### Value Variables

Static configuration values:

```json
{
  "type": "value",
  "name": "message",
  "value": "Welcome to Kozen Engine! 🚀"
}
```

### Reference Variables

References outputs from previous components or other variables:

```json
{
  "type": "reference",
  "name": "delay",
  "value": "DEMO_DELAY",
  "default": 1000
}
```

### Secret Variables

Retrieves secure values through the SecretManager:

```json
{
  "type": "secret",
  "name": "apiKey",
  "value": "ATLAS_PRIVATE_KEY",
  "default": "default-secret-value"
}
```

### Protected Variables

Secure configuration values for sensitive setup parameters:

```json
{
  "type": "protected",
  "name": "aws:secretKey",
  "value": "AWS_SECRET_ACCESS_KEY",
  "default": ""
}
```

## Component Definition

### Component Schema

```json
{
  "name": "ComponentName",
  "input": [
    {
      "type": "environment|value|reference|secret|protected",
      "name": "variableName",
      "value": "variableValue",
      "default": "defaultValue"
    }
  ],
  "setup": [
    {
      "type": "environment|value|reference|secret|protected",
      "name": "setupParameter",
      "value": "setupValue",
      "default": "defaultValue"
    }
  ],
  "output": [
    {
      "type": "reference|value",
      "name": "outputName",
      "value": "outputValue",
      "description": "Output description"
    }
  ]
}
```

### Component Variable Processing

Variables in components follow the same type system as stack-level variables, with additional support for:

- **Cross-component references**: Output from one component can be referenced in another
- **Variable interpolation**: String values support `${variable}` syntax
- **Default value fallbacks**: Automatic fallback to default values when resolution fails

## Template Examples

### Simple Demo Template

```json
{
  "name": "demo",
  "description": "Simple demonstration template for testing the IaC pipeline functionality with HelloWorld and SimpleLogger components. Perfect for development and system verification.",
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
      },
      {
        "type": "environment",
        "name": "PULUMI_BACKEND_URL"
      }
    ],
    "setup": [
      {
        "type": "environment",
        "name": "aws:region",
        "value": "AWS_REGION",
        "default": "us-east-1"
      },
      {
        "type": "protected",
        "name": "aws:accessKey",
        "value": "AWS_ACCESS_KEY_ID",
        "default": ""
      },
      {
        "type": "protected",
        "name": "aws:secretKey",
        "value": "AWS_SECRET_ACCESS_KEY",
        "default": ""
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
            "value": "Welcome to the IaC Pipeline Demo! 🚀"
          },
          {
            "type": "reference",
            "name": "delay",
            "value": "DEMO_DELAY",
            "default": 1000
          }
        ],
        "output": [
          {
            "type": "reference",
            "name": "ipAddress",
            "value": "ipAddress",
            "description": "IP address of the HelloWorld component"
          },
          {
            "type": "value",
            "name": "format",
            "value": "${message} - ${reference}",
            "description": "Formatted message from HelloWorld"
          }
        ],
        "setup": [
          {
            "type": "secret",
            "name": "mongodb-atlas:publicKey",
            "value": "ATLAS_PUBLIC_KEY"
          },
          {
            "type": "secret",
            "name": "mongodb-atlas:privateKey",
            "value": "ATLAS_PRIVATE_KEY"
          }
        ]
      },
      {
        "name": "DemoSecond",
        "input": [
          {
            "type": "reference",
            "name": "address",
            "value": "ipAddress",
            "default": "127.0.0.1"
          },
          {
            "type": "value",
            "name": "message",
            "value": "Hello from DemoSecond! 🌍"
          },
          {
            "name": "delay",
            "value": 500
          }
        ]
      }
    ]
  }
}
```

### Infrastructure Deployment Template

```json
{
  "name": "atlas-infrastructure",
  "description": "MongoDB Atlas cluster deployment with enhanced security and configuration management",
  "version": "1.0.0",
  "engine": "1.0.0",
  "release": "20241201",
  "requires": [],
  "stack": {
    "orchestrator": "Pulumi",
    "input": [
      {
        "type": "environment",
        "name": "PULUMI_CONFIG_PASSPHRASE"
      },
      {
        "type": "environment",
        "name": "NODE_ENV",
        "default": "development"
      }
    ],
    "setup": [
      {
        "type": "protected",
        "name": "mongodb-atlas:publicKey",
        "value": "ATLAS_PUBLIC_KEY"
      },
      {
        "type": "protected",
        "name": "mongodb-atlas:privateKey",
        "value": "ATLAS_PRIVATE_KEY"
      },
      {
        "type": "protected",
        "name": "mongodb-atlas:projectId",
        "value": "ATLAS_PROJECT_ID"
      }
    ],
    "components": [
      {
        "name": "AtlasController",
        "input": [
          {
            "type": "secret",
            "name": "projectId",
            "value": "ATLAS_PROJECT_ID"
          },
          {
            "type": "environment",
            "name": "environment",
            "value": "NODE_ENV",
            "default": "development"
          },
          {
            "type": "value",
            "name": "clusterType",
            "value": "REPLICASET"
          },
          {
            "type": "value",
            "name": "mongoDbMajorVersion",
            "value": "8.0"
          },
          {
            "type": "value",
            "name": "providerInstanceSizeName",
            "value": "M10"
          },
          {
            "type": "value",
            "name": "cloudBackup",
            "value": true
          }
        ],
        "setup": [
          {
            "type": "value",
            "name": "clusterName",
            "value": "kozen-cluster"
          },
          {
            "type": "environment",
            "name": "region",
            "value": "AWS_REGION",
            "default": "us-east-1"
          }
        ],
        "output": [
          {
            "type": "reference",
            "name": "connectionString",
            "value": "connectionString",
            "description": "MongoDB connection string"
          },
          {
            "type": "reference",
            "name": "clusterId",
            "value": "clusterId",
            "description": "Atlas cluster identifier"
          }
        ]
      }
    ]
  }
}
```

### Multi-Component Pipeline Template

```json
{
  "name": "full-deployment-pipeline",
  "description": "Complete infrastructure deployment with testing and monitoring",
  "version": "2.0.0",
  "engine": "1.0.0",
  "release": "20241201",
  "requires": [],
  "stack": {
    "orchestrator": "Pulumi",
    "input": [
      {
        "type": "environment",
        "name": "PULUMI_CONFIG_PASSPHRASE"
      },
      {
        "type": "environment",
        "name": "NODE_ENV",
        "default": "development"
      }
    ],
    "setup": [
      {
        "type": "protected",
        "name": "aws:region",
        "value": "AWS_REGION",
        "default": "us-east-1"
      },
      {
        "type": "protected",
        "name": "aws:accessKey",
        "value": "AWS_ACCESS_KEY_ID"
      },
      {
        "type": "protected",
        "name": "aws:secretKey",
        "value": "AWS_SECRET_ACCESS_KEY"
      }
    ],
    "components": [
      {
        "name": "AtlasController",
        "input": [
          {
            "type": "secret",
            "name": "projectId",
            "value": "ATLAS_PROJECT_ID"
          }
        ],
        "output": [
          {
            "type": "reference",
            "name": "connectionString",
            "value": "connectionString",
            "description": "Database connection string"
          }
        ]
      },
      {
        "name": "KubernetesController",
        "input": [
          {
            "type": "reference",
            "name": "databaseUrl",
            "value": "connectionString"
          },
          {
            "type": "environment",
            "name": "appImage",
            "value": "APP_IMAGE",
            "default": "myapp:latest"
          }
        ],
        "setup": [
          {
            "type": "value",
            "name": "namespace",
            "value": "production"
          },
          {
            "type": "value",
            "name": "replicas",
            "value": 3
          }
        ],
        "output": [
          {
            "type": "reference",
            "name": "serviceUrl",
            "value": "serviceUrl",
            "description": "Application service URL"
          },
          {
            "type": "reference",
            "name": "namespace",
            "value": "namespace",
            "description": "Kubernetes namespace"
          }
        ]
      },
      {
        "name": "TestingComponent",
        "input": [
          {
            "type": "reference",
            "name": "targetUrl",
            "value": "serviceUrl"
          },
          {
            "type": "value",
            "name": "testSuite",
            "value": "production"
          }
        ],
        "setup": [
          {
            "type": "value",
            "name": "browser",
            "value": "chromium"
          },
          {
            "type": "value",
            "name": "headless",
            "value": true
          }
        ],
        "output": [
          {
            "type": "reference",
            "name": "testResults",
            "value": "testResults",
            "description": "Test execution results"
          }
        ]
      }
    ]
  }
}
```

## Template Storage

### File System Storage (TemplateManagerFile)

Templates stored in the file system under `cfg/templates/`:

```
cfg/templates/
├── demo.json
├── atlas.basic.json
├── kubernetes.standard.json
├── full.pipeline.json
└── testing.suite.json
```

#### File Naming Convention

- Format: `{name}.{variant}.json` or `{name}.json`
- Examples: `demo.json`, `atlas.basic.json`, `k8s.production.json`

### MongoDB Storage (TemplateManagerMDB)

Templates stored in MongoDB collections:

```javascript
// MongoDB Document Structure
{
    _id: ObjectId("..."),
    name: "demo",
    version: "1.0.0",
    engine: "1.0.0",
    template: {
        // Complete template definition
    },
    metadata: {
        createdAt: ISODate("..."),
        updatedAt: ISODate("..."),
        tags: ["demo", "testing", "development"]
    }
}
```

#### Collection Structure

- **Collection**: `templates`
- **Database**: Configurable (default: `kozen`)
- **Indexing**: Name, version, engine, tags

## Variable Processing

### Variable Resolution Order

1. **Value Variables**: Processed first (static values)
2. **Environment Variables**: Resolved from process environment
3. **Secret Variables**: Retrieved through SecretManager
4. **Protected Variables**: Secure values for stack configuration
5. **Reference Variables**: Resolved from previous component outputs

### ProcessorService

The ProcessorService handles variable resolution and interpolation:

```typescript
const processor = new ProcessorService();

// Process input variables
const resolvedInputs = await processor.transformInput(
  component,
  previousOutputs,
  "input"
);

// Process setup variables
const resolvedSetup = await processor.transformSetup(
  component,
  resolvedInputs,
  "setup"
);
```

### Variable Interpolation

Variables support string interpolation:

```json
{
  "type": "value",
  "name": "connectionString",
  "value": "mongodb://${username}:${password}@${host}:${port}/${database}"
}
```

Where `${username}`, `${password}`, etc., are resolved from environment variables or secrets.

## Component Execution and Orchestration

### Orchestration Strategies

The system supports different orchestration approaches through composition components:

#### Sequential Execution

Components execute one after another, allowing for output dependencies:

```json
{
  "stack": {
    "orchestrator": "Node",
    "components": [
      { "name": "DatabaseComponent" },
      { "name": "ApplicationComponent" },
      { "name": "TestingComponent" }
    ]
  }
}
```

#### Parallel Execution

Composition components can group related components and execute them in parallel:

```json
{
  "stack": {
    "orchestrator": "Pulumi",
    "components": [
      { "name": "InfrastructureComposer" },
      { "name": "ApplicationComposer" },
      { "name": "TestingComposer" }
    ]
  }
}
```

### Composition Components

Composition components act as orchestrators for groups of related components, enabling:

- **Parallel execution** of independent components
- **Resource optimization** through batched operations
- **Error isolation** between component groups
- **Dependency management** across component boundaries

## Template Validation

### Schema Validation

Templates are validated against the new JSON schema:

```typescript
// Validate template structure
const validation = await templateManager.validate(templateName);

if (!validation.success) {
  console.error("Template validation failed:", validation.errors);
}
```

### Component Validation

Individual components are validated:

```typescript
// Validate component configuration
const component = await templateManager.loadComponent(componentName);
const validation = await component.validate(inputs);
```

### Runtime Validation

Variables and dependencies validated at runtime:

```typescript
// Validate variable resolution
const variables = await processor.validateVariables(component.input);

// Validate component dependencies
const dependencies = await processor.validateDependencies(component);
```

## Template Best Practices

### 1. Design Principles

#### Single Responsibility

Each template should have a clear, focused purpose:

```json
{
  "name": "atlas-deployment",
  "description": "MongoDB Atlas cluster deployment only",
  "stack": {
    "components": [{ "name": "AtlasController" }]
  }
}
```

#### Modular Composition

Break complex workflows into smaller, reusable templates:

```json
{
  "name": "infrastructure-base",
  "description": "Base infrastructure components",
  "stack": {
    "components": [
      { "name": "AtlasController" },
      { "name": "NetworkController" }
    ]
  }
}
```

#### Orchestration Strategy

Design templates to leverage composition components for optimal execution:

```json
{
  "name": "parallel-deployment",
  "description": "Optimized deployment using parallel execution",
  "stack": {
    "components": [
      { "name": "InfrastructureComposer" },
      { "name": "ApplicationComposer" }
    ]
  }
}
```

### 2. Variable Management

#### Clear Naming

Use descriptive variable names:

```json
{
  "type": "secret",
  "name": "mongodbProjectId",
  "value": "ATLAS_PROJECT_ID"
}
```

#### Default Values

Provide sensible defaults:

```json
{
  "type": "environment",
  "name": "environment",
  "value": "NODE_ENV",
  "default": "development"
}
```

#### Variable Types

Choose appropriate variable types:

- **value**: For static configuration
- **environment**: For runtime environment variables
- **secret**: For sensitive data
- **protected**: For secure stack configuration
- **reference**: For inter-component communication

### 3. Security

#### Secret Management

Never include secrets directly in templates:

```json
// ❌ Bad
{
  "type": "value",
  "name": "apiKey",
  "value": "sk-1234567890abcdef"
}

// ✅ Good
{
  "type": "secret",
  "name": "apiKey",
  "value": "ATLAS_PRIVATE_KEY"
}
```

#### Protected Configuration

Use protected variables for sensitive setup parameters:

```json
{
  "type": "protected",
  "name": "aws:secretKey",
  "value": "AWS_SECRET_ACCESS_KEY",
  "default": ""
}
```

## Template Development Workflow

### 1. Template Creation

```bash
# Create new template file
touch cfg/templates/my-new-template.json

# Validate template syntax
npm run dev -- --template=my-new-template --action=validate
```

### 2. Testing and Iteration

```bash
# Test template deployment
npm run dev -- --template=my-new-template --action=deploy

# Check template status
npm run dev -- --template=my-new-template --action=status

# Clean up test deployment
npm run dev -- --template=my-new-template --action=undeploy
```

### 3. Version Management

```json
{
  "name": "my-template",
  "version": "1.0.0",
  "engine": "1.0.0",
  "release": "20241201"
}
```

### 4. Documentation

Create template-specific documentation:

```json
{
  "name": "documented-template",
  "description": "Well-documented template example with comprehensive configuration",
  "metadata": {
    "documentation": "docs/templates/documented-template.md",
    "examples": "examples/documented-template/",
    "tags": ["infrastructure", "testing", "mongodb"]
  }
}
```

## Advanced Template Features

### Component Dependencies

```json
{
  "stack": {
    "components": [
      {
        "name": "DatabaseComponent",
        "order": 1
      },
      {
        "name": "ApplicationComponent",
        "order": 2,
        "input": [
          {
            "type": "reference",
            "name": "databaseUrl",
            "value": "connectionString"
          }
        ]
      }
    ]
  }
}
```

### Dynamic Configuration

```json
{
  "stack": {
    "components": [
      {
        "name": "AtlasController",
        "input": [
          {
            "type": "environment",
            "name": "clusterType",
            "value": "CLUSTER_TYPE",
            "default": "REPLICASET"
          },
          {
            "type": "environment",
            "name": "instanceSize",
            "value": "INSTANCE_SIZE",
            "default": "M10"
          }
        ]
      }
    ]
  }
}
```

### Template Requirements

Use the `requires` field to specify dependencies:

```json
{
  "name": "advanced-template",
  "requires": ["infrastructure-base", "security-baseline"],
  "stack": {
    "components": [{ "name": "AdvancedComponent" }]
  }
}
```

This comprehensive template system enables the creation of powerful, flexible, and maintainable pipeline definitions that can be easily shared, versioned, and reused across different environments and use cases. The composition component approach ensures optimal execution performance through intelligent parallelization while maintaining clear dependencies between components.
