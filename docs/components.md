# Component System

## Overview

Kozen Engine's component system is the heart of the platform's extensibility. Components are autonomous units that can perform infrastructure deployment, testing execution, API calls, or any custom logic. Each component implements a standardized interface while maintaining complete flexibility in their internal implementation.

![Component Architecture](./images/kozen-architecture-Component.jpg)

## Component Architecture

### Base Component Structure

All components extend the `BaseController` abstract class:

```typescript
export abstract class BaseController {
  protected assistant!: IIoC;
  protected config: IComponent;

  abstract deploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult>;
  abstract undeploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult>;
  abstract validate(input?: IStruct, pipeline?: IPipeline): Promise<IResult>;
  abstract status(input?: IStruct, pipeline?: IPipeline): Promise<IResult>;
}
```

### Component Lifecycle

![Component Flow](./images/kozen-architecture-Component.Flow.jpg)

1. **Configuration**: Component receives configuration from template
2. **Input Processing**: Variables are resolved and inputs prepared
3. **Execution**: Component performs its designated operation
4. **Output Generation**: Results are collected and formatted
5. **Data Collection**: Execution data is stored in MongoDB

## Built-in Components

### Infrastructure Components

#### Atlas Component (`src/components/Atlas.ts`)

**Purpose**: MongoDB Atlas cluster deployment and management

```typescript
export class AtlasController extends BaseController {
  async deploy(input?: IStruct): Promise<IResult> {
    // Deploy MongoDB Atlas cluster using Pulumi
    const cluster = await this.createAtlasCluster();
    return {
      success: true,
      output: {
        connectionString: cluster.connectionString,
        clusterId: cluster.id,
      },
    };
  }
}
```

**Configuration Example**:

```json
{
  "name": "AtlasController",
  "region": "us-east-1",
  "clusterType": "REPLICASET",
  "mongoDbMajorVersion": "8.0",
  "providerInstanceSizeName": "M10",
  "cloudBackup": true
}
```

#### Kubernetes Component (`src/components/Kubernetes.ts`)

**Purpose**: Kubernetes resource deployment and management

```typescript
export class KubernetesController extends BaseController {
  async deploy(input?: IStruct): Promise<IResult> {
    // Deploy Kubernetes resources
    const resources = await this.deployKubernetesResources();
    return {
      success: true,
      output: {
        serviceUrl: resources.serviceUrl,
        namespace: resources.namespace,
      },
    };
  }
}
```

**Configuration Example**:

```json
{
  "name": "KubernetesController",
  "namespace": "production",
  "replicas": 3,
  "image": "nginx:latest",
  "containerPort": 80,
  "serviceType": "LoadBalancer"
}
```

#### Ops Manager Component (`src/components/OpsManager.ts`)

**Purpose**: MongoDB Ops Manager deployment on Kubernetes

```typescript
export class OpsManagerController extends BaseController {
  async deploy(input?: IStruct): Promise<IResult> {
    // Deploy Ops Manager on Kubernetes
    const deployment = await this.deployOpsManager();
    return {
      success: true,
      output: {
        managementUrl: deployment.url,
        adminInterface: deployment.adminUrl,
      },
    };
  }
}
```

### Testing Components

#### Demo Components (`src/components/DemoFirst.ts`, `src/components/DemoSecond.ts`)

**Purpose**: Example components for testing and demonstration

```typescript
export class DemoFirst extends BaseController {
  async deploy(input?: IStruct): Promise<IResult> {
    // Simulate testing or processing operation
    console.log(`Executing test with: ${input?.message}`);
    return {
      success: true,
      output: {
        testResult: "passed",
        executionTime: Date.now(),
      },
    };
  }
}
```

## Component Input/Output System

### Input Processing

Components receive inputs through the variable processing system:

```json
{
  "input": [
    {
      "name": "environment",
      "type": "environment",
      "value": "NODE_ENV",
      "default": "development"
    },
    {
      "name": "secretKey",
      "type": "secret",
      "value": "production/api-key"
    },
    {
      "name": "previousOutput",
      "type": "reference",
      "value": "deploymentId"
    }
  ]
}
```

### Output Generation

