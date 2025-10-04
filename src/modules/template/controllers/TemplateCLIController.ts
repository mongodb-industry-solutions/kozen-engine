/**
 * @fileoverview TemplateController - CLI to TemplateManager bridge component
 * Controller for managing infrastructure templates through CLI interactions with pluggable TemplateManager providers.
 * Supports operations like loading, saving, and listing templates across multiple storage backends.
 *
 * @author MongoDB Solution Assurance Team (SAT)
 * @since 1.1.0
 * @version 1.1.0
 */
import path from 'path';
import { CLIController } from '../../../applications/cli/controllers/CLIController';
import { IArgs } from '../../../shared/models/Args';
import { IConfig } from '../../../shared/models/Config';
import { readFrom } from '../../../shared/tools/util';
import { ITemplateArgs, ITemplateManager } from '../models/Template';

/**
 * @class TemplateController
 * @extends CLIController
 * @description CLI controller for managing infrastructure templates and template storage.
 * 
 * This controller provides command-line interface for interacting with the Kozen Engine
 * template management system, supporting multiple backends including file system storage
 * and MongoDB with comprehensive template operations.
 * 
 * @example
 * ```typescript
 * const templateController = new TemplateController();
 * await templateController.save({ name: 'atlas.basic', content: templateData });
 * const template = await templateController.get({ name: 'atlas.basic' });
 * ```
 */
export class TemplateController extends CLIController {

    /**
     * Saves a template to the configured template storage backend
     * Stores the template using the resolved TemplateManager service with automatic serialization
     * 
     * @param {Object} options - Template storage options
     * @param {string} options.name - Unique identifier for the template
     * @param {string} [options.content] - Template content as JSON string
     * @param {string} [options.file] - File path to read template content from
     * @returns {Promise<boolean>} Promise resolving to true if save operation succeeds, false otherwise
     * @throws {Error} When template manager resolution fails or storage operation encounters errors
     * @public
     */
    public async set(options: { name: string, content?: string, file?: string }): Promise<boolean> {
        try {
            let { name, content, file } = options;

            let templateContent: any;

            // Get content from file or direct content parameter
            if (file) {
                const fileContent = await readFrom(file);
                if (!fileContent) {
                    throw new Error(`Failed to read template content from file: ${file}`);
                }
                templateContent = JSON.parse(fileContent);
            } else if (content) {
                templateContent = typeof content === 'string' ? JSON.parse(content) : content;
            } else {
                throw new Error('Either content or file parameter is required for save operation');
            }

            if (!name && templateContent.name) {
                name = templateContent.name;
            }

            if (!name) {
                throw new Error('Template name is required for save operation');
            }

            const templateManager = await this.assistant?.resolve<ITemplateManager>('template:manager');
            if (!templateManager) {
                throw new Error('Failed to resolve TemplateManager service');
            }

            const result = await templateManager.save(name, templateContent);

            this.logger?.info({
                flow: this.getId(options as unknown as IConfig),
                src: 'Controller:Template:save',
                message: `✅ Template '${name}' saved successfully.`
            });

            return result;
        } catch (error) {
            this.logger?.error({
                flow: this.getId(options as unknown as IConfig),
                src: 'Controller:Template:save',
                message: `❌ Failed to save template '${options.name}': ${(error as Error).message}`
            });
            return false;
        }
    }

    /**
     * Retrieves a template from the configured template storage backend
     * Loads the template using the TemplateManager service with automatic deserialization
     * 
     * @param {Object} options - Template retrieval options
     * @param {string} options.name - Unique identifier of the template to retrieve
     * @param {string} [options.format] - Output format (json, yaml, etc.)
     * @returns {Promise<any | null>} Promise resolving to template content or null if not found
     * @throws {Error} When template manager resolution fails or retrieval operation encounters errors
     * @public
     */
    public async get(options: { name: string, format?: string }): Promise<any | null> {
        try {
            const { name, format = 'json' } = options;

            if (!name) {
                throw new Error('Template name is required for get operation');
            }

            const templateManager = await this.assistant?.resolve<ITemplateManager>('template:manager');
            if (!templateManager) {
                throw new Error('Failed to resolve TemplateManager service');
            }

            const template = await templateManager.load(name);

            if (template) {
                this.logger?.info({
                    flow: this.getId(options as unknown as IConfig),
                    src: 'Controller:Template:get',
                    message: `✅ Retrieved template '${name}' successfully.`,
                    data: { templateName: name, format }
                });
            } else {
                this.logger?.info({
                    flow: this.getId(options as unknown as IConfig),
                    src: 'Controller:Template:get',
                    message: `🔍 Template '${name}' not found.`
                });
            }

            return template;
        } catch (error) {
            this.logger?.error({
                flow: this.getId(options as unknown as IConfig),
                src: 'Controller:Template:get',
                message: `❌ Failed to retrieve template '${options.name}': ${(error as Error).message}`
            });
            return null;
        }
    }

