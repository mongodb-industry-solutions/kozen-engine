import { IStackOptions } from "../../pipeline/models/Stack";

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
    flow?: string;

    /**
     * Storage backend type
     * @type {string}
     * @description Supported types: MDB, File
     */
    type?: string;

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

/**
 * @interface ITemplateArgs
 * @description Command line arguments interface for template management operations.
 * Extends base CLI arguments with template-specific options for operations like load, save, and list.
 */
export interface ITemplateArgs {
    /**
     * Action to perform on templates
     * @type {string}
     */
    action: string;

    /**
     * Template name/identifier
     * @type {string}
     */
    name?: string;

    /**
     * Template content for save operations (JSON string or file path)
     * @type {string}
     */
    content?: string;

    /**
     * File path to read template content from
     * @type {string}
     */
    file?: string;

    /**
     * Template storage configuration override
     * @type {string}
     */
    storage?: string;

    /**
     * Output format for template operations (json, yaml, etc.)
     * @type {string}
     */
    format?: string;

    /**
     * Stack/environment identifier
     * @type {string}
     */
    stack?: string;

    /**
     * Project identifier
     * @type {string}
     */
    project?: string;

    /**
     * Configuration file path
     * @type {string}
     */
    config?: string;
}

/**
 * @interface ITemplateManager
 * @description Template manager interface defining operations for template storage and retrieval.
 * Provides a unified interface for different template storage backends (file system, MongoDB, etc.).
 */
export interface ITemplateManager {
    /**
     * Template configuration options for storage backend settings
     * @type {ITemplateConfig}
     */
    options: ITemplateConfig;

    /**
     * Loads a template from the configured storage backend
     * @template T - The expected type of the loaded template
     * @param {string} templateName - Name of the template to load
     * @param {ITemplateConfig} [options] - Optional configuration override for this operation
     * @returns {Promise<T>} Promise resolving to the loaded template data
     * @throws {Error} When template loading fails due to configuration issues, network problems, or missing templates
     */
    load<T = any>(templateName: string, options?: ITemplateConfig): Promise<T>;

    /**
     * Saves a template to the configured storage backend
     * @template T - The type of the template content to save
     * @param {string} templateName - Name of the template to save
     * @param {T} content - Template content to persist
     * @param {ITemplateConfig} [options] - Optional configuration override for this operation
     * @returns {Promise<boolean>} Promise resolving to true if save operation succeeds, false otherwise
     * @throws {Error} When template saving fails due to configuration issues, network problems, or storage errors
     */
    save<T = any>(templateName: string, content: T, options?: ITemplateConfig): Promise<boolean>;

    /**
     * Deletes a template from the configured storage backend
     * @param {string} templateName - Name of the template to delete
     * @param {ITemplateConfig} [options] - Optional configuration override for this operation
     * @returns {Promise<boolean>} Promise resolving to true if delete operation succeeds, false otherwise
     * @throws {Error} When template deletion fails due to configuration issues, network problems, or storage errors
     */
    delete(templateName: string, options?: ITemplateConfig): Promise<boolean>;

    /**
     * Lists available templates from the configured storage backend
     * @param {ITemplateConfig} [options] - Optional configuration override for this operation
     * @returns {Promise<string[]>} Promise resolving to array of template names
     * @throws {Error} When template listing fails due to configuration issues, network problems, or storage errors
     */
    list(options?: ITemplateConfig): Promise<string[]>;
}  
