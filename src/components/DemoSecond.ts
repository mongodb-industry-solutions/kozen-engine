import { BaseController } from '../controllers/BaseController';
import { IResult, IStruct } from '../models/Types';

/**
 * Simple HelloWorld component controller for testing pipeline functionality
 * This component demonstrates basic deployment, validation, and cleanup operations
 */
export class DemoSecond extends BaseController {


  async deploy(input?: IStruct): Promise<IResult> {
    console.log(`Deploying DemoFirst with message: ${input?.message}`);
    return {
      templateName: this.config.name,
      action: 'deploy',
      success: true,
      message: `DemoFirst deployed successfully with message: ${input?.address}`,
      timestamp: new Date(),
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

export default DemoSecond;
