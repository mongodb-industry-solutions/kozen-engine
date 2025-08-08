/**
 * @fileoverview File-based Template Manager Service - File System Implementation
 * File system-specific implementation for loading and saving infrastructure templates 
 * from local or network directories with JSON serialization and atomic operations.
 * 
 * @author MongoDB Solution Assurance Team (SAT)
 * @since 1.0.4
 * @version 1.1.0
 */
import * as fs from 'fs';
import * as path from 'path';
import { ITemplateConfig } from '../models/Template';
import TemplateManager from "./TemplateManager";

/**
 * @class TemplateManagerFile
 * @extends TemplateManager
 * @description File system implementation for template operations with JSON serialization, 
 * atomic writes, and comprehensive error handling.
 * 
 * This implementation provides:
 * - JSON template file loading and parsing
 * - Atomic file writes with temporary files
 * - Automatic directory creation
 * - Template metadata enrichment
 * - Comprehensive error handling with cleanup
 */
export class TemplateManagerFile extends TemplateManager {

    /**
     * Loads a template from the file system by name
     * @public
     * @template T - The expected type of the loaded template
     * @param {string} templateName - The name of the template file to load (without .json extension)
     * @param {ITemplateConfig} [options] - Optional configuration override
     * @returns {Promise<T>} Promise resolving to the parsed template object
     * @throws {Error} When template file is not found, cannot be read, or contains invalid JSON
     */
    async load<T = any>(templateName: string, options?: ITemplateConfig): Promise<T> {
        try {
            this.options = options || this.options;
            const templatePath = this.getTemplatePath(templateName, this.options.file?.path || '');

            if (!fs.existsSync(templatePath)) {
                throw new Error(`Template file not found: ${templatePath}`);
            }

            const templateContent = await fs.promises.readFile(templatePath, 'utf-8');
            const template: T = JSON.parse(templateContent);

            return template;

        } catch (error) {
            if (error instanceof SyntaxError) {
                throw new Error(`Invalid JSON in template ${templateName}: ${error.message}`);
            }
            throw error;
        }
    }

    /**
     * Saves a template to the file system with JSON serialization and atomic writes
     * @public
     * @template T - The type of the template content to save
     * @param {string} templateName - The name of the template file to save (without .json extension)
     * @param {T} content - Template content to persist as JSON
     * @param {ITemplateConfig} [options] - Optional configuration override
     * @returns {Promise<boolean>} Promise resolving to true if save operation succeeds, false otherwise
     * @throws {Error} When template directory doesn't exist, content serialization fails, or file write errors occur
     */
    async save<T = any>(templateName: string, content: T, options?: ITemplateConfig): Promise<boolean> {
        try {
            this.options = options || this.options;
            const templatePath = this.getTemplatePath(templateName, this.options.file?.path || '');
            const templateDir = path.dirname(templatePath);

            // Ensure the directory exists
            if (!fs.existsSync(templateDir)) {
                await fs.promises.mkdir(templateDir, { recursive: true });
            }

            // Prepare template data with metadata
            const templateData = {
                ...content,
                name: templateName,
                lastModified: new Date().toISOString(),
                version: (content as any)?.version || '1.0.0'
            };

            // Serialize content to JSON with proper formatting
            const jsonContent = JSON.stringify(templateData, null, 2);

            // Write to temporary file first for atomic operation
            const tempPath = `${templatePath}.tmp`;
            await fs.promises.writeFile(tempPath, jsonContent, 'utf-8');

            // Atomic rename to final destination
            await fs.promises.rename(tempPath, templatePath);

            return true;

        } catch (error) {
            // Clean up temp file if it exists
            const tempPath = `${this.getTemplatePath(templateName, this.options.file?.path || '')}.tmp`;
            try {
                if (fs.existsSync(tempPath)) {
                    await fs.promises.unlink(tempPath);
                }
            } catch (cleanupError) {
                // Ignore cleanup errors
            }

            if (error instanceof TypeError) {
                throw new Error(`Unable to serialize template content for ${templateName}: ${error.message}`);
            }
            throw new Error(`Failed to save template ${templateName}: ${(error as Error).message}`);
        }
    }

    /**
     * Constructs the full file system path to a template file
     * @private
     * @param {string} templateName - The name of the template (without file extension)
     * @param {string} basePath - The base directory path where templates are stored
     * @returns {string} The complete file system path to the template file
     */
    private getTemplatePath(templateName: string, basePath: string): string {
        return path.join(basePath, `${templateName}.json`);
    }
}

export default TemplateManagerFile;