import { VCategory } from "../../../shared/models/Types";
import { BaseService } from "../../../shared/services/BaseService";
import { IIoC } from "../../../shared/tools";
import { ILogger } from "../../../shared/tools/log/types";
import { ITemplateConfig, ITemplateManager } from "../models/Template";

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
 */
export class TemplateManager extends BaseService implements TemplateManager {

    /**
     * Template configuration options
     * @protected
     * @type {ITemplateConfig | undefined}
     */
    protected _options: ITemplateConfig | null;

    /**
     * Gets the current template configuration options
     * @public
     * @readonly
     * @type {ITemplateConfig}
     * @returns {ITemplateConfig} The current template configuration
     * @throws {Error} When configuration is not initialized
     */
    get options(): ITemplateConfig {
        return this._options!;
    }

    /**
     * Sets the template configuration options
     * @public
     * @param {ITemplateConfig} value - Template configuration to set
     */
    set options(value: ITemplateConfig) {
        this._options = value;
    }

    /**
     * Creates a new TemplateManager instance
     * @constructor
     * @param {ITemplateConfig} [options] - Optional template configuration
     */
    constructor(options?: ITemplateConfig | null, dep?: { assistant: IIoC, logger: ILogger }) {
        super(dep);
        this._options = options ?? null;
        this.prefix = "template:manager:";
    }

    /**
     * Loads a template from the configured storage backend
     * @public
     * @template T - The expected type of the loaded template
     * @param {string} templateName - Name of the template to load
     * @param {ITemplateConfig} [options] - Optional configuration override for this operation
     * @returns {Promise<T>} Promise resolving to the loaded template data
     * @throws {Error} When template loading fails due to configuration issues, network problems, or missing templates
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
        const controller = await this.getDelegate<ITemplateManager>(options.type || 'file');
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
        const controller = await this.getDelegate<ITemplateManager>(options.type || 'file');

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
     * @public
     * @param {string} templateName - Name/identifier of the template to delete
     * @param {ITemplateConfig} [options] - Optional configuration override for this operation
     * @returns {Promise<boolean>} Promise resolving to true if delete operation succeeds, false otherwise
     * @throws {Error} When template deletion fails due to configuration issues, network problems, or storage errors
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
        const controller = await this.getDelegate<ITemplateManager>(options.type || 'file');

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
     * @public
     * @param {ITemplateConfig} [options] - Optional configuration override for this operation
     * @returns {Promise<string[]>} Promise resolving to array of template names
     * @throws {Error} When template listing fails due to configuration issues, network problems, or storage errors
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
        const controller = await this.getDelegate<ITemplateManager>(options.type || 'file');

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