Components produce standardized outputs:

```typescript
interface IResult {
  success: boolean;
  message?: string;
  output?: IStruct;
  timestamp?: Date;
  duration?: number;
  errors?: string[];
}
```

### Variable Types

| Type          | Description                 | Example                          |
| ------------- | --------------------------- | -------------------------------- |
| `environment` | Environment variables       | `NODE_ENV`, `AWS_REGION`         |
| `secret`      | Secret management values    | AWS secrets, MongoDB credentials |
| `reference`   | Previous component outputs  | Component results, shared data   |
| `static`      | Static configuration values | Fixed strings, numbers           |

## Creating Custom Components

### 1. Basic Component Structure

```typescript
import { BaseController } from "../controllers/BaseController";
import { IResult, IStruct } from "../models/Types";

export class CustomComponent extends BaseController {
  async deploy(input?: IStruct): Promise<IResult> {
    try {
      // 1. Validate input
      this.validateInput(input);

      // 2. Execute custom logic
      const result = await this.executeCustomLogic(input);

      // 3. Return standardized result
      return {
        success: true,
        message: "Custom operation completed",
        output: result,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        errors: [error.message],
        timestamp: new Date(),
      };
    }
  }

  async validate(input?: IStruct): Promise<IResult> {
    // Validation logic
  }

  async undeploy(input?: IStruct): Promise<IResult> {
    // Cleanup logic
  }

  async status(input?: IStruct): Promise<IResult> {
    // Status check logic
  }

  private validateInput(input?: IStruct): void {
    // Input validation logic
  }

  private async executeCustomLogic(input?: IStruct): Promise<any> {
    // Custom implementation
  }
}
```

### 2. Testing Component Example

```typescript
export class E2ETestComponent extends BaseController {
  async deploy(input?: IStruct): Promise<IResult> {
    const testSuite = input?.testSuite || "default";
    const targetUrl = input?.targetUrl;

    if (!targetUrl) {
      throw new Error("Target URL is required for E2E testing");
    }

    // Execute E2E tests
    const testResults = await this.runE2ETests(testSuite, targetUrl);

    return {
      success: testResults.passed,
      message: `E2E tests ${testResults.passed ? "passed" : "failed"}`,
      output: {
        testsRun: testResults.total,
        testsPassed: testResults.passed,
        testsFailed: testResults.failed,
        duration: testResults.duration,
        coverage: testResults.coverage,
      },
      timestamp: new Date(),
    };
  }

  private async runE2ETests(suite: string, url: string) {
    // Implement E2E testing logic
    // This could use Playwright, Cypress, or other testing frameworks
  }
}
```

### 3. API Integration Component

```typescript
export class APITestComponent extends BaseController {
  async deploy(input?: IStruct): Promise<IResult> {
    const apiEndpoint = input?.endpoint;
    const testCases = input?.testCases || [];

    const results = [];

    for (const testCase of testCases) {
      const result = await this.executeAPITest(apiEndpoint, testCase);
      results.push(result);
    }

    const totalTests = results.length;
    const passedTests = results.filter((r) => r.success).length;

    return {
      success: passedTests === totalTests,
      message: `API tests completed: ${passedTests}/${totalTests} passed`,
      output: {
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        results,
      },
      timestamp: new Date(),
    };
  }

  private async executeAPITest(endpoint: string, testCase: any) {
    // Implement API testing logic
  }
}
```

### 4. Performance Test Component

```typescript
export class PerformanceTestComponent extends BaseController {
  async deploy(input?: IStruct): Promise<IResult> {
    const targetUrl = input?.targetUrl;
    const loadConfig = {
      users: input?.concurrentUsers || 10,
      duration: input?.testDuration || 60,
      rampUp: input?.rampUpTime || 10,
    };

    const metrics = await this.executeLoadTest(targetUrl, loadConfig);

    return {
      success: metrics.errorRate < 0.05, // Less than 5% error rate
      message: `Performance test completed`,
      output: {
        averageResponseTime: metrics.avgResponseTime,
        maxResponseTime: metrics.maxResponseTime,
        requestsPerSecond: metrics.rps,
        errorRate: metrics.errorRate,
        totalRequests: metrics.totalRequests,
      },
      timestamp: new Date(),
    };
  }

  private async executeLoadTest(url: string, config: any) {
    // Implement performance testing logic
    // This could use k6, Artillery, or other performance testing tools
  }
}
```

