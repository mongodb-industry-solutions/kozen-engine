import { IPipeline } from '../../modules/pipeline/models/Pipeline';
import { BaseController } from '../../shared/controllers/BaseController';
import { IComponent } from '../../shared/models/Component';
import { IResult } from '../../shared/models/Result';
import { IStruct, VCategory } from '../../shared/models/Types';

/**
 * Simple HelloWorld component controller for testing pipeline functionality
 * This component demonstrates basic deployment, validation, and cleanup operations
 */
export class DemoSecond extends BaseController {

  /**
   * Supplies concise metadata for DemoSecond simple component.
   * @returns {Promise<IComponent>} Component metadata definition.
   */
  public metadata(): Promise<IComponent> {
    return Promise.resolve({
      description: 'Second simple demo component for pipeline testing',
      orchestrator: 'Node',
      engine: '^1.0.5',
      input: [
        { name: 'adddress', description: 'Referenced IP address (typo kept to match template)', format: 'string' },
        { name: 'message', description: 'Message to show', format: 'string' },
        { name: 'delay', description: 'Delay value possibly sourced from secret', format: 'number' }
      ]
    });
  }

  /**
   * Deploys the DemoSecond component with logging and result generation
   * @param input - Optional deployment input parameters with message
   * @returns Promise resolving to deployment result with success status
   */
  async deploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult> {
    this.logger?.info({
      flow: pipeline?.id,
      category: VCategory.cmp.iac,
      src: 'component:DemoSecond:deploy',
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
    return {
      templateName: this.config.name,
      action: 'deploy',
      success: true,
      message: `DemoSecond deployed successfully with message: ${input?.address}`,
      timestamp: new Date(),
      output: {
        value: "test demo second"
      }
    };
  }

  /**
   * Undeploys the DemoSecond component with cleanup confirmation
   * @param input - Optional undeployment input parameters
   * @returns Promise resolving to undeployment result with success status
   */
  async undeploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult> {
    this.logger?.info({
      src: 'component:DemoSecond:undeploy',
      message: `Deploying with message: ${input?.message}`,
      data: {
        templateName: this.config.name,
      }
    });
    return {
      templateName: this.config.name,
      action: 'undeploy',
      success: true,
      message: `DemoFirst undeployed successfully.`,
      timestamp: new Date(),
    };
  }

  /**
   * Validates the DemoSecond component configuration
   * @param input - Optional validation input parameters
   * @returns Promise resolving to validation result with status confirmation
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
   * Retrieves current status information for the DemoSecond component
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

export default DemoSecond;
