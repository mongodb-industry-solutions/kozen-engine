/**
 * @fileoverview Pulumi stack configuration models for infrastructure management
 * @description Defines interfaces and types for Pulumi-based infrastructure stack operations
 * @author MDB SAT
 * @since 1.0.4
 * @version 1.0.5
 */
import { ConfigMap, Stack } from "@pulumi/pulumi/automation";
import { IComponent } from "./Component";
import { IResult, IStruct } from "./Types";

/**
 * Pulumi program function type for stack deployment
 * @typedef {() => Promise<any>} IProgramFn
 */
export type IProgramFn = () => Promise<any>;

/**
 * Stack setup function type for configuration
 * @typedef {(stack: any) => Promise<IConfigValue>} ISetupFn
 */
export type ISetupFn = (stack: any) => Promise<IConfigValue>;

/**
 * Configuration value interface extending Pulumi ConfigMap
 * @interface IConfigValue
 * @extends ConfigMap
 */
export interface IConfigValue extends ConfigMap { }

/**
 * @interface IStackOptions
 * @description Complete configuration options for Pulumi stack management
 */
export interface IStackOptions extends IComponent {

    /**
     * Infrastructure orchestration tool type
     * @type {string}
     */
    orchestrator?: string;

    /**
     * Stack metadata tags
     * @type {Record<string, string>}
     */
    tags?: Record<string, string>;

    /**
     * Project logical grouping
     * @type {string}
     */
    project?: string;

    /**
     * Pulumi program function
     * @type {IProgramFn}
     */
    program?: IProgramFn;

    /**
     * Configuration setup function
     * @type {ISetupFn}
     */
    init?: ISetupFn;

    /**
     * Workspace backend configuration
     * @type {Object}
     */
    workspace?: {
        /**
         * Backend URL for state storage
         * @type {string}
         */
        url?: string;

        /**
         * Runtime environment
         * @type {string}
         */
        runtime?: string;
    };

    /**
     * Environment-specific overrides
     * @type {Object}
     */
    environment?: {
        /**
         * Stack name environment variable
         * @type {string}
         */
        stackName?: string;

        /**
         * Project name environment variable
         * @type {string}
         */
        projectName?: string;

        /**
         * Region environment variable
         * @type {string}
         */
        region?: string;

        /**
         * Backend URL environment variable
         * @type {string}
         */
        backendUrl?: string;
    };

    /**
     * Additional configuration options
     * @type {Record<string, any>}
     */
    config?: IStackConfig;

    /**
     * Array of infrastructure components
     * @type {IComponent[]}
     */
    components?: IComponent[];
}

/**
 * @interface IStackConfig
 * @description Generic interface for stack configuration
 * @template T - Type for arguments
 * @template H - Type for options
 */
export interface IStackConfig<T = any, H = any> {
    /**
     * Generic inline program arguments
     * @type {T}
     */
    args: T;

    /**
     * Generic local workspace options
     * @type {H}
     */
    opts: H;

    /**
     * Stack name for deployment identification
     * @type {string}
     */
    stackName: string;

    /**
     * Project name for stack identification
     * @type {string}
     */
    projectName: string;

    /**
     * Region environment variable
     * @type {string}
     */
    region?: string;

    /**
     * Additional configuration options
     * @type {Record<string, any>}
     */
    [key: string]: any;
}


/**
 * @interface IStackManager
 * @description Interface for StackManager, exposing public properties and methods
 */
export interface IStackManager {
    /**
     * Gets the project name for stack identification
     * @readonly
     * @type {string}
     */
    readonly projectName: string;

    /**
     * Gets the stack name for deployment identification
     * @readonly
     * @type {string}
     */
    readonly stackName: string;


    readonly config?: IStackOptions;

    /**
     * Deploys infrastructure using Pulumi automation
     * @param {IStackOptions} config - Configuration options for stack deployment
     * @returns {Promise<Object>} Promise resolving to deployment result with status and metadata
     * @throws {Error} When deployment fails
     */
    deploy(config: IStackOptions): Promise<IResult>;

    /**
     * Destroys infrastructure using Pulumi automation
     * @param {IStackOptions} config - Configuration options for stack destruction
     * @returns {Promise<Object>} Promise resolving to destruction result with status and metadata
     * @throws {Error} When destruction fails
     */
    undeploy(config: IStackOptions): Promise<IResult>;

    /**
     * Validates stack configuration
     * @param {IStackOptions} config - Configuration options for stack validation
     * @returns {Promise<Object>} Promise resolving to validation result with status and details
     * @throws {Error} When validation fails
     */
    validate(config: IStackOptions): Promise<IResult>;

    /**
     * Retrieves current status and information about deployed stacks
     * @param {IStackOptions} config - Configuration options for status query
     * @returns {Promise<Object>} Promise resolving to status information
     * @throws {Error} When status query fails
     */
    status(config: IStackOptions): Promise<IResult>;

    /**
     * Transforms component input configuration through variable processing
     * @param component - Component configuration containing input definitions
     * @param output - Output context for variable resolution  
     * @param key - Property key to process for input configuration
     * @returns Promise resolving to transformed input configuration object
     */
    transformInput(component: IComponent, output: IStruct, key: string): Promise<IStruct>;

    /**
     * Transforms component setup configuration for stack initialization
     * @param component - Component configuration containing setup definitions
     * @param output - Output context for variable resolution
     * @param key - Property key to process for setup configuration  
     * @returns Promise resolving to transformed setup configuration object
     */
    transformSetup(component: IComponent, output: IStruct, key: string): Promise<IStruct>;
}

/**
 * @interface IStackManagerPulumi
 * @description Extended stack manager interface for Pulumi-specific operations
 * @extends IStackManager
 */
export interface IStackManagerPulumi extends IStackManager {
    /**
     * Pulumi stack instance for direct automation access
     * @type {Stack}
     */
    stack?: Stack;
}