# Kozen — Task Execution Framework

**Kozen** is a lightweight Task Execution Framework designed for building custom automation workflows with first-class infrastructure-as-code (IaC) and testing capabilities. Distributed as an NPM package, Kozen seamlessly integrates into Node.js projects, offering scalability, extensibility, and simplicity.

## Features

- **Config-Driven Pipelines**: Create pipelines from JSON templates (`cfg/templates/*.json`).
- **IaC Orchestration**: Supports pluggable IaC managers such as Pulumi and Terraform.
- **Comprehensive Test Execution**: Handle end-to-end, integration, and performance testing workflows.
- **Extensible Components**: Built-in dependency injection (DI) container for easy customization.
- **Secret and Template Management**: Secure handling of secrets and structured templates.
- **Structured Logging**: Out-of-the-box logging with optional MongoDB data storage.
- **Cross-Platform Utilities**: Environment-independent tools for smooth operations.

## Installation

Install the package via NPM:

````bash
npm install @mongodb-solution-assurance/kozen
```

## Quick Usage

Here’s how to quickly use Kozen to deploy a pipeline:

```typescript
import { IoC, PipelineManager } from '@mongodb-solution-assurance/kozen';

const ioc = new IoC();
const pipeline = new PipelineManager(ioc);

await pipeline.deploy({
  template: 'atlas.basic',
  config: 'cfg/config.json',
  action: 'deploy'
});
```

## Core Concepts

- **Applications**: High-level user interfaces for Kozen (CLI, AI MCP, REST).
- **Modules**: Horizontal extensions capable of defining their own components.
- **Components**: Executable units used in pipelines, such as IaC tasks, tests, and APIs.
- **Templates**: Declarative JSON files specifying tasks and their dependencies.
- **Shared Utilities**: Includes IoC, DI, logging, environment utilities, and common models.

Kozen adheres to Dependency Injection and Inversion of Control principles, ensuring scalability and extensibility for complex automation pipelines.

### Example Configuration

Below is an example configuration file (`cfg/config.json`) for pipeline execution:

```json
{
  "id": "K2025XXXX",
  "project": "demo",
  "stack": "dev",
  "modules": ["pipeline", "template", "secret", "logger"],
  "template": { "name": "atlas.basic" }
}
```

### CLI Integration

Create your own CLI application (Jenkins-style) using Kozen by referring to `bin/pipeline.ts` or `bin/kozen.ts`.
Import the required types from the public package:
`@mongodb-solution-assurance/kozen`.

## Documentation

- **Official Wiki**: [Kozen Engine Wiki](https://github.com/mongodb-industry-solutions/kozen-engine/wiki)
- **Reported Issues**: [GitHub Issues](https://github.com/mongodb-industry-solutions/kozen-engine/issues)

## License

MIT © MongoDB Industry Solutions
Available on [NPM](https://www.npmjs.com/package/@mongodb-solution-assurance/kozen).
```

### Key Improvements:
1. **Enhanced readability**: Simplified and structured sentences for easier understanding.
2. **Consistent terminology**: Maintained a clearer and more consistent tone throughout.
3. **Stronger emphasis on features and benefits**: Highlighted Kozen’s strengths and use cases.
4. **Professional formatting**: Improved markdown formatting for a polished look.

Let me know if there's anything else you'd like to refine!
````
