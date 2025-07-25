/**
 * @fileoverview Secret Manager Service - Secret Resolution Bridge Component
 * @description Bridge service for managing secrets from various backends (AWS, MongoDB, environment variables)
 * @author MDB SAT
 * @since 1.0.4
 * @version 1.0.5
 */
import { ILoggerService } from "../models/Logger";
import { ISecretManager, ISecretManagerOptions } from "../models/Secret";
import { VCategory } from "../models/Types";
import { IIoC } from "../tools";
import { BaseService } from "./BaseService";

/**
 * @class SecretManager
 * @extends BaseService
 * @description Bridge service for secret resolution from multiple backends
 */
export class SecretManager extends BaseService implements ISecretManager {
    /**
     * Secret manager configuration options
     * @protected
     * @type {ISecretManagerOptions | undefined}
     */
    protected _options?: ISecretManagerOptions;

    /**
     * Gets the current secret manager configuration options
     * @public
     * @readonly
     * @type {ISecretManagerOptions}
     * @returns {ISecretManagerOptions} The current secret manager configuration
     * @throws {Error} When configuration is not initialized
     */
    get options(): ISecretManagerOptions {
        return this._options!;
    }

    /**
     * Sets the secret manager configuration options
     * @public
     * @param {ISecretManagerOptions} value - Secret manager configuration to set
     */
    set options(value: ISecretManagerOptions) {
        this._options = value;
    }

    /**
     * Creates a new SecretManager instance
     * @constructor
     * @param {ISecretManagerOptions} [options] - Optional secret manager configuration
     */
    constructor(options?: ISecretManagerOptions, dep?: { assistant: IIoC, logger: ILoggerService }) {
        super(dep);
        this.options = options!;
    }

    /**
     * Resolves a secret value from the configured backend
     * @public
     * @param {string} key - The secret key to resolve
     * @param {ISecretManagerOptions} [options] - Optional configuration override
     * @returns {Promise<string | null | undefined | number | boolean>} Promise resolving to the secret value
     * @throws {Error} When secret resolution fails
     */
    public async resolve(key: string, options?: ISecretManagerOptions): Promise<string | null | undefined | number | boolean> {
        const value = await this.getValue(key, options);
        return value ?? process.env[key];
    }

    protected async getValue(key: string, options?: ISecretManagerOptions): Promise<string | null | undefined | number | boolean> {
        try {
            if (!this.assistant) {
                throw new Error("Incorrect dependency injection configuration.");
            }
            options = { ...this.options, ...options };
            if (!this.options?.type) {
                throw new Error("SecretManager options or type is not defined.");
            }
            const controllerName = "SecretManager" + options.type;
            const controller = await this.assistant.resolve<ISecretManager>(controllerName);
            return await controller.resolve(key, options);
        }
        catch (error) {
            this.logger?.error({
                flow: options?.flow,
                category: VCategory.core.secret,
                src: 'Service:SecretManager:getValue',
                message: (error as Error).message
            });
            return null;
        }
    }

}

export default SecretManager;