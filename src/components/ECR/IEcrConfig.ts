export interface IEcrConfig {
  // Optional friendly message for logs
  message?: string;

  // Naming helpers
  resourcePrefix?: string;
  containerName?: string;
  repositoryName?: string;

  // ECR options
  scanOnPush?: boolean;
  forceDelete?: boolean;
  imageTagMutability?: "MUTABLE" | "IMMUTABLE";

  // Optional lifecycle policy (JSON string)
  lifecyclePolicyJson?: string;

  // Optional tags
  tags?: Record<string, string>;

  // Optional region override (falls back to Pulumi config or env)
  region?: string;
}