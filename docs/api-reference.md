# API Reference

## Overview

This document provides comprehensive API reference for Kozen Engine's core classes, interfaces, and methods. The API is designed for both programmatic usage and NPM package integration.

## Core Classes

### PipelineManager

The main orchestrator class for pipeline operations.

#### Constructor

```typescript
constructor(assistant?: IIoC)
```

**Parameters:**
- `assistant` (optional): IoC container instance

**Example:**
```typescript
import { PipelineManager, IoC } from 'kozen-engine';

const ioc = new IoC();
const pipeline = new PipelineManager(ioc);
```

#### Methods

##### configure(config: IPipelineArgs): Promise<void>

Configures the pipeline manager with execution parameters.

**Parameters:**
- `config`: Pipeline configuration object

**Returns:** Promise<void>

**Example:**
```typescript
await pipeline.configure({
    template: 'atlas-basic',
    config: 'cfg/config.json',
    action: 'deploy'
});
```

##### deploy(args: IPipelineArgs): Promise<IResult>

Executes pipeline deployment with specified template and configuration.

**Parameters:**
- `args`: Pipeline execution arguments

**Returns:** Promise<IResult>

**Example:**
```typescript
const result = await pipeline.deploy({
    template: 'full-pipeline',
    config: 'cfg/config.json',
    action: 'deploy'
});

console.log(`Deployment ${result.success ? 'successful' : 'failed'}`);
```

##### validate(args: IPipelineArgs): Promise<IResult>

Validates pipeline configuration and template structure.

**Parameters:**
- `args`: Pipeline validation arguments

**Returns:** Promise<IResult>

**Example:**
```typescript
const validation = await pipeline.validate({
    template: 'atlas-basic',
    config: 'cfg/config.json',
    action: 'validate'
});

if (!validation.success) {
    console.error('Validation failed:', validation.errors);
}
```

##### undeploy(args: IPipelineArgs): Promise<IResult>

Removes deployed infrastructure and cleans up resources.

**Parameters:**
- `args`: Pipeline cleanup arguments

**Returns:** Promise<IResult>

**Example:**
```typescript
const cleanup = await pipeline.undeploy({
    template: 'atlas-basic',
    config: 'cfg/config.json',
    action: 'undeploy'
});
```

##### status(args: IPipelineArgs): Promise<IResult>

Retrieves current status of deployed pipeline resources.

**Parameters:**
- `args`: Pipeline status query arguments

**Returns:** Promise<IResult>

**Example:**
```typescript
const status = await pipeline.status({
    template: 'atlas-basic',
    config: 'cfg/config.json',
    action: 'status'
});
```

### BaseController

Abstract base class for all component controllers.

#### Constructor

```typescript
protected constructor()
```

#### Abstract Methods

##### deploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult>

Executes component deployment logic.

**Parameters:**
- `input` (optional): Component input parameters
- `pipeline` (optional): Pipeline execution context

**Returns:** Promise<IResult>

##### undeploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult>

Executes component cleanup logic.

**Parameters:**
- `input` (optional): Component input parameters
- `pipeline` (optional): Pipeline execution context

**Returns:** Promise<IResult>

##### validate(input?: IStruct, pipeline?: IPipeline): Promise<IResult>

Validates component configuration and dependencies.

**Parameters:**
- `input` (optional): Component input parameters
- `pipeline` (optional): Pipeline execution context

**Returns:** Promise<IResult>

##### status(input?: IStruct, pipeline?: IPipeline): Promise<IResult>

Retrieves component status and health information.

**Parameters:**
- `input` (optional): Component input parameters
- `pipeline` (optional): Pipeline execution context

**Returns:** Promise<IResult>

#### Protected Properties

##### assistant: IIoC

IoC container for dependency resolution.

##### config: IComponent

Component configuration object.

#### Example Implementation

