import { BaseController } from '../../controllers/BaseController';
import { IPipeline } from '../../models/Pipeline';
import { IResult, IStruct, VCategory } from '../../models/Types';
import { IK8PodsConfig } from "./IK8PodsConfig";

import * as kubernetes from '@pulumi/kubernetes';
import * as pulumi from '@pulumi/pulumi';

/**
 * Simple demo component controller for testing pipeline functionality
 * This component demonstrates basic deployment, validation, and cleanup operations
 */
export class K8Pods extends BaseController {

  /**
   * Deploys the K8Pods component with message logging and output generation
   * @param input - Optional deployment input parameters with message and timeout
   * @returns Promise resolving to deployment result with success status and IP address output
   */
  async deploy(input?: IK8PodsConfig, pipeline?: IPipeline): Promise<IResult> {

    const kubeconfig: pulumi.Input<string> = (input?.kubeconfigJson ?? "");
    pulumi.output(kubeconfig).apply((k: string) => {
      this.logger?.info({
        flow: pipeline?.id,
        category: VCategory.cmp.iac,
        src: 'component:K8Pods:deploy',
        message: `kubeconfigJson (first 200 chars): ${k.slice(0, 200)}...`
      });
    });

    this.logger?.info({
      flow: pipeline?.id,
      category: VCategory.cmp.iac,
      src: 'component:K8Pods:deploy',
      message: `Deploying with message: ${input?.message}`,
      data: {
        // Get the current component name
        componentName: this.config.name,
        // Get the current template name
        templateName: pipeline?.template?.name,
        // Get the current stack name (usually the execution environment like: dev, stg, prd, test, etc.)
        stackName: pipeline?.stack?.config?.name,
        // Get the current project name, which can be used in combination with the stackName as prefix for internal resource deployment (ex. K2025072112202952-dev)
        projectName: pipeline?.stack?.config?.project,
        // Get component (ex. K2025072112202952-dev)
        prefix: this.getPrefix(pipeline)
      }
    });

    // Create a unique resource name with the prefix
    const resourcePrefix = this.getPrefix(pipeline).toLowerCase();

    // Define el proveedor de Kubernetes con el kubeconfig
    const k8sProvider = new kubernetes.Provider("eksProvider", {
      kubeconfig
    });

    // const namespaceName = `${resourcePrefix}-namespace`;
    // const namespace = new kubernetes.core.v1.Namespace(
    //   namespaceName,
    //   {
    //     metadata: { name: namespaceName },
    //   },
    //   { provider: k8sProvider }
    // );

    const appLabels = { app: resourcePrefix };

    const envVars = []; // Array to hold environment variables

    const {
      containerName = "app-container",
      image,
      ...inputEnv
    } = input || {};

    for (let key in inputEnv) {
      inputEnv[key] && envVars.push({ name: key, value: inputEnv[key] });
    }

    if (!input?.image) {
      const srvK8Registry = await this.assistant?.resolve<BaseController>('ECR');
      if (srvK8Registry) {
        const registry = await srvK8Registry.deploy(
          {
            message: `Deploying ECR registry for ${this.config.name}`,
            resourcePrefix,
            // namespace: namespace.metadata.name,
            containerName
          },
          pipeline
        );
        console.log(registry.output);
        // input.image = `${registry.output.registryUrl}/nginx:latest`;

      }
    }

    const podName = `${resourcePrefix}-pod`;
    const pod = new kubernetes.core.v1.Pod(podName, {
      metadata: {
        name: podName,
        // namespace: namespace.metadata.name,
        labels: appLabels,
      },
      spec: {
        containers: [
          {
            name: containerName, // Default container name
            image, // Container image to deploy
            ports: [{ containerPort: 80 }, { containerPort: 8080 }, { containerPort: 3000 }],
            env: envVars
          },
        ],
      },
    },
      { provider: k8sProvider }
    );

    const serviceName = `${resourcePrefix}-service`;
    const service = new kubernetes.core.v1.Service(serviceName, {
      metadata: {
        name: serviceName,
        // namespace: namespace.metadata.name,
        labels: appLabels,
        annotations: { // This annotation makes it so that the service is accessible from the internet
          "service.beta.kubernetes.io/aws-load-balancer-scheme": "internet-facing"
        }
      },
      spec: {
        type: "LoadBalancer",
        selector: appLabels,
        ports: [
          { name: "http-3000", port: 3000, targetPort: 3000 }
        ],
      },
    }, { provider: k8sProvider });

    // Exporta detalles importantes
    return {
      output: {
        // namespaceName: namespace.metadata.name.apply((n) => n),
        podName: pod.metadata.name.apply((n) => n),
      }
    };

  }

  /**
   * Undeploys the DemoFirst component with cleanup confirmation
   * @param input - Optional undeployment input parameters
   * @returns Promise resolving to undeployment result with success status
   */
  async undeploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult> {
    return {
      templateName: this.config.name,
      action: 'undeploy',
      success: true,
      message: `DemoFirst undeployed successfully.`,
      timestamp: new Date(),
    };
  }

  /**
   * Validates the DemoFirst component configuration for deployment readiness
   * @param input - Optional validation input parameters
   * @returns Promise resolving to validation result with success confirmation
   */
  async validate(input?: IStruct, pipeline?: IPipeline): Promise<IResult> {
    return {
      templateName: this.config.name,
      action: 'validate',
      success: true,
      message: `DemoFirst configuration is valid.`,
      timestamp: new Date(),
    };
  }

  /**
   * Retrieves current operational status information for the DemoFirst component
   * @param input - Optional status query input parameters
   * @returns Promise resolving to status result with operational state
   */
  async status(input?: IStruct, pipeline?: IPipeline): Promise<IResult> {
    return {
      templateName: this.config.name,
      action: 'status',
      success: true,
      message: `DemoFirst is running.`,
      timestamp: new Date(),
    };
  }

}

export default K8Pods;
