import { IAppType } from "./Types";

/**
 * Base CLI arguments interface for CLI operations
 * @interface IArgs
 */
export interface IArgs {
    /**
     * Help action entry flag for displaying usage information
     * @type {string}
     */
    help?: string;

    /**
     * Configuration file path for CLI settings
     * @type {string}
     */
    config?: string;

    /**
     * Operation type to execute. Supported actions: deploy, undeploy, validate, status
     * @type {string}
     */
    action: string;

    /**
     * Module controller to execute
     * @type {string}
     */
    module?: string;

    /**
     * Optional unique stack identifier for environment isolation
     * @type {string}
     */
    stack?: string;

    /**
     * Optional project organization name for resource grouping
     * @type {string}
     */
    project?: string;

    /**
     * Optional type of application
     */
    type?: IAppType;

    /**
     * Optional extra properties
     * @type {any}
     */
    [key: string]: any;
}