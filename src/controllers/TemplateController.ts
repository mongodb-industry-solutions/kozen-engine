/**
 * @fileoverview TemplateController - CLI to TemplateManager bridge component
 * Controller for managing infrastructure templates through CLI interactions with pluggable TemplateManager providers.
 * Supports operations like loading, saving, and listing templates across multiple storage backends.
 *
 * @author MongoDB Solution Assurance Team (SAT)
 * @since 1.1.0
 * @version 1.1.0
 */
import { IConfig } from '../models/Pipeline';
import { ITemplateArgs, ITemplateManager } from '../models/Template';
import { ICLIArgs } from '../models/Types';
import { readFrom } from '../tools/util';
import { CLIController } from './CLIController';

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

            const templateManager = await this.assistant?.resolve<ITemplateManager>('TemplateManager');
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

            const templateManager = await this.assistant?.resolve<ITemplateManager>('TemplateManager');
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

            const templateManager = await this.assistant?.resolve<ITemplateManager>('TemplateManager');
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

            const templateManager = await this.assistant?.resolve<ITemplateManager>('TemplateManager');
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
            const templateManager = await this.assistant?.resolve<ITemplateManager>('TemplateManager');
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
    public help(): void {
        console.log(`
===============================================================================
Kozen Engine (Template Manager Tool)
===============================================================================

Description:
    Manage infrastructure templates and deployment configurations through multiple
    storage backends including file system and MongoDB. Provides centralized template
    storage with versioning, metadata management, and cross-platform compatibility.

Usage:
    kozen --action=template:<action> --name=<template> [options]
    kozen --controller=template --action=<action> --name=<template> [options]

Core Options:
    --stack=<id>                    Environment identifier (dev, test, staging, prod)
                                    (default: from NODE_ENV or 'dev')
    --project=<id>                  Project identifier for template organization
                                    (default: auto-generated timestamp ID)
    --config=<file>                 Configuration file path containing template manager settings
                                    (default: cfg/config.json)
    --controller=template           Explicitly set controller to template
    --action=<[controller:]action>  Template management operation to perform:

Available Actions:
    set                             Store a new template or update existing one
                                    - Serializes template content automatically
                                    - Supports multiple backend providers
                                    - Requires --name and (--content or --file) parameters
    
    get                             Retrieve and display a stored template
                                    - Automatically deserializes template content
                                    - Returns null if template not found
                                    - Requires --name parameter
    
    delete                          Remove a template from storage backend
                                    - Permanently deletes template data
                                    - Cannot be undone once executed
                                    - Requires --name parameter
    
    list                            Display available templates from storage
                                    - Shows all template names in storage
                                    - Supports different output formats (table, json)
                                    - Useful for template discovery and management
    
    metadata                        Display template manager configuration
                                    - Shows current backend provider details
                                    - Displays storage settings
                                    - Useful for troubleshooting

Template Management Options:
    --name=<identifier>             Template name/identifier (REQUIRED for most actions)
                                    Examples: atlas.basic, k8s.standard, custom.template
    --content=<json>                Template content as JSON string (REQUIRED for 'save' action)
                                    Can contain complete template definitions
    --file=<path>                   File path to read template content from (alternative to --content)
                                    Supports JSON template files
    --format=<type>                 Output format for template display (json, yaml, table)
                                    (default: json for get/metadata, table for list)
    --storage=<type>                Storage backend override (File, MDB)
                                    Temporarily override configured storage backend

Environment Variables:
    KOZEN_CONFIG                    Default value assigned to the --config property
    KOZEN_ACTION                    Default value assigned to the --action property
    KOZEN_STACK                     Default value assigned to the --stack property
    KOZEN_PROJECT                   Default value assigned to the --project property
    KOZEN_TM_NAME                   Default value assigned to the --name property
    KOZEN_TM_CONTENT                Default value assigned to the --content property
    KOZEN_TM_FILE                   Default value assigned to the --file property
    KOZEN_TM_FORMAT                 Default value assigned to the --format property

Storage Backends:
    File System                     Local/network file storage with JSON serialization
    MongoDB                         Document-based storage with metadata and versioning
    
Template Features:
    - Automatic serialization/deserialization
    - Multiple backend provider support
    - Environment-based template organization
    - Metadata enrichment (timestamps, versioning)
    - Audit logging for all operations

Examples:
    # Save a template from JSON content
    kozen --action=template:save --name=atlas.basic --content='{"name":"atlas.basic","components":[...]}'
    
    # Save a template from file
    kozen --action=template:save --name=k8s.standard --file=./templates/k8s-standard.json
    
    # Retrieve a template
    kozen --action=template:get --name=atlas.basic
    
    # Retrieve with specific format
    kozen --action=template:get --name=atlas.basic --format=json
    
    # Delete a template permanently
    kozen --action=template:delete --name=atlas.basic
    
    # List available templates in table format
    kozen --action=template:list --format=table
    
    # List available templates in JSON format
    kozen --action=template:list --format=json
    
    # Alternative syntax with explicit controller
    kozen --controller=template --action=get --name=demo.template
    
    # Get template manager configuration details
    kozen --action=template:metadata
    
    # Save template with environment separation
    kozen --action=template:save --name=prod.atlas --file=./prod-atlas.json --stack=production
    
    # Delete template with explicit controller syntax
    kozen --controller=template --action=delete --name=old.template
    
    # Using environment variables for convenience
    export KOZEN_TM_NAME=my.template
    export KOZEN_TM_FILE=./my-template.json
    kozen --action=template:save
===============================================================================
        `);
    }

    /**
     * Parses and processes command line arguments specific to template management operations
     * Extends base argument parsing with template-specific defaults and environment variable fallbacks
     * 
     * @param {string[] | ICLIArgs} args - Raw command line arguments array or pre-parsed arguments
     * @returns {Promise<ITemplateArgs>} Promise resolving to structured template arguments with defaults applied
     * @public
     */
    public async fillout(args: string[] | ICLIArgs): Promise<ITemplateArgs> {
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