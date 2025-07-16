## Automated Testing Platform with Pulumi and IaC Templates

This project aims to create an automated testing execution platform that leverages Infrastructure as Code (IaC) using Pulumi. The core idea is to simplify infrastructure deployments for testing by defining reusable **templates**. Each template encapsulates all the necessary configurations to provision an entire infrastructure stack, enabling consistent, repeatable, and on-demand test environments.

-----

### 1\. Core Concepts and Principles

  * **Infrastructure as Code (IaC):** Managing and provisioning infrastructure through code instead of manual processes. This promotes consistency, version control, and automation.
  * **Pulumi:** An IaC framework that allows you to define infrastructure using popular programming languages (TypeScript, Python, Go, C\#, Java, YAML). This project will heavily rely on Pulumi's capabilities to manage cloud resources.
  * **Templates:** Pre-defined JSON configurations that describe the desired infrastructure. These templates act as blueprints for deploying specific testing environments. They abstract away the underlying Pulumi code, making it easier for users to provision complex setups without deep IaC knowledge.
  * **Component-Based Architecture:** The infrastructure described within templates is broken down into individual "components." Each component represents a specific cloud resource or service (e.g., an Atlas cluster, Kubernetes instances). This modularity enhances maintainability and extensibility.
  * **Automated Testing Integration:** The ultimate goal is to seamlessly integrate the infrastructure provisioning with automated testing frameworks, allowing tests to be executed against freshly provisioned and configured environments.

-----

### 2\. Template Structure and Properties

The templates are JSON files that serve as the primary input for the platform. Let's break down their structure and the purpose of each property:

```json
{
  "name": "Atlas Standard",
  "description": "Creates an Atlas cluster with a single ReplicaSet and additionally creates two Kubernetes instances to deploy a demo application that will interact with the created Atlas server.",
  "version": "1.0.0",
  "release": "20250407",
  "requires": [
    { "key": "MyClusterSecret", "provider": "aws", "type": "secret" }
  ],
  "deploymentMode": "synchronous",
  "components": [
    {
      "name": "Kubernetes",
      "region": "west-us",
      "instances": 2,
      "gitHubUrl": "https://github.com/mongodb-industry-solutions/kozen",
      "dockerFilePath": "./iac/",
      "output": [{ "name": "k8IpAddress", "description": "container public ip" }]
    },
    {
      "name": "Atlas",
      "region": "west-us",
      "clusterType": "REPLICASET",
      "replicationSpecs": [
        {
          "numShards": 1,
          "regionsConfigs": [
            {
              "regionName": "US_EAST_1",
              "electableNodes": 3,
              "priority": 7,
              "readOnlyNodes": 0
            }
          ]
        }
      ],
      "cloudBackup": true,
      "autoScalingDiskGbEnabled": true,
      "mongoDbMajorVersion": "8.0",
      "providerName": "AWS",
      "providerInstanceSizeName": "M10",
      "input": [{ "name": "ipAddress", "description": "ip address to include in the white list" }],
      "output": [{ "name": "ipAddress", "description": "container public ip" }]
    }
  ]
}
```

#### Template Properties:

  * **`name` (String):** A unique, human-readable name for the template. This helps in identifying its purpose.
      * *Example:* `"Atlas Standard"`
  * **`description` (String):** A detailed explanation of what the template deploys and its intended use. This is crucial for users to understand if a template is suitable for their needs.
      * *Example:* `"Creates an Atlas cluster with a single ReplicaSet and additionally creates two Kubernetes instances to deploy a demo application that will interact with the created Atlas server."`
  * **`version` (String):** The semantic version of the template. Useful for tracking changes and compatibility.
      * *Example:* `"1.0.0"`
  * **`release` (String):** The release date or identifier of the template.
      * *Example:* `"20250407"`
  * **`requires` (Array of Objects):** Defines the indispensable prerequisites for the template to function correctly. This is vital for validation. Each object in the array specifies a requirement.
      * **`key` (String):** The name of the required secret, credential, or resource.
      * **`provider` (String):** The cloud provider where the requirement is expected (e.g., "aws", "azure", "gcp").
      * **`type` (String):** The type of requirement (e.g., "secret", "permission", "resource").
      * *Example:* `[{ "key": "MyClusterSecret", "provider": "aws", "type": "secret" }]` - This indicates that a secret named "MyClusterSecret" must exist in AWS.
  * **`deploymentMode` (String):** Determines how the components within the template are deployed.
      * **`synchronous`:** Components are deployed in the order they are declared in the `components` array. This is necessary when there are explicit dependencies between components (e.g., a Kubernetes application needs an Atlas database to be created first). This mode is slower due to sequential execution.
      * **`asynchronous`:** (Implicit, if not specified or another value is used) Components are deployed in parallel, where possible, to speed up the deployment process. This mode is suitable when components have no direct deployment dependencies.
      * *Example:* `"synchronous"`
  * **`components` (Array of Objects):** This is the most crucial part of the template, defining each individual infrastructure component to be deployed. Each object within this array represents a single component.

#### Component Properties (within `components` array):

  * **`name` (String):** The logical name of the component, which maps directly to a **Controller class** responsible for deploying that specific resource (e.g., "Atlas" maps to `AtlasController`, "Kubernetes" maps to `KubernetesController`).
      * *Example:* `"Atlas"`, `"Kubernetes"`
  * **`region` (String):** The geographical region where the component should be deployed. This can be generalized across components.
      * *Example:* `"west-us"`, `"US_EAST_1"`
  * **`providerName` (String):** The cloud provider associated with the component (e.g., "AWS", "Azure", "GCP"). This can also be generalized.
      * *Example:* `"AWS"`
  * **Other Component-Specific Properties:** The remaining properties within a component object are highly specific to the type of resource being deployed and will be interpreted by its corresponding Controller.
      * *Example (Atlas component):* `clusterType`, `replicationSpecs`, `cloudBackup`, `mongoDbMajorVersion`, `providerInstanceSizeName`.
      * *Example (Kubernetes component):* `instances`, `gitHubUrl`, `dockerFilePath`.
  * **`input` (Array of Objects - Optional):** Defines inputs that this component might require from other components or external sources. Each object describes an input.
      * **`name` (String):** The name of the input parameter.
      * **`description` (String):** A brief description of the input.
      * *Example:* `[{ "name": "ipAddress", "description": "ip address to include in the white list" }]` (for Atlas, to whitelist the Kubernetes IP).
  * **`output` (Array of Objects - Optional):** Defines outputs that this component will produce upon successful deployment, which can then be consumed by other components or the testing framework. Each object describes an output.
      * **`name` (String):** The name of the output parameter.
      * **`description` (String):** A brief description of the output.
      * *Example:* `[{ "name": "ipAddress", "description": "container public ip" }]` (for Kubernetes, to provide its IP to Atlas).

-----

### 3\. System Architecture and Logic

The platform will follow a clear architectural pattern, separating concerns into distinct logical units.

#### 3.1. High-Level Architecture Diagram

![](./images/kozen-architecture-Layers.jpg)


#### 3.2. Detailed Component Breakdown

##### 3.2.1. Template Store

  * **Description:** A repository (e.g., a file system, S3 bucket, Git repository) where all the defined JSON templates are stored.
  * **Logic:** Provides a centralized location for managing and versioning templates. The `PipelineController` will interact with this store to load templates.

##### 3.2.2. Validation Engine

  * **Description:** Responsible for pre-deployment validation of templates.
  * **Logic:**
    1.  When a template is selected for deployment, the `PipelineController` will invoke the Validation Engine.
    2.  It iterates through the `requires` array of the template.
    3.  For each requirement, it performs checks against the specified `provider` and `type`.
          * *Example:* If `type` is "secret" and `provider` is "aws", it attempts to verify the existence of the secret in AWS Secrets Manager.
    4.  If any required element is missing or invalid, it generates a descriptive error message, preventing unnecessary and failed deployments.
    5.  Returns a list of validation errors (if any) or a success status.
  * **Benefit:** Reduces deployment errors, improves user experience by providing early feedback, and ensures prerequisites are met.

##### 3.2.3. Deployment Orchestrator (PipelineController)

  * **Description:** The central brain of the platform, responsible for loading templates, orchestrating validations, and triggering deployments/undeployments of components.
  * **Properties:**
      * `template`: The loaded template object (JSON).
      * `validationErrors`: A list of errors generated by the Validation Engine.
  * **Methods:**
      * **`loadTemplate(templateName: string)`:**
        1.  Loads the specified template JSON file from the Template Store into memory.
        2.  Parses the JSON into a template object.
      * **`validateTemplate(): boolean`:**
        1.  Calls the Validation Engine, passing the loaded template.
        2.  Stores any returned errors in `this.validationErrors`.
        3.  Returns `true` if valid, `false` otherwise.
      * **`deploy()`:**
        1.  First, call `validateTemplate()`. If validation fails, abort and report errors.
        2.  Determine the deployment order based on `deploymentMode`:
              * **`synchronous`:** Iterate through `components` sequentially.
              * **`asynchronous`:** (If not synchronous) Identify components without dependencies or manage dependencies for parallel execution (more advanced logic required for true asynchronous deployment with dependencies). For simplicity in the initial phase, consider a basic sequential loop even for "asynchronous" if dependencies aren't explicitly managed. For a more robust asynchronous approach, a dependency graph might be needed.
        3.  For each `component` in the determined order:
              * Dynamically create an instance of the corresponding Controller class based on `component.name` (e.g., if `name` is "Atlas", instantiate `AtlasController`).
              * Create an instance of the specific `BaseConfig` specialization (e.g., `AtlasConfig`, `KubernetesConfig`) and populate it with all the properties defined for that component in the template.
              * Pass the populated configuration object to the Controller.
              * Call the Controller's `configure()` method.
              * Call the Controller's `deploy()` method.
              * Handle any outputs from the deployed component and make them available as inputs for subsequent components if needed (e.g., Kubernetes IP for Atlas whitelist).
      * **`undeploy()`:**
        1.  Similar to `deploy()`, but iterates components in reverse order (for `synchronous` mode) to handle dependencies correctly during teardown.
        2.  For each `component`:
              * Dynamically create an instance of the corresponding Controller.
              * Populate its configuration.
              * Call the Controller's `undeploy()` method.

##### 3.2.4. Pulumi Controllers

  * **Description:** These are the specialized classes responsible for interacting with Pulumi to provision and manage specific types of cloud resources. Each `name` property in a template's `components` array maps to a specific Controller class.
  * **Inheritance:**
      * All controllers should inherit from a `BaseController` abstract class.
      * All configuration objects should inherit from a `BaseConfig` abstract class.

###### `BaseConfig` (Abstract Class)

  * **Properties:**
      * `name: string` (e.g., "Atlas", "Kubernetes")
      * `region: string`
      * `providerName: string`
      * `input: Array<{ name: string; description: string; value?: any }>` (Optional, to pass values into the component)
      * `output: Array<{ name: string; description: string }>` (Optional, to define what outputs this component will expose)
  * **Purpose:** Provides a common structure for all component-specific configurations.

###### Example: `AtlasConfig` (inherits from `BaseConfig`)

```typescript
interface AtlasConfig extends BaseConfig {
  clusterType: "REPLICASET" | "SHARDED";
  replicationSpecs: Array<{
    numShards: number;
    regionsConfigs: Array<{
      regionName: string;
      electableNodes: number;
      priority: number;
      readOnlyNodes: number;
    }>;
  }>;
  cloudBackup: boolean;
  autoScalingDiskGbEnabled: boolean;
  mongoDbMajorVersion: string;
  providerInstanceSizeName: string;
  // ... other Atlas-specific properties
}
```

###### Example: `KubernetesConfig` (inherits from `BaseConfig`)

```typescript
interface KubernetesConfig extends BaseConfig {
  instances: number;
  gitHubUrl: string;
  dockerFilePath: string;
  // ... other Kubernetes-specific properties
}
```

###### `BaseController` (Abstract Class)

  * **Properties:**
      * `config: BaseConfig` (Holds the specific configuration for the component)
  * **Methods (Abstract):**
      * **`configure(config: BaseConfig): void`:** This method is responsible for taking the generic `BaseConfig` and casting/validating it to the specific configuration type (e.g., `AtlasConfig`), and then preparing the controller with these settings.
      * **`deploy(): Promise<any>`:** Contains the Pulumi code to provision the specific resource(s). Returns a promise that resolves with any relevant outputs.
      * **`undeploy(): Promise<any>`:** Contains the Pulumi code to de-provision the specific resource(s).

###### Example: `AtlasController` (inherits from `BaseController`)

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as mongodbatlas from "@pulumi/mongodbatlas";

class AtlasController extends BaseController {
  private atlasConfig: AtlasConfig;

  configure(config: BaseConfig): void {
    // Type assertion/validation
    if (!("clusterType" in config)) {
      throw new Error("Invalid Atlas configuration provided.");
    }
    this.atlasConfig = config as AtlasConfig;
  }

  async deploy(): Promise<any> {
    console.log(`Deploying Atlas cluster: ${this.atlasConfig.name}`);

    // Pulumi code to create an Atlas cluster based on this.atlasConfig
    const cluster = new mongodbatlas.Cluster(this.atlasConfig.name, {
      projectId: pulumi.output(process.env.MONGODB_ATLAS_PROJECT_ID), // From secrets or config
      name: this.atlasConfig.name,
      clusterType: this.atlasConfig.clusterType,
      replicationSpecs: this.atlasConfig.replicationSpecs.map((spec) => ({
        numShards: spec.numShards,
        regionsConfigs: spec.regionsConfigs.map((rc) => ({
          regionName: rc.regionName,
          electableNodes: rc.electableNodes,
          priority: rc.priority,
          readOnlyNodes: rc.readOnlyNodes,
        })),
      })),
      cloudBackup: this.atlasConfig.cloudBackup,
      autoScalingDiskGbEnabled: this.atlasConfig.autoScalingDiskGbEnabled,
      mongoDbMajorVersion: this.atlasConfig.mongoDbMajorVersion,
      providerName: this.atlasConfig.providerName,
      providerInstanceSizeName: this.atlasConfig.providerInstanceSizeName,
      // ... other properties from atlasConfig
    });

    // Handle inputs, e.g., IP whitelist
    if (this.atlasConfig.input) {
        const ipInput = this.atlasConfig.input.find(i => i.name === "ipAddress");
        if (ipInput && ipInput.value) {
            new mongodbatlas.ProjectIpAccessList(`${this.atlasConfig.name}-whitelist`, {
                projectId: pulumi.output(process.env.MONGODB_ATLAS_PROJECT_ID),
                ipAddress: ipInput.value,
                comment: "IP address from Kubernetes component"
            });
        }
    }

    // Output relevant information
    const ipAddress = "dynamic-ip-address"; // Placeholder, get actual IP from cluster output
    console.log(`Atlas cluster ${this.atlasConfig.name} deployed.`);
    return { ipAddress }; // Return outputs for other components to consume
  }

  async undeploy(): Promise<void> {
    console.log(`Undeploying Atlas cluster: ${this.atlasConfig.name}`);
    // Pulumi code to delete the Atlas cluster
    // Pulumi handles resource deletion automatically when a stack is destroyed,
    // but explicit resource deletion logic might be needed for specific cases
    // or if you're managing resources outside of a full stack destroy.
    console.log(`Atlas cluster ${this.atlasConfig.name} undeployed.`);
  }
}
```

###### Example: `KubernetesController` (inherits from `BaseController`)

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import * as docker from "@pulumi/docker"; // Assuming Docker build for demo app

class KubernetesController extends BaseController {
  private k8sConfig: KubernetesConfig;

  configure(config: BaseConfig): void {
    if (!("instances" in config)) {
      throw new Error("Invalid Kubernetes configuration provided.");
    }
    this.k8sConfig = config as KubernetesConfig;
  }

  async deploy(): Promise<any> {
    console.log(`Deploying Kubernetes instances: ${this.k8sConfig.name}`);

    // Example: Deploy a simple Nginx deployment for demonstration
    const appLabels = { app: "nginx" };
    const deployment = new k8s.apps.v1.Deployment(this.k8sConfig.name, {
      spec: {
        selector: { matchLabels: appLabels },
        replicas: this.k8sConfig.instances,
        template: {
          metadata: { labels: appLabels },
          spec: {
            containers: [
              {
                name: "nginx",
                image: "nginx:1.14.2",
                ports: [{ containerPort: 80 }],
              },
            ],
          },
        },
      },
    });

    const service = new k8s.core.v1.Service(this.k8sConfig.name, {
      spec: {
        selector: appLabels,
        ports: [{ port: 80, targetPort: 80 }],
        type: "LoadBalancer", // Expose via Load Balancer for public IP
      },
    });

    // Get the public IP address of the LoadBalancer
    const k8IpAddress = service.status.apply(status => status.loadBalancer.ingress[0].ip);
    console.log(`Kubernetes deployment ${this.k8sConfig.name} deployed.`);
    return { k8IpAddress }; // Return outputs
  }

  async undeploy(): Promise<void> {
    console.log(`Undeploying Kubernetes instances: ${this.k8sConfig.name}`);
    // Pulumi handles resource deletion automatically on stack destroy
    console.log(`Kubernetes instances ${this.k8sConfig.name} undeployed.`);
  }
}
```

#### 3.3. Flow Diagrams

##### 3.3.1. Deployment Flow

```mermaid
graph TD
    A[Start Deployment] --> B{Load Template JSON}
    B --> C{Parse Template}
    C --> D{Validate Template (requires)}
    D -- NO --> E[Report Validation Errors & Exit]
    D -- YES --> F{Determine Deployment Order (deploymentMode)}
    F --> G{Loop through Components}
    G --> H{Dynamically Instantiate Controller (e.g., AtlasController)}
    H --> I{Populate Controller's Config (e.g., AtlasConfig)}
    I --> J{Call Controller.configure()}
    J --> K{Call Controller.deploy()}
    K --> L{Capture Component Outputs}
    L --> M{Handle Dependencies / Pass Outputs as Inputs to Next Components}
    M -- More Components? --> G
    M -- No More Components --> N[Deployment Complete]
    K -- Deployment Error --> P[Rollback / Report Error]
```

##### 3.3.2. Undeployment Flow

```mermaid
graph TD
    A[Start Undeployment] --> B{Load Template JSON}
    B --> C{Parse Template}
    C --> D{Determine Undeployment Order (Reverse for synchronous)}
    D --> E{Loop through Components (in reverse)}
    E --> F{Dynamically Instantiate Controller}
    F --> G{Populate Controller's Config}
    G --> H{Call Controller.configure()}
    H --> I{Call Controller.undeploy()}
    I -- More Components? --> E
    I -- No More Components --> J[Undeployment Complete]
    I -- Undeployment Error --> K[Report Error]
```

-----

### 4\. Key Design Considerations and Benefits

  * **Extensibility:** The component-based design with Controllers makes the platform highly extensible. To support a new cloud resource, a developer simply needs to create a new Controller class and its corresponding configuration interface, adhering to the `BaseController` and `BaseConfig` contracts. This isolates Pulumi-specific logic within these controllers.
  * **Maintainability:** By separating configuration (templates) from implementation (controllers), the system is easier to maintain. Changes to how a specific resource is deployed (e.g., updating a Pulumi provider version) only require modifying the relevant Controller, not every template.
  * **Usability:** Testers or users without deep IaC knowledge can provision complex environments simply by selecting and running a template. The `description` and `requires` properties provide clear guidance.
  * **Robustness:** The Validation Engine significantly reduces deployment failures by catching missing prerequisites early.
  * **Reusability:** Templates are reusable blueprints for common testing scenarios, ensuring consistency across environments.
  * **Version Control:** Both templates and Controller code can be managed under version control, allowing for traceability and rollbacks.
  * **Dependency Management:** The `deploymentMode` and the mechanism for passing outputs as inputs between components handle inter-component dependencies during deployment.
  * **Dynamic Instantiation:** Using the `name` property to dynamically load and instantiate Controller classes is a powerful pattern for creating a flexible and pluggable architecture. In TypeScript/JavaScript, this can be achieved using a mapping object or a simple factory function.

-----

### 5\. Future Enhancements

  * **Asynchronous Deployment with Dependency Graph:** For truly complex templates with many inter-dependent components, implement a sophisticated dependency graph solver to optimize parallel deployments.
  * **Output Management:** A more robust mechanism for components to expose and consume outputs, potentially with a centralized state store or a Pub/Sub model.
  * **UI/API Layer:** Develop a user interface or an API to allow users to browse, select, and trigger template deployments, as well as view deployment status and logs.
  * **Logging and Monitoring:** Integrate comprehensive logging and monitoring for deployments, including Pulumi's rich output.
  * **Cost Estimation:** Integrate with cloud provider APIs to provide cost estimates for a template deployment before execution.
  * **Resource Tagging:** Automatically apply tags to all deployed resources for better cost tracking and management.
  * **Template Versioning and Rollbacks:** Implement more advanced template versioning and a mechanism for rolling back to previous successful deployments.

