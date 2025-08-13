
import { ILoggerService } from "../models/Logger";
import { IProcessorService } from "../models/Processor";
import { ISecretManager } from "../models/Secret";
import { IMetadata, IStruct, VCategory } from "../models/Types";
import { IIoC } from "../tools";

/**
 * @fileoverview Variable Processor Service - Variable Resolution Bridge Component
 * Service that acts as a bridge between template variable definitions and their resolved values.
 * This service abstracts the complexity of variable resolution from different sources including
 * environment variables, reference scopes, secrets, and static values.
 * 
 * The ProcessorService implements a bridge pattern by providing a unified interface for
 * variable resolution regardless of the source type, enabling templates to use variables
 * without knowing their specific resolution mechanisms.
 * 
 * @class ProcessorService
 * @author MDB SAT
 * @since 1.0.4
 * @version 1.0.5
 * 
 * @example
 * ```typescript
 * // Basic usage with environment variables and secrets
 * const processor = new ProcessorService({
 *   scope: { deploymentId: 'prod-001' },
 *   srvSecret: secretManager
 * });
 * 
 * const variables = [
 *   { name: 'environment', type: 'environment', value: 'NODE_ENV' },
 *   { name: 'deploymentId', type: 'reference', value: 'deploymentId' },
 *   { name: 'apiKey', type: 'secret', value: 'production/api-key' },
 *   { name: 'region', type: 'static', value: 'us-east-1' }
 * ];
 * 
 * const resolved = await processor.process(variables);
 * // Returns: { environment: 'production', deploymentId: 'prod-001', apiKey: '***', region: 'us-east-1' }
 * ```
 */
export class ProcessorService implements IProcessorService {
    /**
     * Optional assistant for IoC resolution
     * @public
     * @type {IIoC}
     * Used for resolving dependencies such as SecretManager if not provided directly.
     */
    public assistant?: IIoC;

    /**
     * Logger service instance for recording variable processing operations
     * @type {ILoggerService | null}
     */
    public logger?: ILoggerService | null;

    /**
     * Variable scope for reference resolution
     * @private
     * @type {IStruct}
     * Stores key-value pairs that can be referenced by template variables.
     * This scope provides a context for resolving reference-type variables and enables
     * variable interpolation within template processing workflows.
     */
    private scope: IStruct;

    /**
     * Secret manager service instance
     * @private
     * @type {ISecretManager}
     * Secret manager service for resolving secure variables from external
     * secret stores like AWS Secrets Manager, Azure Key Vault, or other secure backends.
     */
    private srvSecret?: ISecretManager;

    /**
     * Creates a new ProcessorService instance
     * @constructor
     * @param {Object} options - Configuration options for the variable processor
     * @param {IStruct} [options.scope={}] - Optional initial scope for reference variable resolution
     * @param {ISecretManager} options.srvSecret - Secret manager service for secure variable resolution
     * 
     * Initializes the variable processor with a reference scope and secret manager.
     * The processor serves as a bridge between template variable definitions and their actual
     * values from various sources (environment, scope, secrets, static values).
     * 
     * @example
     * ```typescript
     * // Initialize with custom scope and secret manager
     * const processor = new ProcessorService({
     *   scope: {
     *     projectName: 'my-project',
     *     version: '1.0.0',
     *     environment: 'production'
     *   },
     *   srvSecret: new SecretManager({
     *     region: 'us-east-1',
     *     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
     *     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
     *   })
     * });
     * ```
     */
    constructor(scope: IStruct = {}, dep?: { assistant: IIoC, logger: ILoggerService, srvSecret?: ISecretManager }) {
        this.scope = scope;
        this.assistant = dep?.assistant;
        this.logger = dep?.logger;
        this.srvSecret = dep?.srvSecret;
    }

