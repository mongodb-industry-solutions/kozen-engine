/**
 * @fileoverview File-based Template Manager Service - File System Implementation
 * @description File system-specific implementation for loading infrastructure templates from local or network directories
 * @author MDB SAT
 * @since 1.0.4
 * @version 1.0.5
 */
import * as fs from 'fs';
import * as path from 'path';
import { ITemplateConfig } from '../models/Template';
import TemplateManager from "./TemplateManager";

/**
 * @class TemplateManagerFile
 * @extends TemplateManager
 * @description File system implementation for template loading with JSON parsing and error handling
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