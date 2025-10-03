/**
 * @fileoverview ReportController - CLI to SecretManager bridge component
 * Controller for managing encrypted secrets through CLI interactions with pluggable SecretManager providers.
 * Supports operations like storing, retrieving, and managing secrets with encryption across multiple backends.
 *
 * @author IaC Pipeline Team
 * @since 1.0.0
 * @version 1.1.0
 */
import path from 'path';
import { CLIController } from '../../../shared/controllers/CLIController';
import { IConfig } from '../../../shared/models/Config';
import { IReportManager, PipelineResult } from '../models/Report';

/**
 * @class ReportController
 * @extends CLIController
 * @description CLI controller for managing reports.
 */
export class ReportController extends CLIController {

    /**
     * Saves an encrypted secret to the configured secret management backend
     * Stores the secret using the resolved SecretManager service with automatic encryption
     * 
     * @param {Object} options - Secret storage options
     * @param {string} options.key - Unique identifier for the secret
     * @param {string} options.value - Secret value to be encrypted and stored
     * @returns {Promise<boolean>} Promise resolving to true if save operation succeeds, false otherwise
     * @throws {Error} When secret manager resolution fails or storage operation encounters errors
     * @public
     */
    public async list(options: { start?: string, end?: string }): Promise<PipelineResult[]> {
        try {
            const { start, end } = options;
            const srvReport = await this.assistant?.resolve<IReportManager>('report:manager');
            const result = await srvReport!.list({ start, end });

            this.logger?.info({
                flow: this.getId(options as unknown as IConfig),
                src: 'Controller:Secret:set',
                message: `✅ Secret '${result?.length}' saved successfully.`
            });
            return result;
        } catch (error) {
            this.logger?.error({
                flow: this.getId(options as unknown as IConfig),
                src: 'Controller:Secret:set',
                message: `❌ Failed to retrieve reports: ${(error as Error).message}`
            });
            return [];
        }
    }

    /**
     * Displays comprehensive CLI usage information for secret management operations
     * Shows available commands, options, and examples for the Secret Manager tool
     * 
     * @returns {void}
     * @public
     */
    public async help(): Promise<void> {
        const dir = process.env.DOCS_DIR || path.resolve(__dirname, '../docs');
        const helpText = await this.srvFile?.select('report', dir);
        console.log(helpText);
    }
}
