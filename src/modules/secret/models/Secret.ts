/**
 * @fileoverview Secret management configuration models
 * Defines interfaces for secure secret storage and retrieval configuration
 * @author MDB SAT
 * @since 1.0.4
 * @version 1.0.5
 */

import { Binary } from "mongodb";
import { ICLIArgs } from "../../../shared/models/Types";
import { IMdbClientOpt } from "../../../shared/tools/mdb/MdbClientOpt";

/**
 * Configuration interface for secret management backend
 * @interface ISecretManagerOptions
 */
export interface ISecretManagerOptions {
    /**
     * Flow identifier for tracking and logging secret operations
     * @type {string}
     */
    flow?: string;

    /**
     * Secret backend type for storage and retrieval operations
     * @type {string}
     * Supported backends: AWS, MDB, ENV
     */
    type?: string;

    /**
     * Cloud provider authentication settings for AWS integration
     * @type {Object}
     */
    cloud?: {
        /**
         * Cloud region for AWS services configuration
         * @type {string}
         */
        region?: string;

        /**
         * Access key identifier for AWS authentication
         * @type {string}
         */
        accessKeyId?: string;

        /**
         * Secret access key for AWS authentication
         * @type {string}
         */
        secretAccessKey?: string;
    };

    /**
     * MongoDB storage configuration for encrypted secret management
     * @type {Object}
     */
    mdb?: IMdbClientOpt;
}

/**
 * Secret manager interface defining storage and retrieval operations
 * @interface ISecretManager
 */
export interface ISecretManager {

    /**
     * Secret manager configuration options for backend operations
     * @type {ISecretManagerOptions}
     */
    options: ISecretManagerOptions;

    /**
     * Resolves a secret value from the configured backend
     * @param {string} key - The secret key to resolve
     * @param {ISecretManagerOptions} [options] - Optional configuration override
     * @returns {Promise<string | null | undefined | number | boolean>} Promise resolving to the secret value
     * @throws {Error} When secret resolution fails
     */
    resolve(key: string, options?: ISecretManagerOptions): Promise<string | null | undefined | number | boolean>;

    /**
     * Saves a secret value to the configured backend storage
     * @param {string} key - The secret key to store
     * @param {string | Binary} value - The secret value to store
     * @param {ISecretManagerOptions} [options] - Optional configuration override
     * @returns {Promise<boolean>} Promise resolving to true if save operation succeeds
     * @throws {Error} When secret storage fails
     */
    save(key: string, value: string | Binary, options?: ISecretManagerOptions): Promise<boolean>;
}

/**
 * Secret management CLI arguments interface
 * @interface ISecretArgs
 * @extends ICLIArgs
 */
export interface ISecretArgs extends ICLIArgs {
    /**
     * Secret key identifier for storage and retrieval operations
     * @type {string}
     */
    key?: string;

    /**
     * Secret value content for storage operations
     * @type {string}
     */
    value?: string;
}