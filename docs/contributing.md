# Contributing & Development Guide

## Overview

Kozen Engine is designed to be highly extensible and easily maintainable. This guide provides comprehensive information on how to contribute to the project, extend its capabilities, and maintain a high-quality codebase. The platform's architecture enables easy extension through new components, services, and templates while maintaining backward compatibility.

## 🏗️ Project Extensibility

Kozen Engine's extensibility is built around three core extensible manager types and a component system that allows for easy integration of new functionality.

### Core Extensible Services

#### 1. Stack Managers (`src/services/StackManager*.ts`)

Stack Managers handle infrastructure orchestration and deployment strategies.

**Available Implementations:**

- **StackManagerNode**: Node.js runtime execution for lightweight operations
- **StackManagerPulumi**: Pulumi-based infrastructure deployment
- **StackManager**: Generic manager with configurable workspace

**Creating a Custom Stack Manager:**

```typescript
import { BaseService } from "./BaseService";
import { IStackManager } from "../models/Stack";
import { IPipeline } from "../models/Pipeline";
import { IResult } from "../models/Types";

export class StackManagerCustom extends BaseService implements IStackManager {
  async deploy(pipeline: IPipeline): Promise<IResult> {
    try {
      // Custom deployment logic
      const result = await this.executeCustomDeployment(pipeline);

      return {
        success: true,
        action: "deploy",
        templateName: pipeline.template?.name,
        output: result,
        timestamp: new Date(),
      };
    } catch (error) {
      return this.handleError("deploy", error);
    }
  }

  async undeploy(pipeline: IPipeline): Promise<IResult> {
    // Custom undeployment logic
  }

  private async executeCustomDeployment(pipeline: IPipeline): Promise<any> {
    // Implement your custom deployment strategy
    // This could integrate with Terraform, Ansible, custom APIs, etc.
  }
}
```

#### 2. Secret Managers (`src/services/SecretManager*.ts`)

Secret Managers handle secure credential storage and retrieval.

**Available Implementations:**

- **SecretManagerAWS**: AWS Secrets Manager integration
- **SecretManagerMDB**: MongoDB-based secret storage
- **SecretManager**: Generic manager with configurable providers

**Creating a Custom Secret Manager:**

```typescript
import { BaseService } from "./BaseService";
import { ISecretManager } from "../models/Secret";

export class SecretManagerCustom extends BaseService implements ISecretManager {
  async getSecret(key: string): Promise<string | null> {
    try {
      // Custom secret retrieval logic
      const secret = await this.retrieveFromCustomProvider(key);

      this.logger?.debug({
        src: "Service:SecretManagerCustom:getSecret",
        message: `Retrieved secret: ${key}`,
      });

      return secret;
    } catch (error) {
      this.logger?.error({
        src: "Service:SecretManagerCustom:getSecret",
        message: `Failed to retrieve secret: ${key}`,
        data: { error: error.message },
      });
      return null;
    }
  }

  async setSecret(key: string, value: string): Promise<boolean> {
    try {
      // Custom secret storage logic
      await this.storeInCustomProvider(key, value);
      return true;
    } catch (error) {
      this.logger?.error({
        src: "Service:SecretManagerCustom:setSecret",
        message: `Failed to store secret: ${key}`,
      });
      return false;
    }
  }

  private async retrieveFromCustomProvider(key: string): Promise<string> {
    // Implement integration with HashiCorp Vault, Azure Key Vault, etc.
  }

  private async storeInCustomProvider(
    key: string,
    value: string
  ): Promise<void> {
    // Implement storage logic
  }
}
```

#### 3. Template Managers (`src/services/TemplateManager*.ts`)

Template Managers handle template storage, retrieval, and management.

**Available Implementations:**

- **TemplateManagerFile**: File system-based template storage
- **TemplateManagerMDB**: MongoDB-based template management
- **TemplateManager**: Generic manager with configurable storage

**Creating a Custom Template Manager:**

