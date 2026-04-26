# 🏠 Kozen

**Kozen** is a lightweight Task Execution Framework, designed for creating automation pipelines, versatile tools, and applications. It enables seamless integration with AI-based interfaces like AI MCP, allowing effortless interactions with large language models (LLMs) and traditional automation tools alike. Kozen supports multiple interfaces, including CLI and REST, and provides easy-to-extend mechanisms for building application types based on its robust extension model. As an NPM package, Kozen integrates seamlessly into Node.js environments, offering scalability, extensibility, and simplicity.

---

## Disclaimer

This repository was created as part of an initiative to promote best practices for integrating solutions with MongoDB. It is distributed under the [Apache 2.0 license](./LICENSE) and is open source. However, please note that this repository is **not actively maintained** by the MongoDB team, nor is it part of MongoDB's official product catalog.

The use of this repository in production environments is solely at your own discretion and risk. MongoDB does not provide any guarantees, warranties, or technical support for this repository. Furthermore, MongoDB shall **not be held liable** for any issues, bugs, or damages caused by its use or implementation.

Please carefully evaluate suitability and perform thorough testing before using this resource in a production environment.

Thank you for understanding,
The MongoDB Team

---

![](https://github.com/mongodb-industry-solutions/kozen-engine/blob/main/docs/images/banner.jpg)

## 🎯 Features

- **Config-Driven Pipelines**: Design and deploy pipelines using JSON templates (`cfg/templates/*.json`).
- **IaC Orchestration**: Support for Infrastructure as Code (IaC) tools such as Pulumi and Terraform.
- **CaC Orchestration**: Support for managing Configurations/Changes as Code (CaC).
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
npm install @kozen/engine
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

For better understanding, please read the ['App-MCP' section](https://github.com/mongodb-industry-solutions/kozen-engine/wiki/App-MCP). To avoid confusion, it is recommended to review the license and the "[Disclaimer and Usage Policy](https://github.com/mongodb-industry-solutions/kozen-engine/wiki/POLICY)" section.

---

## 📚 Documentation

Explore additional resources and documentation:

- [Disclaimer and Usage Policy](https://github.com/mongodb-industry-solutions/kozen-engine/wiki/POLICY)
- [How to Contribute to Kozen Ecosystem](https://github.com/mongodb-industry-solutions/kozen-engine/wiki/Contribute)
- [Official Wiki Documentation](https://github.com/mongodb-industry-solutions/kozen-engine/wiki)
- [Kozen through DeepWiki](https://deepwiki.com/mongodb-industry-solutions/kozen-engine)
- [GitHub Reported Issues](https://github.com/mongodb-industry-solutions/kozen-engine/issues)
- [Get Started](https://github.com/mongodb-industry-solutions/kozen-engine/wiki/Get-Started)

---

← Previous: [Home](https://github.com/mongodb-industry-solutions/kozen-engine/wiki) | Next: [Introduction](https://github.com/mongodb-industry-solutions/kozen-engine/wiki/Introduction) →
