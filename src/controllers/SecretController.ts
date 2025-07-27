/**
 * @fileoverview SecretController - CLI to SecretManager bridge component
 * @description Controller for managing secrets in MongoDB through CLI interactions using SecretManagerMDB.
 * Supports operations like saving and resolving secrets using encryption.
 *
 * @author IaC Pipeline Team
 * @since 1.0.0
 * @version 1.1.0
 */

import * as fs from 'fs';
import { ILoggerService } from '../models/Logger';
import { IPipelineConfig, ISecretArgs } from '../models/Pipeline';
import { ISecretManager, ISecretManagerOptions } from '../models/Secret';
import { IAction } from '../models/Types';
import { IIoC, IoC } from '../tools';

export class SecretController {
    protected assistant?: IIoC | null;
    public logger?: ILoggerService | null;

    /**
     * Creates a new SecretController instance
     *
     * @constructor
     * @param {ISecretManagerOptions} [options] - Configuration options for MongoDB and encryption
     */
    constructor() {
        this.assistant = new IoC();
    }

    /**
     * Saves a secret to MongoDB with encryption support
     *
     * @async
     * @method saveSecret
     * @param {string} key - The key for the secret
     * @param {string} value - The value of the secret
     * @returns {Promise<boolean>} Success status of the save operation
     *
     * @example
     * const success = await controller.saveSecret('API_KEY', 'super_secret_key');
     * console.log('Secret saved:', success);
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
     *
     * @async
     * @method resolveSecret
     * @param {string} key - The key to search for
     * @returns {Promise<string | null>} The resolved secret value or null if not found
     *
     * @example
     * const secret = await controller.resolveSecret('API_KEY');
     * console.log('Resolved secret:', secret);
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
     *
     * @method displayUsage
     */
    public static displayUsage(): void {
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
     * Loads pipeline configuration from a JSON file
     *
     * @public
     * @param {string} configPath - File system path to the configuration file
     * @returns {Promise<IPipelineConfig>} Promise resolving to the loaded and parsed pipeline configuration
     * @throws {Error} When file reading fails, JSON parsing errors occur, or file access is denied
     *
     * @description Loads and parses pipeline configuration from a JSON file, providing error handling
     * for common file system and parsing issues. The configuration includes service dependencies,
     * deployment settings, and environment-specific parameters.
     *
     * @example
     * ```typescript
     * try {
     *   const config = await pipelineManager.load('cfg/production.json');
     *   console.log('Loaded config:', config.name);
     * } catch (error) {
     *   console.error('Failed to load config:', error.message);
     * }
     * ```
     */
    public async load(configPath: string): Promise<IPipelineConfig> {
        try {
            const configContent = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(configContent) as IPipelineConfig;
            return config;
        } catch (error) {
            throw new Error(`Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Configures the pipeline manager with the provided configuration and IoC container
     * 
     * @public
     * @param {IPipelineConfig} config - The pipeline configuration to apply
     * @param {IoC} [ioc] - Optional IoC container for dependency management
     * @returns {Promise<PipelineManager>} Promise resolving to the configured PipelineManager instance
     * @throws {Error} When configuration fails due to invalid configuration or dependency registration errors
     * 
     * @description This method sets up the pipeline manager by:
     * 1. Storing the provided configuration
     * 2. Setting up the IoC container for dependency injection
     * 3. Registering all service dependencies defined in the configuration
     */
    public async configure(args: ISecretArgs): Promise<void> {

        try {
            const config = args.config && await this.load(args.config);
            if (!config) {
                throw new Error(`Configuration file not found: ${args.config}`);
            }
            if (!this.assistant) {
                throw new Error("Incorrect dependency injection configuration.");
            }
            config.dependencies && await this.assistant.register(config.dependencies);
            // TODO: move this to the config
            this.logger = await this.assistant.resolve<ILoggerService>('LoggerService');

        } catch (error) {
            throw new Error(`Failed to configure pipeline: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
      * Parses command line arguments into structured format
      *
      * @method parseArguments
      * @param {string[]} args - Command line arguments array
      * @returns {ISecretArgs} Parsed CLI arguments
      *
      * @example
      * ```typescript
      * const args = controller.parseArguments(['--template=atlas.basic', '--action=deploy']);
      * // Returns: { template: 'atlas.basic', config: 'config.json', action: 'deploy' }
      * ```
      */
    public parseArguments(args: string[]): ISecretArgs {
        let parsed: Partial<ISecretArgs> = this.extract(args);
        parsed.action = parsed.action || (process.env.KOZEN_SM_ACTION as IAction) || 'resolve';
        parsed.key = parsed.key || (process.env.KOZEN_SM_KEY as IAction);
        parsed.config = parsed.config || process.env.KOZEN_CONFIG || 'cfg/config.json';
        return parsed as ISecretArgs;
    }

    extract(argv?: string[]) {
        argv = argv || process.argv;
        return argv.slice(2).reduce((acc: Record<string, string>, arg: string) => {
            const [key, value] = arg.split('=');
            acc[key.replace('--', '')] = value;
            return acc;
        }, {});
    }
}
