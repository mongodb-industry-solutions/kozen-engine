import { BaseController } from '../controllers/BaseController';
import { IResult, IStruct } from '../models/Types';

/**
 * Simple demo component controller for testing pipeline functionality
 * This component demonstrates basic deployment, validation, and cleanup operations
 */
export class DemoFirst extends BaseController {

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

  async validate(input?: IStruct): Promise<IResult> {
    return {
      templateName: this.config.name,
      action: 'validate',
      success: true,
      message: `DemoFirst configuration is valid.`,
      timestamp: new Date(),
    };
  }

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
