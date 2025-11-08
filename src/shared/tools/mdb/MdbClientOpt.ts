export interface IMdbClientOpt {
    /**
     * MongoDB integration enabled flag for secret storage
     * @type {boolean}
     */
    enabled?: boolean;

    /**
     * Database name for secret storage operations
     * @type {string}
     */
    database?: string;

    /**
     * Collection name for secret document storage
     * @type {string}
     */
    collection?: string;

    /**
     * Connection URI reference for MongoDB authentication
     * @type {string}
     */
    uri?: string;

    /**
     * Secret source strategy for encryption key management
     * @type {string}
     * Supported strategies: cloud, local
     */
    source?: string;

    /**
     * Key alternative name for encryption key identification
     * @type {string}
     */
    keyAltName?: string;

    /**
     * Encryption algorithm for secret protection operations
     * @type {string}
     */
    algorithm?: string;

    /**
     * Master key reference for encryption operations
     * @type {string}
     */
    key?: string;
}


export interface IMdbClientOpts {
    mdb: IMdbClientOpt;
    [key: string]: any;
}