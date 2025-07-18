import { IStackOptions } from "./Stack";

/**
 * @fileoverview Infrastructure template models and configuration interfaces
 * @description Defines components, templates, and configuration structures for infrastructure deployment
 * @author MDB SAT
 * @since 4.0.0
 * @version 4.0.0
 */

/**
 * Deployment execution mode type
 * @typedef {"sync" | "async"} IDeploymentMode
 */
export type IDeploymentMode = "sync" | "async";

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
     * Stack configuration options for infrastructure deployment
     * @type {IStackOptions}
     */
    stack?: IStackOptions;
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
