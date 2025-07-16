/**
 * @fileoverview Secret management configuration models
 * @description Defines interfaces for secure secret storage and retrieval configuration
 * @author MongoDB Solutions Assurance Team
 * @since 4.0.0
 * @version 4.0.0
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