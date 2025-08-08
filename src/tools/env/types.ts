/**
 * @fileoverview Type definitions for environment variable management system
 * Defines interfaces and types for the Kozen Engine environment variable handling,
 * cross-platform environment persistence, and inter-process communication.
 * 
 * @author IaC Pipeline Team
 * @since 1.0.0
 * @version 1.1.0
 */

/**
 * @interface IEnvOptions
 * @description Configuration options for environment variable operations.
 * Provides control over how environment variables are exposed and managed
 * across different operating systems and execution contexts.
 */
export interface IEnvOptions {
    /**
     * Unique flow identifier for tracking environment variable operations
     * Used for logging and debugging environment management processes
     * @type {string}
     * @optional
     */
    flow?: string;

    /**
     * Prefix to be applied to environment variable names when exposing them globally
     * Helps avoid naming conflicts and organize variables by application or context
     * @type {string}
     * @optional
     * @example 'KOZEN', 'MYAPP', 'PROD'
     */
    prefix?: string;

    /**
     * Logger instance for recording environment variable operations and errors
     * Used for debugging and auditing environment management activities
     * @type {Console}
     * @optional
     */
    logger?: Console;
}

/**
 * @interface IShellVariables
 * @description Structure for shell environment variable key-value pairs.
 * Used internally for managing individual environment variable operations
 * across different operating systems and shell environments.
 */
export interface IShellVariables {
    /**
     * Environment variable name/identifier
     * Should follow standard environment variable naming conventions (uppercase, underscores)
     * @type {string}
     * @required
     */
    key: string;

    /**
     * Environment variable value to be set
     * Will be automatically sanitized for shell compatibility
     * @type {string}
     * @required
     */
    value: string;
}

/**
 * @interface IEnv
 * @description Main interface for environment variable management operations.
 * Defines the contract for classes that handle cross-platform environment variable
 * persistence and inter-process communication in the Kozen Engine.
 * 
 * Implementations of this interface should provide:
 * - Cross-platform environment variable persistence
 * - Automatic sanitization of variable names and values
 * - Support for .env file loading
 * - Logging of environment operations
 */
export interface IEnv {
    /**
     * Logger service instance for recording environment operations and errors
     * Used for debugging, auditing, and troubleshooting environment management
     * @type {Console | null}
     * @optional
     */
    logger?: Console | null;

    /**
     * Exposes a set of variables globally for inter-process communication
     * Makes variables available system-wide, persisting beyond the Node.js process lifetime
     * 
     * @param {Record<string, any>} content - Object containing key-value pairs to expose as environment variables
     * @param {IEnvOptions} [opts] - Optional configuration for prefix, flow tracking, and logging
     * @returns {Promise<void>} Promise that resolves when all variables are successfully exposed
     * @throws {Error} When variable exposure fails due to system permissions or invalid content
     */
    expose(content: Record<string, any>, opts?: IEnvOptions): Promise<void>;

    /**
     * Loads environment variables from .env configuration files
     * Supports standard .env file format with key=value pairs
     * 
     * @returns {void}
     */
    load(): void;
}
