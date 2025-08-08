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
import { IConfig } from '../models/Pipeline';
import { ICLIArgs, VCategory } from '../models/Types';
import { getID, IIoC, ILogInput, ILogLevel, IoC } from '../tools';

/**
 * @class CLIController
 * @description Base controller class for CLI operations providing common functionality
 * for argument parsing, configuration management, and dependency injection.
 * 
 * This controller serves as the foundation for all CLI-based controllers in the Kozen Engine,
 * providing standardized interfaces for command-line interaction, logging, and service resolution.
 */
export class CLIController {
    /**
     * IoC container instance for dependency injection and service resolution
     * @type {IIoC | null}
     * @protected
     */
    protected assistant?: IIoC | null;

    /**
     * Parsed command line arguments
     * @type {any}
     * @protected
     */
    protected args: any;

    /**
     * Gets the IoC helper instance for dependency resolution
     * @returns {IIoC | null | undefined} The IoC container instance
     * @public
     */
    public get helper() {
        return this.assistant;
    }

    /**
     * Gets the parsed command line arguments
     * @template T - Type of arguments to return, defaults to ICLIArgs
     * @returns {T} The parsed arguments cast to specified type
     * @public
     */
    public getArgs<T = ICLIArgs>(): T {
        return this.args as T;
    }

    /**
     * Logger service instance for recording CLI operations and errors
     * @type {ILoggerService | null}
     * @public
     */
    public logger?: ILoggerService | null;

    /**
     * Creates a new CLIController instance with dependency injection support
     * 
     * @constructor
     * @param {Object} [dependency] - Optional dependency injection configuration
     * @param {IIoC} [dependency.assistant] - IoC container for service resolution
     * @param {ILoggerService} [dependency.logger] - Logger service for operation tracking
     */
    constructor(dependency?: { assistant: IIoC, logger: ILoggerService }) {
        this.assistant = dependency?.assistant ?? new IoC();
        this.logger = dependency?.logger ?? null;
    }

    /**
     * Displays comprehensive CLI usage information and command examples
     * Shows available options, environment variables, and usage patterns for the Kozen Engine CLI tool
     * 
     * @public
     * @returns {void}
     */
    public help(): void {
        console.log(`
===============================================================================
Kozen Engine - Dynamic Infrastructure & Testing Pipeline Platform
===============================================================================

Usage:
    kozen --action=<value> [--controller=<value>] [options]

Core Options:
    --stack=<id>                    Environment identifier (dev, test, prod) 
                                    (default: from NODE_ENV or 'dev')
    --project=<id>                  Project identifier for resource organization
                                    (default: auto-generated timestamp ID)
    --config=<file>                 Path to configuration file
                                    (default: cfg/config.json)
    --controller=<name>             Specify controller explicitly. Available controllers:
                                    - pipeline: Manage infrastructure and testing pipelines
                                    - logger: Manage system logs and monitoring data
                                    - secret: Manage encrypted secrets and credentials
    --action=<[controller:]action>  Action to perform. Format: 'action' or 'controller:action'
                                    - help: Get help or assistance on how to use a tool

Environment Variables:
    KOZEN_CONFIG                    Default value assigned to the --config property
    KOZEN_ACTION                    Default value assigned to the --action property
    KOZEN_STACK                     Default value assigned to the --stack property
    KOZEN_PROJECT                   Default value assigned to the --project property

Controller-Specific Help:
    kozen --action=help --controller=pipeline    # Pipeline management help
    kozen --action=help --controller=secret      # Secret management help
    kozen --action=help --controller=logger      # Logging system help

Quick Start Examples:
    kozen --action=pipeline:help                 # Get pipeline help
    kozen --action=secret:help                   # Get secret management help
    kozen --controller=pipeline --action=help    # Alternative syntax
===============================================================================
        `);
    }

