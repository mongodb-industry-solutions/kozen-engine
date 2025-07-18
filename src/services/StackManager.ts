/**
 * @fileoverview Stack Manager Service - Infrastructure Stack Bridge Component
 * @description Service for managing infrastructure stacks using Pulumi automation
 * @author MDB SAT
 * @since 1.0.4
 * @version 1.0.5
 */

import { IComponent } from "../models/Component";
import { IStackManager, IStackOptions } from "../models/Stack";
import { IResult, IStruct } from "../models/Types";
import { getID } from "../tools";
import { BaseService } from "./BaseService";

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
    protected config: IStackOptions;

    /**
     * Creates a new StackManager instance
     * @constructor
     * @param {IStackOptions} [config] - Optional stack configuration options
     */
    constructor(config?: IStackOptions) {
        super();
        this.config = config || {};
    }

    /**
     * Gets or generates the project name for the stack
     * @public
     * @readonly
     * @type {string}
     * @returns {string} The project name for stack identification
     * @throws {Error} When project name generation fails
     */
    public get projectName(): string {
        if (!this.config.project) {
            this.config.project = getID();
        }
        return this.config.project;
    }

    /**
     * Gets or generates the stack name for deployment identification
     * @public
     * @readonly
     * @type {string}
     * @returns {string} The stack name for environment identification
     */
    public get stackName(): string {
        if (!this.config.name) {
            const envKey = this.config?.environment?.stackName || "NODE_ENV";
            this.config.name = process.env[envKey] || "dev";
        }
        return this.config.name;
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
        const type = config.orchestrator || "Pulumi";
        const controllerName = "StackManager" + type;
        const controller = await this.assistant.resolve<IStackManager>(controllerName);
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
        config.project = this.projectName;
        config.name = this.stackName;
        this.config = config;
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
            console.log(error)
            return {
                stackName: this.stackName,
                projectName: this.projectName,
                success: false,
                timestamp: new Date(),
                message: `Stack ${this.stackName} deployed failed.`,
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
            console.log(error)
            return {
                stackName: this.stackName,
                projectName: this.projectName,
                success: false,
                timestamp: new Date(),
                message: `Stack ${this.stackName} undeploy failed.`,
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
            console.log(error)
            return {
                stackName: this.stackName,
                projectName: this.projectName,
                success: false,
                timestamp: new Date(),
                message: `Stack ${this.stackName} validate failed.`,
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
            console.log(error)
            return {
                stackName: this.stackName,
                projectName: this.projectName,
                success: false,
                timestamp: new Date(),
                message: `Stack ${this.stackName} status failed.`,
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
    public async transformSetup(component: IComponent, output: IStruct = {}, key: string = "input"): Promise<IStruct> {
        return await this.execute(this.config, "transformSetup", [component, output, key]);
    }
}

export default StackManager;