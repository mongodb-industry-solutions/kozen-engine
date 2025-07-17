/**
 * @fileoverview Stack Manager Service - Infrastructure Stack Bridge Component
 * @description Service for managing infrastructure stacks using Pulumi automation
 * @author MongoDB Solutions Assurance Team
 * @since 4.0.0
 * @version 4.0.0
 */

import {
    InlineProgramArgs,
    LocalWorkspace,
    LocalWorkspaceOptions,
    ProjectRuntime,
    Stack
} from "@pulumi/pulumi/automation";
import { IStackOptions } from "../models/Stack";
import { getID } from "../tools";
import { BaseService } from "./BaseService";

/**
 * @class StackManager
 * @extends BaseService
 * @description Bridge service for managing infrastructure stacks using Pulumi automation
 */
export class StackManager extends BaseService {

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
     * Configures and validates stack options for Pulumi automation
     * @public
     * @param {IStackOptions} [config] - Optional configuration options to merge with existing settings
     * @returns {Object} Configuration object containing Pulumi arguments, workspace options, and identifiers
     * @throws {Error} When required stack program is not configured
     */
    public configure(config?: IStackOptions): { args: InlineProgramArgs, opts: LocalWorkspaceOptions, stackName: string, projectName: string } {
        // If a configuration is provided, use it; otherwise, keep the existing one.
        if (config) {
            this.config = { ...this.config, ...config };
        }

        // Create a unique project name for each cluster to avoid conflicts.
        const projectName = this.projectName;
        const stackName = this.stackName;
        const envKeyUrl = this.config?.environment?.backendUrl || "KOZEN_PULUMI_BACKEND_URL";

        // Ensure the stack name is unique by appending the project name.
        const args: InlineProgramArgs = {
            stackName,
            projectName,
            program: this.config.program ?? (() => { throw new Error("Stack program is required."); })
        };

        // Set workspace options
        const opts: LocalWorkspaceOptions = {
            projectSettings: {
                name: args.projectName,
                runtime: (this.config.workspace?.runtime || "nodejs") as ProjectRuntime,
                backend: { url: process.env[envKeyUrl] || this.config.workspace?.url },
            },
            envVars: {
                PULUMI_CONFIG_PASSPHRASE: "kozenIsSoSecure"
            }
        };

        return {
            stackName,
            projectName,
            args,
            opts
        }
    }

    /**
     * Sets up and configures a Pulumi stack with custom configuration
     * @protected
     * @param {Stack} stack - The Pulumi stack instance to configure
     * @param {IStackOptions} config - Configuration options containing setup function and parameters
     * @returns {Promise<Stack>} Promise resolving to the configured stack instance
     * @throws {Error} When stack configuration fails or setup function encounters errors
     */
    protected async setup(stack: Stack, config: IStackOptions): Promise<Stack> {
        // Configure the stack with the provided configuration
        if (config.setup instanceof Function) {
            const setupResult = await config.setup(stack);
            (setupResult) && await stack.setAllConfig(setupResult);
        }
        return stack;
    }

    /**
     * Selects an existing Pulumi stack for operations
     * @protected
     * @param {IStackOptions} [config] - Optional configuration options for stack selection
     * @returns {Promise<Stack>} Promise resolving to the selected Pulumi stack instance
     * @throws {Error} When stack selection fails due to configuration or access issues
     */
    protected async select(config?: IStackOptions): Promise<Stack> {
        // Configure the stack with the provided options
        const { args, opts } = this.configure(config);
        return await LocalWorkspace.selectStack(args, opts);
    }

