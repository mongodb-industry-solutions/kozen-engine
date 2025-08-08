/**
 * @fileoverview SecretController - CLI to SecretManager bridge component
 * Controller for managing encrypted secrets through CLI interactions with pluggable SecretManager providers.
 * Supports operations like storing, retrieving, and managing secrets with encryption across multiple backends.
 *
 * @author IaC Pipeline Team
 * @since 1.0.0
 * @version 1.1.0
 */
import { IConfig } from '../models/Pipeline';
import { ISecretArgs, ISecretManager } from '../models/Secret';
import { IAction, ICLIArgs } from '../models/Types';
import { CLIController } from './CLIController';

/**
 * @class SecretController
 * @extends CLIController
 * @description CLI controller for managing encrypted secrets and credentials.
 * 
 * This controller provides command-line interface for interacting with the Kozen Engine
 * secret management system, supporting multiple backends including AWS Secrets Manager
 * and MongoDB with Client-Side Field Level Encryption (CSFLE).
 * 
 * @example
 * ```typescript
 * const secretController = new SecretController();
 * await secretController.set({ key: 'API_KEY', value: 'secret-value' });
 * const value = await secretController.get({ key: 'API_KEY' });
 * ```
 */
export class SecretController extends CLIController {

    /**
     * Saves an encrypted secret to the configured secret management backend
     * Stores the secret using the resolved SecretManager service with automatic encryption
     * 
     * @param {Object} options - Secret storage options
     * @param {string} options.key - Unique identifier for the secret
     * @param {string} options.value - Secret value to be encrypted and stored
     * @returns {Promise<boolean>} Promise resolving to true if save operation succeeds, false otherwise
     * @throws {Error} When secret manager resolution fails or storage operation encounters errors
     * @public
     */
    public async set(options: { key: string, value: string }): Promise<boolean> {
        try {
            const { key, value } = options;
            const srvSecret = await this.assistant?.resolve<ISecretManager>('SecretManager');
            const result = await srvSecret!.save(key, value);
            this.logger?.info({
                flow: this.getId(options as unknown as IConfig),
                src: 'Controller:Secret:set',
                message: `✅ Secret '${key}' saved successfully.`
            });
            return result;
        } catch (error) {
            this.logger?.error({
                flow: this.getId(options as unknown as IConfig),
                src: 'Controller:Secret:set',
                message: `❌ Failed to resolve secret '${options.key}': ${(error as Error).message}`
            });
            return false;
        }
    }

    /**
     * Retrieves and decrypts a secret from the configured secret management backend
     * Resolves the secret using the SecretManager service with automatic decryption
     * 
     * @param {Object} options - Secret retrieval options
     * @param {string} options.key - Unique identifier of the secret to retrieve
     * @returns {Promise<string | null>} Promise resolving to decrypted secret value or null if not found
     * @throws {Error} When secret manager resolution fails or retrieval operation encounters errors
     * @public
     */
    public async get(options: { key: string }): Promise<string | null> {
        try {
            const { key } = options;
            const srvSecret = await this.assistant?.resolve<ISecretManager>('SecretManager');
            const value = await srvSecret!.resolve(key);
            if (value) {
                this.logger?.info({
                    flow: this.getId(options as unknown as IConfig),
                    src: 'Controller:Secret:get',
                    message: `✅ Resolved secret '${key}': ${value}`
                });
            } else {
                this.logger?.info({
                    flow: this.getId(options as unknown as IConfig),
                    src: 'Controller:Secret:get',
                    message: `🔍 Secret '${key}' not found.`
                });
            }
            return String(value) || null;
        } catch (error) {
            this.logger?.error({
                flow: this.getId(options as unknown as IConfig),
                src: 'Controller:Secret:get',
                message: `❌ Failed to resolve secret '${options.key}': ${(error as Error).message}`
            });
            return null;
        }
    }

    /**
     * Retrieves metadata information about the secret management configuration
     * Provides details about the current SecretManager backend and its configuration
     * 
     * @param {Object} options - Metadata retrieval options
     * @param {string} options.key - Key identifier (currently unused but maintained for interface consistency)
     * @returns {Promise<any | null>} Promise resolving to secret manager configuration metadata or null if unavailable
     * @public
     */
    public async metadata(options: { key: string }) {
        try {
            const srvSecret = await this.assistant?.resolve<ISecretManager>('SecretManager');
            return srvSecret?.options;
        } catch (error) {
            this.logger?.error({
                flow: this.getId(options as unknown as IConfig),
                src: 'Controller:Secret:metadata',
                message: `❌ Failed to resolve secret manager metadata: ${(error as Error).message}`
            });
            return null;
        }
    }

