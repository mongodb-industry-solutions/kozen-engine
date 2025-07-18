# Template System

## Overview

The Kozen Engine template system enables the creation of reusable, configurable pipeline definitions. Templates define the structure, components, and data flow for infrastructure deployment and testing operations. The system supports dynamic variable resolution, component chaining, and flexible storage backends.

![Template System Architecture](./images/kozen-architecture-Template.drawio.svg)

## Template Architecture

### Core Concepts

- **Template**: A JSON-based pipeline definition
- **Components**: Individual units of work within a template
- **Variables**: Dynamic inputs resolved at runtime
- **Outputs**: Data produced by components for subsequent use
- **Stack Configuration**: Infrastructure orchestration settings

### Template Lifecycle

1. **Template Loading**: Template retrieved from storage (file system or MongoDB)
2. **Variable Resolution**: Input variables processed through VarProcessorService
3. **Component Execution**: Components executed in sequence
4. **Output Collection**: Results gathered and stored
5. **Data Analytics**: Execution data stored in MongoDB for visualization

## Template Structure

### Basic Template Schema

```json
{
  "name": "string",
  "description": "string",
  "version": "string",
  "engine": "kozen",
  "release": "stable|beta|alpha",
  "deploymentMode": "sync|async",
  "stack": {
    "orchestrator": "Pulumi|Node",
    "project": "string",
    "environment": {}
  },
  "components": [
    {
      "name": "string",
      "description": "string",
      "input": [],
      "setup": [],
      "output": []
    }
  ]
}
```

### Template Properties

| Property         | Type   | Required | Description                      |
| ---------------- | ------ | -------- | -------------------------------- |
| `name`           | string | Yes      | Unique template identifier       |
| `description`    | string | No       | Human-readable description       |
| `version`        | string | Yes      | Semantic version (e.g., "1.0.0") |
| `engine`         | string | Yes      | Engine compatibility ("kozen")   |
| `release`        | string | No       | Release stability level          |
| `deploymentMode` | string | No       | Execution mode (default: "sync") |
| `stack`          | object | No       | Stack configuration              |
| `components`     | array  | Yes      | Component definitions            |

## Component Definition

### Component Schema

