import { BaseController } from '../../controllers/BaseController';
import { IPipeline } from '../../models/Pipeline';
import { IResult, IStruct } from '../../models/Types';

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
  async deploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult> {

    this.logger?.info({
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
    console.log(`Undeploying DemoFirst`);
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
