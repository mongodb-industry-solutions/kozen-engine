import { ILoggerService } from "../models/Logger";
import { ITemplateConfig, ITemplateManager } from "../models/Template";
import { VCategory } from "../models/Types";
import { IIoC } from "../tools";
import { BaseService } from "./BaseService";

/**
 * @fileoverview Template Manager Service - Template Storage Bridge Component
 * Service that acts as a bridge between the pipeline's template processing logic
 * and various template storage backends (file system, MongoDB, remote repositories).
 * This service abstracts template loading operations and provides a unified interface
 * regardless of the underlying storage mechanism.
 * 
 * The TemplateManager implements a bridge pattern by delegating template operations to
 * specific storage implementations while maintaining a consistent interface for template
 * consumers. This enables switching between different template storage strategies without
 * modifying the core pipeline logic.
 * 
 * @class TemplateManager
 * @extends BaseService
 * @author MDB SAT
 * @since 1.0.4
 * @version 1.0.5
 * 
 * @example
 * ```typescript
 * // File-based template storage
 * const fileTemplateManager = new TemplateManager({
 *   type: 'File',
 *   file: { path: './templates' }
 * });
 * 
 * // MongoDB-based template storage
 * const mongoTemplateManager = new TemplateManager({
 *   type: 'MDB',
 *   mdb: {
 *     enabled: true,
 *     database: 'infrastructure',
 *     collection: 'templates',
 *     uri: 'mongodb://localhost:27017'
 *   }
 * });
 * 
 * // Load a template (storage type abstracted)
 * const template = await templateManager.load('atlas.basic');
 * ```
 */
export class TemplateManager extends BaseService implements TemplateManager {

    /**
     * Template configuration options
     * @protected
     * @type {ITemplateConfig | undefined}
     * Configuration object containing template storage settings and connection parameters.
     * This includes storage type, file paths, database connections, and other backend-specific options.
     */
    protected _options: ITemplateConfig | null;

    /**
     * Gets the current template configuration options
     * @public
     * @readonly
     * @type {ITemplateConfig}
     * @returns {ITemplateConfig} The current template configuration
     * @throws {Error} When configuration is not initialized
     * 
     * Returns the active template configuration including storage type and connection settings.
     * This configuration determines how templates are loaded and which storage backend is used.
     * 
     * @example
     * ```typescript
     * const config = templateManager.options;
     * console.log(`Storage type: ${config.type}`);
     * console.log(`Storage path: ${config.file?.path}`);
     * ```
     */
    get options(): ITemplateConfig {
        return this._options!;
    }

    /**
     * Sets the template configuration options
     * @public
     * @param {ITemplateConfig} value - Template configuration to set
     * 
     * Updates the template configuration settings. This allows dynamic
     * reconfiguration of storage backends and connection parameters at runtime.
     * 
     * @example
     * ```typescript
     * templateManager.options = {
     *   type: 'MDB',
     *   mdb: {
     *     enabled: true,
     *     database: 'templates',
     *     collection: 'infrastructure_templates',
     *     uri: process.env.MONGODB_URI
     *   }
     * };
     * ```
     */
    set options(value: ITemplateConfig) {
        this._options = value;
    }

    /**
     * Creates a new TemplateManager instance
     * @constructor
     * @param {ITemplateConfig} [options] - Optional template configuration
     * 
     * Initializes the template manager with the provided configuration.
     * The configuration determines which storage backend will be used for template operations.
     * If no configuration is provided, it must be set before calling load operations.
     * 
     * @example
     * ```typescript
     * // Create with file-based storage
     * const manager = new TemplateManager({
     *   type: 'File',
     *   file: { path: './infrastructure/templates' }
     * });
     * 
     * // Create without configuration (set later)
     * const manager = new TemplateManager();
     * manager.options = { type: 'File', file: { path: './templates' } };
     * ```
     */
    constructor(options?: ITemplateConfig | null, dep?: { assistant: IIoC, logger: ILoggerService }) {
        super(dep);
        this._options = options ?? null;
        this.prefix = "TemplateManager";
    }