```json
{
  "name": "ComponentName",
  "description": "Component description",
  "version": "1.0.0",
  "engine": "kozen",
  "region": "us-east-1",
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
      "type": "static|environment|secret",
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

### Variable Types

#### Environment Variables

References environment variables from the execution context:

```json
{
  "name": "nodeEnv",
  "type": "environment",
  "value": "NODE_ENV",
  "default": "development",
  "description": "Deployment environment"
}
```

#### Secret Variables

Retrieves secure values through the SecretManager:

```json
{
  "name": "apiKey",
  "type": "secret",
  "value": "production/api-key",
  "description": "API authentication key"
}
```

#### Reference Variables

References outputs from previous components:

```json
{
  "name": "databaseConnection",
  "type": "reference",
  "value": "connectionString",
  "description": "Database connection from Atlas component"
}
```

#### Static Variables

Fixed configuration values:

```json
{
  "name": "region",
  "type": "static",
  "value": "us-east-1",
  "description": "AWS deployment region"
}
```

## Template Examples

### Infrastructure Deployment Template

```json
{
  "name": "atlas-infrastructure",
  "description": "MongoDB Atlas cluster deployment",
  "version": "1.0.0",
  "engine": "kozen",
  "release": "stable",
  "deploymentMode": "sync",
  "stack": {
    "orchestrator": "Pulumi",
    "project": "atlas-infrastructure",
    "environment": {
      "stackName": "ENVIRONMENT"
    }
  },
  "components": [
    {
      "name": "AtlasController",
      "description": "Deploy MongoDB Atlas cluster",
      "region": "us-east-1",
      "clusterType": "REPLICASET",
      "mongoDbMajorVersion": "8.0",
      "providerInstanceSizeName": "M10",
      "cloudBackup": true,
      "input": [
        {
          "name": "projectId",
          "type": "secret",
          "value": "mongodb-atlas/project-id",
          "description": "Atlas project identifier"
        },
        {
          "name": "environment",
          "type": "environment",
          "value": "NODE_ENV",
          "default": "development",
          "description": "Deployment environment"
        }
      ],
      "setup": [
        {
          "name": "clusterName",
          "type": "static",
          "value": "kozen-cluster"
        }
      ],
      "output": [
        {
          "name": "connectionString",
          "description": "MongoDB connection string"
        },
        {
          "name": "clusterId",
          "description": "Atlas cluster identifier"
        }
      ]
    }
  ]
}
```

### Full Pipeline Template

```json
{
  "name": "full-deployment-pipeline",
  "description": "Complete infrastructure deployment with testing",
  "version": "2.0.0",
  "engine": "kozen",
  "release": "stable",
  "deploymentMode": "sync",
  "stack": {
    "orchestrator": "Pulumi",
    "project": "full-pipeline"
  },
  "components": [
    {
      "name": "AtlasController",
      "description": "Deploy database infrastructure",
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
    },
    {
      "name": "KubernetesController",
      "description": "Deploy application services",
      "input": [
        {
          "name": "databaseUrl",
          "type": "reference",
          "value": "connectionString"
        },
        {
          "name": "appImage",
          "type": "environment",
          "value": "APP_IMAGE",
          "default": "myapp:latest"
        }
      ],
      "setup": [
        {
          "name": "namespace",
          "type": "static",
          "value": "production"
        },
        {
          "name": "replicas",
          "type": "static",
          "value": 3
        }
      ],
      "output": [
        {
          "name": "serviceUrl",
          "description": "Application service URL"
        },
        {
          "name": "namespace",
          "description": "Kubernetes namespace"
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
      "setup": [
        {
          "name": "browser",
          "type": "static",
          "value": "chromium"
        },
        {
          "name": "headless",
          "type": "static",
          "value": true
        }
      ],
      "output": [
        {
          "name": "testResults",
          "description": "Test execution results"
        },
        {
          "name": "coverage",
          "description": "Test coverage metrics"
        }
      ]
    },
    {
      "name": "PerformanceTestComponent",
      "description": "Execute performance testing",
      "input": [
        {
          "name": "targetUrl",
          "type": "reference",
          "value": "serviceUrl"
        },
        {
          "name": "concurrentUsers",
          "type": "environment",
          "value": "LOAD_TEST_USERS",
          "default": "10"
        },
        {
          "name": "testDuration",
          "type": "static",
          "value": "60"
        }
      ],
      "output": [
        {
          "name": "performanceMetrics",
          "description": "Performance test results"
        }
      ]
    }
  ]
}
```

### Testing-Only Template

```json
{
  "name": "comprehensive-testing",
  "description": "Complete testing suite without infrastructure deployment",
  "version": "1.0.0",
  "engine": "kozen",
  "release": "stable",
  "deploymentMode": "sync",
  "components": [
    {
      "name": "DemoFirst",
      "description": "Initialize testing environment",
      "input": [
        {
          "name": "message",
          "type": "static",
          "value": "Testing environment initialized"
        }
      ],
      "output": [
        {
          "name": "environmentReady",
          "description": "Environment initialization status"
        }
      ]
    },
    {
      "name": "E2ETestComponent",
      "description": "Run end-to-end tests",
      "input": [
        {
          "name": "targetUrl",
          "type": "environment",
          "value": "TEST_TARGET_URL"
        },
        {
          "name": "environmentStatus",
          "type": "reference",
          "value": "environmentReady"
        }
      ],
      "output": [
        {
          "name": "e2eResults",
          "description": "E2E test results"
        }
      ]
    },
    {
      "name": "APITestComponent",
      "description": "Run API integration tests",
      "input": [
        {
          "name": "apiEndpoint",
          "type": "environment",
          "value": "API_ENDPOINT"
        },
        {
          "name": "apiKey",
          "type": "secret",
          "value": "api-testing/key"
        }
      ],
      "output": [
        {
          "name": "apiTestResults",
          "description": "API test results"
        }
      ]
    },
    {
      "name": "PerformanceTestComponent",
      "description": "Run performance tests",
      "input": [
        {
          "name": "targetUrl",
          "type": "environment",
          "value": "TEST_TARGET_URL"
        },
        {
          "name": "loadProfile",
          "type": "static",
          "value": "standard"
        }
      ],
      "output": [
        {
          "name": "performanceResults",
          "description": "Performance test results"
        }
      ]
    }
  ]
}
```

## Template Storage

### File System Storage (TemplateManagerFile)

Templates stored in the file system under `cfg/templates/`:

```
cfg/templates/
├── atlas.basic.json
├── kubernetes.standard.json
├── full.pipeline.json
└── testing.suite.json
```

#### File Naming Convention

- Format: `{name}.{variant}.json`
- Examples: `atlas.basic.json`, `k8s.production.json`

### MongoDB Storage (TemplateManagerMDB)

Templates stored in MongoDB collections:

```javascript
// MongoDB Document Structure
{
    _id: ObjectId("..."),
    name: "atlas-basic",
    version: "1.0.0",
    engine: "kozen",
    template: {
        // Complete template definition
    },
    metadata: {
        createdAt: ISODate("..."),
        updatedAt: ISODate("..."),
        tags: ["infrastructure", "mongodb", "atlas"]
    }
}
```

#### Collection Structure

- **Collection**: `templates`
- **Database**: Configurable (default: `kozen`)
- **Indexing**: Name, version, engine, tags

## Variable Processing

### Variable Resolution Order

1. **Static Values**: Processed first (no resolution needed)
2. **Environment Variables**: Resolved from process environment
3. **Secret Variables**: Retrieved through SecretManager
4. **Reference Variables**: Resolved from previous component outputs

### VarProcessorService

The VarProcessorService handles variable resolution and interpolation:

```typescript
const processor = new VarProcessorService();

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
  "name": "connectionString",
  "type": "static",
  "value": "mongodb://${username}:${password}@${host}:${port}/${database}"
}
```

Where `${username}`, `${password}`, etc., are resolved from environment variables or secrets.

## Template Validation

### Schema Validation

Templates are validated against JSON schema:

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
  "components": [
    {
      "name": "AtlasController"
    }
  ]
}
```

#### Modular Composition

Break complex workflows into smaller, reusable templates:

```json
{
  "name": "infrastructure-base",
  "description": "Base infrastructure components",
  "components": ["AtlasController", "NetworkController"]
}
```

```json
{
  "name": "application-deployment",
  "description": "Application deployment on existing infrastructure",
  "components": ["KubernetesController", "ServiceController"]
}
```

#### Idempotent Operations

Ensure templates can be run multiple times safely:

```json
{
  "name": "idempotent-deployment",
  "components": [
    {
      "name": "AtlasController",
      "setup": [
        {
          "name": "createOnlyIfNotExists",
          "type": "static",
          "value": true
        }
      ]
    }
  ]
}
```

### 2. Variable Management

#### Clear Naming

Use descriptive variable names:

```json
{
  "name": "mongodbProjectId",
  "type": "secret",
  "value": "mongodb-atlas/project-id",
  "description": "MongoDB Atlas project identifier"
}
```

#### Default Values

Provide sensible defaults:

```json
{
  "name": "environment",
  "type": "environment",
  "value": "NODE_ENV",
  "default": "development",
  "description": "Deployment environment"
}
```

#### Documentation

Document all variables and outputs:

```json
{
  "name": "connectionString",
  "description": "MongoDB connection string for application use"
}
```

### 3. Error Handling

#### Graceful Degradation

Design for partial failure scenarios:

```json
{
  "name": "RobustDeployment",
  "components": [
    {
      "name": "PrimaryService",
      "input": [
        {
          "name": "fallbackEnabled",
          "type": "static",
          "value": true
        }
      ]
    }
  ]
}
```

#### Clear Error Messages

Provide actionable error information:

```json
{
  "name": "database",
  "type": "secret",
  "value": "production/database-url",
  "description": "Database URL - ensure secret exists in production/database-url"
}
```

### 4. Security

#### Secret Management

Never include secrets in templates:

```json
// ❌ Bad
{
    "name": "apiKey",
    "type": "static",
    "value": "sk-1234567890abcdef"
}

// ✅ Good
{
    "name": "apiKey",
    "type": "secret",
    "value": "production/api-key"
}
```

#### Environment Separation

Use environment-specific variables:

```json
{
  "name": "databaseUrl",
  "type": "environment",
  "value": "DATABASE_URL_${NODE_ENV}",
  "description": "Environment-specific database URL"
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
  "version": "1.0.0", // Initial release
  "description": "Updated for new component support"
}
```

```json
{
  "name": "my-template",
  "version": "1.1.0", // Feature addition
  "description": "Added performance testing component"
}
```

### 4. Documentation

Create template-specific documentation:

```json
{
  "name": "documented-template",
  "description": "Well-documented template example",
  "metadata": {
    "documentation": "docs/templates/documented-template.md",
    "examples": "examples/documented-template/",
    "tags": ["infrastructure", "testing", "mongodb"]
  }
}
```

## Advanced Template Features

### Conditional Components

```json
{
  "name": "conditional-deployment",
  "components": [
    {
      "name": "AtlasController",
      "condition": "${DEPLOY_DATABASE} === 'true'"
    },
    {
      "name": "KubernetesController",
      "condition": "${DEPLOY_APP} === 'true'"
    }
  ]
}
```

### Component Dependencies

```json
{
  "name": "dependency-aware",
  "components": [
    {
      "name": "DatabaseComponent",
      "order": 1
    },
    {
      "name": "ApplicationComponent",
      "order": 2,
      "dependsOn": ["DatabaseComponent"]
    },
    {
      "name": "TestComponent",
      "order": 3,
      "dependsOn": ["ApplicationComponent"]
    }
  ]
}
```

### Dynamic Configuration

```json
{
  "name": "dynamic-config",
  "components": [
    {
      "name": "AtlasController",
      "clusterType": "${CLUSTER_TYPE}",
      "providerInstanceSizeName": "${INSTANCE_SIZE}",
      "replicationSpecs": [
        {
          "numShards": "${NUM_SHARDS}",
          "regionsConfig": {
            "${REGION}": {
              "electableNodes": "${ELECTABLE_NODES}",
              "priority": 7,
              "readOnlyNodes": 0
            }
          }
        }
      ]
    }
  ]
}
```

This comprehensive template system enables the creation of powerful, flexible, and maintainable pipeline definitions that can be easily shared, versioned, and reused across different environments and use cases.
