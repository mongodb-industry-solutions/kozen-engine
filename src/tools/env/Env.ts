import { exec } from "child_process";
import dotenv from "dotenv";
import os from "os";
import path from "path";

/**
 * A class to expose environment variables globally across processes and different operating systems.
 * Supports Windows, Linux, and macOS.
 */
export class Env {
    private prefix: string;

    constructor(prefix: string = "KOZEN_PL") {
        this.prefix = prefix.trim().toUpperCase();
    }

    /**
     * Expose a set of variables globally for inter-process communication.
     * These variables persist outside the Node.js runtime and are accessible by other applications/processes.
     *
     * @param content - An object containing key-value pairs to be exposed as environment variables.
     */
    public async expose(content: Record<string, any>, prefix: string = "KOZEN_PL"): Promise<void> {
        if (!content || typeof content !== "object") {
            throw new Error("Invalid content provided. Expected an object.");
        }

        const currentOS = os.type();

        try {
            // Object.assign(process.env, content);
            let out = [];
            for (let prop in content) {
                if (content[prop]) {
                    let value = this.sanitizeValue(content[prop]);
                    let key = this.sanitizeKey(prop, prefix);
                    process.env[key] = value;
                    switch (currentOS) {
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
            console.error("Error while exposing environment variables:", error);
            throw error;
        }
    }

    /**
     * Set environment variables on Windows using `setx`.
     * @param variables - An array of key-value pairs to set.
     */
    private setWindowsVariables({ key, value }: { key: string; value: string }): Promise<void> {
        const exportCommand = `setx ${key} "${value}"` || `set ${key}="${value}"`;
        return this.execCommand(exportCommand);
    }

    /**
     * Set environment variables on Linux/macOS by appending them to the shell profile file.
     * @param variables - An array of key-value pairs to set.
     */
    private async setUnixVariables({ key, value }: { key: string; value: string }): Promise<void> {
        const shellProfilePath = Env.determineShellProfilePath();
        if (!shellProfilePath) {
            throw new Error("Unable to determine your shell profile file.");
        }
        const exportCommand = `export ${key}="${value}"`;
        return this.execCommand(`echo '${exportCommand}' >> ${shellProfilePath}`);
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
        return String(value).trim();
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