    /**
     * Loads a template from the configured storage backend
     * @public
     * @template T - The expected type of the loaded template
     * @param {string} templateName - Name of the template to load
     * @param {ITemplateConfig} [options] - Optional configuration override for this operation
     * @returns {Promise<T>} Promise resolving to the loaded template data
     * @throws {Error} When template loading fails due to configuration issues, network problems, or missing templates
     * 
     * Loads a template from the configured storage backend by delegating to the appropriate
     * storage-specific implementation (TemplateManagerFile, TemplateManagerMDB, etc.).
     * This method implements the bridge pattern by providing a unified interface regardless
     * of the underlying storage mechanism.
     * 
     * The loading process:
     * 1. Validates that storage type is configured
     * 2. Resolves the appropriate storage-specific manager from IoC container
     * 3. Delegates the loading operation to the specific implementation
     * 4. Returns the loaded template data
     * 
     * @example
     * ```typescript
     * // Load a basic Atlas cluster template
     * const atlasTemplate = await templateManager.load<ITemplate>('atlas.basic');
     * 
     * // Load with custom configuration override
     * const template = await templateManager.load('custom.template', {
     *   type: 'File',
     *   file: { path: '/custom/template/path' }
     * });
     * 
     * // Use loaded template
     * console.log(`Template: ${atlasTemplate.name}`);
     * console.log(`Components: ${atlasTemplate.components.length}`);
     * ```
     */
    async load<T = any>(templateName: string, options?: ITemplateConfig): Promise<T> {
        if (!this.options?.type) {
            throw new Error("TemplateManager options or type is not defined.");
        }
        if (!this.assistant) {
            throw new Error("Incorrect dependency injection configuration.");
        }
        options = { ...this.options, ...options };
        const controllerName = this.prefix || '' + options.type;
        const controller = await this.getDelegate<ITemplateManager>(options.type || 'File');
        this.logger?.info({
            flow: options.flow,
            category: VCategory.core.template,
            src: 'Service:TemplateManager:load',
            message: 'Loading template',
            data: { controllerName, templateName }
        });
        const data = await controller.load<T>(templateName, options);
        return data;
    }

    /**
     * Saves a template to the configured storage backend by delegating to the appropriate
     * storage-specific implementation (TemplateManagerFile, TemplateManagerMDB, etc.).
     * This method implements the bridge pattern by providing a unified interface regardless
     * of the underlying storage mechanism.
     * @public
     * @template T - The type of the template content to save
     * @param {string} templateName - Name/identifier of the template to save
     * @param {T} content - Template content/data to persist (will be serialized appropriately)
     * @param {ITemplateConfig} [options] - Optional configuration override for this operation
     * @returns {Promise<boolean>} Promise resolving to true if save operation succeeds, false otherwise
     * @throws {Error} When template saving fails due to configuration issues, network problems, or storage errors
     */
    async save<T = any>(templateName: string, content: T, options?: ITemplateConfig): Promise<boolean> {
        if (!this.options?.type) {
            throw new Error("TemplateManager options or type is not defined.");
        }
        if (!this.assistant) {
            throw new Error("Incorrect dependency injection configuration.");
        }

        options = { ...this.options, ...options };
        const controllerName = this.prefix || '' + options.type;
        const controller = await this.getDelegate<ITemplateManager>(options.type || 'File');

        this.logger?.info({
            flow: options.flow,
            category: VCategory.core.template,
            src: 'Service:TemplateManager:save',
            message: 'Saving template',
            data: { controllerName, templateName, contentSize: JSON.stringify(content).length }
        });

        const result = await controller.save(templateName, content, options);

        this.logger?.info({
            flow: options.flow,
            category: VCategory.core.template,
            src: 'Service:TemplateManager:save',
            message: result ? 'Template saved successfully' : 'Template save failed',
            data: { controllerName, templateName, success: result }
        });

        return result;
    }