    /**
     * Deletes a template from the configured template storage backend
     * Removes the template using the TemplateManager service with comprehensive error handling
     * 
     * @param {Object} options - Template deletion options
     * @param {string} options.name - Unique identifier of the template to delete
     * @returns {Promise<boolean>} Promise resolving to true if delete operation succeeds, false otherwise
     * @throws {Error} When template manager resolution fails or deletion operation encounters errors
     * @public
     */
    public async delete(options: { name: string }): Promise<boolean> {
        try {
            const { name } = options;

            if (!name) {
                throw new Error('Template name is required for delete operation');
            }

            const templateManager = await this.assistant?.resolve<ITemplateManager>('template:manager');
            if (!templateManager) {
                throw new Error('Failed to resolve TemplateManager service');
            }

            const result = await templateManager.delete(name);

            if (result) {
                this.logger?.info({
                    flow: this.getId(options as unknown as IConfig),
                    src: 'Controller:Template:delete',
                    message: `✅ Template '${name}' deleted successfully.`
                });
            } else {
                this.logger?.info({
                    flow: this.getId(options as unknown as IConfig),
                    src: 'Controller:Template:delete',
                    message: `🔍 Template '${name}' not found or could not be deleted.`
                });
            }

            return result;
        } catch (error) {
            this.logger?.error({
                flow: this.getId(options as unknown as IConfig),
                src: 'Controller:Template:delete',
                message: `❌ Failed to delete template '${options.name}': ${(error as Error).message}`
            });
            return false;
        }
    }

    /**
     * Lists available templates from the configured storage backend
     * Retrieves template names and displays them in the requested format
     * 
     * @param {Object} [options] - Template listing options
     * @param {string} [options.format] - Output format (json, table, etc.)
     * @returns {Promise<string[] | null>} Promise resolving to array of template names or null if operation fails
     * @public
     */
    public async list(options?: { format?: string }): Promise<string[] | null> {
        try {
            const { format = 'table' } = options || {};

            const templateManager = await this.assistant?.resolve<ITemplateManager>('template:manager');
            if (!templateManager) {
                throw new Error('Failed to resolve TemplateManager service');
            }

            const templates = await templateManager.list();

            this.logger?.info({
                flow: this.getId(options as IConfig),
                src: 'Controller:Template:list',
                message: `📋 Retrieved ${templates.length} templates successfully.`,
                data: { count: templates.length, format }
            });

            return templates;
        } catch (error) {
            this.logger?.error({
                flow: this.getId(options as IConfig),
                src: 'Controller:Template:list',
                message: `❌ Failed to list templates: ${(error as Error).message}`
            });
            return null;
        }
    }

    /**
     * Retrieves metadata information about the template management configuration
     * Provides details about the current TemplateManager backend and its configuration
     * 
     * @param {Object} [options] - Metadata retrieval options
     * @returns {Promise<any | null>} Promise resolving to template manager configuration metadata or null if unavailable
     * @public
     */
    public async metadata(options?: { name?: string }): Promise<any | null> {
        try {
            const templateManager = await this.assistant?.resolve<ITemplateManager>('template:manager');
            if (!templateManager) {
                throw new Error('Failed to resolve TemplateManager service');
            }

            const config = templateManager.options;

            this.logger?.info({
                flow: this.getId(options as IConfig),
                src: 'Controller:Template:metadata',
                message: '📊 Retrieved template manager configuration successfully.'
            });

            return config;
        } catch (error) {
            this.logger?.error({
                flow: this.getId(options as IConfig),
                src: 'Controller:Template:metadata',
                message: `❌ Failed to retrieve template manager metadata: ${(error as Error).message}`
            });
            return null;
        }
    }

    /**
     * Displays comprehensive CLI usage information for template management operations
     * Shows available commands, options, and examples for the Template Manager tool
     * 
     * @returns {void}
     * @public
     */
    public async help(): Promise<void> {
        const dir = process.env.DOCS_DIR || path.resolve(__dirname, '../docs');
        const helpText = await this.srvFile?.select('template', dir);
        console.log(helpText);
    }

    /**
     * Parses and processes command line arguments specific to template management operations
     * Extends base argument parsing with template-specific defaults and environment variable fallbacks
     * 
     * @param {string[] | IArgs} args - Raw command line arguments array or pre-parsed arguments
     * @returns {Promise<ITemplateArgs>} Promise resolving to structured template arguments with defaults applied
     * @public
     */
    public async fill(args: string[] | IArgs): Promise<ITemplateArgs> {
        let parsed: Partial<ITemplateArgs> = this.extract(args);
        // Apply environment variable defaults
        process.env.KOZEN_TM_NAME && (parsed.name = parsed.name || process.env.KOZEN_TM_NAME);
        process.env.KOZEN_TM_CONTENT && (parsed.content = parsed.content || process.env.KOZEN_TM_CONTENT);
        process.env.KOZEN_TM_FILE && (parsed.file = parsed.file || process.env.KOZEN_TM_FILE);
        process.env.KOZEN_TM_FORMAT && (parsed.format = parsed.format || process.env.KOZEN_TM_FORMAT || 'json');
        process.env.KOZEN_TM_STORAGE && (parsed.storage = parsed.storage || process.env.KOZEN_TM_STORAGE);
        return parsed as ITemplateArgs;
    }
}