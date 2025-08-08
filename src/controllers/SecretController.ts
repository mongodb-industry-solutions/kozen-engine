/**
 * @fileoverview SecretController - CLI to SecretManager bridge component
 * Controller for managing secrets in MongoDB through CLI interactions using SecretManagerMDB.
 * Supports operations like saving and resolving secrets using encryption.
 *
 * @author IaC Pipeline Team
 * @since 1.0.0
 * @version 1.1.0
 */
import { ISecretArgs, ISecretManager } from '../models/Secret';
import { IAction, ICLIArgs } from '../models/Types';
import { CLIController } from './CLIController';

export class SecretController extends CLIController {

    /**
     * Saves a secret to MongoDB with encryption support
     * @public
     * @param {string} key - The key for the secret
     * @param {string} value - The value of the secret
     * @returns {Promise<boolean>} Success status of the save operation
     */
    public async set(options: { key: string, value: string }): Promise<boolean> {
        try {
            const { key, value } = options;
            const srvSecret = await this.assistant?.resolve<ISecretManager>('SecretManager');
            const result = await srvSecret!.save(key, value);
            this.logger?.debug({
                src: 'Controller:Secret:set',
                message: `✅ Secret '${key}' saved successfully.`
            });
            return result;
        } catch (error) {
            this.logger?.debug({
                src: 'Controller:Secret:set',
                message: `❌ Failed to resolve secret '${options.key}': ${(error as Error).message}`
            });
            return false;
        }
    }

    /**
     * Resolves a secret from MongoDB with decryption support
     * @public
     * @param {string} key - The key to search for
     * @returns {Promise<string | null>} The resolved secret value or null if not found
     */
    public async get(options: { key: string }): Promise<string | null> {
        try {
            const { key } = options;
            const srvSecret = await this.assistant?.resolve<ISecretManager>('SecretManager');
            const value = await srvSecret!.resolve(key);
            if (value) {
                this.logger?.debug({
                    src: 'Controller:Secret:get',
                    message: `✅ Resolved secret '${key}': ${value}`
                });
            } else {
                this.logger?.debug({
                    src: 'Controller:Secret:get',
                    message: `🔍 Secret '${key}' not found.`
                });
            }
            return String(value) || null;
        } catch (error) {
            this.logger?.debug({
                src: 'Controller:Secret:get',
                message: `❌ Failed to resolve secret '${options.key}': ${(error as Error).message}`
            });
            return null;
        }
    }

    public async metadata(options: { key: string }) {
        try {
            const srvSecret = await this.assistant?.resolve<ISecretManager>('SecretManager');
            return srvSecret?.options;
        } catch (error) {
            this.logger?.debug({
                src: 'Controller:Secret:metadata',
                message: `❌ Failed to resolve secret manager metadata: ${(error as Error).message}`
            });
            return null;
        }
    }

    /**
     * Displays CLI usage information for working with secrets
     * @public
     * @static
     */
    public help(): void {
        console.log(`
===============================================================================
Kozen Engine (Secret Manager Tool)
===============================================================================

Usage:
    kozen --action=secret:set --key=<key> --value=<value>
    kozen --action=secret:get --key=<key>
    kozen --action=get --controller=secret --key=<key>

Options:
    --action=<[controller:]action>  Action to be performed within the Secret Manager tool. The possible values are:
                                    - set: Insert or update the value of a secret
                                    - get: Obtain the value of a secret
                                    - metadata: Obtain data about the secret manager configuration
    --controller=secret             Set controller name as secret (required if not specified in the action)

    --key=<key>                     Secret key (required)
    --value=<value>                 Secret value (required for save action)

Examples:
    kozen --action=secret:set --key=API_KEY --value="my super secret"
    kozen --action=secret:get --key=API_KEY
===============================================================================
        `);
    }

    /**
     * Parses command line arguments into structured format
     * @public
     * @param {string[]} args - Command line arguments array
     * @returns {ISecretArgs} Parsed CLI arguments with defaults applied
     */
    public async fillout(args: string[] | ICLIArgs): Promise<ISecretArgs> {
        let parsed: Partial<ISecretArgs> = this.extract(args);
        parsed.action !== 'metadata' && (parsed.key = parsed.key || (process.env.KOZEN_SM_KEY as IAction));
        parsed.action === 'set' && (parsed.value = parsed.value || process.env.KOZEN_SM_VAL);
        return parsed as ISecretArgs;
    }
}
