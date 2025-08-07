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
import { IAction } from '../models/Types';
import { CLIController } from './CLIController';

export class SecretController extends CLIController {

    /**
     * Saves a secret to MongoDB with encryption support
     * @public
     * @param {string} key - The key for the secret
     * @param {string} value - The value of the secret
     * @returns {Promise<boolean>} Success status of the save operation
     */
    public async save(key: string, value: string): Promise<boolean> {
        try {
            const srvSecret = await this.assistant?.resolve<ISecretManager>('SecretManager');
            const result = await srvSecret!.save(key, value);
            this.logger?.debug({
                src: 'Controller:Secret:save',
                message: `✅ Secret '${key}' saved successfully.`
            });
            return result;
        } catch (error) {
            this.logger?.debug({
                src: 'Controller:Secret:save',
                message: `❌ Failed to resolve secret '${key}': ${(error as Error).message}`
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
    public async resolve(key: string): Promise<string | null> {
        try {
            const srvSecret = await this.assistant?.resolve<ISecretManager>('SecretManager');
            const value = await srvSecret!.resolve(key);
            if (value) {
                this.logger?.debug({
                    src: 'Controller:Secret:resolve',
                    message: `✅ Resolved secret '${key}': ${value}`
                });
            } else {
                this.logger?.debug({
                    src: 'Controller:Secret:resolve',
                    message: `🔍 Secret '${key}' not found.`
                });
            }
            return String(value) || null;
        } catch (error) {
            this.logger?.debug({
                src: 'Controller:Secret:resolve',
                message: `❌ Failed to resolve secret '${key}': ${(error as Error).message}`
            });
            return null;
        }
    }

    /**
     * Displays CLI usage information for working with secrets
     * @public
     * @static
     */
    public static displayHelp(): void {
        console.log(`
            MongoDB Secrets CLI
            ===============================================================================
            
            Usage:
            secrets --action=save --key=<key> --value=<value>
            secrets --action=resolve --key=<key>
            
            Options:
            --action=<action>   Action to perform: save, resolve
            --key=<key>         Secret key (required)
            --value=<value>     Secret value (required for save action)
            
            Examples:
            secrets --action=save --key=API_KEY --value=my_super_secret
            secrets --action=resolve --key=API_KEY
            ===============================================================================
        `);
    }

    /**
     * Parses command line arguments into structured format
     * @public
     * @param {string[]} args - Command line arguments array
     * @returns {ISecretArgs} Parsed CLI arguments with defaults applied
     */
    public async parseArguments(args: string[]): Promise<ISecretArgs> {
        let parsed: Partial<ISecretArgs> = this.extract(args);
        parsed.action = parsed.action || (process.env.KOZEN_SM_ACTION as IAction) || 'resolve';
        parsed.key = parsed.key || (process.env.KOZEN_SM_KEY as IAction);
        parsed.config = parsed.config || process.env.KOZEN_CONFIG || 'cfg/config.json';
        parsed.value = parsed.value || process.env.KOZEN_SM_VAL;
        return parsed as ISecretArgs;
    }
}
