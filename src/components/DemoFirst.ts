import { BaseController } from '../controllers/BaseController';
import { IResult, IStruct } from '../models/Types';

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
  async deploy(input?: IStruct): Promise<IResult> {
    console.log(`Deploying DemoFirst with message: ${input?.message}`);
    // await new Promise(resolve => setTimeout(resolve, input?. || 1000));
    return {
      templateName: this.config.name,
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
  async undeploy(input?: IStruct): Promise<IResult> {
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
   * Retrieves current operational status information for the DemoFirst component
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

export default DemoFirst;
