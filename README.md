# Kozen

**Kozen** is a lightweight Task Execution Framework, designed for creating automation pipelines, versatile tools, and applications. It enables seamless integration with AI-based interfaces like AI MCP, allowing effortless interactions with large language models (LLMs) and traditional automation tools alike. Kozen supports multiple interfaces, including CLI and REST, and provides easy-to-extend mechanisms for building application types based on its robust extension model. As an NPM package, Kozen integrates seamlessly into Node.js environments, offering scalability, extensibility, and simplicity.

![](https://github.com/mongodb-industry-solutions/kozen-engine/blob/main/docs/images/banner.jpg)

## 🎯 Features

- **Config-Driven Pipelines**: Design and deploy pipelines using JSON templates (`cfg/templates/*.json`).
- **IaC Orchestration**: Include pluggable infrastructure-as-code (IaC) managers such as Pulumi and Terraform.
- **Flexible Application Development**: Create automation tools and applications that export via **AI MCP**, enabling intuitive interactions with **LLMs**.
- **Comprehensive Test Execution**: Execute end-to-end tests, integration tests, and performance workflows.
- **Extensible Components**: Use dependency injection (DI) and inversion of control (IoC) for extending and customizing Kozen.
- **Multi-Interface Support**: Build applications using **CLI**, **REST**, or AI MCP—leveraging Kozen's extensibility framework.
- **Secret and Template Management**: Securely manage sensitive data and workflow templates.
- **Structured Logging**: Native logging support, with optional storage in MongoDB for persistent structured logs.
- **Cross-Platform Utilities**: Universal helper functions designed to simplify operations and workflows across diverse environments.
- **Triggers Utilities**: Self‑Hosted Triggers support.

---

## 🏭 Installation

Install Kozen via NPM:

```bash
npm install @mongodb-solution-assurance/kozen
```

---

## 🚀 Quick Usage

Below is an example of quickly using Kozen to deploy a pipeline:

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

---

## 📊 Core Concepts

- **Applications**: Build high-level interfaces such as CLI, AI MCP, and REST with Kozen.
- **Modules**: Extend and add functionality via horizontal modules like pipeline orchestration, logging, and more.
- **Components**: Fine-grained reusable execution units for tasks like IaC provisioning, API communication, and LLM integrations.
- **Templates**: Ensure workflows and dependencies are declaratively defined using JSON files.
- **Shared Utilities**: Out-of-the-box utilities including dependency injection, environment management, logging, and common abstractions.

Kozen enables following Dependency Injection (DI) and Inversion of Control (IoC) principles, making it ideal for scalable automation and AI-driven applications.

---

## 📦 Multi-Interface Application Development

Kozen empowers developers to create Jenkins-style applications that support CLI, REST, and AI-based interfaces like **AI MCP** for interacting with LLMs. The modular design ensures applications and tools are customizable while remaining straightforward to implement.

Refer to examples in files like `bin/pipeline.ts` or `bin/kozen.ts` to build CLI applications or explore the extensibility model for REST/MCP interfaces. Import required modules from the following package:
`@mongodb-solution-assurance/kozen`.

---

## 🖥️ CLI Interactions

Below are examples of how to interact with **Kozen** through its **CLI interface**:

### General Help Command

```bash
npx kozen --action=help
```

### Run the `list` method from the `template` module/tool

```bash
npx kozen --action=template:list --moduleLoad=@mongodb-solution-assurance/kozen-template
```

### Create the environment file: `/home/user/.env`

```
MDB_URI=mongodb+srv://***REDACTED***@server/kozen?retryWrites=true&w=majority&appName=MyApp
MDB_MASTER_KEY=opV685wCgFr13iqLcJVtptutaSDPHi4Z

ATLAS_PROJECT_ID=SDPHi4Z
ATLAS_PRIVATE_KEY=V685wCg
ATLAS_PUBLIC_KEY=13iqLc

PULUMI_CONFIG_PASSPHRASE=demo

KOZEN_LOG_LEVEL=INFO
KOZEN_LOG_TYPE=object
KOZEN_MODULE_LOAD=@mongodb-solution-assurance/kozen-template

```

### Run the `list` method from the `template` module/tool with a static environment file

```bash
npx kozen --action=template:list --envFile=/home/user/.env
```

---

## 🤖 AI MCP Interactions

**AI MCP (Model Context Protocol)** is an interface for interacting with Kozen and its modules through JSON-based communication protocols.

### Example of AI MCP Configuration

Below is an interaction example using AI MCP, including server setups and environment configurations:

```json
{
  "servers": {
    "kozen": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@mongodb-solution-assurance/kozen@latest", "--type=mcp"],
      "env": {
        "MDB_URI": "mongodb+srv://***REDACTED***@server/kozen?retryWrites=true&w=majority&appName=MyApp",
        "MDB_MASTER_KEY": "opV685wCgFr13iqLcJVtptutaSDPHi4Z",
        "ATLAS_PROJECT_ID": "SDPHi4Z",
        "ATLAS_PRIVATE_KEY": "V685wCg",
        "ATLAS_PUBLIC_KEY": "13iqLc",
        "PULUMI_CONFIG_PASSPHRASE": "demo",
        "KOZEN_LOG_LEVEL": "NONE",
        "KOZEN_LOG_TYPE": "object",
        "KOZEN_MODULE_LOAD": "@mongodb-solution-assurance/kozen-template"
      }
    }
  },
  "inputs": []
}
```

---

## 📚 Documentation

Explore additional resources and documentation:

- **Official Wiki**: [Kozen Wiki](https://github.com/mongodb-industry-solutions/kozen-engine/wiki)
- **Reported Issues**: [GitHub Issues](https://github.com/mongodb-industry-solutions/kozen-engine/issues)
- **Local Documentation**: [Direct Repository - Docs Folder](./docs/README.md)

---

## 📋 License

Kozen is distributed under the **MIT License** and is available via [NPM](https://www.npmjs.com/package/@mongodb-solution-assurance/kozen).
