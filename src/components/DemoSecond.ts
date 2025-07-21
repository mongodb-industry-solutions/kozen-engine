import { BaseController } from '../controllers/BaseController';
import { IResult, IStruct } from '../models/Types';

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
  async deploy(input?: IStruct): Promise<IResult> {
    this.logger?.info({
      src: 'component:DemoSecond:deploy',
      message: `Deploying with message: ${input?.message}`,
      data: {
        templateName: this.config.name,
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
  async undeploy(input?: IStruct): Promise<IResult> {
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
  async validate(input?: IStruct): Promise<IResult> {
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
  async status(input?: IStruct): Promise<IResult> {
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
