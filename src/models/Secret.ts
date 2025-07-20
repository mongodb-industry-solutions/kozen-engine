/**
 * @fileoverview Secret management configuration models
 * @description Defines interfaces for secure secret storage and retrieval configuration
 * @author MDB SAT
 * @since 1.0.4
 * @version 1.0.5
 */

/**
 * @interface ISecretManagerOptions
 * @description Configuration interface for secret management backend
 */
export interface ISecretManagerOptions {
    /**
     * Secret backend type
     * @type {string}
     * @description Supported backends: AWS, MDB, ENV
     */
    type: string;

    /**
     * Cloud provider authentication settings
     * @type {Object}
     */
    cloud?: {
        /**
         * Cloud region
         * @type {string}
         */
        region?: string;

        /**
         * Access key identifier
         * @type {string}
         */
        accessKeyId?: string;

        /**
         * Secret access key
         * @type {string}
         */
        secretAccessKey?: string;
    };

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

        /**
         * Secret source strategy
         * @type {string}
         * @description Supported strategies: cloud, local
         */
        secretSource?: string;
    };
}

export interface ISecretManager {

    /**
     * The secret manager configuration options.
     * @param {ISecretManagerOptions} value - Secret manager configuration to set.
     */
    options: ISecretManagerOptions;

    /**
     * Resolves a secret value from the configured backend.
     * @param {string} key - The secret key to resolve.
     * @param {ISecretManagerOptions} [options] - Optional configuration override.
     * @returns {Promise<string | null | undefined | number | boolean>} Promise resolving to the secret value.
     * @throws {Error} When secret resolution fails.
     */
    resolve(key: string, options?: ISecretManagerOptions): Promise<string | null | undefined | number | boolean>;
}  
