import { IDependency, IIoC } from "../tools";
import { IArgs } from "./Args";
import { IConfig } from "./Config";

export interface IModuleOpt {
    path?: string;
    name?: string;
}

export interface IModule {
    /** Gets the IoC helper instance for dependency resolution */
    readonly helper: IIoC | null | undefined;

    /**
     * Initializes the module
     * @param argv Optional startup arguments
     * @returns A promise resolving initial args and config
     */
    init<T = IArgs>(argv?: string[] | IArgs): Promise<{ args?: T, config?: IConfig | null }>;

    /**
     * Registers dependencies in the IoC container
     * @param config Configuration data
     * @param opts Additional options for registration
     * @returns A promise resolving with the registered dependencies
     */
    register(config: IConfig | null, opts?: any): Promise<Record<string, IDependency> | null>;
}
