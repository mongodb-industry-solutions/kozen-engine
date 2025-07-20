/**
 * @fileoverview MongoDB Template Manager Service - MongoDB Implementation
 * @description MongoDB-specific implementation for loading infrastructure templates from MongoDB collections
 * @author MDB SAT
 * @since 1.0.4
 * @version 1.0.5
 */
import { MongoClient } from "mongodb";
import { ISecretManager } from "../models/Secret";
import { ITemplateConfig } from "../models/Template";
import TemplateManager from "./TemplateManager";

/**
 * @class TemplateManagerMDB
 * @extends TemplateManager
 * @description MongoDB implementation for template loading with secure URI resolution and connection management
 */
export class TemplateManagerMDB extends TemplateManager {

    /**
     * MongoDB client instance for database operations
     * @private
     * @type {MongoClient | null}
     */
    private client: MongoClient | null = null;

    /**
     * Loads a template from MongoDB collection by name
     * @public
     * @template T - The expected type of the loaded template
     * @param {string} templateName - The name of the template document to retrieve
     * @param {ITemplateConfig} [options] - Optional configuration override
     * @returns {Promise<T>} Promise resolving to the loaded template object
     * @throws {Error} When template loading fails
     */
    async load<T = any>(templateName: string, options?: ITemplateConfig): Promise<T> {
        try {
            if (!this.assistant) {
                throw new Error("Incorrect dependency injection configuration.");
            }

            const secret = await this.assistant.resolve<ISecretManager>(`SecretManager`) || null;
            // Use provided options or fallback to the default options
            options = options || this.options;

            if (!options?.mdb || !secret) {
                throw new Error("MongoDB configuration is missing or the secret manager is invalid.");
            }

            const { uri: uriKey, database, collection } = options.mdb;
            const uri = await secret.resolve(uriKey) as string;

            // Ensure MongoClient is initialized
            await this.initializeClient(uri);

            if (!this.client) {
                throw new Error("Failed to connect to MongoDB.");
            }

            const db = this.client.db(database);
            const templatesCollection = db.collection(collection);

            // Query the template by name
            const template = await templatesCollection.findOne({ name: templateName });

            if (!template) {
                throw new Error(`Template not found: ${templateName}`);
            }

            return template as T;
        } catch (error) {
            const errorMessage = (error instanceof Error) ? error.message : String(error);
            throw new Error(`Error loading template '${templateName}': ${errorMessage}`);
        }
    }

    /**
     * Initializes MongoDB client connection if not already established
     * @private
     * @param {string} uri - MongoDB connection URI string
     * @returns {Promise<void>} Promise that resolves when connection is established
     * @throws {Error} When MongoDB connection fails
     */
    private async initializeClient(uri: string): Promise<void> {
        if (!this.client) {
            this.client = new MongoClient(uri);
            await this.client.connect();
        }
    }

    /**
     * Closes active MongoDB connection and cleans up resources
     * @public
     * @returns {Promise<void>} Promise that resolves when connection cleanup is complete
     */
    async closeConnection(): Promise<void> {
        if (this.client) {
            await this.client.close();
            this.client = null;
        }
    }
}

export default TemplateManagerMDB;
