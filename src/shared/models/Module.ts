import { IDependency, IIoC, ILogInput, ILogLevel } from "../tools";
import { IArgs } from "./Args";
import { IConfig } from "./Config";
import { IMetadata } from "./Metadata";

export interface IModuleOpt {
    key?: string;
    path?: string;
    alias?: string;
    name?: string;
}

export interface IModule {
    /** Gets the IoC helper instance for dependency resolution */
    readonly helper: IIoC | null | undefined;

    /**
     * Metadata about the module's dependency configuration
     */
    metadata?: IMetadata;

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

    /**
     * Determines required modules based on configuration
     * @param config Configuration data
     * @param opts Additional options for determining requirements
     */
    requires(config: IConfig | null, opts?: any): Promise<Array<string | IModuleOpt> | null>;

    /**
     * Generates a unique identifier for the module
     * @param opt Optional configuration to influence ID generation
     */
    getId(opt?: IConfig): string;

    /**
     * Waits for the module to be fully ready
     */
    wait(): Promise<void>;

    /**
     * Logs information related to the module
     * @param input Log input data
     * @param level Optional log level
     */
    log(input: ILogInput, level?: ILogLevel): void;
}
