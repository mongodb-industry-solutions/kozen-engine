/**
 * @fileoverview MongoDB Secret Manager Service - MongoDB Implementation with Encryption Support
 * @description MongoDB-specific implementation of secret management with Client-Side Field Level Encryption (CSFLE) support
 * @author MDB SAT
 * @since 1.0.4
 * @version 1.0.6
 */

import { Binary, ClientEncryption, ClientEncryptionEncryptOptions, ClientEncryptionOptions, KMSProviders, MongoClient } from "mongodb";
import { ISecretManagerOptions } from "../models/Secret";
import { VCategory } from "../models/Types";
import SecretManager from "./SecretManager";

/**
 * @class SecretManagerMDB
 * @extends SecretManager
 * @description MongoDB implementation with Client-Side Field Level Encryption (CSFLE) support
 */
export class SecretManagerMDB extends SecretManager {
    /**
     * MongoDB client instance used for database operations.
     * @private
     * @type {MongoClient | null}
     */
    protected client: MongoClient | null = null;

    /**
     * Client-Side Field Level Encryption instance used for encryption and decryption.
     * @private
     * @type {ClientEncryption | null}
     */
    protected encryption: ClientEncryption | null = null;

    /**
     * KMS providers configuration for encryption operations.
     * @private
     * @type {KMSProviders | null}
     */
    protected kmsProviders: KMSProviders | null = null;

    /**
     * Resolves a secret value from MongoDB with optional decryption.
     * @public
     * @param {string} key - The secret key to search for in the MongoDB collection.
     * @param {ISecretManagerOptions} [options] - Optional configuration override.
     * @returns {Promise<string | null | number | boolean>} Promise resolving the decrypted secret value.
     * @throws {Error} When secret resolution fails.
     */
    public async resolve(
        key: string,
        options?: ISecretManagerOptions
    ): Promise<string | null | undefined | number | boolean> {
        try {
            options && (this.options = { ...this.options, ...options });
            const { mdb } = this.options;
            if (!mdb) {
                throw new Error("MongoDB configuration is missing in SecretManager options.");
            }

            // Initialize MongoDB client
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
     * Saves a secret value to MongoDB with optional encryption.
     * @public
     * @param {string} key - The secret key to store in the MongoDB collection.
     * @param {string} value - The secret value to store in the MongoDB collection.
     * @param {ISecretManagerOptions} [options] - Optional configuration override.
     * @returns {Promise<boolean>} Promise resolving to true if the secret is successfully saved.
     * @throws {Error} When secret storage fails.
     */
    public async save(key: string, value: string | Binary, options?: ISecretManagerOptions): Promise<boolean> {
        try {
            options && (this.options = { ...this.options, ...options });
            const { mdb } = this.options;
            if (!mdb) {
                throw new Error("MongoDB configuration is missing in SecretManager options.");
            }

            // Initialize MongoDB client
            const client = await this.initClient(this.options);

            // Get collection  
            const collection = client!.db(mdb.database).collection(mdb.collection);

            // Encrypt the value if necessary
            value = await this.encryption!.encrypt(value, {
                algorithm: mdb.algorithm as ClientEncryptionEncryptOptions['algorithm'] || 'AEAD_AES_256_CBC_HMAC_SHA_512-Random',
                keyId: await this.createDataKey(options)
            });

            // Insert or update the secret document
            const result = await collection.updateOne(
                { key },
                { $set: { value, encrypted: true } },
                { upsert: true }
            );

            return result.acknowledged;
        } catch (error) {
            this.logger?.error({
                flow: options?.flow,
                category: VCategory.core.secret,
                src: 'Service:Secret:MDB:save',
                message: `Failed to store secret '${key}' in MongoDB Secrets Manager. ${(error as Error).message}`
            });
            throw error;
        }
    }

    /**
     * Initializes the MongoDB client and encryption settings.
     * @private
     * @param {ISecretManagerOptions} [options] - MongoDB options for configuration.
     * @returns {Promise<MongoClient>} Promise resolving the MongoDB client instance.
     * @throws {Error} If MongoDB connection or encryption setup fails.
     */
    protected async initClient(options?: ISecretManagerOptions): Promise<MongoClient> {
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

        // Initialize Client-Side Field Level Encryption if necessary
        if (!this.encryption) {
            this.encryption = new ClientEncryption(this.client, this.getOptions(options));
        }

        return this.client;
    }

    protected async createDataKey(options?: ISecretManagerOptions) {
        const keyAltName = this.getKeyAlt(options);
        const collection = options?.mdb?.database && this.client!.db(options?.mdb.database).collection(options?.mdb.collection) as any;
        const existent = await collection?.findOne({ keyAltNames: keyAltName });

        // Create a data encryption key (DEK)
        const dekId = existent?.["_id"] || await this.encryption!.createDataKey('local', { keyAltNames: [keyAltName] });

        this.logger?.warn({
            flow: options?.flow,
            category: VCategory.core.secret,
            src: 'Service:Secret:MDB:createDataKey',
            message: 'Create Data Key',
            data: { dekId, keyAltName }
        });

        return dekId;
    }

    protected getKeyAlt(options?: ISecretManagerOptions) {
        const { mdb } = options || this.options;
        return mdb?.keyAltName || process.env.KOZEN_SM_ALT || `${mdb?.database || 'db'}-${mdb?.collection || 'co'}.alt`;
    }

    protected getkeyVaultNamespace(options?: ISecretManagerOptions) {
        const { mdb } = options || this.options;
        return `${mdb?.database || 'db'}.${mdb?.collection || 'keyVault'}`;
    }

    /**
     * Retrieves the KMS providers configuration for encryption.
     * @protected
     * @param {ISecretManagerOptions} [options] - Configuration options.
     * @returns {KMSProviders} The KMS providers configuration.
     */
    protected getKmsProviders(options?: ISecretManagerOptions): KMSProviders {
        const { cloud, mdb } = options || this.options || {};
        const localMasterKeyBase64 = process.env[mdb?.key || 'MDB_MASTER_KEY'] || this.getLocalKey();
        const kmsProviders: KMSProviders = {
            local: {
                key: Buffer.from(localMasterKeyBase64, "base64")
            }
        };

        if (cloud?.accessKeyId && cloud?.secretAccessKey && mdb?.source === 'cloud') {
            kmsProviders["aws"] = {
                accessKeyId: cloud.accessKeyId,
                secretAccessKey: cloud.secretAccessKey,
            };
        }

        return kmsProviders;
    }

    protected getLocalKey() {
        const crypto = require('crypto');
        // Generate a 96-byte random key
        const localMasterKey = crypto.randomBytes(96);
        // Encode the key in Base64 format
        return localMasterKey.toString('base64');
    }

    /**
     * Retrieves the encryption configuration options.
     * @protected
     * @param {ISecretManagerOptions} [options] - Configuration options.
     * @returns {ClientEncryptionOptions} The encryption configuration options.
     */
    protected getOptions(options?: ISecretManagerOptions): ClientEncryptionOptions {
        return {
            kmsProviders: this.getKmsProviders(options),
            keyVaultNamespace: this.getkeyVaultNamespace(options)
        };
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

export default SecretManagerMDB;
