import { IStruct } from "./Types";

/**
 * Transform function type for component input processing
 * @typedef {(component: IComponent, output: IStruct) => Promise<IStruct>} ITransformFn
 */
export type ITransformFn = (component: IComponent, output: IStruct) => Promise<IStruct>;

/**
 * @fileoverview Infrastructure template models and configuration interfaces
 * @description Defines components, templates, and configuration structures for infrastructure deployment
 * @author MongoDB Solutions Assurance Team
 * @since 4.0.0
 * @version 4.0.0
 */

/**
 * Component output data type
 * @typedef {any} IComponentOutput
 */
export type IComponentOutput = any;

/**
 * Component input data type
 * @typedef {any} IComponentInput
 */
export type IComponentInput = any;

/**
 * Deployment execution mode type
 * @typedef {"sync" | "async"} IDeploymentMode
 */
export type IDeploymentMode = "sync" | "async";

/**
 * @interface IComponent
 * @description Infrastructure component configuration interface
 */
export interface IComponent {
    /**
     * Unique component identifier
     * @type {string}
     */
    name: string;

    /**
     * Component description
     * @type {string}
     */
    description?: string;

    /**
     * Component version
     * @type {string}
     */
    version?: string;

    /**
     * Engine requirements
     * @type {string}
     */
    engine?: string;

    /**
     * Expected component output
     * @type {IComponentOutput}
     */
    output?: IComponentOutput;

    /**
     * Required input parameters
     * @type {IComponentInput}
     */
    input?: IComponentInput;

    /**
     * Configuration parameters
     * @type {any}
     */
    setup?: any;

    /**
     * Additional custom properties
     * @type {any}
     */
    [key: string]: any;
}

/**
 * @interface ITemplate
 * @description Infrastructure template definition interface
 */
export interface ITemplate {
    /**
     * Template name
     * @type {string}
     */
    name: string;

    /**
     * Template description
     * @type {string}
     */
    description?: string;

    /**
     * Template version
     * @type {string}
     */
    version?: string;

    /**
     * Engine requirements
     * @type {string}
     */
    engine?: string;

    /**
     * Release stability level
     * @type {string}
     */
    release?: string;

    /**
     * Deployment execution mode
     * @type {IDeploymentMode}
     */
    deploymentMode?: IDeploymentMode;

    /**
     * Array of infrastructure components
     * @type {IComponent[]}
     */
    components: IComponent[];
}

/**
 * @interface ITemplateConfig
 * @description Template storage configuration interface
 */
export interface ITemplateConfig {
    /**
     * Storage backend type
     * @type {string}
     * @description Supported types: MDB, File
     */
    type: string;

    /**
     * MongoDB storage configuration
     * @type {Object}
     */
    mdb?: {
        /**
         * MongoDB integration enabled flag
         * @type {boolean}
         */
        enabled: boolean;

        /**
         * Database name
         * @type {string}
         */
        database: string;

        /**
         * Collection name
         * @type {string}
         */
        collection: string;

        /**
         * Connection URI reference
         * @type {string}
         */
        uri: string;
    };

    /**
     * File system storage configuration
     * @type {Object}
     */
    file?: {
        /**
         * Templates directory path
         * @type {string}
         */
        path: string;
    };
}
