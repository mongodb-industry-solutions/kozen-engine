import { BaseController } from '../../controllers/BaseController';
import { IPipeline } from '../../models/Pipeline';
import { constCategory, IResult, IStruct } from '../../models/Types';

/**
 * Simple HelloWorld component controller for testing pipeline functionality
 * This component demonstrates basic deployment, validation, and cleanup operations
 */
export class DemoSecond extends BaseController {

  /**
   * Deploys the DemoSecond component with logging and result generation
   * @param input - Optional deployment input parameters with message
   * @returns Promise resolving to deployment result with success status
   */
  async deploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult> {
    this.logger?.info({
      category: constCategory.cmp.iac,
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
      message: `DemoFirst deployed successfully with message: ${input?.address}`,
      timestamp: new Date(),
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
