/**
 * @fileoverview MongoDB Template Manager Service - MongoDB Implementation
 * MongoDB-specific implementation for loading and saving infrastructure templates 
 * from MongoDB collections with secure connections and metadata management.
 * 
 * @author MongoDB Solution Assurance Team (SAT)
 * @since 1.0.4
 * @version 1.1.0
 */
import { MongoClient } from "mongodb";
import { VCategory } from "../../../shared/models/Types";
import { ISecretManager } from "../../secret/models/Secret";
import { ITemplateConfig } from "../models/Template";
import TemplateManager from "./TemplateManager";

/**
 * @class TemplateManagerMDB
 * @extends TemplateManager
 * @description MongoDB implementation for template operations with secure URI resolution, 
 * connection management, and comprehensive upsert operations.
 * 
 * This implementation provides:
 * - Secure MongoDB connection with URI resolution through SecretManager
 * - Template loading with document queries
 * - Upsert operations for template persistence
 * - Automatic metadata enrichment (timestamps, versioning)
 * - Connection pooling and cleanup
 * - Comprehensive error handling and logging
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

            const secret = await this.assistant.resolve<ISecretManager>(`secret:manager`) || null;
            // Use provided options or fallback to the default options
            options = options || this.options;

            if (!options?.mdb || !secret) {
                throw new Error("MongoDB configuration is missing or the secret manager is invalid.");
            }

            const { uri: uriKey, database, collection } = options.mdb;
            const uri = await secret.resolve(uriKey, { flow: options.flow }) as string;

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

    /**
     * Saves a template to MongoDB collection with upsert operation and metadata enrichment
     * @public
     * @template T - The type of the template content to save
     * @param {string} templateName - The name of the template document to save/update
     * @param {T} content - Template content to persist in MongoDB
     * @param {ITemplateConfig} [options] - Optional configuration override
     * @returns {Promise<boolean>} Promise resolving to true if save operation succeeds, false otherwise
     * @throws {Error} When template saving fails due to configuration, connection, or database errors
     */
    public async save<T = any>(templateName: string, content: T, options?: ITemplateConfig): Promise<boolean> {
        try {
            if (!this.assistant) {
                throw new Error("Incorrect dependency injection configuration.");
            }

            const secret = await this.assistant.resolve<ISecretManager>(`secret:manager`) || null;
            // Use provided options or fallback to the default options
            options = options || this.options;

            if (!options?.mdb || !secret) {
                throw new Error("MongoDB configuration is missing or the secret manager is invalid.");
            }

            const { uri: uriKey, database, collection } = options.mdb;
            const uri = await secret.resolve(uriKey, { flow: options.flow }) as string;

            // Ensure MongoClient is initialized
            await this.initializeClient(uri);

            if (!this.client) {
                throw new Error("Failed to connect to MongoDB.");
            }

            const db = this.client.db(database);
            const templateCollection = db.collection(collection);

            // Prepare template document with metadata
            const templateDocument = {
                ...content,
                name: templateName,
                lastModified: new Date(),
                version: (content as any)?.version || '1.0.0',
                createdAt: new Date() // Will be ignored on update due to $setOnInsert
            };

            // Use upsert with $set for updates and $setOnInsert for creation-only fields
            const result = await templateCollection.updateOne(
                { name: templateName },
                {
                    $set: {
                        ...content,
                        name: templateName,
                        lastModified: new Date(),
                        version: (content as any)?.version || '1.0.0'
                    },
                    $setOnInsert: {
                        createdAt: new Date()
                    }
                },
                { upsert: true }
            );

            this.logger?.info({
                flow: options?.flow,
                category: VCategory.core.template,
                src: 'Service:TemplateManagerMDB:save',
                message: result.upsertedCount > 0
                    ? `Template '${templateName}' created successfully in MongoDB`
                    : `Template '${templateName}' updated successfully in MongoDB`,
                data: {
                    templateName,
                    matchedCount: result.matchedCount,
                    modifiedCount: result.modifiedCount,
                    upsertedCount: result.upsertedCount,
                    acknowledged: result.acknowledged
                }
            });

            return result.acknowledged;

        } catch (error) {
            this.logger?.error({
                flow: options?.flow,
                category: VCategory.core.template,
                src: 'Service:TemplateManagerMDB:save',
                message: `Failed to save template '${templateName}' in MongoDB: ${(error as Error).message}`,
                data: { templateName, error: (error as Error).message }
            });
            throw new Error(`Failed to save template '${templateName}' to MongoDB: ${(error as Error).message}`);
        }
    }

    /**
     * Deletes a template from MongoDB collection by name
     * @public
     * @param {string} templateName - The name of the template document to delete
     * @param {ITemplateConfig} [options] - Optional configuration override
     * @returns {Promise<boolean>} Promise resolving to true if delete operation succeeds, false otherwise
     * @throws {Error} When template deletion fails due to configuration, connection, or database errors
     */
    public async delete(templateName: string, options?: ITemplateConfig): Promise<boolean> {
        try {
            if (!this.assistant) {
                throw new Error("Incorrect dependency injection configuration.");
            }

            const secret = await this.assistant.resolve<ISecretManager>(`secret:manager`) || null;
            // Use provided options or fallback to the default options
            options = options || this.options;

            if (!options?.mdb || !secret) {
                throw new Error("MongoDB configuration is missing or the secret manager is invalid.");
            }

            const { uri: uriKey, database, collection } = options.mdb;
            const uri = await secret.resolve(uriKey, { flow: options.flow }) as string;

            // Ensure MongoClient is initialized
            await this.initializeClient(uri);

            if (!this.client) {
                throw new Error("Failed to connect to MongoDB.");
            }

            const db = this.client.db(database);
            const templateCollection = db.collection(collection);

            // Delete the template document
            const result = await templateCollection.deleteOne({ name: templateName });

            this.logger?.info({
                flow: options?.flow,
                category: VCategory.core.template,
                src: 'Service:TemplateManagerMDB:delete',
                message: result.deletedCount > 0
                    ? `Template '${templateName}' deleted successfully from MongoDB`
                    : `Template '${templateName}' not found in MongoDB`,
                data: {
                    templateName,
                    deletedCount: result.deletedCount,
                    acknowledged: result.acknowledged
                }
            });

            return result.acknowledged && result.deletedCount > 0;

        } catch (error) {
            this.logger?.error({
                flow: options?.flow,
                category: VCategory.core.template,
                src: 'Service:TemplateManagerMDB:delete',
                message: `Failed to delete template '${templateName}' from MongoDB: ${(error as Error).message}`,
                data: { templateName, error: (error as Error).message }
            });
            throw new Error(`Failed to delete template '${templateName}' from MongoDB: ${(error as Error).message}`);
        }
    }

    /**
     * Lists all available templates from MongoDB collection
     * @public
     * @param {ITemplateConfig} [options] - Optional configuration override
     * @returns {Promise<string[]>} Promise resolving to array of template names
     * @throws {Error} When template listing fails due to configuration, connection, or database errors
     */
    public async list(options?: ITemplateConfig): Promise<string[]> {
        try {
            if (!this.assistant) {
                throw new Error("Incorrect dependency injection configuration.");
            }

            const secret = await this.assistant.resolve<ISecretManager>(`secret:manager`) || null;
            // Use provided options or fallback to the default options
            options = options || this.options;

            if (!options?.mdb || !secret) {
                throw new Error("MongoDB configuration is missing or the secret manager is invalid.");
            }

            const { uri: uriKey, database, collection } = options.mdb;
            const uri = await secret.resolve(uriKey, { flow: options.flow }) as string;

            // Ensure MongoClient is initialized
            await this.initializeClient(uri);

            if (!this.client) {
                throw new Error("Failed to connect to MongoDB.");
            }

            const db = this.client.db(database);
            const templateCollection = db.collection(collection);

            // Query all templates and return only the names
            const templates = await templateCollection
                .find({}, { projection: { name: 1, _id: 0 } })
                .sort({ name: 1 })
                .toArray();

            const templateNames = templates
                .map(template => template.name)
                .filter(name => name); // Filter out any null/undefined names

            this.logger?.info({
                flow: options?.flow,
                category: VCategory.core.template,
                src: 'Service:TemplateManagerMDB:list',
                message: `Retrieved ${templateNames.length} templates from MongoDB`,
                data: {
                    count: templateNames.length,
                    templates: templateNames.slice(0, 10) // Log first 10 for brevity
                }
            });

            return templateNames;

        } catch (error) {
            this.logger?.error({
                flow: options?.flow,
                category: VCategory.core.template,
                src: 'Service:TemplateManagerMDB:list',
                message: `Failed to list templates from MongoDB: ${(error as Error).message}`,
                data: { error: (error as Error).message }
            });
            throw new Error(`Failed to list templates from MongoDB: ${(error as Error).message}`);
        }
    }
}

export default TemplateManagerMDB;
