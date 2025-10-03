import { AppModule } from "..";
import { IArgs } from "../../../shared/models/Args";

export class CLIServer {

    private app?: AppModule;

    constructor(app: AppModule) {
        this.app = app;
    }

    async register(app: AppModule): Promise<void> {
        this.app = app;
    }

    /**
     * Dispatch to appropriate controller based on arguments
     * @param app
     * @param args
     * @returns {Promise<{ result: T; options: O; }>}
     */
    async dispatch<T = any, O = any>(args: IArgs): Promise<{ result: T; options: O }> {
        try {
            if (!args?.controller) {
                throw new Error('No valid controller was specified');
            }

            if (!args?.action) {
                throw new Error('No valid action was specified');
            }

            if (args.controller === 'controller' && args.action === 'help') {
                args.controller = 'help:controller:cli';
            }

            const controller = await this.app?.helper?.get(args.controller) as any;

            if (!controller) {
                throw new Error('No valid controller found');
            }

            const options = { ...args, ...(await controller.fill(args)) };
            const action = controller[args.action];
            if (!action) {
                throw new Error('No valid action found');
            }

            const result = await action.apply(controller, [options]) as T;

            return { result, options };

        }
        catch (error) {
            return null as unknown as { result: T; options: O };
        }
    }
}