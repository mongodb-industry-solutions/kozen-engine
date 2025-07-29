import { env } from 'process';
import { BaseController } from '../../controllers/BaseController';
import { IPipeline } from '../../models/Pipeline';
import { IResult, IStruct, VCategory } from '../../models/Types';
import { IK8PodsConfig } from "./IK8PodsConfig";

import * as kubernetes from '@pulumi/kubernetes';
import * as fs from 'fs';

/**
 * Simple demo component controller for testing pipeline functionality
 * This component demonstrates basic deployment, validation, and cleanup operations
 */
export class DemoFirst extends BaseController {

  /**
   * Deploys the DemoFirst component with message logging and output generation
   * @param input - Optional deployment input parameters with message and timeout
   * @returns Promise resolving to deployment result with success status and IP address output
   */
  async deploy(input?: IK8PodsConfig, pipeline?: IPipeline): Promise<IResult> {

    const kubeconfigPath = `${process.env.HOME}/.kube/config`;
    const kubeconfig = fs.readFileSync(kubeconfigPath).toString();

    this.logger?.info({
      flow: pipeline?.id,
      category: VCategory.cmp.iac,
      src: 'component:DemoFirst:deploy',
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

    const namespaceName = `${resourcePrefix}-namespace`;
    const namespace = new kubernetes.core.v1.Namespace(
      namespaceName,
      {
        metadata: { name: namespaceName },
      },
      { provider: k8sProvider }
    );

    const envVars = [
      {
        name: "DITTO_WEBSOCKET_URL",
        value: process.env.DITTO_WEBSOCKET_URL
      },
      {
        name: "DITTO_CUSTOM_AUTH_URL",
        value: process.env.DITTO_CUSTOM_AUTH_URL
      },
      {
        name: "DITTO_PLAYGROUND_TOKEN",
        value: process.env.DITTO_PLAYGROUND_TOKEN
      },
      {
        name: "DITTO_APP_ID",
        value: process.env.DITTO_APP_ID
      }
    ];


    const podName = `${resourcePrefix}-pod`;
    const pod = new kubernetes.core.v1.Pod(
      podName,
      {
        metadata: {
          name: podName,
          namespace: namespace.metadata.name,
        },
        spec: {
          containers: [
            {
              name: input?.containerName || "app-container", // Default container name
              image: input?.image || "nginx:latest", // Container image to deploy
              ports: [{ containerPort: 80 }, { containerPort: 8080 }, { containerPort: 3000 }], // Expose port 80 and 8080
              env: envVars
            },
          ],
        },
      },
      { provider: k8sProvider }
    );

    // Exporta detalles importantes
    return {
      output: {
        namespaceName: namespace.metadata.name.apply((n) => n),
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

export default DemoFirst;