```typescript
import { BaseService } from "./BaseService";
import { ITemplateManager } from "../models/Template";
import { ITemplate } from "../models/Template";

export class TemplateManagerCustom
  extends BaseService
  implements ITemplateManager
{
  async loadTemplate(name: string): Promise<ITemplate | null> {
    try {
      // Custom template loading logic
      const templateData = await this.fetchFromCustomSource(name);

      if (!templateData) {
        this.logger?.warn({
          src: "Service:TemplateManagerCustom:loadTemplate",
          message: `Template not found: ${name}`,
        });
        return null;
      }

      return this.parseTemplate(templateData);
    } catch (error) {
      this.logger?.error({
        src: "Service:TemplateManagerCustom:loadTemplate",
        message: `Failed to load template: ${name}`,
      });
      return null;
    }
  }

  async saveTemplate(template: ITemplate): Promise<boolean> {
    try {
      // Custom template saving logic
      await this.storeInCustomSource(template);
      return true;
    } catch (error) {
      return false;
    }
  }

  private async fetchFromCustomSource(name: string): Promise<any> {
    // Implement integration with Git repositories, S3, HTTP endpoints, etc.
  }
}
```

## 🧩 Component Extension

### Creating New Components

Components are the building blocks of pipelines. Each component implements the `BaseController` interface.

**Component Structure Example:**

```typescript
import { BaseController } from "../controllers/BaseController";
import { IPipeline } from "../models/Pipeline";
import { IResult, IStruct } from "../models/Types";

/**
 * Custom component for specific functionality
 * Example: Integration with external APIs, custom testing, data processing
 */
export class CustomComponent extends BaseController {
  /**
   * Deploy/Execute the component functionality
   */
  async deploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult> {
    try {
      // 1. Cast input to specific configuration
      const config = this.castToCustomConfig(input);

      // 2. Validate configuration
      this.validateConfiguration(config);

      // 3. Log execution details
      this.logger?.info({
        src: "component:CustomComponent:deploy",
        message: `Executing custom component with config`,
        data: {
          componentName: this.config.name,
          templateName: pipeline?.template?.name,
          stackName: pipeline?.stack?.config?.name,
          prefix: this.getPrefix(pipeline),
        },
      });

      // 4. Execute custom logic
      const result = await this.executeCustomLogic(config, pipeline);

      // 5. Return standardized result
      return {
        templateName: pipeline?.template?.name,
        action: "deploy",
        success: true,
        message: `Custom component executed successfully`,
        output: result,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger?.error({
        src: "component:CustomComponent:deploy",
        message: `Component execution failed: ${error.message}`,
      });

      return {
        templateName: pipeline?.template?.name,
        action: "deploy",
        success: false,
        message: error.message,
        errors: [error.message],
        timestamp: new Date(),
      };
    }
  }

  async undeploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult> {
    // Implement cleanup logic
    return {
      templateName: this.config.name,
      action: "undeploy",
      success: true,
      message: `Custom component cleaned up successfully`,
      timestamp: new Date(),
    };
  }

  async validate(input?: IStruct, pipeline?: IPipeline): Promise<IResult> {
    try {
      const config = this.castToCustomConfig(input);
      this.validateConfiguration(config);

      return {
        templateName: this.config.name,
        action: "validate",
        success: true,
        message: `Custom component configuration is valid`,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        templateName: this.config.name,
        action: "validate",
        success: false,
        message: error.message,
        errors: [error.message],
        timestamp: new Date(),
      };
    }
  }

  async status(input?: IStruct, pipeline?: IPipeline): Promise<IResult> {
    // Implement status checking logic
    return {
      templateName: this.config.name,
      action: "status",
      success: true,
      message: `Custom component is operational`,
      timestamp: new Date(),
    };
  }

  /**
   * Cast generic input to component-specific configuration
   */
  private castToCustomConfig(input?: IStruct): CustomComponentConfig {
    return {
      endpoint: (input?.endpoint as string) || "http://localhost:3000",
      timeout: Number(input?.timeout) || 30000,
      retries: Number(input?.retries) || 3,
      apiKey: input?.apiKey as string,
      // Add more specific configuration properties
    };
  }

  /**
   * Validate component configuration
   */
  private validateConfiguration(config: CustomComponentConfig): void {
    if (!config.endpoint) {
      throw new Error("Endpoint is required for CustomComponent");
    }

    if (!config.apiKey) {
      throw new Error("API key is required for CustomComponent");
    }

    // Add more validation logic
  }

  /**
   * Execute component-specific logic
   */
  private async executeCustomLogic(
    config: CustomComponentConfig,
    pipeline?: IPipeline
  ): Promise<any> {
    // Implement your custom functionality here
    // Examples:
    // - Call external APIs
    // - Execute tests
    // - Process data
    // - Deploy resources
    // - Run CLI commands

    const result = {
      status: "completed",
      data: {},
      metrics: {
        executionTime: Date.now(),
        resourcesCreated: 1,
      },
    };

    return result;
  }
}

/**
 * Component-specific configuration interface
 */
interface CustomComponentConfig {
  endpoint: string;
  timeout: number;
  retries: number;
  apiKey: string;
}

export default CustomComponent;
```

