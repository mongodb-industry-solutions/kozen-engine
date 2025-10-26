
import { IDependencyMap } from "../tools";
import { IArgs } from "./Args";
import { IModuleOpt } from "./Module";
import { IAppType } from "./Types";

/**
 * Kozen configuration interface for deployment management
 * @interface IConfig
 * @extends IPipelineArgs
 */
export interface IConfig extends IArgs {

    /**
     * Unique pipeline instance identifier for tracking and logging
     * @type {string}
     */
    id?: string;

    /**
     * Pipeline configuration identifier for human-readable naming
     * @type {string}
     */
    name?: string;

    /**
     * Engine version requirements for compatibility validation
     * @type {string}
     */
    engine?: string;

    /**
     * Semantic version for pipeline configuration versioning
     * @type {string}
     */
    version?: string;

    /**
     * Optional type of application
     */
    type?: IAppType;

    /**
     * Optional pipeline description for documentation purposes
     * @type {string}
     */
    description?: string;

    /**
     * Service configuration array for IoC container dependency injection
     * @type {IDependencyMap}
     */
    dependencies?: IDependencyMap;

    /**
     * Module loading configuration for dynamic module management
     */
    modules?: {
        path?: string;
        mode?: "inherit" | "override";
        load?: Array<string | IModuleOpt>;
    }
}