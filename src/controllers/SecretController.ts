/**
 * @fileoverview SecretController - CLI to SecretManager bridge component
 * Controller for managing secrets in MongoDB through CLI interactions using SecretManagerMDB.
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
    /**
     * IoC container instance for dependency injection and service resolution
     * @type {IIoC | null}
     */
    protected assistant?: IIoC | null;

    /**
     * Logger service instance for recording secret management operations
     * @type {ILoggerService | null}
     */
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
     * @public
     * @param {string} configPath - File system path to the configuration file
     * @returns {Promise<IPipelineConfig>} Promise resolving to the loaded and parsed pipeline configuration
     * @throws {Error} When file reading fails, JSON parsing errors occur, or file access is denied
     * 
     * Loads and parses pipeline configuration from a JSON file, providing error handling
     * for common file system and parsing issues. The configuration includes service dependencies,
     * deployment settings, and environment-specific parameters.
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
     * Configures the secret controller with provided arguments and dependencies
     * @public
     * @param {ISecretArgs} args - Secret controller configuration arguments
     * @returns {Promise<void>} Promise that resolves when configuration is complete
     * @throws {Error} When configuration fails due to invalid configuration or dependency registration errors
     * 
     * This method sets up the secret controller by:
     * 1. Loading the configuration file if provided
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
     * @public
     * @param {string[]} args - Command line arguments array
     * @returns {ISecretArgs} Parsed CLI arguments with defaults applied
     */
    public parseArguments(args: string[]): ISecretArgs {
        let parsed: Partial<ISecretArgs> = this.extract(args);
        parsed.action = parsed.action || (process.env.KOZEN_SM_ACTION as IAction) || 'resolve';
        parsed.key = parsed.key || (process.env.KOZEN_SM_KEY as IAction);
        parsed.config = parsed.config || process.env.KOZEN_CONFIG || 'cfg/config.json';
        parsed.value = parsed.value || process.env.KOZEN_SM_VAL;
        return parsed as ISecretArgs;
    }

    /**
     * Extracts key-value pairs from command line arguments array
     * @public
     * @param {string[]} [argv] - Command line arguments array, defaults to process.argv
     * @returns {Record<string, string>} Object containing parsed argument key-value pairs
     */
    extract(argv?: string[]) {
        argv = argv || process.argv;
        return argv.slice(2).reduce((acc: Record<string, string>, arg: string) => {
            const [key, value] = arg.split('=');
            acc[key.replace('--', '')] = value;
            return acc;
        }, {});
    }
}
