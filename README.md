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

## 📊 Core Concepts

- **Modules**: Extend and add functionality via horizontal modules like pipeline orchestration, logging, and more. Modules play a critical role by internally registering one or more of the following: applications, components, and controllers:
  - **Applications**: Build high-level interfaces such as CLI, AI MCP, and REST with Kozen.
  - **Components**: Fine-grained reusable execution units for tasks like IaC provisioning, API communication, and LLM integrations.
  - **Controllers**: Responsible for handling actions based on the executed application. Controllers are a cornerstone of Kozen, responding to tasks and providing specific functionalities linked to the application's communication interface.
- **Templates**: Ensure workflows and dependencies are declaratively defined using JSON files.
- **Shared Utilities**: Out-of-the-box utilities including dependency injection, environment management, logging, and common abstractions, making Kozen ideal for scalable automation and AI-driven applications.

For better understanding, please read the ['Introduction' section](https://github.com/mongodb-industry-solutions/kozen-engine/wiki/Introduction)

---

## 🏭 Installation

Install Kozen via NPM:

```bash
npm install @mongodb-solution-assurance/kozen
```

For better understanding, please read the ['Get-Started' section](https://github.com/mongodb-industry-solutions/kozen-engine/wiki/Get-Started)

---

## 📦 Multi-Interface Application Development

Kozen empowers developers to build applications that support multiple interfaces, including CLI, REST, and AI-based interfaces such as **AI MCP** for interacting with LLMs and more. Its modular design ensures that applications and tools are both customizable and easy to implement.

### 🖥️ CLI Interactions

Below are examples of how to interact with **Kozen** through its **CLI interface**:

```bash
npx kozen --action=help
```

For better understanding, please read the ['App-CLI' section](https://github.com/mongodb-industry-solutions/kozen-engine/wiki/App-CLI)

### 🤖 AI MCP Interactions

**MCP (Model Context Protocol)** for Artificial Intelligence Systems is an interface for interacting with Kozen and its modules through JSON-based communication protocols.

For better understanding, please read the ['App-MCP' section](https://github.com/mongodb-industry-solutions/kozen-engine/wiki/App-MCP)

---

## 📚 Documentation

Explore additional resources and documentation:

- **Official Wiki**: [Kozen Full Documentation](https://github.com/mongodb-industry-solutions/kozen-engine/wiki)
- **Reported Issues**: [GitHub Issues](https://github.com/mongodb-industry-solutions/kozen-engine/issues)
- **Next Step**: [Get Started](https://github.com/mongodb-industry-solutions/kozen-engine/wiki/Get-Started)

---

## 📋 License

Kozen is distributed under the **MIT License** and is available via [NPM](https://www.npmjs.com/package/@mongodb-solution-assurance/kozen).
