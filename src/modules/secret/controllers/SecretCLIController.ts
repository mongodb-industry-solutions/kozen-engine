/**
 * @fileoverview SecretController - CLI to SecretManager bridge component
 * Controller for managing encrypted secrets through CLI interactions with pluggable SecretManager providers.
 * Supports operations like storing, retrieving, and managing secrets with encryption across multiple backends.
 *
 * @author IaC Pipeline Team
 * @since 1.0.0
 * @version 1.1.0
 */
import { CLIController } from '../../../shared/controllers/CLIController';
import { IAction, ICLIArgs } from '../../../shared/models/Types';
import { IConfig } from '../../pipeline/models/Pipeline';
import { ISecretArgs, ISecretManager } from '../models/Secret';

/**
 * @class SecretController
 * @extends CLIController
 * @description CLI controller for managing encrypted secrets and credentials.
 * 
 * This controller provides command-line interface for interacting with the Kozen Engine
 * secret management system, supporting multiple backends including AWS Secrets Manager
 * and MongoDB with Client-Side Field Level Encryption (CSFLE).
 * 
 * @example
 * ```typescript
 * const secretController = new SecretController();
 * await secretController.set({ key: 'API_KEY', value: 'secret-value' });
 * const value = await secretController.get({ key: 'API_KEY' });
 * ```
 */
export class SecretController extends CLIController {

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
    public async set(options: { key: string, value: string }): Promise<boolean> {
        try {
            const { key, value } = options;
            const srvSecret = await this.assistant?.resolve<ISecretManager>('SecretManager');
            const result = await srvSecret!.save(key, value);
            this.logger?.info({
                flow: this.getId(options as unknown as IConfig),
                src: 'Controller:Secret:set',
                message: `✅ Secret '${key}' saved successfully.`
            });
            return result;
        } catch (error) {
            this.logger?.error({
                flow: this.getId(options as unknown as IConfig),
                src: 'Controller:Secret:set',
                message: `❌ Failed to resolve secret '${options.key}': ${(error as Error).message}`
            });
            return false;
        }
    }

    /**
     * Retrieves and decrypts a secret from the configured secret management backend
     * Resolves the secret using the SecretManager service with automatic decryption
     * 
     * @param {Object} options - Secret retrieval options
     * @param {string} options.key - Unique identifier of the secret to retrieve
     * @returns {Promise<string | null>} Promise resolving to decrypted secret value or null if not found
     * @throws {Error} When secret manager resolution fails or retrieval operation encounters errors
     * @public
     */
    public async get(options: { key: string }): Promise<string | null> {
        try {
            const { key } = options;
            const srvSecret = await this.assistant?.resolve<ISecretManager>('SecretManager');
            const value = await srvSecret!.resolve(key);
            if (value) {
                this.logger?.info({
                    flow: this.getId(options as unknown as IConfig),
                    src: 'Controller:Secret:get',
                    message: `✅ Resolved secret '${key}': ${value}`
                });
            } else {
                this.logger?.info({
                    flow: this.getId(options as unknown as IConfig),
                    src: 'Controller:Secret:get',
                    message: `🔍 Secret '${key}' not found.`
                });
            }
            return String(value) || null;
        } catch (error) {
            this.logger?.error({
                flow: this.getId(options as unknown as IConfig),
                src: 'Controller:Secret:get',
                message: `❌ Failed to resolve secret '${options.key}': ${(error as Error).message}`
            });
            return null;
        }
    }

    /**
     * Retrieves metadata information about the secret management configuration
     * Provides details about the current SecretManager backend and its configuration
     * 
     * @param {Object} options - Metadata retrieval options
     * @param {string} options.key - Key identifier (currently unused but maintained for interface consistency)
     * @returns {Promise<any | null>} Promise resolving to secret manager configuration metadata or null if unavailable
     * @public
     */
    public async metadata(options: { key: string }) {
        try {
            const srvSecret = await this.assistant?.resolve<ISecretManager>('SecretManager');
            return srvSecret?.options;
        } catch (error) {
            this.logger?.error({
                flow: this.getId(options as unknown as IConfig),
                src: 'Controller:Secret:metadata',
                message: `❌ Failed to resolve secret manager metadata: ${(error as Error).message}`
            });
            return null;
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
        const helpText = await this.fileSrv?.select('secret');
        console.log(helpText);
    }

    /**
     * Parses and processes command line arguments specific to secret management operations
     * Extends base argument parsing with secret-specific defaults and environment variable fallbacks
     * 
     * @param {string[] | ICLIArgs} args - Raw command line arguments array or pre-parsed arguments
     * @returns {Promise<ISecretArgs>} Promise resolving to structured secret arguments with defaults applied
     * @public
     */
    public async fillout(args: string[] | ICLIArgs): Promise<ISecretArgs> {
        let parsed: Partial<ISecretArgs> = this.extract(args);
        parsed.action !== 'metadata' && (parsed.key = parsed.key || (process.env.KOZEN_SM_KEY as IAction));
        parsed.action === 'set' && (parsed.value = parsed.value || process.env.KOZEN_SM_VAL);
        return parsed as ISecretArgs;
    }
}
