import { promises as fs } from 'fs';
import defConfig from "../../../cfg/config.json";
import { IArgs } from '../models/Args';
import { IConfig } from '../models/Config';
import { IModule, IModuleOpt } from '../models/Module';
import { IAppType } from "../models/Types";
import { getID, IDependency, IDependencyMap } from "../tools";
import { ILogger } from '../tools/log/types';
import { KzModule } from './KzModule';

export class KzApp extends KzModule {

    /**
     * Parsed command line arguments
     * @type {any}
     * @protected
     */
    protected args: any;

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
     * Configures the secret controller with provided arguments and dependencies
     * @public
     * @param {IArgs} args - Secret controller configuration arguments
     * @returns {Promise<void>} Promise that resolves when configuration is complete
     * @throws {Error} When configuration fails due to invalid configuration or dependency registration errors
     */
    public async configure(args: IArgs): Promise<IConfig | null> {
        try {
            const config = (args.config && await this.load(args.config)) || {} as IConfig;
            const defCfg = defConfig as unknown as IConfig;

            !config.modules && (config.modules = {});
            !config.dependencies && (config.dependencies = {} as IDependencyMap);

            config.id = config.id || this.getId(args);
            config.name = config.name || defCfg.name || 'Default';
            config.engine = config.engine || defCfg.engine || 'default';
            config.version = config.version || defCfg.version || '1.0.0';
            config.description = config.description || defCfg.description || 'Kozen Engine Default Configuration';
            config.type = args.type || config.type || defCfg.type || 'cli';
            config.modules.path = config.modules.path || defCfg.modules?.path || args.modulePath || process.env.KOZEN_MODULE_PATH;
            config.modules.mode = config.modules.mode || defCfg.modules?.mode || args.moduleMode || process.env.KOZEN_MODULE_MODE || 'inherit';
            config.modules.load = config.modules.load || args.moduleLoad?.split(',') || process.env.KOZEN_MODULE_LOAD?.split(',');
            if (config.modules.mode === 'inherit') {
                const baseLoad = Array.isArray(config.modules.load) ? config.modules.load : [];
                const defLoad = Array.isArray(defCfg.modules?.load) ? defCfg.modules.load : [];
                config.modules.load = [...new Set([...defLoad, ...baseLoad])];
            } else {
                config.modules.load = config.modules.load || defCfg.modules?.load;
            }
            config.dependencies = { ...(defCfg.dependencies as IDependencyMap), ...(config.dependencies as IDependencyMap) };
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

    public async register(config: IConfig | null, opts?: any): Promise<Record<string, IDependency> | null> {
        if (!config?.modules?.load) {
            return null;
        }
        if (!this.assistant) {
            throw new Error("Incorrect dependency injection configuration.");
        }
        await this.assistant.register(config.dependencies as IDependencyMap);
        await this.importList(config.modules.load, config, opts);
        return null;
    }

    /**
     * Imports and registers a list of modules based on provided configuration
     * @param list List of modules to import
     * @param config Module configuration
     * @param opts Additional options for registration
     */
    public async importList(list: Array<string | IModuleOpt>, config: IConfig | null, opts?: any) {
        for (const key in list || []) {
            let module = list[key];
            module && await this.importItem(module, config, opts);
        }
    }

    /**
     * Imports and registers a single module based on provided configuration
     * @param module Module to import
     * @param config Module configuration
     * @param opts Additional options for registration
     */
    public async importItem(module: string | IModuleOpt, config: IConfig | null, opts?: any) {
        // Ensure assistant is available
        if (!this.assistant) {
            throw new Error("Incorrect dependency injection configuration.");
        }
        // Get module instance
        const mod = await this.getModule(module, config);
        // Check module requirements
        if (mod?.requires instanceof Function) {
            const dependencies = await mod.requires(config, opts);
            dependencies?.length && await this.importList(dependencies, config, opts);
        }
        // Register module dependencies
        if (mod?.register instanceof Function) {
            const dependencies = await mod.register(config, opts);
            dependencies && await this.assistant.register(dependencies);
        }
        // Ensure logger is available
        if (!this.assistant.logger) {
            this.assistant.logger = await this.assistant.get<ILogger>('logger:service') as unknown as Console;
        }
    }

    /**
     * Retrieves a module instance based on the provided configuration
     * @param mod Module options or name
     * @param config Module configuration
     * @returns The resolved module instance or null if not found
     */
    public async getModule(mod: IModuleOpt | string, config: IConfig | null): Promise<IModule | null> {
        mod = typeof mod === 'string' ? { name: mod } : mod;
        mod.path = mod.path || config?.modules?.path || process.env.KOZEN_MODULE_PATH;
        let namespace = mod.key || "module:" + (mod.alias || mod.name);
        let dep: IDependency = {
            ...{
                "category": "module",
                "lifetime": "singleton",
                "dependencies": [
                    {
                        "key": "assistant",
                        "target": "IoC",
                        "type": "ref"
                    }
                ]
            },
            ...mod,
        };
        await this.assistant?.register({ [namespace]: dep });
        const obj = await this.assistant?.get<IModule>(namespace) || null;
        if (obj) {
            obj.metadata = obj.metadata || {};
            obj.metadata.src = dep;
            obj.metadata.namespace = namespace;
            obj.metadata.name = obj.metadata.name || mod.name;
            obj.metadata.alias = obj.metadata.alias || mod.alias || mod.name;
        }
        return obj;
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
        parsed.type = parsed.type || (process.env.KOZEN_APP_TYPE as IAppType) || 'cli' as IAppType;
        parsed.module = `${(parsed.module || process.env['KOZEN_MODULE'] || option?.length && option[0] || '')}:controller` + (parsed.type ? `:${parsed.type}` : '');
        parsed.config = parsed.config || process.env.KOZEN_CONFIG;
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
    public extract(argv?: string[] | IArgs): Record<string, any> {
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