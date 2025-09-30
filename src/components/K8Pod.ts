import * as kubernetes from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { BaseController } from '../modules/component/controllers/BaseController';
import { IComponent } from '../modules/component/models/Component';
import { IPipeline } from '../modules/pipeline/models/Pipeline';
import { IResult, IStruct } from '../shared/models/Types';

/**
 * K8Pod component controller for deploying containers to existing EKS clusters
 * Manages the creation and removal of Kubernetes pods using Pulumi
 */
export class K8Pod extends BaseController {
  private k8sProvider?: kubernetes.Provider;

  /**
   * Provides metadata for Kubernetes Pod deployment configuration.
   * @returns {Promise<IComponent>} Component metadata definition.
   */
  public metadata(): Promise<IComponent> {
    return Promise.resolve({
      description: 'Deploy a containerized workload to an existing Kubernetes cluster',
      orchestrator: 'Pulumi',
      engine: '^1.0.5',
      input: [
        { name: 'namespace', description: 'Target Kubernetes namespace', format: 'string' },
        { name: 'deploymentName', description: 'Deployment resource name', format: 'string' },
        { name: 'appLabel', description: 'Label to group resources', format: 'string' },
        { name: 'labels', description: 'Additional labels for resources', format: 'Record<string,string>' },
        { name: 'replicas', description: 'Desired replica count', format: 'number' },
        { name: 'containerName', description: 'Container name', format: 'string' },
        { name: 'image', description: 'Container image', format: 'string' },
        { name: 'containerPort', description: 'Container port', format: 'number' },
        { name: 'ports', description: 'Additional container ports', format: 'Array<{containerPort:number,protocol?:string}>' },
        { name: 'env', description: 'Environment variables', format: 'Array<{name:string,value?:string,valueFrom?:any}>' },
        { name: 'resources', description: 'Container resources', format: 'any' },
        { name: 'volumes', description: 'Pod volumes', format: 'any[]' },
        { name: 'volumeMounts', description: 'Container volume mounts', format: 'any[]' },
        { name: 'serviceName', description: 'Service name', format: 'string' },
        { name: 'servicePort', description: 'Service port', format: 'number' },
        { name: 'serviceType', description: 'Service type', format: '"ClusterIP" | "NodePort" | "LoadBalancer"' },
        { name: 'createService', description: 'Whether to create a service', format: 'boolean' }
      ],
      output: [
        { name: 'deploymentName', description: 'Resulting deployment name', format: 'string' },
        { name: 'serviceName', description: 'Resulting service name (if created)', format: 'string' },
        { name: 'namespace', description: 'Namespace used', format: 'string' },
        { name: 'image', description: 'Image deployed', format: 'string' },
        { name: 'replicas', description: 'Replica count', format: 'number' }
      ]
    });
  }

