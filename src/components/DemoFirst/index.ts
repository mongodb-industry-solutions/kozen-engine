import { IPipeline } from '../../modules/pipeline/models/Pipeline';
import { KzComponent } from '../../shared/controllers/KzComponent';
import { IComponent } from '../../shared/models/Component';
import { IResult } from '../../shared/models/Result';
import { IStruct, VCategory } from '../../shared/models/Types';

/**
 * Simple demo component controller for testing pipeline functionality
 * This component demonstrates basic deployment, validation, and cleanup operations
 */
export class DemoFirst extends KzComponent {

  /**
   * Supplies concise metadata for DemoFirst component usage.
   * @returns {Promise<IComponent>} Component metadata definition.
   */
  public metadata(): Promise<IComponent> {
    return Promise.resolve({
      description: 'Simple demo component for basic pipeline testing',
      orchestrator: 'Node',
      engine: '^1.0.5',
      setup: [
        { type: 'secret', name: 'mongodb-atlas:publicKey', value: 'ATLAS_PUBLIC_KEY' },
        { type: 'secret', name: 'mongodb-atlas:privateKey', value: 'ATLAS_PRIVATE_KEY' },
        { type: 'secret', name: 'mongodb-atlas:projectId', value: 'ATLAS_PROJECT_ID' }
      ],
      input: [
        { name: 'projectName', description: 'Project logical name', format: 'string' },
        { name: 'message', description: 'Demo message to log', format: 'string' },
        { name: 'delay', description: 'Delay in ms before completing', format: 'number' },
        { name: 'secs', description: 'Secret example value', format: 'string' }
      ],
      output: [
        { name: 'ipAddress', description: 'Sample IP address output', format: 'string' },
        { name: 'format', description: 'Formatted string example', format: 'string' }
      ],
      dependency: [
        {
          name: 'DemoSecond',
          description: 'Example of how to call another component as a dependency'
        }
      ]
    });
  }

  /**
   * Deploys the DemoFirst component with message logging and output generation
   * @param input - Optional deployment input parameters with message and timeout
   * @returns Promise resolving to deployment result with success status and IP address output
   */
  async deploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult> {

    this.logger?.debug({
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

    // Example of how to call another component as a dependency
    const component = await this.assistant?.resolve<KzComponent>('DemoSecond');
    const depResult = await component?.deploy(input, pipeline);
    this.logger?.info({
      flow: pipeline?.id,
      category: VCategory.cmp.iac,
      src: 'component:DemoFirst:deploy',
      message: `Result of calling a component as a dependency`,
      data: depResult?.output
    });

    // await new Promise(resolve => setTimeout(resolve, input?. || 1000));
    return {
      templateName: pipeline?.template?.name,
      action: 'deploy',
      success: true,
      message: `DemoFirst deployed successfully with message: ${input?.message}`,
      timestamp: new Date(),
      output: {
        ipAddress: "123.94.55.2"
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
