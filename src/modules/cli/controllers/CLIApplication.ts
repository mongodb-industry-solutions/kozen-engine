
import { KzApplication } from "../../../shared/controllers/KzApplication";
import { IArgs } from "../../../shared/models/Args";
import { IModule } from "../../../shared/models/Module";

export class CLIServer extends KzApplication {

    async register(app: IModule): Promise<void> {
        this.app = app;
    }

    async start(args?: IArgs): Promise<void> {
        if (!this.app) {
            throw new Error("App Module not properly initialized.");
        }
        const { result, options, error } = await this.dispatch(args);
        if (error) {
            throw error;
        }
        args?.action !== 'help' && this.app.log({
            flow: (this.config && this.app.getId(this.config)) || undefined,
            src: 'bin:Kozen',
            data: {
                params: options,
                result
            }
        });
        await this.app.wait();
        !result?.await && process.exit(0);
    }

    /**
     * Dispatch to appropriate controller based on arguments
     * @param app
     * @param args
     * @returns {Promise<{ result: T; options: O; }>}
     */
    async dispatch<T = any, O = any>(args?: IArgs): Promise<{ result: T; options: O, error?: Error }> {
        try {
            if (!args?.module) {
                throw new Error('No valid module controller was specified');
            }

            if (!args?.action) {
                throw new Error('No valid action was specified');
            }

            if (args.module === 'controller' && args.action === 'help') {
                args.module = 'help:controller:cli';
            }

            const controller = await this.app?.helper?.get(args.module) as any;

            if (!controller) {
                throw new Error('No valid controller found for module: ' + args.module);
            }

            const options = { ...args, ...(await controller.fill(args)) };
            const action = controller[args.action];
            if (!action) {
                throw new Error('No valid action found: ' + args.action);
            }

            const result = await action.apply(controller, [options]) as T;

            return { result, options };
        }
        catch (error) {
            return { result: {} as T, options: {} as O, error: error as Error };
        }
    }
}