import * as pulumi from "@pulumi/pulumi";
import * as k8s from "@pulumi/kubernetes";
import { BaseController } from '../BaseController';
import { BaseConfig } from '../../models/BaseConfig';
import { KubernetesPodConfig } from '../../models/KubernetesPodConfig';
import { DeploymentResult } from '../../models/Template';
import { PulumiStackManager } from "../../services/PulumiStackManager";
import { InlineProgramArgs, LocalWorkspaceOptions, UpResult } from "@pulumi/pulumi/automation";


export class KubernetesPodController extends BaseController {
    private kubernetesPodConfig: KubernetesPodConfig;
    private stackManager: PulumiStackManager | null = null;

  
    constructor() {
        super();
        this.kubernetesPodConfig = {} as KubernetesPodConfig;
    }

 
    configure(config: BaseConfig): void {
        try {
            if (!this.isKubernetesPodConfig(config)) {
                throw new Error("Invalid Kubernetes configuration provided. Missing required Kubernetes-specific properties.");
            }

            this.kubernetesPodConfig = config as KubernetesPodConfig;
            this.config = this.kubernetesPodConfig;
            this.isConfigured = true;

            console.log(`Kubernetes controller configured for: ${this.kubernetesPodConfig.name}`);
        } catch (error) {
            console.error(`Error configuring Kubernetes controller:`, error);
            throw error;
        }
    }


    private _createPulumiProgram(): pulumi.automation.PulumiFn {
        return async () => {
            // Extract the kubeconfig value and convert to YAML string
            let kubeconfigString: string;
            
            if (typeof this.kubernetesPodConfig.kubeconfig === 'string') {
                kubeconfigString = this.kubernetesPodConfig.kubeconfig;
            } else if (this.kubernetesPodConfig.kubeconfig && typeof this.kubernetesPodConfig.kubeconfig === 'object') {
                // Convert the kubeconfig object to YAML string
                const yaml = require('js-yaml');
                kubeconfigString = yaml.dump(this.kubernetesPodConfig.kubeconfig);
            } else {
                throw new Error('Invalid kubeconfig format');
            }

            const provider = new k8s.Provider('k8s-provider', {
                kubeconfig: kubeconfigString
            });

            const pod = new k8s.core.v1.Pod(`example-pod`, {
                metadata: {
                    name: this.kubernetesPodConfig.name || 'example-pod',
                    namespace: this.kubernetesPodConfig.namespace || 'default',
                },
                spec: {
                    containers: [{
                        name: 'main',
                        image: this.kubernetesPodConfig.image,
                        ports: this.kubernetesPodConfig.containerPort ? [{
                            containerPort: this.kubernetesPodConfig.containerPort
                        }] : undefined,
                        env: this.kubernetesPodConfig.env,
                        resources: this.kubernetesPodConfig.resources,
                    }]
                }
            }, { provider });

            return {
                podName: pod.metadata.name,
                podNamespace: pod.metadata.namespace,
            };
        };
    }


    private _getStackManager(): PulumiStackManager {
        if (!this.isConfigured) {
            throw new Error("Controller is not configured.");
        }

        // Create a unique project name for each cluster to avoid conflicts.
        const projectName = `kozen-k8s-${this.kubernetesPodConfig.name}`;
        const stackName = process.env.ENVIRONMENT || "dev";

        const args: InlineProgramArgs = {
            stackName: stackName,
            projectName: projectName,
            program: this._createPulumiProgram(),
        };

        const workspaceOpts: LocalWorkspaceOptions = {
            projectSettings: {
                name: args.projectName,
                runtime: "nodejs",
                backend: { url: process.env.PULUMI_BACKEND_URL || "s3://kozen-pulumi-stacks" },
            },
        };

        return new PulumiStackManager({ args, workspaceOpts });
    }


    async deploy(): Promise<DeploymentResult> {
        if (!this.isReady()) {
            throw new Error("Kubernetes controller is not properly configured. Call configure() first.");
        }

        try {
            console.log(`Deploying Kubernetes pod: ${this.kubernetesPodConfig.name}`);
            this.stackManager = this._getStackManager();
            const result: UpResult = await this.stackManager.up();

            console.log(`Kubernetes pod ${this.kubernetesPodConfig.name} deployed successfully`);
            return {
                componentName: this.kubernetesPodConfig.name,
                success: true,
                outputs: this.extractOutputs(result.outputs),
            };
        } catch (error) {
            console.error(`Error deploying Kubernetes pod ${this.kubernetesPodConfig.name}:`, error);
            return {
                componentName: this.kubernetesPodConfig.name,
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }


    async undeploy(): Promise<void> {
        if (!this.isReady()) {
            throw new Error("Kubernetes controller is not properly configured.");
        }

        try {
            console.log(`Undeploying Kubernetes pod: ${this.kubernetesPodConfig.name}`);
            // Ensure stack manager is initialized for undeploying, even if deploy wasn't called.
            this.stackManager = this._getStackManager();
            await this.stackManager.destroy();
            console.log(`Kubernetes pod ${this.kubernetesPodConfig.name} undeployed successfully`);
        } catch (error) {
            console.error(`Error undeploying Kubernetes pod ${this.kubernetesPodConfig.name}:`, error);
            throw error;
        }
    }


    private isKubernetesPodConfig(config: BaseConfig): config is KubernetesPodConfig {
        return 'name' in config &&
            'image' in config &&
            'kubeconfig' in config;
    }

    protected extractOutputs(result: any): { [key: string]: any } {
        const outputs: { [key: string]: any } = {};

        return outputs;
    }
}