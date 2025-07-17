/**
 * @fileoverview Secret Manager Service - Secret Resolution Bridge Component
 * @description Bridge service for managing secrets from various backends (AWS, MongoDB, environment variables)
 * @author MongoDB Solutions Assurance Team
 * @since 4.0.0
 * @version 4.0.0
 */
import { ISecretManagerOptions } from "../models/Secret";
import { BaseService } from "./BaseService";

/**
 * @class SecretManager
 * @extends BaseService
 * @description Bridge service for secret resolution from multiple backends
 */
export class SecretManager extends BaseService {
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
    constructor(options?: ISecretManagerOptions) {
        super();
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
            options = options || this.options;
            if (!this.options?.type) {
                throw new Error("SecretManager options or type is not defined.");
            }
            const controllerName = "SecretManager" + options.type;
            const controller = await this.assistant.resolve<SecretManager>(controllerName);
            return await controller.resolve(key, options);
        }
        catch (error) {
            console.log(error);
            return null;
        }
    }

}

export default SecretManager;