```typescript
export class CustomComponent extends BaseController {
    async deploy(input?: IStruct): Promise<IResult> {
        try {
            // Component-specific deployment logic
            const result = await this.performDeployment(input);
            
            return {
                success: true,
                message: 'Component deployed successfully',
                output: result,
                timestamp: new Date()
            };
        } catch (error) {
            return {
                success: false,
                message: error.message,
                errors: [error.message],
                timestamp: new Date()
            };
        }
    }

    async validate(input?: IStruct): Promise<IResult> {
        // Validation logic
        return {
            success: true,
            message: 'Component configuration is valid'
        };
    }

    async undeploy(input?: IStruct): Promise<IResult> {
        // Cleanup logic
        return {
            success: true,
            message: 'Component cleaned up successfully'
        };
    }

    async status(input?: IStruct): Promise<IResult> {
        // Status check logic
        return {
            success: true,
            message: 'Component is healthy',
            output: { status: 'running' }
        };
    }
}
```

### StackManager

Abstract base class for stack management implementations.

#### Abstract Methods

##### deploy(config: IStackOptions): Promise<IResult>

Deploys infrastructure stack with specified configuration.

**Parameters:**
- `config`: Stack configuration options

**Returns:** Promise<IResult>

##### undeploy(config: IStackOptions): Promise<IResult>

Removes deployed infrastructure stack.

**Parameters:**
- `config`: Stack configuration options

**Returns:** Promise<IResult>

##### status(config: IStackOptions): Promise<IResult>

Retrieves stack deployment status.

**Parameters:**
- `config`: Stack configuration options

**Returns:** Promise<IResult>

#### Methods

##### configure(config: IStackOptions): IStackOptions

Configures stack manager with project and stack naming.

**Parameters:**
- `config`: Stack configuration options

**Returns:** Merged configuration object

##### transformSetup(component: IComponent, output?: IStruct, key?: string): Promise<IStruct>

Transforms component setup configuration for stack operations.

**Parameters:**
- `component`: Component configuration
- `output` (optional): Output accumulator
- `key` (optional): Configuration key to process

**Returns:** Promise<IStruct>

### TemplateManager

Abstract base class for template storage and retrieval.

#### Abstract Methods

##### load<T>(templateName: string): Promise<T>

Loads template by name from storage backend.

**Parameters:**
- `templateName`: Template identifier

**Returns:** Promise<T> - Parsed template object

**Type Parameters:**
- `T`: Expected template type

**Example:**
```typescript
const template = await templateManager.load<ITemplate>('atlas-basic');
```

#### Methods

##### configure(config: IStruct): void

Configures template manager with storage settings.

**Parameters:**
- `config`: Template manager configuration

**Example:**
```typescript
templateManager.configure({
    storageType: 'file',
    path: './cfg/templates'
});
```

### SecretManager

Abstract base class for secret management implementations.

#### Abstract Methods

##### resolve(key: string): Promise<string>

Resolves secret value by key from secure storage.

**Parameters:**
- `key`: Secret identifier

**Returns:** Promise<string> - Secret value

**Example:**
```typescript
const apiKey = await secretManager.resolve('production/api-key');
```

#### Methods

##### configure(config: IStruct): Promise<void>

Configures secret manager with provider settings.

**Parameters:**
- `config`: Secret manager configuration

**Returns:** Promise<void>

**Example:**
```typescript
await secretManager.configure({
    region: 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});
```

### IoC Container

Dependency injection container for service management.

#### Static Methods

##### getInstance(): IIoC

Returns singleton IoC container instance.

**Returns:** IIoC

**Example:**
```typescript
const container = IoC.getInstance();
```

#### Methods

##### register(configs: ServiceConfig[]): Promise<void>

Registers services with the container.

**Parameters:**
- `configs`: Array of service configuration objects

**Returns:** Promise<void>

**Example:**
```typescript
await container.register([
    {
        key: 'StackManagerPulumi',
        target: StackManagerPulumi,
        type: 'class',
        lifetime: 'singleton'
    }
]);
```

##### resolve<T>(key: string): Promise<T>

Resolves service instance by key.

**Parameters:**
- `key`: Service registration key

**Returns:** Promise<T> - Service instance