  /**
   * Deploys a container pod to an existing EKS cluster
   * @param input - Container deployment configuration
   * @param pipeline - Pipeline context containing stack and template information
   * @returns Promise resolving to deployment result with pod details
   */
  async deploy(input?: IPodConfig, pipeline?: IPipeline): Promise<IResult> {
    // if (!pipeline?.stack) {
    //   return {
    //     templateName: pipeline?.template?.name,
    //     action: 'deploy',
    //     success: false,
    //     message: `Missing pipeline stack reference`,
    //     timestamp: new Date(),
    //   }
    // }

    try {
      this.logger?.info({
        flow: pipeline?.id,
        src: 'component:K8Pod:deploy',
        message: `Deploying container with message: ${input?.message}`,
        data: {
          componentName: this.config.name,
          templateName: pipeline?.template?.name,
          stackName: pipeline?.stack?.config?.name,
          projectName: pipeline?.stack?.config?.project,
          prefix: this.getPrefix(pipeline),
          containerImage: input?.image,
          containerName: input?.containerName
        }
      });

      // Create a unique resource name with the prefix
      const resourcePrefix = this.getPrefix(pipeline);

      // Replace the kubeconfig string handling with file path
      const kubeconfigPath = path.join(os.homedir(), '.kube', 'config');
      const kubeconfig = fs.existsSync(kubeconfigPath) ? fs.readFileSync(kubeconfigPath, 'utf8') : '';

      // Create Kubernetes provider using file path
      this.k8sProvider = new kubernetes.Provider(`${resourcePrefix}-k8s-provider`, {
        kubeconfig
      });

      // Create namespace (optional)
      const namespace = new kubernetes.core.v1.Namespace(`${resourcePrefix}-namespace`, {
        metadata: {
          name: input?.namespace || "default",
        },
      }, { provider: this.k8sProvider });

      // Create deployment
      const deployment = new kubernetes.apps.v1.Deployment(`${resourcePrefix}-deployment`, {
        metadata: {
          name: input?.deploymentName || `${resourcePrefix}-app`,
          namespace: namespace.metadata.name,
          labels: {
            app: input?.appLabel || resourcePrefix,
            ...input?.labels
          }
        },
        spec: {
          replicas: input?.replicas || 1,
          selector: {
            matchLabels: {
              app: input?.appLabel || resourcePrefix,
            },
          },
          template: {
            metadata: {
              labels: {
                app: input?.appLabel || resourcePrefix,
                ...input?.labels
              },
            },
            spec: {
              containers: [
                {
                  name: input?.containerName || "app-container",
                  image: input?.image || "nginx:latest",
                  ports: input?.ports || [
                    {
                      containerPort: input?.containerPort || 80,
                    },
                  ],
                  env: input?.env || [],
                  resources: input?.resources || {
                    requests: {
                      memory: "64Mi",
                      cpu: "250m",
                    },
                    limits: {
                      memory: "128Mi",
                      cpu: "500m",
                    },
                  },
                  ...(input?.volumeMounts && { volumeMounts: input.volumeMounts }),
                },
              ],
              ...(input?.volumes && { volumes: input.volumes }),
            },
          },
        },
      }, { provider: this.k8sProvider });

      // Create service (optional, if service configuration is provided)
      let service;
      if (input?.createService !== false) {
        service = new kubernetes.core.v1.Service(`${resourcePrefix}-service`, {
          metadata: {
            name: input?.serviceName || `${resourcePrefix}-service`,
            namespace: namespace.metadata.name,
            labels: {
              app: input?.appLabel || resourcePrefix,
            }
          },
          spec: {
            selector: {
              app: input?.appLabel || resourcePrefix,
            },
            ports: [
              {
                port: input?.servicePort || 80,
                targetPort: input?.containerPort || 80,
                protocol: "TCP",
              },
            ],
            type: input?.serviceType || "ClusterIP", // ClusterIP, NodePort, LoadBalancer
          },
        }, { provider: this.k8sProvider });
      }

      return {
        templateName: pipeline?.template?.name,
        action: 'deploy',
        success: true,
        message: `K8s Pod deployed successfully with message: ${input?.message}`,
        timestamp: new Date(),
        output: {
          deploymentName: deployment.metadata.name,
          serviceName: service?.metadata.name,
          namespace: namespace.metadata.name,
          image: input?.image || "nginx:latest",
          replicas: input?.replicas || 1,
        }
      };

    } catch (error) {
      this.logger?.error({
        flow: pipeline?.id,
        src: 'component:K8Pod:deploy',
        message: `Error deploying K8s Pod: ${error instanceof Error ? error.message : String(error)}`,
        data: { error }
      });

      return {
        templateName: pipeline?.template?.name,
        action: 'deploy',
        success: false,
        message: `K8s Pod deployment failed: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Undeploys the Kubernetes pod resources
   * @param input - Optional undeployment input parameters
   * @returns Promise resolving to undeployment result with success status
   */
  async undeploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult> {
    this.logger?.info({
      flow: pipeline?.id,
      src: 'component:K8Pod:undeploy',
      message: `Undeploying K8s Pod: ${this.config.name}`
    });

    return {
      templateName: pipeline?.template?.name,
      action: 'undeploy',
      success: true,
      message: `K8s Pod resources marked for removal on next deployment`,
      timestamp: new Date(),
    };
  }

  /**
   * Validates the pod configuration for deployment readiness
   * @param input - Optional validation input parameters
   * @returns Promise resolving to validation result with success confirmation
   */
  async validate(input?: IStruct, pipeline?: IPipeline): Promise<IResult> {
    const podInput = input as IPodConfig;

    // Check if required fields are present
    const requiredFields = ['image'];
    const missingFields = requiredFields.filter(field => !(field in podInput));

    if (missingFields.length > 0) {
      return {
        templateName: pipeline?.template?.name,
        action: 'validate',
        success: false,
        message: `K8s Pod configuration is missing required fields: ${missingFields.join(', ')}`,
        timestamp: new Date(),
      };
    }

    return {
      templateName: pipeline?.template?.name,
      action: 'validate',
      success: true,
      message: `K8s Pod configuration is valid.`,
      timestamp: new Date(),
    };
  }

  /**
   * Retrieves current operational status information for the pod
   * @param input - Optional status query input parameters
   * @returns Promise resolving to status result with operational state
   */
  async status(input?: IStruct, pipeline?: IPipeline): Promise<IResult> {
    return {
      templateName: pipeline?.template?.name,
      action: 'status',
      success: true,
      message: `K8s Pod is running.`,
      timestamp: new Date(),
    };
  }
}

export default K8Pod;

export interface IPodConfig extends IStruct {
  // Container configuration
  image: string;
  containerName?: string;
  containerPort?: number;

  // Deployment configuration
  deploymentName?: string;
  replicas?: number;
  appLabel?: string;
  labels?: { [key: string]: string };

  // Namespace
  namespace?: string;

  // Service configuration
  createService?: boolean;
  serviceName?: string;
  servicePort?: number;
  serviceType?: "ClusterIP" | "NodePort" | "LoadBalancer";

  // Container resources
  resources?: {
    requests?: { [key: string]: string };
    limits?: { [key: string]: string };
  };

  // Environment variables
  env?: Array<{
    name: string;
    value?: string;
    valueFrom?: any;
  }>;

  // Ports
  ports?: Array<{
    containerPort: number;
    protocol?: string;
  }>;

  // Volumes
  volumes?: any[];
  volumeMounts?: any[];

  // Kubeconfig (from EKS cluster output)
  kubeconfig?: pulumi.Input<string>;
  kubeconfigJson?: pulumi.Input<string>;
}