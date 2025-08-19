export interface IDockerConfig {
  // Git source
  repoUrl?: string;          // e.g., https://github.com/org/repo.git
  gitRef?: string;           // branch/tag/sha
  contextPath?: string;      // subdir context for docker build (default: '.')
  dockerfile?: string;       // Dockerfile path relative to context (default: 'Dockerfile')

  // ECR / image
  registryUrl: string;       // e.g., 123456789012.dkr.ecr.us-east-1.amazonaws.com/my-app
  imageTag?: string;         // default: 'latest'
  repositoryName?: string;   // optional (derived from registryUrl if omitted)
  region?: string;           // default: from env/config or 'us-east-1'

  // Build options
  buildArgs?: Record<string, string>;
  push?: boolean;            // default: true

  // Optional auth
  githubToken?: string;      // to access private repos via https
  // Logging
  message?: string;
}