**Type Parameters:**
- `T`: Expected service type

**Example:**
```typescript
const stackManager = await container.resolve<IStackManager>('StackManagerPulumi');
```

##### autoRegister(pattern: string, lifetime?: string): Promise<void>

Automatically registers services matching pattern.

**Parameters:**
- `pattern`: Regular expression pattern for auto-discovery
- `lifetime` (optional): Service lifetime (default: 'transient')

**Returns:** Promise<void>

**Example:**
```typescript
await container.autoRegister('.*Controller\\.ts$', 'transient');
```

## Core Interfaces

### IPipelineArgs

Pipeline execution arguments interface.

```typescript
interface IPipelineArgs {
    template: string;           // Template name
    config: string;            // Configuration file path
    action: string;            // Action to perform
    environment?: string;      // Environment name
    variables?: IStruct;       // Additional variables
}
```

### IResult

Standard result interface for all operations.

```typescript
interface IResult {
    success: boolean;          // Operation success status
    message?: string;          // Human-readable message
    output?: IStruct;          // Operation output data
    timestamp?: Date;          // Execution timestamp
    duration?: number;         // Execution duration in milliseconds
    errors?: string[];         // Error messages array
}
```

### ITemplate

Template definition interface.

```typescript
interface ITemplate {
    name: string;              // Template name
    description?: string;      // Template description
    version: string;           // Template version
    engine: string;            // Engine compatibility
    release?: string;          // Release stability
    deploymentMode?: string;   // Execution mode
    stack?: IStackOptions;     // Stack configuration
    components: IComponent[];  // Component definitions
}
```

### IComponent

Component configuration interface.

```typescript
interface IComponent {
    name: string;              // Component name
    description?: string;      // Component description
    version?: string;          // Component version
    engine?: string;           // Engine compatibility
    input?: IMetadata[];       // Input variable definitions
    setup?: IMetadata[];       // Setup parameter definitions
    output?: IMetadata[];      // Output variable definitions
    [key: string]: any;        // Additional configuration properties
}
```

### IMetadata

Variable metadata interface.

```typescript
interface IMetadata {
    name: string;              // Variable name
    type: string;              // Variable type (environment|secret|reference|static)
    value?: any;               // Variable value
    default?: any;             // Default value
    description?: string;      // Variable description
}
```

### IStackOptions

Stack configuration interface.

```typescript
interface IStackOptions extends IComponent {
    orchestrator?: string;     // Infrastructure orchestration tool
    project?: string;          // Project name
    environment?: IStruct;     // Environment variables
}
```

### IStruct

Generic key-value structure interface.

```typescript
interface IStruct {
    [key: string]: any;
}
```

## Service Configuration Interfaces

### ServiceConfig

IoC service configuration interface.

```typescript
interface ServiceConfig {
    key?: string;                                      // Registration key
    target?: any;                                      // Service implementation
    type?: 'class' | 'value' | 'function' | 'alias' | 'ref' | 'auto';
    lifetime?: 'singleton' | 'transient' | 'scoped';  // Service lifetime
    args?: JsonValue[];                                // Constructor arguments
    dependencies?: ServiceConfig[];                    // Nested dependencies
}
```

## Concrete Implementations

### StackManagerPulumi

Pulumi-based stack management implementation.

#### Constructor

```typescript
constructor()
```

#### Methods

##### deploy(config: IStackOptions): Promise<IResult>

Deploys infrastructure using Pulumi automation.

##### transformSetup(opts: IComponent, output?: IStruct, key?: string): Promise<IStruct>

Transforms component setup for Pulumi configuration.

##### transformSetupItem(meta: IMetadata, input: IStruct): Promise<IStruct>

Transforms individual setup metadata item.

#### Properties

##### stack: Stack

Pulumi stack instance for operations.

**Example:**
```typescript
const stackManager = new StackManagerPulumi();
await stackManager.configure({
    orchestrator: 'Pulumi',
    project: 'my-project'
});

const result = await stackManager.deploy(config);
```

### TemplateManagerFile

File system-based template management.