    /**
     * Displays comprehensive CLI usage information for secret management operations
     * Shows available commands, options, and examples for the Secret Manager tool
     * 
     * @returns {void}
     * @public
     */
    public help(): void {
        console.log(`
===============================================================================
Kozen Engine (Secret Manager Tool)
===============================================================================

Description:
    Securely manage encrypted secrets and credentials through multiple backend
    providers including AWS Secrets Manager and MongoDB with Client-Side Field
    Level Encryption (CSFLE). Provides centralized secret storage with automatic
    encryption and decryption capabilities.

Usage:
    kozen --action=secret:<action> --key=<name> [options]
    kozen --controller=secret --action=<action> --key=<name> [options]

Core Options:
    --stack=<id>                    Environment identifier (dev, test, staging, prod)
                                    (default: from NODE_ENV or 'dev')
    --project=<id>                  Project identifier for secret organization
                                    (default: auto-generated timestamp ID)
    --config=<file>                 Configuration file path containing secret manager settings
                                    (default: cfg/config.json)
    --controller=secret             Explicitly set controller to secret
    --action=<[controller:]action>  Secret management operation to perform:

Available Actions:
    set                             Store a new secret or update existing one
                                    - Encrypts secret value automatically
                                    - Supports multiple backend providers
                                    - Requires --key and --value parameters
    
    get                             Retrieve and decrypt a stored secret
                                    - Automatically decrypts secret value
                                    - Returns null if secret not found
                                    - Requires --key parameter
    
    metadata                        Display secret manager configuration
                                    - Shows current backend provider details
                                    - Displays encryption settings
                                    - Useful for troubleshooting

Secret Management Options:
    --key=<name>                    Secret identifier/name (REQUIRED for all actions)
                                    Examples: API_KEY, DATABASE_PASSWORD, JWT_SECRET
    --value=<content>               Secret value to store (REQUIRED for 'set' action)
                                    Can contain passwords, API keys, certificates, etc.

Environment Variables:
    KOZEN_CONFIG                    Default value assigned to the --config property
    KOZEN_ACTION                    Default value assigned to the --action property
    KOZEN_STACK                     Default value assigned to the --stack property
    KOZEN_PROJECT                   Default value assigned to the --project property

    KOZEN_SM_KEY                    Default value assigned to the --key property
    KOZEN_SM_VAL                    Default value assigned to the --value property
    KOZEN_SM_ALT                    Default value for alternative key name, it provides fallback key naming for MongoDB-based secrets.

Backend Providers:
    AWS Secrets Manager             Enterprise-grade secret storage with IAM integration
    MongoDB CSFLE                   Client-side encryption with MongoDB storage
    
Security Features:
    - Automatic encryption/decryption
    - Multiple backend provider support
    - Environment-based secret isolation
    - Audit logging for all operations

Examples:
    # Store a new API key
    kozen --action=secret:set --key=STRIPE_API_KEY --value="sk_test_abc123..."
    
    # Retrieve an existing secret
    kozen --action=secret:get --key=STRIPE_API_KEY
    
    # Store database credentials with environment separation
    kozen --action=secret:set --key=DB_PASSWORD --value="secure-password" --stack=production
    
    # Alternative syntax with explicit controller
    kozen --controller=secret --action=get --key=JWT_SECRET
    
    # Get secret manager configuration details
    kozen --action=secret:metadata --key=any
    
    # Store secret with project-specific organization
    kozen --action=secret:set --key=OAUTH_CLIENT_SECRET --value="client-secret" --project=MyApp-v2.0
    
    # Using environment variables for convenience
    export KOZEN_SM_KEY=API_TOKEN
    export KOZEN_SM_VAL=token-value-here
    kozen --action=secret:set
===============================================================================
        `);
    }

    /**
     * Parses and processes command line arguments specific to secret management operations
     * Extends base argument parsing with secret-specific defaults and environment variable fallbacks
     * 
     * @param {string[] | ICLIArgs} args - Raw command line arguments array or pre-parsed arguments
     * @returns {Promise<ISecretArgs>} Promise resolving to structured secret arguments with defaults applied
     * @public
     */
    public async fillout(args: string[] | ICLIArgs): Promise<ISecretArgs> {
        let parsed: Partial<ISecretArgs> = this.extract(args);
        parsed.action !== 'metadata' && (parsed.key = parsed.key || (process.env.KOZEN_SM_KEY as IAction));
        parsed.action === 'set' && (parsed.value = parsed.value || process.env.KOZEN_SM_VAL);
        return parsed as ISecretArgs;
    }
}
