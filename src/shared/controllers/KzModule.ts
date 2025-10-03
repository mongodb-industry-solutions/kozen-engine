import { IArgs } from "../models/Args";
import { IConfig } from "../models/Config";
import { IModule } from "../models/Module";
import { IDependency, IIoC } from "../tools";

export class KzModule implements IModule {

    /**
     * IoC container instance for dependency injection and service resolution
     * @type {IIoC | null}
     * @protected
     */
    protected assistant?: IIoC | null;

    /**
     * Gets the IoC helper instance for dependency resolution
     * @returns {IIoC | null | undefined} The IoC container instance
     * @public
     */
    public get helper(): IIoC | null | undefined {
        return this.assistant;
    }

    constructor(dependency?: { assistant?: IIoC }) {
        dependency?.assistant && (this.assistant = dependency.assistant);
    }

    public async init<T = IArgs>(argv?: string[] | IArgs): Promise<{ args?: T, config?: IConfig | null }> {
        return {};
    }

    public async register(config: IConfig | null, opts?: any): Promise<Record<string, IDependency> | null> {
        return Promise.resolve(null);
    }
}