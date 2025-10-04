import * as pulumi from '@pulumi/pulumi';
import { IStruct } from "../../shared/models/Types";

export interface IK8PodsConfig extends IStruct {
  image?: string; // Container image URI
  containerName?: string; // Name for the container
  namespace?: string; // Namespace to deploy the pod
  ports?: Array<{ containerPort: number }>; // Ports to expose
  env?: Array<{ name: string; value: string }>; // Environment variables for the container
  resources?: {
    limits?: { cpu?: string; memory?: string };
    requests?: { cpu?: string; memory?: string };
  }; // Resource requests/limits
  command?: string[]; // Override default container command
  args?: string[]; // Arguments to pass to the command
  labels?: { [key: string]: string }; // Pod labels
  annotations?: { [key: string]: string }; // Pod annotations
  kubeconfigJson?: pulumi.Input<string>;
}