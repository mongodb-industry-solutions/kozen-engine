/**
 * @fileoverview MongoDB Secret Manager Service - MongoDB Implementation with Encryption Support
 * @description MongoDB-specific implementation of secret management with Client-Side Field Level Encryption support
 * @author MDB SAT
 * @since 4.0.0
 * @version 4.0.0
 */
import { ClientEncryption, MongoClient } from "mongodb";
import { ISecretManagerOptions } from "../models/Secret";
import SecretManager from "./SecretManager";

/**
 * @class SecretManagerMDB
 * @extends SecretManager
 * @description MongoDB implementation with Client-Side Field Level Encryption support
 */
export class SecretManagerMDB extends SecretManager {
    /**
     * MongoDB client instance for database operations
     * @private
     * @type {MongoClient | null}
     */
    private client: MongoClient | null = null;

    /**
     * Client-Side Field Level Encryption instance
     * @private
     * @type {ClientEncryption | null}
     */
    private encryption: ClientEncryption | null = null;

    /**
     * KMS providers configuration for encryption operations
     * @private
     * @type {Object | null}
     */
    private kmsProviders: { [key: string]: any } | null = null;

    /**
     * Resolves a secret value from MongoDB with optional decryption
     * @public
     * @param {string} key - The secret key to search for in the MongoDB collection
     * @param {ISecretManagerOptions} [options] - Optional configuration override
     * @returns {Promise<string | null | undefined | number | boolean>} Promise resolving to the decrypted secret value
     * @throws {Error} When secret resolution fails
     */
    public async resolve(key: string, options?: ISecretManagerOptions): Promise<string | null | undefined | number | boolean> {
        try {
            this.initializeKmsProviders();
            await this.initializeClientAndEncryption();

            const { mdb } = options || this.options;
            if (!mdb) {
                throw new Error("MongoDB configuration is missing in SecretManager options.");
            }

            const collection = this.client!.db(mdb.database).collection(mdb.collection);

            // Query the secret document by key
            const secretDocument = await collection.findOne({ key });
            if (!secretDocument) {
                console.warn(`Secret '${key}' not found in MongoDB collection: '${mdb.collection}'.`);
                return null;
            }

            // Decrypt the encrypted value if applicable
            let resolvedValue = secretDocument.value;
            if (secretDocument.encrypted && this.encryption) {
                resolvedValue = await this.encryption.decrypt(resolvedValue);
            }

            return resolvedValue;
        } catch (error) {
            console.error(`Failed to resolve secret '${key}' from MongoDB.`, error);
            throw error;
        }
    }

    /**
     * Initializes MongoDB client and Client-Side Field Level Encryption configuration
     * @private
     * @returns {Promise<void>} Promise that resolves when initialization is complete
     * @throws {Error} When MongoDB connection fails or encryption setup encounters errors
     */
    private async initializeClientAndEncryption(): Promise<void> {
        const { mdb } = this.options;

        if (!mdb?.uri) {
            throw new Error("MongoDB URI is required to initialize SecretManagerMDB.");
        }

        const secret = await this.assistant.resolve<SecretManager>(`SecretManager`);
        const uri = await secret.resolve(mdb.uri) as string;

        // Initialize MongoDB client
        if (!this.client) {
            this.client = new MongoClient(uri);
            await this.client.connect();
        }

        // Initialize Client-Side Field Level Encryption (if necessary)
        if (!this.encryption) {
            const keyVaultNamespace = `${mdb.database}.keyVault`;

            this.encryption = new ClientEncryption(this.client, {
                kmsProviders: this.kmsProviders!,
                keyVaultNamespace,
            });
        }
    }

    /**
     * Initializes KMS providers configuration for Client-Side Field Level Encryption
     * @private
     * @returns {void}
     */
    private initializeKmsProviders(): void {
        const localMasterKeyBase64 = process.env.LOCAL_MASTER_KEY;
        this.kmsProviders = {
            local: {
                key: Buffer.from(localMasterKeyBase64 || "", "base64"), // Default to local key
            },
        };

        const { cloud, mdb } = this.options;
        if (cloud?.accessKeyId && cloud?.secretAccessKey && mdb?.secretSource === 'cloud') {
            this.kmsProviders["aws"] = {
                accessKeyId: cloud.accessKeyId,
                secretAccessKey: cloud.secretAccessKey,
            };
        }
    }

    /**
     * Closes active MongoDB connection and resets encryption context
     * @public
     * @returns {Promise<void>} Promise that resolves when cleanup is complete
     */
    public async closeConnection(): Promise<void> {
        if (this.client) {
            await this.client.close();
            this.client = null;
        }
        this.encryption = null;
    }
}

export default SecretManagerMDB;