    /**
     * Deletes a template from the configured storage backend by delegating to the appropriate
     * storage-specific implementation (TemplateManagerFile, TemplateManagerMDB, etc.).
     * This method implements the bridge pattern by providing a unified interface regardless
     * of the underlying storage mechanism.
     * 
     * The deletion process:
     * 1. Validates that storage type is configured
     * 2. Resolves the appropriate storage-specific manager from IoC container
     * 3. Delegates the deletion operation to the specific implementation
     * 4. Logs the operation result and returns success status
     * 
     * @public
     * @param {string} templateName - Name/identifier of the template to delete
     * @param {ITemplateConfig} [options] - Optional configuration override for this operation
     * @returns {Promise<boolean>} Promise resolving to true if delete operation succeeds, false otherwise
     * @throws {Error} When template deletion fails due to configuration issues, network problems, or storage errors
     * 
     * @example
     * ```typescript
     * // Delete a template
     * const success = await templateManager.delete('atlas.basic');
     * 
     * // Delete with custom configuration override
     * const success = await templateManager.delete('custom.template', {
     *   type: 'MDB',
     *   mdb: { 
     *     database: 'templates', 
     *     collection: 'infrastructure',
     *     uri: 'MONGODB_URI_KEY'
     *   }
     * });
     * ```
     */
    async delete(templateName: string, options?: ITemplateConfig): Promise<boolean> {
        if (!this.options?.type) {
            throw new Error("TemplateManager options or type is not defined.");
        }
        if (!this.assistant) {
            throw new Error("Incorrect dependency injection configuration.");
        }

        options = { ...this.options, ...options };
        const controllerName = this.prefix || '' + options.type;
        const controller = await this.getDelegate<ITemplateManager>(options.type || 'File');

        this.logger?.info({
            flow: options.flow,
            category: VCategory.core.template,
            src: 'Service:TemplateManager:delete',
            message: 'Deleting template',
            data: { controllerName, templateName }
        });

        const result = await controller.delete(templateName, options);

        this.logger?.info({
            flow: options.flow,
            category: VCategory.core.template,
            src: 'Service:TemplateManager:delete',
            message: result ? 'Template deleted successfully' : 'Template deletion failed',
            data: { controllerName, templateName, success: result }
        });

        return result;
    }

    /**
     * Lists available templates from the configured storage backend by delegating to the appropriate
     * storage-specific implementation (TemplateManagerFile, TemplateManagerMDB, etc.).
     * This method implements the bridge pattern by providing a unified interface regardless
     * of the underlying storage mechanism.
     * 
     * The listing process:
     * 1. Validates that storage type is configured
     * 2. Resolves the appropriate storage-specific manager from IoC container
     * 3. Delegates the listing operation to the specific implementation
     * 4. Returns the list of available template names
     * 
     * @public
     * @param {ITemplateConfig} [options] - Optional configuration override for this operation
     * @returns {Promise<string[]>} Promise resolving to array of template names
     * @throws {Error} When template listing fails due to configuration issues, network problems, or storage errors
     * 
     * @example
     * ```typescript
     * // List all templates
     * const templates = await templateManager.list();
     * console.log('Available templates:', templates);
     * 
     * // List with custom configuration override
     * const templates = await templateManager.list({
     *   type: 'File',
     *   file: { path: '/custom/template/path' }
     * });
     * ```
     */
    async list(options?: ITemplateConfig): Promise<string[]> {
        if (!this.options?.type) {
            throw new Error("TemplateManager options or type is not defined.");
        }
        if (!this.assistant) {
            throw new Error("Incorrect dependency injection configuration.");
        }

        options = { ...this.options, ...options };
        const controllerName = this.prefix || '' + options.type;
        const controller = await this.getDelegate<ITemplateManager>(options.type || 'File');

        this.logger?.info({
            flow: options.flow,
            category: VCategory.core.template,
            src: 'Service:TemplateManager:list',
            message: 'Listing templates',
            data: { controllerName }
        });

        const templates = await controller.list(options);

        this.logger?.info({
            flow: options.flow,
            category: VCategory.core.template,
            src: 'Service:TemplateManager:list',
            message: 'Templates listed successfully',
            data: { controllerName, count: templates.length, templates: templates.slice(0, 10) } // Log first 10 for brevity
        });

        return templates;
    }
}
export default TemplateManager;
