# Kozen — Task Execution Framework

**Kozen** is a lightweight Task Execution Framework designed not only for creating automation pipelines but also for building versatile tools and applications. It enables seamless AI MCP integration, allowing effortless interaction with large language models (LLMs) just as you would with any traditional framework. Kozen supports multiple interfaces, including CLI and REST, and provides mechanisms for easily defining application types based on its robust extension system. Distributed as an NPM package, Kozen seamlessly integrates into Node.js projects, delivering scalability, extensibility, and simplicity.

## 🎯 Features

- **Config-Driven Pipelines**: Design and deploy pipelines using JSON templates (`cfg/templates/*.json`).
- **IaC Orchestration**: Include pluggable infrastructure-as-code (IaC) managers such as Pulumi and Terraform.
- **Flexible Application Development**: Create tools that export via **AI MCP** to interact with **LLMs** in a straightforward manner, leveraging Kozen’s extension framework.
- **Comprehensive Test Execution**: Execute end-to-end tests, integration tests, and performance workflows.
- **Extensible Components**: Leverage dependency injection (DI) to extend and customize Kozen easily.
- **Multi-Interface Support**: Build applications with **CLI**, **REST**, or other interface mechanisms built on Kozen's extensibility model.
- **Secret and Template Management**: Securely manage sensitive data and templates.
- **Structured Logging**: Native logging support with optional storage in MongoDB for structured, persistent logs.
- **Cross-Platform Utilities**: Universal tools that simplify operations across diverse environments.

## 🏭 Installation

Install the package via NPM:

```bash
npm install @mongodb-solution-assurance/kozen
```

## 🚀 Quick Usage

Here’s how to quickly use Kozen to deploy a pipeline:

```typescript
import { IoC, PipelineManager } from "@mongodb-solution-assurance/kozen";

const ioc = new IoC();
const pipeline = new PipelineManager(ioc);

await pipeline.deploy({
  template: "atlas.basic",
  config: "cfg/config.json",
  action: "deploy",
});
```

## 📊 Core Concepts

- **Applications**: Build high-level user interfaces with Kozen (CLI, AI MCP, REST).
- **Modules**: Define horizontal extensions to add your own components seamlessly.
- **Components**: Create reusable execution units for pipelines, including IaC tasks, APIs, and LLM integrations.
- **Templates**: Provide declarative JSON definitions for defining workflows and dependencies.
- **Shared Utilities**: A core library including IoC (Inversion of Control), DI (Dependency Injection), logging, environment utilities, and common models.

Kozen empowers developers to follow Dependency Injection and Inversion of Control principles, ensuring scalability and extensibility for complex automation as well as AI-driven applications.

### 🔧 Example Configuration

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

### 📦 Multi-Interface Application Development

Kozen allows developers to create robust Jenkins-style applications using CLI or REST. Its modular architecture even supports exporting tools for AI-based interfaces such as **AI MCP**, which simplifies interaction with large language models (LLMs).

With Kozen, you can quickly define applications tailored to specific needs, integrating diverse mechanisms for handling pipelines, automation tasks, and more—all with minimal complexity.

Refer to files like `bin/pipeline.ts` or `bin/kozen.ts` for examples of building CLI applications. Import types from the public package:
`@mongodb-solution-assurance/kozen`.

## 📚 Documentation

- **Official Wiki**: [Kozen Engine Wiki](https://github.com/mongodb-industry-solutions/kozen-engine/wiki)
- **Reported Issues**: [GitHub Issues](https://github.com/mongodb-industry-solutions/kozen-engine/issues)
- **Local Documentation**: [Explore the project’s documentation directly within the repository](./docs/README.md)

## 📋 License

MIT © MongoDB Industry Solutions
Available on [NPM](https://www.npmjs.com/package/@mongodb-solution-assurance/kozen).
