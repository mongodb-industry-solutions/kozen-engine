import { promises as fs } from 'fs';
import defConfig from "../../../cfg/config.json";
import { KzModule } from '../../shared/controllers/KzModule';
import { IArgs } from '../../shared/models/Args';
import { VCategory } from "../../shared/models/Types";
import { getID, IDependencyMap, IIoC, ILogInput, ILogLevel, IoC } from "../../shared/tools";
import { ILoggerService } from "../logger/models/Logger";
import ioc from "./configs/ioc.json";
import { IConfig } from './models/Config';
import { IModuleOpt } from './models/Module';

export class AppModule {

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
    public get helper(): IIoC | null | undefined {
        return this.assistant;
    }

    /**
     * Gets the parsed command line arguments
     * @template T - Type of arguments to return, defaults to IArgs
     * @returns {T} The parsed arguments cast to specified type
     * @public
     */
    public getArgs<T = IArgs>(): T {
        return this.args as T;
    }

    /**
     * Logger service instance for recording CLI operations and errors
     * @type {ILoggerService | null}
     * @public
     */
    public get logger(): ILoggerService | null {
        return this.assistant?.logger as unknown as ILoggerService || null;
    }

    /**
     * Creates a new CLIController instance with dependency injection support
     * 
     * @constructor
     * @param {Object} [dependency] - Optional dependency injection configuration
     * @param {IIoC} [dependency.assistant] - IoC container for service resolution
     * @param {ILoggerService} [dependency.logger] - Logger service for operation tracking
     */
    constructor(dependency?: { assistant: IIoC }) {
        this.assistant = dependency?.assistant ?? new IoC();
    }

    /**
     * Loads pipeline configuration from a JSON file
     * @public
     * @param {string} configPath - File system path to the configuration file
     * @returns {Promise<IConfig>} Promise resolving to the loaded and parsed pipeline configuration
     * @throws {Error} When file reading fails, JSON parsing errors occur, or file access is denied
     */
    public async load(configPath: string): Promise<IConfig | null> {
        try {
            const configContent = await fs.readFile(configPath, 'utf8');
            const config = JSON.parse(configContent) as IConfig;
            return config;
        } catch (_) {
            return null;
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
     * @param {IArgs} args - Secret controller configuration arguments
     * @returns {Promise<void>} Promise that resolves when configuration is complete
     * @throws {Error} When configuration fails due to invalid configuration or dependency registration errors
     */
    public async configure(args: IArgs): Promise<IConfig | null> {
        try {
            const config = (args.config && await this.load(args.config)) || defConfig as unknown as IConfig;
            // config.id = this.getId(arg);
            config.name = config.name || 'Default';
            config.engine = config.engine || 'default';
            config.version = config.version || '1.0.0';
            config.description = config.description || 'Kozen Engine Default Configuration';
            config.type = args.type || config.type || 'cli';

            if (!config) {
                return null;
            }

            if (!this.assistant) {
                throw new Error("Incorrect dependency injection configuration.");
            }

            config.dependencies && await this.assistant.register(config.dependencies);
            return config;
        } catch (error) {
            throw new Error(`Failed to configure: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Initializes the CLI controller by parsing arguments and loading configuration
     * This method combines argument parsing and configuration loading in a single operation
     *
     * @template T - Type of arguments to return, defaults to IArgs
     * @param {string[] | IArgs} [argv] - Command line arguments or pre-parsed arguments
     * @returns {Promise<{args?: T, config?: IConfig | null}>} Promise resolving to parsed arguments and loaded configuration
     * @throws {Error} When argument parsing or configuration loading fails
     * @public
     */
    public async init<T = IArgs>(argv?: string[] | IArgs): Promise<{ args?: T, config?: IConfig | null }> {
        const args = await this.fill(argv ?? process.argv);
        const config = await this.configure(args);
        this.args = args;
        return { args: args as T, config };
    }

    public async register(config: IConfig | null, opts?: any): Promise<void> {
        if (!config?.modules?.load?.length) {
            return;
        }
        if (!this.assistant) {
            throw new Error("Incorrect dependency injection configuration.");
        }
        await this.assistant.register(ioc as IDependencyMap);
        for (const key in config.modules.load || []) {
            let module = config?.modules?.load[key];
            if (module) {
                module = typeof module === 'string' ? { name: module } : module;
                module.path = module.path || config?.modules?.path || "../../../modules";
                const mod = await this.getModule(module, config);
                if (mod?.register instanceof Function) {
                    const dependencies = await mod.register(config, opts);
                    dependencies && await this.assistant.register(dependencies);
                }
                if (!this.assistant.logger) {
                    this.assistant.logger = await this.assistant.get<ILoggerService>('logger:service') as unknown as Console;
                }
            }
        }
    }

    public async getModule(mod: IModuleOpt, config: IConfig | null): Promise<KzModule | null> {
        let namespace = "module:" + mod.name;
        await this.assistant?.register({
            [namespace]: {
                "path": mod.path,
                "lifetime": "singleton",
                "args": [{}],
                "dependencies": [
                    {
                        "key": "assistant",
                        "target": "IoC",
                        "type": "ref"
                    }
                ]
            }
        });
        return await this.assistant?.get<KzModule>(namespace) || null;
    }

    /**
     * Parses and processes command line arguments into structured format with environment variable fallbacks
     * Handles both string array arguments and pre-parsed argument objects, applying defaults from environment variables
     *
     * @param {string[] | IArgs} args - Raw command line arguments array or pre-parsed arguments object
     * @returns {Promise<IArgs>} Promise resolving to structured CLI arguments with all defaults applied
     * @public
     */
    public async fill(args: string[] | IArgs): Promise<IArgs> {
        let parsed: Partial<IArgs> = this.extract(args);
        parsed.action = parsed.action || process.env['KOZEN_ACTION'] || 'help';
        let option = parsed.action?.split(":") || [];
        parsed.stack = (parsed.stack || process.env.KOZEN_STACK || process.env["NODE_ENV"] || 'dev').toUpperCase();
        parsed.project = parsed.project || process.env.KOZEN_PROJECT || getID();
        parsed.action = option?.length > 1 ? option[1] : option[0];
        parsed.controller = `${(parsed.controller || process.env['KOZEN_CONTROLLER'] || option?.length && option[0] || '')}:controller` + (parsed.type ? `:${parsed.type}` : '');
        parsed.config = parsed.config || process.env.KOZEN_CONFIG || 'cfg/config.json';
        return parsed as IArgs;
    }

    /**
     * Extracts key-value pairs from command line arguments array using '--key=value' format
     * Supports both raw command line arrays and pre-parsed argument objects
     *
     * @param {string[] | IArgs} [argv] - Command line arguments array or parsed arguments object
     * @returns {Record<string, any>} Object containing parsed argument key-value pairs
     * @protected
     */
    protected extract(argv?: string[] | IArgs): Record<string, any> {
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