### Component Registration

Components are automatically discovered through the IoC container's auto-registration feature. Place your component in the `src/components/` directory and it will be automatically registered.

**Manual Registration (if needed):**

```json
{
  "target": "CustomComponent",
  "type": "class",
  "lifetime": "singleton",
  "path": "../../components",
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

## 🐛 VSCode Debugging Integration

The project includes comprehensive VSCode debugging support for enhanced development experience.

### Debug Configurations

Located in `.vscode/launch.json`, the following debug configurations are available:

#### 1. 🛠️ Develop

General development debugging with full template execution.

**Usage:**

```bash
# Set environment variables in .env or directly
export KOZEN_TEMPLATE=demo
export KOZEN_ACTION=deploy
export KOZEN_STACK=dev
export KOZEN_PROJECT=DEBUG001

# Run in VSCode: F5 -> Select "🛠️ Develop"
```

#### 2. 🚀 Test Deploy

Debug deployment operations with specific templates.

**Environment Configuration:**

```bash
KOZEN_TEMPLATE=atlas.basic
KOZEN_ACTION=deploy
KOZEN_STACK=test
KOZEN_PROJECT=TEST$(date +%Y%m%d%H%M%S)
```

#### 3. 🗑️ Test Undeploy

Debug cleanup and undeployment operations.

#### 4. ✅ Test Validate

Debug template and component validation.

#### 5. 🔧 Test Status

Debug status checking operations.

#### 6. 📁 Debug Current File

Debug individual TypeScript files directly.

### Advanced Debugging Techniques

#### Component-Specific Debugging

To debug a specific component with different templates:

1. **Set Environment Variables:**

```bash
# Debug Atlas component
export KOZEN_TEMPLATE=atlas.basic
export KOZEN_STACK=debug
export KOZEN_PROJECT=ATLAS_DEBUG

# Debug Demo components
export KOZEN_TEMPLATE=demo
export KOZEN_STACK=dev
export KOZEN_PROJECT=DEMO_DEBUG

