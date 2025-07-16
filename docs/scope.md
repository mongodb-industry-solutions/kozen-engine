## Kozen: A Key Subsystem within Solution Assurance Utilities (SAU)

The **Kozen** project, as we've defined it, is a specialized **subsystem** operating within a broader initiative known as **Solution Assurance Utilities (SAU)**. SAU aims to provide a comprehensive suite of tools and platforms to ensure the reliability, security, and efficiency of solutions.

![](./images/kozen-architecture-SAU.jpg)

Within the SAU ecosystem, Kozen specifically addresses the critical areas of **Testing** and **DevOps**. It serves as the primary engine for automating infrastructure provisioning for test environments, enabling robust, repeatable, and on-demand deployments.

While Kozen covers these crucial aspects, the SAU project also encompasses other vital areas:

* **Security (IAM Packages):** This area focuses on Identity and Access Management (IAM) related utilities, likely involving tools and processes for managing roles, permissions, and secure access across various cloud resources and services.
* **Data Modeling:** Currently, this area is in its nascent stages with no defined components yet. It will likely evolve to include tools for designing, managing, and validating data structures and schemas.

In essence, Kozen acts as a powerful, focused component that provides the IaC-driven automation capabilities for testing and DevOps within the larger framework of SAU, which itself tackles multiple facets of solution assurance.


## Kozen's Current Phase: Focus on GitHub Actions and Template Repository

Currently, the **Kozen project is in its early stages**, with a primary focus on establishing a robust foundation for automated testing. Its immediate goal is to **dynamically create test execution environments directly within GitHub Actions**.

![](./images/kozen-architecture-Scope.Current.jpg)

At this initial phase, the core of Kozen's functionality is managed within a **generic template repository**. This repository acts as a boilerplate, providing a reusable codebase that simplifies the setup of these dynamic environments. Importantly, the **Kozen Engine itself functions as a subsystem contained within this template repository**, rather than being a separately distributable package. That standalone package distribution is slated for its second iteration, signifying a future phase of development.

Looking ahead, all generated data and metrics from these test executions will be **stored in MongoDB Atlas**. For clear and insightful visualization, this data will then be **represented graphically using Atlas Charts**, providing an intuitive dashboard for analyzing test results and environment performance.

## Next steps in project scope

The project, initially focused on automated testing execution via IaC templates, holds the potential for a much broader scope. At its core, the **Kozen Engine** emerges as a crucial abstraction layer built on top of Pulumi. Its primary function is to manage and orchestrate the deployment of testing environment definition templates.

![](./images/kozen-architecture-Next.jpg)


### 1. Kozen Engine as an Independent, Reusable Component (NPM Package)

By packaging the **Kozen Engine** as an **NPM package**, its reusability and independent project status are greatly enhanced. This allows:

* **Wider Adoption:** Any JavaScript/TypeScript project can easily integrate the Kozen Engine, leveraging its template-driven deployment capabilities without needing to re-implement the Pulumi orchestration logic.
* **Decoupling:** It decouples the core logic from specific frontends or integration points, making it a robust, standalone utility.
* **Version Control & Updates:** Standard NPM practices allow for easy versioning, distribution, and updates, ensuring consumers always have access to the latest features and bug fixes.

### 2. Testing as a Service (TaaS) Platform via REST API Backend

To truly expand its reach and provide a more accessible platform, the Kozen Engine can form the backbone of a **Testing as a Service (TaaS)** offering. This is achieved by building a backend service that exposes the Kozen Engine's functionalities through **REST APIs**.

This backend would enable:

* **Custom Frontend/Dashboard:** A dedicated web application or dashboard can be developed that interacts with these REST APIs. This provides a user-friendly graphical interface where:
    * Users can browse available templates.
    * Create and validate templates (input required parameters for deployments).
    * Trigger deployments and undeployments with a click.
    * Monitor the status of active testing environments.
    * View deployment logs and outputs (e.g., connection strings, public IPs).
* **Integration with MCP Server and Agents:** The REST API can also serve as an integration point for larger management platforms, such as a "Model Context Protocol (MCP) server." This allows the MCP to programmatically interact with the Kozen Engine, creating templates, triggering deployments and receiving status updates from automated AI agents, further streamlining large-scale testing operations.

### 3. Simplified Template Definition and Management

The introduction of a TaaS platform greatly simplifies the process of defining and managing templates:

* **Centralized Template Repository:** The platform can provide a centralized UI for template creation, editing, and versioning, abstracting away direct file system or Git interactions for end-users.
* **Guided Template Creation:** The UI can guide users through defining new templates, suggesting common properties, and validating input in real-time, reducing errors.

### 4. Continued Integration with Task Managers (e.g., GitHub Actions)

While providing a TaaS platform, the Kozen Engine's core functionality as an NPM package ensures it can still be leveraged by existing automation workflows. This means:

* **CI/CD Integration:** DevOps developers can continue to integrate the Kozen Engine directly into their Continuous Integration/Continuous Deployment (CI/CD) pipelines, such as **GitHub Actions**. This allows for automated provisioning of testing environments as part of the software delivery lifecycle.
* **Scripting Flexibility:** Users who prefer command-line tools or scripting can still directly use the NPM package, providing maximum flexibility for diverse use cases.

### 5. Broad Accessibility and Intuitive Usage for Stakeholders

This expanded vision makes the platform incredibly accessible and intuitive for a wide range of stakeholders:

* **Partners:** Can quickly spin up isolated testing environments for integrations or joint development efforts without deep knowledge of the underlying cloud infrastructure.
* **Testers:** Gain self-service capabilities to provision on-demand environments tailored for specific test cases, reducing wait times and increasing efficiency.
* **DevOps Developers:** Benefit from a powerful, extensible tool to automate infrastructure provisioning, fitting seamlessly into their existing CI/CD workflows and reducing manual effort.
* **Solution Architects:** Can use the platform to rapidly demonstrate complex solution deployments, showcase different architectural patterns, and validate designs against real-world cloud environments.

In essence, by evolving the Kozen Engine into a distributable NPM package and underpinning a TaaS platform, the project transitions from a focused internal tool to a versatile, enterprise-grade solution that empowers various teams to provision and manage testing environments with unprecedented ease and automation.