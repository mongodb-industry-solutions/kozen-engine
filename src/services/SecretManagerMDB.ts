/**
 * @fileoverview MongoDB Secret Manager Service - MongoDB Implementation with Encryption Support
 * @description MongoDB-specific implementation of secret management with Client-Side Field Level Encryption support
 * @author MDB SAT
 * @since 1.0.4
 * @version 1.0.5
 */
import { ClientEncryption, ClientEncryptionOptions, KMSProviders, MongoClient } from "mongodb";
import { ISecretManagerOptions } from "../models/Secret";
import { VCategory } from "../models/Types";
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
    protected client: MongoClient | null = null;

    /**
     * Client-Side Field Level Encryption instance
     * @private
     * @type {ClientEncryption | null}
     */
    protected encryption: ClientEncryption | null = null;

    /**
     * KMS providers configuration for encryption operations
     * @private
     * @type {Object | null}
     */
    protected kmsProviders: KMSProviders | null = null;

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
            options && (this.options = { ...this.options, ...options });
            const { mdb } = this.options;
            if (!mdb) {
                throw new Error("MongoDB configuration is missing in SecretManager options.");
            }

            // Load MongoDB client
            const client = await this.initClient(this.options);

            // Get collection
            const collection = client!.db(mdb.database).collection(mdb.collection);

            // Query the secret document by key
            const secretDocument = await collection.findOne({ key });
            if (!secretDocument) {
                this.logger?.warn({
                    flow: options?.flow,
                    category: VCategory.core.secret,
                    src: 'Service:Secret:MDB:resolve',
                    message: `Secret '${key}' not found in MongoDB collection: '${mdb.collection}'.`
                });
                return null;
            }

            // Decrypt the encrypted value if applicable
            let resolvedValue = secretDocument.value;
            if (secretDocument.encrypted && this.encryption) {
                resolvedValue = await this.encryption.decrypt(resolvedValue);
            }

            return resolvedValue;
        } catch (error) {
            this.logger?.error({
                flow: options?.flow,
                category: VCategory.core.secret,
                src: 'Service:Secret:MDB:resolve',
                message: `Failed to retrieve secret '${key}' from MongoDB Secrets Manager. ${(error as Error).message}`
            });
            throw error;
        }
    }

    /**
     * Resolves a secret value from MongoDB with optional decryption
     * @public
     * @param {string} key - The secret key to search for in the MongoDB collection
     * @param {ISecretManagerOptions} [options] - Optional configuration override
     * @returns {Promise<string | null | undefined | number | boolean>} Promise resolving to the decrypted secret value
     * @throws {Error} When secret resolution fails
     */
    public async save(key: string, value: string, options?: ISecretManagerOptions): Promise<boolean> {
        try {
            options && (this.options = { ...this.options, ...options });
            const { mdb } = this.options;
            if (!mdb) {
                throw new Error("MongoDB configuration is missing in SecretManager options.");
            }

            // Load MongoDB client
            const client = await this.initClient(this.options);

            // Get collection
            const collection = client!.db(mdb.database).collection(mdb.collection);

            // Query the secret document by key
            const secretDocument = await collection.findOne({ key });
            if (!secretDocument) {
                this.logger?.warn({
                    flow: options?.flow,
                    category: VCategory.core.secret,
                    src: 'Service:Secret:MDB:resolve',
                    message: `Secret '${key}' not found in MongoDB collection: '${mdb.collection}'.`
                });
                return false;
            }

            // Decrypt the encrypted value if applicable
            let resolvedValue = secretDocument.value;
            if (secretDocument.encrypted && this.encryption) {
                resolvedValue = await this.encryption.decrypt(resolvedValue);
            }

            return resolvedValue;
        } catch (error) {
            this.logger?.error({
                flow: options?.flow,
                category: VCategory.core.secret,
                src: 'Service:Secret:MDB:resolve',
                message: `Failed to retrieve secret '${key}' from MongoDB Secrets Manager. ${(error as Error).message}`
            });
            throw error;
        }
    }

    /**
     * Initializes MongoDB client and Client-Side Field Level Encryption configuration
     * @private
     * @returns {Promise<void>} Promise that resolves when initialization is complete
     * @throws {Error} When MongoDB connection fails or encryption setup encounters errors
     */
    protected async initClient(options?: ISecretManagerOptions): Promise<MongoClient> {
        const { mdb } = options || this.options;

        if (!mdb?.uri) {
            throw new Error("The MongoDB URI is required to initialize the MongoDB Secrets Manager.");
        }

        if (!this.assistant) {
            throw new Error("Incorrect dependency injection configuration.");
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
            this.encryption = new ClientEncryption(this.client, this.getOptions(options));
        }

        return this.client;
    }

    /**
     * Initializes KMS providers configuration for Client-Side Field Level Encryption support
     * @private
     * @returns void
     * @description Sets up local and AWS KMS providers for encryption operations based on environment variables and configuration
     */
    protected getKmsProviders(options?: ISecretManagerOptions): KMSProviders {
        const { cloud, mdb } = options || this.options || {};
        const localMasterKeyBase64 = process.env.LOCAL_MASTER_KEY;

        const kmsProviders: KMSProviders = {
            local: {
                key: Buffer.from(localMasterKeyBase64 || "*-*", "base64")
            }
        };

        if (cloud?.accessKeyId && cloud?.secretAccessKey && mdb?.secretSource === 'cloud') {
            kmsProviders["aws"] = {
                accessKeyId: cloud.accessKeyId,
                secretAccessKey: cloud.secretAccessKey,
            };
        }

        return kmsProviders;
    }

    protected getOptions(options?: ISecretManagerOptions): ClientEncryptionOptions {
        const { mdb } = options || this.options || {};
        return {
            kmsProviders: this.getKmsProviders(options),
            keyVaultNamespace: `${mdb?.database || 'db'}.keyVault`
        }
    }

    /**
     * Closes active MongoDB connection and resets encryption context
     * @public
     * @returns {Promise<void>} Promise that resolves when cleanup is complete
     */
    public async close(): Promise<void> {
        if (this.client) {
            await this.client.close();
            this.client = null;
        }
        this.encryption = null;
    }
}

export default SecretManagerMDB;