# Debug with custom configuration
export KOZEN_CONFIG=cfg/config.dev.json
```

2. **Use Breakpoints:**

   - Set breakpoints in component files (`src/components/*.ts`)
   - Set breakpoints in service files (`src/services/*.ts`)
   - Set breakpoints in the pipeline controller (`src/controllers/PipelineController.ts`)

3. **Debug with Different Stack Names:**

```bash
# Different environments
export KOZEN_STACK=dev      # Development debugging
export KOZEN_STACK=test     # Testing debugging
export KOZEN_STACK=staging  # Staging debugging
export KOZEN_STACK=prod     # Production debugging (careful!)
```

#### Template Debugging

Debug different template configurations:

```bash
# Simple demo template
export KOZEN_TEMPLATE=demo

# Atlas infrastructure template
export KOZEN_TEMPLATE=atlas.basic

# Full pipeline template
export KOZEN_TEMPLATE=full.pipeline

# Custom template
export KOZEN_TEMPLATE=my-custom-template
```

#### Service Debugging

Debug specific services by setting breakpoints in:

- `src/services/PipelineManager.ts` - Pipeline orchestration
- `src/services/ProcessorService.ts` - Variable processing
- `src/services/TemplateManager*.ts` - Template management
- `src/services/SecretManager*.ts` - Secret management
- `src/services/StackManager*.ts` - Stack management

### Debug Environment Setup

Create debug-specific environment files:

**.env.debug:**

```bash
NODE_ENV=development
KOZEN_TEMPLATE=demo
KOZEN_ACTION=deploy
KOZEN_STACK=debug
KOZEN_PROJECT=DEBUG$(date +%Y%m%d%H%M%S)
KOZEN_CONFIG=cfg/config.json

# Enhanced logging for debugging
LOG_LEVEL=debug
DEBUG=kozen:*

# MongoDB for analytics (optional)
MDB_URI=mongodb://localhost:27017/kozen-debug

# AWS credentials (for AWS components)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# Atlas credentials (for Atlas components)
ATLAS_PUBLIC_KEY=your-public-key
ATLAS_PRIVATE_KEY=your-private-key
ATLAS_PROJECT_ID=your-project-id
```

## 📝 Change Request Process

### 1. Issue Reporting

Use GitHub Issues for bug reports, feature requests, and improvements:

**Bug Report Template:**

````markdown
**Bug Description**
A clear and concise description of the bug.

**Environment**

- OS: [e.g., Windows 10, macOS 12, Ubuntu 20.04]
- Node.js version: [e.g., 18.17.0]
- Kozen Engine version: [e.g., 1.0.5]

**Template Configuration**

```json
{
  "template": "template-name",
  "action": "deploy",
  "stack": "dev"
}
```
````

**Steps to Reproduce**

1. Set environment variables...
2. Run command...
3. Observe error...

**Expected Behavior**
What should have happened.

**Actual Behavior**
What actually happened.

**Logs**

```
Paste relevant logs here
```

````

**Feature Request Template:**
```markdown
**Feature Description**
A clear description of the new feature or enhancement.

**Use Case**
Describe the problem this feature would solve.

**Proposed Solution**
How you envision this feature working.

**Alternative Solutions**
Any alternative approaches you've considered.

**Impact**
- Components affected: [list]
- Breaking changes: [yes/no]
- Documentation updates needed: [yes/no]
````

### 2. Pull Request Process

1. **Fork the Repository**

```bash
git clone https://github.com/your-username/kozen-engine.git
cd kozen-engine
npm install
```

2. **Create Feature Branch**

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

3. **Development Guidelines**

   - Follow existing code style and patterns
   - Add comprehensive tests for new features
   - Update documentation as needed
   - Ensure all existing tests pass

4. **Testing Your Changes**

```bash
# Run existing tests
npm test

# Test with different templates
npm run dev -- --template=demo --action=validate
npm run dev -- --template=demo --action=deploy
npm run dev -- --template=demo --action=undeploy

# Test with debug configuration
export KOZEN_TEMPLATE=demo
npm run dev
```

5. **Commit Guidelines**

```bash
# Use conventional commit format
git commit -m "feat: add custom secret manager support"
git commit -m "fix: resolve template variable resolution issue"
git commit -m "docs: update component development guide"
```

6. **Submit Pull Request**
   - Provide clear description of changes
   - Reference related issues
   - Include test results
   - Add documentation updates

### 3. Code Review Process

All pull requests require:

- Code review by at least one maintainer
- Passing automated tests
- Documentation updates (if applicable)
- No breaking changes without major version bump

## 🧪 Testing Strategy

### Component Testing

**Unit Tests for Components:**

```typescript
import { CustomComponent } from "../src/components/CustomComponent";
import { mockPipeline, mockInput } from "./mocks";

describe("CustomComponent", () => {
  let component: CustomComponent;

  beforeEach(() => {
    component = new CustomComponent();
  });

  test("should deploy successfully with valid input", async () => {
    const result = await component.deploy(mockInput, mockPipeline);

    expect(result.success).toBe(true);
    expect(result.action).toBe("deploy");
    expect(result.output).toBeDefined();
  });

  test("should handle validation errors gracefully", async () => {
    const invalidInput = {
      /* invalid data */
    };
    const result = await component.validate(invalidInput, mockPipeline);

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });
});
```

**Integration Tests:**

```bash
# Test complete pipeline execution
npm run test:integration

# Test specific templates
npm run dev -- --template=test-template --action=validate
```

### Service Testing

Test extensible services with different configurations:

```typescript
import { CustomStackManager } from "../src/services/StackManagerCustom";

