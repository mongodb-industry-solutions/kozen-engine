/**
 * @fileoverview Stack Manager Service - Infrastructure Stack Bridge Component
 * @description Service for managing infrastructure stacks using Pulumi automation
 * @author MDB SAT
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
import { IComponent } from "../models/Component";
import { IStackConfig, IStackOptions } from "../models/Stack";
import { IMetadata, IResult, IStruct } from "../models/Types";
import StackManager from "./StackManager";

/**
 * @class StackManager
 * @extends BaseService
 * @description Bridge service for managing infrastructure stacks using Pulumi automation
 */
export class StackManagerPulumi extends StackManager {

    /**
     * Internal Pulumi stack instance for deployment operations
     * @protected
     */
    protected _stack?: Stack

    /**
     * Gets the current Pulumi stack instance
     * @public
     * @returns Current stack instance for deployment operations
     */
    public get stack(): Stack {
        return this._stack!;
    }

    /**
     * Sets the Pulumi stack instance for deployment operations
     * @protected
     * @param stack - Pulumi stack instance to configure for operations
     */
    protected set stack(stack: Stack) {
        this._stack = stack;
    }


    /**
     * Configures and validates stack options for Pulumi automation
     * @public
     * @param {IStackOptions} [config] - Optional configuration options to merge with existing settings
     * @returns {Object} Configuration object containing Pulumi arguments, workspace options, and identifiers
     * @throws {Error} When required stack program is not configured
     */

    public async configure(stack?: IStackOptions): Promise<IStackConfig<InlineProgramArgs, LocalWorkspaceOptions>> {

        // Create a unique project name for each cluster to avoid conflicts.
        const projectName = stack?.project || "K0Z3N";
        const stackName = stack?.name || "dev";
        const inputs = await this.transformInput({ input: stack?.input });

        // Ensure the stack name is unique by appending the project name.
        const args: InlineProgramArgs = {
            stackName,
            projectName,
            program: stack?.program ?? (() => { throw new Error("Stack program is required."); })
        };

        // Set workspace options
        const opts: LocalWorkspaceOptions = {
            projectSettings: {
                name: args.projectName,
                runtime: (stack?.workspace?.runtime || "nodejs") as ProjectRuntime,
                backend: { url: inputs?.PULUMI_BACKEND_URL || stack?.workspace?.url },
            },
            envVars: {
                PULUMI_CONFIG_PASSPHRASE: inputs?.PULUMI_CONFIG_PASSPHRASE || "K0Z3N-IsSoSecure",
                ...inputs
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
    protected async setup(stack: Stack, opts: IStackOptions): Promise<Stack> {
        // Configure the stack with the provided configuration
        let stackSetup = await this.transformSetup({ setup: opts.setup }, {}, 'setup');
        let cmpSetup = {};
        if (opts.init instanceof Function) {
            cmpSetup = await opts.init(stack);
        }
        let fullSetup = { ...stackSetup, ...cmpSetup };
        await stack.setAllConfig(fullSetup);
        return stack;
    }

    /**
     * Transforms component setup configuration into Pulumi configuration format
     * @public
     * @param opts - Component configuration containing setup definitions
     * @param output - Output object to accumulate transformed values
     * @param key - Property key to process for setup configuration
     * @returns Promise resolving to transformed setup configuration object
     */
    public async transformSetup(opts: IComponent, output: IStruct = {}, key: string = "setup"): Promise<IStruct> {
        if (Array.isArray(opts[key])) {
            let input = await this.transformInput(opts, {}, key);
            for (let item of opts[key]) {
                let tmp = await this.transformSetupItem(item, input);
                output = { ...output, ...tmp }
            }
        }
        return output;
    }

    /**
     * Transforms individual setup metadata item into Pulumi configuration format
     * @public
     * @param meta - Metadata definition containing name, type, and configuration details
     * @param input - Input values to resolve configuration values from
     * @returns Promise resolving to Pulumi configuration object with value and secret flag
     */
    public async transformSetupItem(meta: IMetadata, input: IStruct): Promise<IStruct> {
        return {
            [meta.name]: {
                value: input[meta.name],
                secret: (meta.type === "secret" || meta.type === "protected")
            }
        };
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
        const { args, opts } = await this.configure(config);
        this.stack = await LocalWorkspace.selectStack(args, opts);
        return this.stack;
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
            const { args, opts } = await this.configure(config);

            // Create or select the stack
            const stack = await LocalWorkspace.createOrSelectStack(args, opts);
            // await stack.setAllConfig({
            //     "aws:region": { value: process.env.AWS_REGION || "us-east-1" },
            //     "aws:accessKey": { value: process.env.AWS_ACCESS_KEY_ID || "", secret: true },
            //     "aws:secretKey": { value: process.env.AWS_SECRET_ACCESS_KEY || "", secret: true },
            // });

            if (!stack || !stack.workspace) {
                throw new Error(`Failed to create or select stack '${args.stackName}' in project '${args.projectName}'.`);
            }

            // return the configured stack
            this.stack = stack;

            await this.setup(stack, config);
            await stack.refresh({ onOutput: (output: string) => console.info(`Stack output: ${output}`) });
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
    public async deploy(config: IStackOptions): Promise<IResult> {
        try {
            const stack = await this.load(config);
            const upRes = await stack.up({ onOutput: (output: string) => console.info(`Stack output: ${output}`) });
            return {
                stackName: config.name,
                projectName: config.project,
                success: true,
                timestamp: new Date(),
                message: `Stack ${config.name} deployed successfully.`,
                output: upRes
            };
        }
        catch (error) {
            console.log(error)
            return {
                stackName: config.name,
                projectName: config.project,
                success: false,
                timestamp: new Date(),
                message: `Stack ${config.name} deployed faild.`,
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
        // Configure the stack with the provided options
        const stack = await this.select(config);
        const destroyRes = await stack.destroy({ onOutput: console.info });
        return {
            stackName: config.name,
            projectName: config.project,
            success: true,
            timestamp: new Date(),
            message: `Stack ${config.name} undeployed successfully.`,
            output: destroyRes
        };
    }

    /**
     * Validates stack configuration without performing deployment
     * @public
     * @param {IStackOptions} config - Configuration options for stack validation
     * @returns {Promise<Object>} Promise resolving to validation result with status and details
     * @throws {Error} When validation fails due to configuration errors, template issues, or runtime problems
     */
    public async validate(config: IStackOptions): Promise<IResult> {
        // TODO: Implement stack validation logic
        // This should validate configuration, templates, and dependencies
        // without performing actual deployment
        return {
            stackName: config.name,
            projectName: config.project,
            success: true,
            timestamp: new Date(),
            message: `Stack ${config.name} configuration validation completed.`,
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
    public async status(config: IStackOptions): Promise<IResult> {
        // Configure the stack with the provided options
        const { opts, stackName, projectName } = await this.configure(config);
        const ws = await LocalWorkspace.create(opts);
        const stacks = await ws.listStacks();
        let found = stackName && stacks.find(s => s.name === stackName);
        return {
            stackName: stackName || "default",
            projectName: projectName || "default",
            success: true,
            timestamp: new Date(),
            message: found ? `Stack ${found.name} is running.` : `No stack found with name ${stackName}.`,
            output: found ? [found] : stacks,
        };
    }
}

export default StackManagerPulumi;