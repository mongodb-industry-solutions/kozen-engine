/**
 * @fileoverview Pulumi stack configuration models for infrastructure management
 * @description Defines interfaces and types for Pulumi-based infrastructure stack operations
 * @author MongoDB Solutions Assurance Team
 * @since 4.0.0
 * @version 4.0.0
 */

import { ConfigMap } from "@pulumi/pulumi/automation";

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
export interface IStackOptions {
    /**
     * Stack description
     * @type {string}
     */
    description?: string;

    /**
     * Stack metadata tags
     * @type {Record<string, string>}
     */
    tags?: Record<string, string>;

    /**
     * Stack identifier
     * @type {string}
     */
    name?: string;

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
    setup?: ISetupFn;

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
    config?: Record<string, any>;
}