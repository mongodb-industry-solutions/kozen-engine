/**
 * @fileoverview MongoDB Secret Manager Service - MongoDB Implementation with Encryption Support
 * MongoDB-specific implementation of secret management with Client-Side Field Level Encryption (CSFLE) support
 * @author MDB SAT
 * @since 1.0.4
 * @version 1.0.6
 */

import { ClientEncryption, KMSProviders, MongoClient } from "mongodb";
import { IIoC } from "../ioc";
import { ILogger } from "../log/types";
import { IMdbClientOpt, IMdbClientOpts } from "./MdbClientOpt";

/**
 * @class ReportManagerMDB
 * @extends ReportManager
 * MongoDB implementation with Client-Side Field Level Encryption (CSFLE) support
 */
export class MdbClient {
    protected assistant?: IIoC | null;

    /**
     * Logger service instance for recording service operations and errors
     * @type {ILogger | null}
     */
    public logger?: ILogger | null;

    /**
     * report manager configuration options
     * @protected
     * @type {IMdbCl | undefined}
     */
    protected _options?: IMdbClientOpts;

    /**
     * Gets the current report manager configuration options
     * @public
     * @readonly
     * @type {IMdbClientOpt}
     * @returns {IMdbClientOpt} The current report manager configuration
     * @throws {Error} When configuration is not initialized
     */
    get options(): IMdbClientOpts {
        return this._options!;
    }

    /**
     * MongoDB client instance used for database operations
     * @private
     * @type {MongoClient | null}
     */
    protected client: MongoClient | null = null;

    /**
     * Client-Side Field Level Encryption instance used for encryption and decryption
     * @private
     * @type {ClientEncryption | null}
     */
    protected encryption: ClientEncryption | null = null;

    /**
     * KMS providers configuration for encryption operations
     * @private
     * @type {KMSProviders | null}
     */
    protected kmsProviders: KMSProviders | null = null;


    /**
     * Initializes the MongoDB client and encryption settings.
     * @private
     * @param {IMdbClientOpt} [options] - MongoDB options for configuration.
     * @returns {Promise<MongoClient>} Promise resolving the MongoDB client instance.
     * @throws {Error} If MongoDB connection or encryption setup fails.
     */
    protected async initClient(options?: IMdbClientOpts): Promise<MongoClient> {
        const { mdb } = options || this.options;

        if (!mdb?.uri) {
            throw new Error("The MongoDB URI is required to initialize the MongoDB Secrets Manager.");
        }

        const uri = process.env[mdb.uri] as string;

        // Initialize MongoDB client if not done already
        if (!this.client) {
            this.client = new MongoClient(uri);
            await this.client.connect();
        }

        return this.client;
    }

    /**
     * Closes the active MongoDB connection and resets encryption context.
     * @public
     * @returns {Promise<void>} Promise resolving when cleanup is complete.
     */
    public async close(): Promise<void> {
        if (this.client) {
            await this.client.close();
            this.client = null;
        }
        this.encryption = null;
    }
}

export default MdbClient;