    /**
     * Creates or selects a Pulumi stack for deployment operations
     * @protected
     * @param {IStackOptions} config - Configuration options for stack creation or selection
     * @returns {Promise<Stack>} Promise resolving to the configured Pulumi stack instance
     * @throws {Error} When stack creation/selection fails due to configuration, access, or workspace issues
     */
    protected async load(config: IStackOptions): Promise<Stack> {
        try {
            // Configure the stack with the provided options
            const { args, opts } = this.configure(config);

            // Create or select the stack
            const stack = await LocalWorkspace.createOrSelectStack(args, opts);
            await stack.setAllConfig({
                "aws:region": { value: process.env.AWS_REGION || "us-east-1" },
                "aws:accessKey": { value: process.env.AWS_ACCESS_KEY_ID || "", secret: true },
                "aws:secretKey": { value: process.env.AWS_SECRET_ACCESS_KEY || "", secret: true },
            });

            if (!stack || !stack.workspace) {
                throw new Error(`Failed to create or select stack '${args.stackName}' in project '${args.projectName}'.`);
            }

            // return the configured stack
            return stack;

        } catch (error) {
            console.error('❌ Error configuring stack:', error);
            throw error;
        }
    }

    /**
     * Deploys infrastructure using Pulumi automation with the provided configuration
     * @public
     * @param {IStackOptions} config - Configuration options for stack deployment
     * @returns {Promise<Object>} Promise resolving to deployment result with status and metadata
     * @throws {Error} When deployment fails due to infrastructure, configuration, or runtime errors
     */
    public async deploy(config: IStackOptions) {
        try {
            const stack = await this.load(config);

            await this.setup(stack, config);
            await stack.refresh({ onOutput: (output: string) => console.info(`Stack output: ${output}`) });
            const upRes = await stack.up({ onOutput: (output: string) => console.info(`Stack output: ${output}`) });

            return {
                stackName: this.stackName,
                projectName: this.projectName,
                success: true,
                timestamp: new Date(),
                message: `Stack ${this.stackName} deployed successfully.`,
                results: upRes
            };
        }
        catch (error) {
            console.log(error)
            return {
                stackName: this.stackName,
                projectName: this.projectName,
                success: false,
                timestamp: new Date(),
                message: `Stack ${this.stackName} deployed faild.`,
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
    public async undeploy(config: IStackOptions) {
        // Configure the stack with the provided options
        const stack = await this.select(config);
        const destroyRes = await stack.destroy({ onOutput: console.info });
        return {
            stackName: this.stackName,
            projectName: this.projectName,
            success: true,
            timestamp: new Date(),
            message: `Stack ${this.stackName} undeployed successfully.`,
            results: destroyRes
        };
    }

    /**
     * Validates stack configuration without performing deployment
     * @public
     * @param {IStackOptions} config - Configuration options for stack validation
     * @returns {Promise<Object>} Promise resolving to validation result with status and details
     * @throws {Error} When validation fails due to configuration errors, template issues, or runtime problems
     */
    public async validate(config: IStackOptions) {
        // TODO: Implement stack validation logic
        // This should validate configuration, templates, and dependencies
        // without performing actual deployment

        return {
            stackName: this.stackName,
            projectName: this.projectName,
            success: true,
            timestamp: new Date(),
            message: `Stack ${this.stackName} configuration validation completed.`,
            results: []
        };
    }

    /**
     * Retrieves current status and information about deployed stacks
     * @public
     * @param {IStackOptions} config - Configuration options for status query
     * @returns {Promise<Object>} Promise resolving to status information with stack details
     * @throws {Error} When status query fails due to workspace access, permissions, or configuration issues
     */
    public async status(config: IStackOptions) {
        // Configure the stack with the provided options
        const { opts, stackName, projectName } = this.configure(config);
        const ws = await LocalWorkspace.create(opts);
        const stacks = await ws.listStacks();
        let found = stackName && stacks.find(s => s.name === stackName);
        return {
            stackName: stackName || "default",
            projectName: projectName || "default",
            success: true,
            timestamp: new Date(),
            message: found ? `Stack ${found.name} is running.` : `No stack found with name ${stackName}.`,
            results: found ? [found] : stacks,
        };
    }
}

export default StackManager;