describe("CustomStackManager", () => {
  test("should deploy infrastructure successfully", async () => {
    const stackManager = new CustomStackManager();
    const result = await stackManager.deploy(mockPipeline);

    expect(result.success).toBe(true);
  });
});
```

## 📚 Documentation Requirements

### Component Documentation

Each new component should include:

1. **README.md** in component directory
2. **JSDoc comments** in TypeScript files
3. **Configuration examples** in templates
4. **Usage examples** in documentation

**Example Component Documentation:**

````typescript
/**
 * @fileoverview Custom Component for External API Integration
 * @description Integrates with external REST APIs for data processing and validation.
 * Supports authentication, retry logic, and error handling.
 *
 * @example
 * ```json
 * {
 *   "name": "CustomComponent",
 *   "input": [
 *     {
 *       "type": "environment",
 *       "name": "apiEndpoint",
 *       "value": "API_ENDPOINT"
 *     },
 *     {
 *       "type": "secret",
 *       "name": "apiKey",
 *       "value": "API_KEY"
 *     }
 *   ]
 * }
 * ```
 *
 * @author Your Name <your.email@example.com>
 * @since 1.1.0
 */
````

### Service Documentation

Document service extensions with:

- Interface definitions
- Configuration options
- Usage examples
- Integration patterns

## 🚀 Best Practices

### 1. Code Quality

- **TypeScript**: Use strict type checking
- **Error Handling**: Implement comprehensive error handling
- **Logging**: Use structured logging with context
- **Validation**: Validate inputs early and thoroughly

### 2. Component Design

- **Single Responsibility**: Each component should have one clear purpose
- **Idempotency**: Components should be safe to run multiple times
- **Configuration**: Support flexible configuration through input/setup
- **Output**: Provide meaningful outputs for other components

### 3. Service Extension

- **Interface Compliance**: Implement required interfaces completely
- **Dependency Injection**: Use IoC container for service dependencies
- **Configuration**: Support environment-specific configurations
- **Testing**: Include comprehensive unit and integration tests

### 4. Template Development

- **Validation**: Validate template structure and dependencies
- **Documentation**: Include clear descriptions and examples
- **Versioning**: Use semantic versioning for templates
- **Testing**: Test templates in different environments

## 🔧 Development Tools

### Required Tools

- **Node.js** 16.0.0 or higher
- **TypeScript** 5.0.0 or higher
- **VSCode** (recommended) with extensions:
  - TypeScript and JavaScript Language Features
  - ESLint
  - Prettier
  - MongoDB for VS Code (optional)

### Optional Tools

- **MongoDB Compass** for template and log analysis
- **AWS CLI** for AWS service integration
- **Docker** for containerized development
- **Postman** for API testing

### Development Scripts

```bash
# Development with hot reload
npm run dev

# Build project
npm run build

# Run tests
npm run test

# Lint code
npm run lint

# Clean build artifacts
npm run clean

# Debug specific template
npm run dev -- --template=your-template --action=deploy
```

## 📋 Checklist for Contributors

### Before Submitting Code

- [ ] Code follows project style guidelines
- [ ] All tests pass locally
- [ ] New features have corresponding tests
- [ ] Documentation is updated
- [ ] Changes are backward compatible (or properly versioned)
- [ ] Environment variables are documented
- [ ] Debug configurations work properly

### Component Development

- [ ] Implements BaseController interface
- [ ] Includes proper error handling
- [ ] Has comprehensive JSDoc documentation
- [ ] Includes input validation
- [ ] Provides meaningful outputs
- [ ] Supports debugging with VSCode

### Service Development

- [ ] Implements required service interface
- [ ] Includes proper dependency injection
- [ ] Has comprehensive testing
- [ ] Supports configuration options
- [ ] Includes usage examples

This comprehensive guide ensures that Kozen Engine remains extensible, maintainable, and developer-friendly while providing clear pathways for contribution and enhancement.

**📚 Related Documentation:**

- [Configuration Guide](./configuration.md) - For environment and service configuration
- [Deployment Guide](./deployment.md) - For production deployment strategies
- [Components Guide](./components.md) - For detailed component development
- [Templates Guide](./templates.md) - For template creation and management
