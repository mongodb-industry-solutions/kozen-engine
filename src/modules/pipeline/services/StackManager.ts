/**
 * @fileoverview Stack Manager Service - Infrastructure Stack Bridge Component
 * @description Service for managing infrastructure stacks using Pulumi automation
 * @author MDB SAT
 * @since 1.0.4
 * @version 1.0.5
 */

import { ITransformOption } from "../../../shared/models/Component";
import { IResult } from "../../../shared/models/Result";
import { IStruct, VCategory } from "../../../shared/models/Types";
import { BaseService } from "../../../shared/services/BaseService";
import { IIoC } from "../../../shared/tools";
import { ILoggerService } from "../../logger/models/Logger";
import { IStackManager, IStackOptions } from "../models/Stack";

/**
 * @class StackManager
 * @extends BaseService
 * @description Bridge service for managing infrastructure stacks using Pulumi automation
 */
export class StackManager extends BaseService implements IStackManager {

    /**
     * Stack configuration options
     * @protected
     * @type {IStackOptions}
     */
    protected _config: IStackOptions;

    public get config() {
        return this._config;
    }

    /**
     * Creates a new StackManager instance
     * @constructor
     * @param {IStackOptions} [config] - Optional stack configuration options
     */
    constructor(config?: IStackOptions | null, dep?: { assistant: IIoC, logger: ILoggerService }) {
        super(dep);
        this._config = config || {};
        this.prefix = "pipeline:stack:manager:";
    }

    /**
     * Executes stack operations through orchestrator-specific implementations
     * @protected
     * @param config - Stack configuration options for orchestrator selection
     * @param action - Operation name to execute on stack manager
     * @param args - Arguments array to pass to operation method
     * @returns Promise resolving to operation result with status and metadata
     */
    protected async execute(config: IStackOptions, action: string, args: Array<any>): Promise<IResult> {
        const controller = await this.getDelegate<IStackManager>(config.orchestrator || 'node');
        const method = controller[action as keyof IStackManager] as Function;
        return await method?.apply(controller, args);
    }

    /**
     * Configures stack manager with project and stack naming for deployment operations
     * @public
     * @param config - Stack configuration options to merge with existing settings
     * @returns Merged configuration with project and stack names properly set
     */
    public configure(config: IStackOptions) {
        // Create a unique project name for each cluster to avoid conflicts.
        config = { ...this.config, ...config };
        this._config = config;
        return config;
    }

    /**
     * Deploys infrastructure using Pulumi automation with the provided configuration
     * @public
     * @param {IStackOptions} config - Configuration options for stack deployment
     * @returns {Promise<Object>} Promise resolving to deployment result with status and metadata
     * @throws {Error} When deployment fails due to infrastructure, configuration, or runtime errors
     */
    public async deploy(config: IStackOptions): Promise<IResult> {
        try {
            config = this.configure(config);
            return await this.execute(config, "deploy", [config]);
        }
        catch (error) {
            this.logger?.error({
                flow: this.config.id,
                category: VCategory.core.stack,
                src: 'Service:StackManager:deploy',
                message: (error as Error).message,
                data: {
                    stackName: this.config.name,
                    projectName: this.config.project,
                }
            });
            return {
                success: false,
                timestamp: new Date(),
                stackName: this.config?.name,
                projectName: this.config?.project,
                message: `Stack ${this.config?.name} deployed failed.`,
            };
        }
    }

    /**
     * Destroys and removes infrastructure using Pulumi automation
     * @public
     * @param {IStackOptions} config - Configuration options for stack destruction
     * @returns {Promise<Object>} Promise resolving to destruction result with status and metadata
     * @throws {Error} When destruction fails due to resource dependencies, permissions, or runtime errors
     */
    public async undeploy(config: IStackOptions): Promise<IResult> {
        try {
            config = this.configure(config);
            return await this.execute(config, "undeploy", [config]);
        }
        catch (error) {
            this.logger?.error({
                flow: this.config.id,
                category: VCategory.core.stack,
                src: 'Service:StackManager:undeploy',
                message: (error as Error).message,
                data: {
                    stackName: this.config.name,
                    projectName: this.config.project,
                }
            });
            return {
                success: false,
                timestamp: new Date(),
                stackName: this.config?.name,
                projectName: this.config?.project,
                message: `Stack ${this.config?.name} undeploy failed.`,
            };
        }
    }