    /**
     * Loads pipeline configuration from a JSON file
     * @public
     * @param {string} configPath - File system path to the configuration file
     * @returns {Promise<IConfig>} Promise resolving to the loaded and parsed pipeline configuration
     * @throws {Error} When file reading fails, JSON parsing errors occur, or file access is denied
     * 
     * Loads and parses pipeline configuration from a JSON file, providing error handling
     * for common file system and parsing issues. The configuration includes service dependencies,
     * deployment settings, and environment-specific parameters.
     */
    public async load(configPath: string): Promise<IConfig> {
        try {
            const configContent = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(configContent) as IConfig;
            // config.id = this.getId(arg);
            config.name = config.name || 'Default';
            config.engine = config.engine || 'default';
            config.version = config.version || '1.0.0';
            config.description = config.description || 'Kozen Engine Default Configuration';
            return config;
        } catch (error) {
            throw new Error(`Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Generates a unique pipeline identifier from configuration options
     * Combines project and stack identifiers to create a unique pipeline ID
     * 
     * @param {IConfig} [opt] - Configuration object containing project and stack information
     * @returns {string} Generated pipeline ID in format 'project-stack' or fallback ID
     * @public
     */
    public getId(opt?: IConfig) {
        return opt?.id || `${opt?.project ?? ''}-${opt?.stack ?? ''}`;
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
    public async configure(args: ICLIArgs): Promise<IConfig | null> {
        try {
            const config = args.config && await this.load(args.config);
            if (!config) {
                return null;
            }
            if (!this.assistant) {
                throw new Error("Incorrect dependency injection configuration.");
            }
            config.dependencies && await this.assistant.register(config.dependencies);
            this.logger = this.logger || await this.assistant.resolve<ILoggerService>('LoggerService');
            return config;
        } catch (error) {
            throw new Error(`Failed to configure: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Initializes the CLI controller by parsing arguments and loading configuration
     * This method combines argument parsing and configuration loading in a single operation
     * 
     * @template T - Type of arguments to return, defaults to ICLIArgs
     * @param {string[] | ICLIArgs} [argv] - Command line arguments or pre-parsed arguments
     * @returns {Promise<{args?: T, config?: IConfig | null}>} Promise resolving to parsed arguments and loaded configuration
     * @throws {Error} When argument parsing or configuration loading fails
     * @public
     */
    public async init<T = ICLIArgs>(argv?: string[] | ICLIArgs): Promise<{ args?: T, config?: IConfig | null }> {
        const args = await this.fillout(argv ?? process.argv);
        const config = await this.configure(args);
        this.args = args;
        return { args: args as T, config };
    }

    /**
     * Parses and processes command line arguments into structured format with environment variable fallbacks
     * Handles both string array arguments and pre-parsed argument objects, applying defaults from environment variables
     * 
     * @param {string[] | ICLIArgs} args - Raw command line arguments array or pre-parsed arguments object
     * @returns {Promise<ICLIArgs>} Promise resolving to structured CLI arguments with all defaults applied
     * @public
     */
    public async fillout(args: string[] | ICLIArgs): Promise<ICLIArgs> {
        let parsed: Partial<ICLIArgs> = this.extract(args);
        parsed.action = parsed.action || process.env['KOZEN_ACTION'] || 'deploy';
        let option = parsed.action?.split(":") || [];
        parsed.stack = (parsed.stack || process.env.KOZEN_STACK || process.env["NODE_ENV"] || 'dev').toUpperCase();
        parsed.project = parsed.project || process.env.KOZEN_PROJECT || getID();
        parsed.action = option?.length > 1 ? option[1] : option[0];
        parsed.controller = this.capitalizeFirstLetter(option?.length > 1 ? option[0] : (parsed.controller || process.env['KOZEN_CONTROLLER'] || '')) + 'Controller';
        parsed.config = parsed.config || process.env.KOZEN_CONFIG || 'cfg/config.json';
        return parsed as ICLIArgs;
    }

    /**
     * Extracts key-value pairs from command line arguments array using '--key=value' format
     * Supports both raw command line arrays and pre-parsed argument objects
     * 
     * @param {string[] | ICLIArgs} [argv] - Command line arguments array or parsed arguments object
     * @returns {Record<string, any>} Object containing parsed argument key-value pairs
     * @protected
     */
    protected extract(argv?: string[] | ICLIArgs): Record<string, any> {
        if (!Array.isArray(argv) && typeof argv === 'object') {
            return argv;
        }
        argv = argv || process.argv;
        return argv.slice(2).reduce((acc: Record<string, string>, arg: string) => {
            const [key, value] = arg.split('=');
            acc[key.replace('--', '')] = value;
            return acc;
        }, {});
    }

    /**
     * Waits for all pending logger operations to complete before continuing
     * Ensures all log entries are properly written before the application exits
     * 
     * @returns {Promise<void>} Promise that resolves when all pending log operations are complete
     * @public
     */
    public async wait(): Promise<void> {
        if (this.logger?.stack) {
            await Promise.all(this.logger.stack)
        }
    }

    /**
     * Logs a message using the controller's logger service with automatic categorization
     * Automatically sets category and flow ID if not specified in the input
     * 
     * @param {ILogInput} input - Log message string or structured log object with metadata
     * @param {ILogLevel} [level=ILogLevel.INFO] - Log level for the message
     * @returns {Promise<void>} Promise that resolves when logging operation completes
     * @public
     */
    public async log(input: ILogInput, level: ILogLevel = ILogLevel.INFO) {
        if (typeof input === 'object') {
            input.category = input.category || VCategory.cli.tool;
            input.flow = input.flow || this.getId(input as unknown as IConfig);
        }
        this.logger?.log(input, level);
    }

    /**
     * Capitalizes the first letter of a string while preserving the rest
     * Utility method for formatting controller names and identifiers
     * 
     * @param {string} str - String to capitalize
     * @returns {string} String with first letter capitalized, empty string if input is falsy
     * @protected
     */
    protected capitalizeFirstLetter(str: string): string {
        return str ? str[0].toUpperCase() + str.slice(1) : '';
    }
}
