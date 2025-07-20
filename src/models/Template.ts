import { IStackOptions } from "./Stack";

/**
 * @fileoverview Infrastructure template models and configuration interfaces
 * @description Defines components, templates, and configuration structures for infrastructure deployment
 * @author MDB SAT
 * @since 1.0.4
 * @version 1.0.5
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

export interface ITemplateManager {
    /**
     * Sets the template configuration options.
     * @param {ITemplateConfig} value - Template configuration to set.
     */
    options: ITemplateConfig;

    /**
     * Loads a template from the configured storage backend.
     * @template T - The expected type of the loaded template.
     * @param {string} templateName - Name of the template to load.
     * @param {ITemplateConfig} [options] - Optional configuration override for this operation.
     * @returns {Promise<T>} Promise resolving to the loaded template data.
     * @throws {Error} When template loading fails due to configuration issues, network problems, or missing templates.
     */
    load<T = any>(templateName: string, options?: ITemplateConfig): Promise<T>;
}  
