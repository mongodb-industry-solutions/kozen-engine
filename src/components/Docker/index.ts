import path from 'path';
import { IPipeline } from '../../modules/pipeline/models/Pipeline';
import { BaseController } from '../../shared/controllers/BaseController';
import { IComponent } from '../../shared/models/Component';
import { IResult } from '../../shared/models/Result';
import { VCategory } from '../../shared/models/Types';
import { IDockerConfig } from "./IDockerConfig";

export class Docker extends BaseController {
  public metadata(): Promise<IComponent> {
    return Promise.resolve({
      description: 'Build and push a Docker image to AWS ECR from a Git repository using shell commands',
      orchestrator: 'Node',
      engine: '^1.0.5',
      input: [
        { name: 'repoUrl', description: 'Git repository URL', format: 'string' },
        { name: 'gitRef', description: 'Git ref (branch/tag/sha) to checkout', format: 'string' },
        { name: 'contextPath', description: 'Docker build context path', format: 'string' },
        { name: 'dockerfile', description: 'Dockerfile path relative to context', format: 'string' },
        { name: 'registryUrl', description: 'ECR registry repo URL (host/repository)', format: 'string' },
        { name: 'imageTag', description: 'Image tag (default latest)', format: 'string' },
        { name: 'repositoryName', description: 'ECR repository name (derived from registryUrl if omitted)', format: 'string' },
        { name: 'region', description: 'AWS region', format: 'string' },
        { name: 'buildArgs', description: 'Build args as key/value', format: 'Record<string,string>' },
        { name: 'push', description: 'Whether to push the image (default true)', format: 'boolean' },
        { name: 'githubToken', description: 'Token for private repo access', format: 'string' },
      ],
      output: [
        { name: 'image', description: 'Full image tag pushed', format: 'string' },
        { name: 'repositoryUrl', description: 'ECR repository URL', format: 'string' },
        { name: 'repositoryName', description: 'Repository name', format: 'string' }
      ]
    });
  }

  private async runCli(cmd: string, pipeline?: IPipeline): Promise<IResult> {
    const cli = await this.assistant?.resolve<any>('CLI');
    return await cli.run({ cmd: 'bash', args: ['-lc', cmd] }, pipeline);
  }

  async deploy(input?: IDockerConfig, pipeline?: IPipeline): Promise<IResult> {
    const id = pipeline?.id;
    const prefix = this.getPrefix(pipeline).toLowerCase();

    const {
      repoUrl,
      gitRef,
      contextPath = '.',
      dockerfile = 'Dockerfile',
      registryUrl,
      imageTag = 'latest',
      repositoryName: repoNameOverride,
      region,
      buildArgs,
      push = true,
      githubToken
    } = (input || {}) as IDockerConfig;

    if (!registryUrl) {
      return { success: false, message: 'registryUrl is required (e.g., 123456789012.dkr.ecr.us-east-1.amazonaws.com/my-app)' };
    }

    // Parse registry host and repository
    const [registryHost, ...repoParts] = registryUrl.split('/').filter(Boolean);
    const repositoryName = repoNameOverride || repoParts.join('/');
    const fullImageTag = `${registryHost}/${repositoryName}:${imageTag}`;

    // Region guess (fallbacks)
    const resolvedRegion = region || process.env.AWS_REGION || 'us-east-1';

    this.logger?.info({
      flow: id,
      category: VCategory.cmp.exe,
      src: 'component:Docker:deploy',
      message: input?.message || `Building and pushing ${fullImageTag}`,
      data: { prefix, repoUrl, gitRef, registryHost, repositoryName, region: resolvedRegion }
    });

    // Prepare working directory
    const workDir = path.join('/tmp', `${prefix}-docker`);
    let result: IResult;

    // 1) Clone repo if provided
    if (repoUrl) {
      const secureRepoUrl = (githubToken && repoUrl.startsWith('https://'))
        ? repoUrl.replace('https://', `https://x-access-token:${githubToken}@`)
        : repoUrl;

      await this.runCli(`rm -rf "${workDir}" && mkdir -p "${workDir}"`, pipeline);
      result = await this.runCli(`git clone --depth=1 "${secureRepoUrl}" "${workDir}"`, pipeline);
      if (result?.success === false) return result;
      if (gitRef) {
        result = await this.runCli(`cd "${workDir}" && git fetch --all && git checkout "${gitRef}"`, pipeline);
        if (result?.success === false) return result;
      }
    }

    // 2) ECR login
    result = await this.runCli(`aws ecr get-login-password --region ${resolvedRegion} | docker login --username AWS --password-stdin ${registryHost}`, pipeline);
    if (result?.success === false) return result;

    // 3) Build
    const ctx = repoUrl ? path.join(workDir, contextPath) : contextPath;
    const df = path.join(ctx, dockerfile);
    const argsStr = buildArgs
      ? Object.entries(buildArgs).map(([k, v]) => `--build-arg ${k}="${v}"`).join(' ')
      : '';
    result = await this.runCli(`docker build -t "${fullImageTag}" -f "${df}" ${argsStr} "${ctx}"`, pipeline);
    if (result?.success === false) return result;

    // 4) Push
    if (push) {
      result = await this.runCli(`docker push "${fullImageTag}"`, pipeline);
      if (result?.success === false) return result;
    }

    return {
      success: true,
      message: `Docker image ${fullImageTag} built${push ? ' and pushed' : ''} successfully`,
      timestamp: new Date(),
      output: {
        image: fullImageTag,
        repositoryUrl: `${registryHost}/${repositoryName}`,
        repositoryName
      }
    };
  }

  async undeploy(): Promise<IResult> {
    // Nothing to delete; images live in ECR (stack-level destroy handles infra)
    return { success: true, message: 'Docker component has no undeploy action.' };
  }

  async validate(): Promise<IResult> {
    return { success: true, message: 'Docker configuration looks valid.' };
  }

  async status(): Promise<IResult> {
    return { success: true, message: 'Docker component ready.' };
  }
}

export default Docker;