    /**
     * Validates stack configuration without performing deployment
     * @public
     * @param {IStackOptions} config - Configuration options for stack validation
     * @returns {Promise<Object>} Promise resolving to validation result with status and details
     * @throws {Error} When validation fails due to configuration errors, template issues, or runtime problems
     */
    public async validate(config: IStackOptions) {
        try {
            config = this.configure(config);
            return await this.execute(config, "validate", [config]);
        }
        catch (error) {
            this.logger?.error({
                flow: this.config.id,
                category: VCategory.core.stack,
                src: 'Service:StackManager:validate',
                message: (error as Error).message,
                data: {
                    stackName: this.config.name,
                    projectName: this.config.project,
                }
            });
            return {
                success: false,
                timestamp: new Date(),
                stackName: this.config?.name,
                projectName: this.config?.project,
                message: `Stack ${this.config.name} validate failed.`,
            };
        }
    }

    /**
     * Retrieves current status and information about deployed stacks
     * @public
     * @param {IStackOptions} config - Configuration options for status query
     * @returns {Promise<Object>} Promise resolving to status information with stack details
     * @throws {Error} When status query fails due to workspace access, permissions, or configuration issues
     */
    public async status(config: IStackOptions): Promise<IResult> {
        try {
            config = this.configure(config);
            return await this.execute(config, "status", [config]);
        }
        catch (error) {
            this.logger?.error({
                flow: this.config.id,
                category: VCategory.core.stack,
                src: 'Service:StackManager:status',
                message: (error as Error).message,
                data: {
                    stackName: this.config.name,
                    projectName: this.config.project,
                }
            });
            return {
                success: false,
                timestamp: new Date(),
                stackName: this.config?.name,
                projectName: this.config?.project,
                message: `Stack ${this.config.name} status failed.`,
            };
        }
    }

    /**
     * Transforms component setup configuration through orchestrator-specific implementations
     * @public
     * @param component - Component configuration containing setup definitions
     * @param output - Output object to accumulate transformed values
     * @param key - Property key to process for setup configuration
     * @returns Promise resolving to transformed setup configuration object
     */
    public async transformSetup(options: ITransformOption): Promise<IStruct> {
        const { component, output = {}, key = "input", flow } = options;
        return await this.execute(this.config, "transformSetup", [{ component, output, key, flow }]);
    }

    /**
     * Sets up and configures the stack with custom configuration
     * @protected
     * @param {IStackOptions} config - Configuration options containing setup function and parameters
     * @param {IStruct} result - Optional result object to merge with output
     * @returns {Promise<Stack>} Promise resolving to the configured stack instance
     * @throws {Error} When stack configuration fails or setup function encounters errors
     */
    protected async output(opts: IStackOptions, result?: IStruct): Promise<IStruct> {
        // Configure the stack with the provided configuration
        let { items = {}, warns = {} } = result ? { items: result } : await this.transformOutput({ component: { output: opts.output }, key: 'output', flow: opts.id });
        let cmpOutput: { items?: IStruct, warns?: IStruct } = {};
        if (opts.end instanceof Function) {
            cmpOutput = await opts.end();
        }
        let output = cmpOutput ? { items: { ...items, ...cmpOutput.items }, warns: { ...warns, ...cmpOutput.warns } } : { items, warns };
        output.warns && this.logger?.warn({
            flow: opts.id,
            category: VCategory.core.stack,
            src: 'Service:StackManager:output',
            data: {
                stackName: opts.name,
                projectName: opts.project,
                issues: output.warns
            },
            message: `Stack output processed successfully.`,
        });
        return output;
    }
}

export default StackManager;