    /**
     * Processes variable definitions and resolves their values from various sources
     * @public
     * @param {IMetadata[]} inputs - Array of variable definitions to process
     * @param {IStruct} [scope] - Optional scope to use for reference resolution, defaults to instance scope
     * @returns {Promise<IStruct>} Promise resolving to an object containing resolved variable values
     * @throws {Error} When variable resolution fails due to missing sources or access issues
     * 
     * This method acts as the main bridge between variable definitions and their resolved values.
     * It supports multiple variable types and provides a unified resolution mechanism:
     * 
     * - **environment**: Resolves from process environment variables
     * - **reference**: Resolves from provided scope context
     * - **secret**: Resolves from external secret management systems
     * - **default/static**: Uses the provided value directly
     * 
     * The method processes variables sequentially, allowing later variables to reference
     * values resolved by earlier variables in the same processing cycle.
     * 
     * @example
     * ```typescript
     * const variableDefinitions = [
     *   {
     *     name: 'databaseUrl',
     *     type: 'environment',
     *     value: 'DATABASE_URL',
     *     default: 'mongodb://localhost:27017/default'
     *   },
     *   {
     *     name: 'clusterName',
     *     type: 'reference',
     *     value: 'deploymentId',
     *     default: 'default-cluster'
     *   },
     *   {
     *     name: 'apiSecret',
     *     type: 'secret',
     *     value: 'production/mongodb-atlas/api-key',
     *     default: null
     *   },
     *   {
     *     name: 'region',
     *     type: 'static',
     *     value: 'us-east-1'
     *   }
     * ];
     * 
     * const resolvedVars = await processor.process(variableDefinitions, {
     *   deploymentId: 'prod-cluster-001'
     * });
     * 
     * // Result includes all resolved variables:
     * // {
     * //   databaseUrl: 'mongodb://prod.example.com:27017/app',
     * //   clusterName: 'prod-cluster-001',
     * //   apiSecret: 'resolved-secret-value',
     * //   region: 'us-east-1'
     * // }
     * ```
     */
    public async process(inputs: IMetadata[], scope?: IStruct, flow?: string): Promise<IStruct> {
        const result: IStruct = {};
        scope = scope || this.scope;
        await Promise.all(inputs.map((definition, index) => this.transform(definition, scope, result, flow, index)));
        return result;
    }

    /**
     * Processes a list of metadata objects and maps them into structured items and warnings.
     * This method ensures unique items while tracking duplicates if they exist.
     *
     * @param {IMetadata[]} inputs - An array of metadata objects to be processed and mapped.
     * @param {string} [flow] - An optional flow identifier to specify processing context (currently unused).
     * @returns {Promise<{ items: IStruct, warns: IStruct }>} - A promise resolving to an object containing:
     *   - `items`: A structured collection of unique metadata objects.
     *   - `warns`: A structured collection of warnings, specifically tracking duplicates.
     */
    public async map(inputs: IMetadata[], flow?: string): Promise<{ items: IStruct, warns: IStruct }> {
        const items: IStruct = {};
        const warns: IStruct = {};
        await Promise.all(inputs.map((item, index) => {
            item.name = item.name || "default";
            if (!items[item.name]) {
                items[item.name] = item;
            } else {
                warns[item.name] = warns[item.name] || { duplicate: 0 };
                warns[item.name].duplicate++;
            }
        }));
        return { items, warns };
    }

    /**
     * Transforms a single variable definition by resolving its value from the appropriate source
     * @public
     * @param {IMetadata} definition - Variable definition containing type, value, and metadata
     * @param {IStruct} [scope={}] - Optional scope context for reference variable resolution
     * @param {IStruct} [result={}] - Result object to accumulate resolved variables
     * @returns {Promise<IStruct>} Promise resolving to the result object with the resolved variable added
     */
    public async transform(def: IMetadata | string, scope: IStruct = {}, result: IStruct = {}, flow: string = '', index: number = 0): Promise<IStruct> {
        const definition: IMetadata = typeof def === 'string' ? { value: def, name: String(index) } : def;
        const { type, value, default: defaultValue, name: key = 'default' } = definition;
        switch (type) {
            case "protected":
            case "environment":
                result[key || index] = process.env[value || key] ?? defaultValue;
                break;

            case "reference":
                result[key || index] = scope[value || key] ?? defaultValue;
                break;

            case "secret":
                result[key || index] = await this.resolveSecret(value || key, defaultValue, flow);
                break;

            default:
                result[key || index] = value;
                break;
        }
        return result;
    }

    /**
     * Resolves a secret value from the configured secret manager
     * 
     * @private
     * @param {string} secretKey - The key or path to the secret in the secret management system
     * @param {any} [defaultValue] - Optional default value to use if secret resolution fails
     * @returns {Promise<any>} Promise resolving to the secret value or the default value
     * 
     * Safely resolves secrets from external secret management systems with
     * comprehensive error handling. If secret resolution fails, logs the error and returns
     * the default value to prevent deployment failures due to temporary secret access issues.
     * 
     * @example
     * ```typescript
     * // This is typically called internally by the process() method
     * const secretValue = await this.resolveSecret('production/database/password', 'fallback-value');
     * ```
     */
    private async resolveSecret(secretKey: string, defaultValue?: any, flow?: string): Promise<any> {
        try {
            if (!this.srvSecret && this.assistant) {
                this.srvSecret = await this.assistant.resolve<ISecretManager>('SecretManager');
            }
            const resolvedSecret = await this.srvSecret?.resolve(secretKey, { flow });
            return resolvedSecret ?? defaultValue;
        } catch (error) {
            this.logger?.error({
                flow,
                category: VCategory.core.template,
                src: 'Service:VarProcessor:resolveSecret',
                message: `Failed to resolve secret for key "${secretKey}": ${(error as Error).message}`
            })
            return defaultValue;
        }
    }
}

export default ProcessorService;