#### Constructor

```typescript
constructor()
```

#### Methods

##### load<T>(templateName: string): Promise<T>

Loads template from file system.

**Example:**
```typescript
const templateManager = new TemplateManagerFile();
templateManager.configure({
    path: './cfg/templates'
});

const template = await templateManager.load('atlas-basic');
```

### SecretManagerAWS

AWS Secrets Manager implementation.

#### Constructor

```typescript
constructor()
```

#### Methods

##### resolve(key: string): Promise<string>

Resolves secret from AWS Secrets Manager.

**Example:**
```typescript
const secretManager = new SecretManagerAWS();
await secretManager.configure({
    region: 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const secret = await secretManager.resolve('production/api-key');
```

## Utility Classes

### Logger

Logging system with multiple output processors.

#### Constructor

```typescript
constructor(config?: LoggerConfig)
```

#### Methods

##### debug(message: string, context?: any): void

Logs debug-level message.

##### info(message: string, context?: any): void

Logs info-level message.

##### warn(message: string, context?: any): void

Logs warning-level message.

##### error(message: string, context?: any): void

Logs error-level message.

**Example:**
```typescript
const logger = new Logger({
    level: 'info',
    category: 'MyComponent'
});

logger.info('Operation completed', { duration: 1500 });
logger.error('Operation failed', { error: 'Connection timeout' });
```

### VarProcessorService

Variable processing and resolution service.

#### Methods

##### transformInput(component: IComponent, output: IStruct, key: string): Promise<IStruct>

Transforms and resolves input variables.

##### transformSetup(component: IComponent, output: IStruct, key: string): Promise<IStruct>

Transforms and resolves setup variables.

**Example:**
```typescript
const processor = new VarProcessorService();

const resolvedInputs = await processor.transformInput(
    component,
    previousOutputs,
    'input'
);
```

## Error Handling

### Standard Error Responses

All API methods return standardized error responses through the IResult interface:

```typescript
{
    success: false,
    message: "Operation failed: Connection timeout",
    errors: [
        "Failed to connect to database",
        "Timeout after 30 seconds"
    ],
    timestamp: new Date(),
    duration: 30000
}
```

### Exception Handling

Components should handle exceptions and return standardized error responses:

```typescript
async deploy(input?: IStruct): Promise<IResult> {
    try {
        const result = await this.performOperation(input);
        return {
            success: true,
            output: result,
            timestamp: new Date()
        };
    } catch (error) {
        return {
            success: false,
            message: error.message,
            errors: [error.message],
            timestamp: new Date()
        };
    }
}
```

## NPM Package Usage

### Installation

```bash
npm install kozen-engine
```

### Basic Usage

```typescript
import { PipelineManager, IoC } from 'kozen-engine';

async function deployInfrastructure() {
    const container = IoC.getInstance();
    const pipeline = new PipelineManager(container);
    
    await pipeline.configure({
        template: 'atlas-basic',
        config: 'config.json',
        action: 'deploy'
    });
    
    const result = await pipeline.deploy({
        template: 'atlas-basic',
        config: 'config.json',
        action: 'deploy'
    });
    
    console.log(`Deployment ${result.success ? 'completed' : 'failed'}`);
    return result;
}
```

### Advanced Usage

```typescript
import { 
    PipelineManager, 
    IoC, 
    StackManagerPulumi,
    TemplateManagerFile,
    SecretManagerAWS 
} from 'kozen-engine';

async function createCustomPipeline() {
    const container = IoC.getInstance();
    
    // Register custom services
    await container.register([
        {
            key: 'CustomStackManager',
            target: StackManagerPulumi,
            type: 'class',
            lifetime: 'singleton'
        },
        {
            key: 'CustomTemplateManager',
            target: TemplateManagerFile,
            type: 'class',
            lifetime: 'singleton'
        }
    ]);
    
    const pipeline = new PipelineManager(container);
    
    return pipeline;
}
```

This comprehensive API reference provides the foundation for integrating Kozen Engine into applications and building custom components and extensions. 