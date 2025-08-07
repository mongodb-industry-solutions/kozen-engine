/**
 * @fileoverview CLI Controller bridge component
 * Controller for managing secrets in MongoDB through CLI interactions using SecretManagerMDB.
 * Supports operations like saving and resolving secrets using encryption.
 *
 * @author IaC Pipeline Team
 * @since 1.0.0
 * @version 1.1.0
 */

import * as fs from 'fs';
import { ILoggerService } from '../models/Logger';
import { IPipelineConfig } from '../models/Pipeline';
import { ICLIArgs, VCategory } from '../models/Types';
import { IIoC, ILogInput, ILogLevel, IoC } from '../tools';

export class CLIController {
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
     * Creates a new CLIController instance
     *
     * @constructor
     * @param {ISecretManagerOptions} [options] - Configuration options for MongoDB and encryption
     */
    constructor() {
        this.assistant = new IoC();
    }

    /**
     * Displays CLI usage information for working with secrets
     * @public
     * @static
     */
    public static displayHelp(): void {
        console.log(`
            MongoDB Tool CLI
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
     * @param {ICLIArgs} args - Secret controller configuration arguments
     * @returns {Promise<void>} Promise that resolves when configuration is complete
     * @throws {Error} When configuration fails due to invalid configuration or dependency registration errors
     * 
     * This method sets up the secret controller by:
     * 1. Loading the configuration file if provided
     * 2. Setting up the IoC container for dependency injection
     * 3. Registering all service dependencies defined in the configuration
     */
    public async configure(args: ICLIArgs): Promise<void> {
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
     * @returns {ICLIArgs} Parsed CLI arguments with defaults applied
     */
    public async parseArguments(args: string[]): Promise<ICLIArgs> {
        let parsed: Partial<ICLIArgs> = this.extract(args);
        return parsed as ICLIArgs;
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

    public async init<T = ICLIArgs>(argv?: string[]): Promise<T> {
        const args = await this.parseArguments(process.argv);
        await this.configure(args);
        return args as T;
    }

    /**
     * Logs a message using the pipeline logger with specified level
     * @public
     * @param {ILogInput} input - Log input message or structured log object
     * @param {ILogLevel} [level] - Log level, defaults to INFO
     * @returns {void | Promise<void>} Log operation result
     */
    public async log(input: ILogInput, level: ILogLevel = ILogLevel.INFO) {
        if (typeof input === 'object') {
            input.category = VCategory.core.pipeline;
        }
        this.logger?.log(input, level);
    }

    /**
     * Waits for all pending logger operations to complete
     * @public
     * @returns {Promise<void>} Promise that resolves when all log operations complete
     */
    public async await(): Promise<void> {
        if (this.logger?.stack) {
            await Promise.all(this.logger.stack)
        }
    }
}
