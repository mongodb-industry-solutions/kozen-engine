import { exec } from "child_process";
import dotenv from "dotenv";
import os from "os";
import path from "path";
import { IEnvOptions, IShellVariables, JSONT } from "..";

/**
 * @class Env
 * @description Cross-platform environment variable management system for global inter-process communication.
 * 
 * The Env class provides a unified interface for exposing environment variables globally across
 * different operating systems (Windows, Linux, macOS), ensuring persistence beyond the Node.js
 * runtime and making variables accessible to other applications and processes.
 * 
 * Key features:
 * - Cross-platform environment variable persistence
 * - Automatic variable name and value sanitization
 * - Configurable prefixing for namespace management
 * - Support for both global and local variable scopes
 * - Integration with shell profiles for Unix systems
 * - Comprehensive logging and error handling
 * 
 * @example
 * ```typescript
 * const env = new Env({ prefix: 'MYAPP', logger: console });
 * 
 * // Expose variables globally
 * await env.expose({
 *   DATABASE_URL: 'mongodb://localhost:27017/mydb',
 *   API_VERSION: '1.2.0'
 * }, { flow: 'deployment-001' });
 * 
 * // Load from .env file
 * env.load();
 * ```
 * 
 * @implements {IEnv}
 */
export class Env {

    /**
     * Logger service instance for recording service operations and errors
     * @type {ILoggerService | null}
     */
    public logger?: Console | null;

    private prefix: string;

    /**
     * Creates a new Env instance with configurable prefix and logging
     * 
     * @constructor
     * @param {Object} [opts] - Configuration options for the environment manager
     * @param {string} [opts.prefix] - Custom prefix for environment variables (defaults to KOZEN_ENV_PREFIX or 'KOZEN_PL')
     * @param {Console} [opts.logger] - Logger instance for operation tracking
     * 
     * @example
     * ```typescript
     * // With default settings
     * const env = new Env();
     * 
     * // With custom configuration
     * const env = new Env({
     *   prefix: 'MYAPP',
     *   logger: console
     * });
     * ```
     */
    constructor(opts?: { prefix?: string, logger?: Console }) {
        const { prefix, logger } = opts || {};
        this.prefix = prefix?.trim().toUpperCase() ?? process.env["KOZEN_ENV_PREFIX"] ?? "KOZEN_PL";
        this.logger = logger as Console;
    }

    /**
     * Expose a set of variables globally for inter-process communication.
     * These variables persist outside the Node.js runtime and are accessible by other applications/processes.
     *
     * @param content - An object containing key-value pairs to be exposed as environment variables.
     */
    public async expose(content: Record<string, any>, opts?: IEnvOptions): Promise<void> {
        if (!content || typeof content !== "object") {
            throw new Error("Invalid content provided. Expected an object.");
        }

        const { prefix, flow } = opts || {};
        const currentOS = os.type();

        try {
            // Object.assign(process.env, content);
            let out = [];
            for (let prop in content) {
                if (content[prop]) {
                    let value = this.sanitizeValue(content[prop]);
                    let key = this.sanitizeKey(prop, prefix);
                    process.env[key] = value;
                    this.logger?.info({
                        flow,
                        src: "Tool:Env:expose",
                        message: "exposing environment variables",
                        data: { key, value, os: currentOS }
                    });
                    switch (currentOS) {
                        case "Windows":
                        case "Windows_NT":
                            out.push(this.setWindowsVariables({ key, value }));
                            break;
                        case "Linux":
                        case "Darwin":
                            out.push(this.setUnixVariables({ key, value }));
                            break;
                        default:
                            throw new Error(`Unsupported operating system: ${currentOS}`);
                    }
                }
            }
            await Promise.all(out);
        } catch (error) {
            this.logger?.error({
                flow,
                src: "Tool:Env:expose",
                message: "Error while exposing environment variables",
                data: { os: currentOS, content, error: (error as Error).message }
            });
            throw error;
        }
    }

    /**
     * Set environment variables on Windows using `setx`.
     * @param variables - An array of key-value pairs to set.
     */
    private setWindowsVariables({ key, value }: IShellVariables): Promise<void> {
        const scope = process.env["KOZEN_ENV_SCOPE"] || "GLOBAL"
        const command = scope === "GLOBAL" ? `setx ${key} "${value}"` : `set ${key}="${value}"`;
        return this.execCommand(command);
    }

    /**
     * Set environment variables on Linux/macOS by appending them to the shell profile file.
     * @param variables - An array of key-value pairs to set.
     */
    private async setUnixVariables({ key, value }: IShellVariables): Promise<void> {
        const scope = process.env["KOZEN_ENV_SCOPE"] || "GLOBAL"
        const shellProfilePath = scope === "GLOBAL" && Env.determineShellProfilePath();
        const exportCommand = `export ${key}="${value}"`;
        const command = !shellProfilePath ? exportCommand : `echo '${exportCommand}' >> ${shellProfilePath}`;
        return this.execCommand(command);
    }

    /**
     * Sanitize the environment variable key based on the prefix and conventions.
     * @param key - The original key.
     * @returns The sanitized key.
     */
    private sanitizeKey(key: string, prefix?: string): string {
        prefix = prefix?.trim().toUpperCase() ?? this.prefix;
        prefix = prefix ? prefix + "_" : "";
        key = prefix ? key.trim().toUpperCase() : key;
        return `${prefix}${key}`;
    }

    /**
     * Sanitize the environment variable value for compatibility.
     * @param value - The original value.
     * @returns The sanitized value.
     */
    private sanitizeValue(value: any): string {
        let limit = (process.env['KOZEN_ENV_LIMIT'] && parseInt(process.env['KOZEN_ENV_LIMIT'])) || 1024;
        let quote = process.env['KOZEN_ENV_QUOTE'] ?? '§';
        let val = JSONT.encode(value);
        val = val.replace(/(\r\n|\\r\\n|\r|\n|\\r|\\n|\t|\\t)/g, " ").replace(/\s+/g, " ");
        val = val.replace(/"/g, quote).trim();
        return val.length > limit ? val.slice(0, limit) : val;
    }

    /**
     * Execute a shell command asynchronously.
     * @param command - The shell command to execute.
     */
    private execCommand(command: string): Promise<void> {
        return new Promise((resolve, reject) => {
            exec(command, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Determine the user's shell profile file based on the OS and shell.
     * @returns The path to the shell profile file.
     */
    static determineShellProfilePath(): string | null {
        const shell = process.env.SHELL || "";
        if (shell.includes("zsh")) {
            return path.join(os.homedir(), ".zshrc");
        } else if (shell.includes("bash")) {
            return path.join(os.homedir(), ".bashrc");
        } else if (shell.includes("fish")) {
            return path.join(os.homedir(), ".config/fish/config.fish");
        } else if (os.type() === "Darwin") {
            return path.join(os.homedir(), ".bash_profile"); // Default fallback for macOS
        } else {
            return null; // Unknown shell
        }
    }

    public load() {
        dotenv.config();
    }
}

export default Env;