## Component Registration

### Automatic Registration

Components are automatically discovered and registered through the IoC container:

```typescript
// Auto-registration configuration
{
    type: 'auto',
    regex: '.*Controller\\.ts$',
    lifetime: 'transient'
}
```

### Manual Registration

For custom components, register explicitly:

```typescript
const configs: IDependency[] = [
  {
    key: "CustomComponent",
    target: CustomComponent,
    type: "class",
    lifetime: "transient",
  },
];

await container.register(configs);
```

## Component Configuration in Templates

### Basic Component Definition

```json
{
  "components": [
    {
      "name": "AtlasController",
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
          "description": "MongoDB connection string"
        }
      ]
    }
  ]
}
```

### Advanced Component Configuration

```json
{
  "components": [
    {
      "name": "E2ETestComponent",
      "description": "End-to-end testing suite",
      "input": [
        {
          "name": "targetUrl",
          "type": "reference",
          "value": "deploymentUrl"
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
          "description": "Complete test execution results"
        }
      ]
    }
  ]
}
```

## Error Handling in Components

### Standardized Error Response

```typescript
return {
  success: false,
  message: "Component execution failed",
  errors: ["Configuration validation failed", "Network timeout occurred"],
  timestamp: new Date(),
  duration: executionTime,
};
```

### Exception Handling Patterns

```typescript
async deploy(input?: IStruct): Promise<IResult> {
    try {
        // Component logic
        return this.successResult(output);
    } catch (error) {
        this.logger.error(`Component execution failed: ${error.message}`);
        return this.errorResult(error);
    }
}

private successResult(output: any): IResult {
    return {
        success: true,
        output,
        timestamp: new Date()
    };
}

private errorResult(error: Error): IResult {
    return {
        success: false,
        message: error.message,
        errors: [error.message],
        timestamp: new Date()
    };
}
```

## Best Practices

### 1. Component Design

- **Single Responsibility**: Each component should have one clear purpose
- **Idempotent Operations**: Components should be safe to run multiple times
- **Graceful Degradation**: Handle failures gracefully with meaningful error messages
- **Resource Cleanup**: Implement proper cleanup in undeploy methods

### 2. Input Validation

- **Validate Early**: Check inputs before processing
- **Provide Defaults**: Use sensible defaults for optional parameters
- **Clear Error Messages**: Provide actionable error messages

### 3. Output Consistency

- **Standardized Format**: Follow the IResult interface consistently
- **Meaningful Data**: Include relevant execution metadata
- **Serializable Outputs**: Ensure outputs can be serialized for data collection

### 4. Logging and Monitoring

- **Structured Logging**: Use consistent logging patterns
- **Performance Metrics**: Track execution times and resource usage
- **Error Tracking**: Log errors with sufficient context for debugging

### 5. Testing

- **Unit Tests**: Test component logic in isolation
- **Integration Tests**: Test components with real dependencies
- **Mock External Services**: Use mocks for external dependencies during testing

## Component Lifecycle Management

### Resource Management

```typescript
export class ResourceManagedComponent extends BaseController {
  private resources: any[] = [];

  async deploy(input?: IStruct): Promise<IResult> {
    try {
      const resource = await this.createResource(input);
      this.resources.push(resource);

      return this.successResult({ resourceId: resource.id });
    } catch (error) {
      // Cleanup on failure
      await this.cleanup();
      throw error;
    }
  }

  async undeploy(): Promise<IResult> {
    await this.cleanup();
    return this.successResult({ message: "Resources cleaned up" });
  }

  private async cleanup(): Promise<void> {
    for (const resource of this.resources) {
      await this.destroyResource(resource);
    }
    this.resources = [];
  }
}
```

This comprehensive component system enables the creation of powerful, flexible pipelines that can handle everything from infrastructure deployment to comprehensive testing suites, all while maintaining consistency and providing rich data collection capabilities.
