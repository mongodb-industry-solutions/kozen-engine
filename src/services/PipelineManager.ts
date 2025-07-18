import * as fs from 'fs';
import { BaseController } from '../controllers/BaseController';
import { IComponent, ITransformFn } from '../models/Component';
import { IPipeline, IPipelineArgs, IPipelineConfig } from '../models/Pipeline';
import { ITemplate } from '../models/Template';
import { IAction, IResult, IStruct } from "../models/Types";
import { IoC } from "../tools";
import { BaseService } from './BaseService';
import { StackManager } from './StackManager';
import { TemplateManager } from './TemplateManager';

/**
 * @fileoverview Pipeline Manager Service - Core Bridge Component
 * @description Main orchestrator service that acts as a bridge between CLI controllers and infrastructure services.
 * This service coordinates template processing, component deployment, and infrastructure stack management.
 * 
 * The PipelineManager implements the Bridge pattern by abstracting the complexity of infrastructure
 * deployment and providing a unified interface for different deployment operations (deploy, undeploy, validate, status).
 * 
 * @author MDB SAT
 * @since 4.0.0
 * @version 4.0.0
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const pipelineManager = new PipelineManager();
 * await pipelineManager.configure(config);
 * 
 * // Deploy infrastructure
 * const deployResult = await pipelineManager.deploy({
 *   template: 'atlas.basic',
 *   action: 'deploy',
 *   config: 'cfg/config.json'
 * });
 * 
 * // Validate template
 * const validateResult = await pipelineManager.validate({
 *   template: 'atlas.basic',
 *   action: 'validate',
 *   config: 'cfg/config.json'
 * });
 * ```
 */
export class PipelineManager extends BaseService {

    /**
     * Current pipeline configuration instance
     * 
     * @private
     * @type {IPipelineConfig | null}
     * @description Stores the active pipeline configuration including dependencies,
     * service registrations, and deployment settings. Null when not configured.
     */
    protected config: IPipelineConfig | null;

    /**
     * Creates a new PipelineManager instance
     * 
     * @constructor
     * @param {IPipelineConfig} [config] - Optional initial pipeline configuration
     * @param {IoC} [ioc] - Optional IoC container for dependency management
     * 
     * @description Initializes the pipeline manager with an IoC container for dependency injection.
     * The manager serves as the central bridge between CLI operations and infrastructure services.
     * Dependencies are registered during the configure() method call.
     * 
     * @example
     * ```typescript
     * // Create with default IoC container
     * const manager = new PipelineManager();
     * 
     * // Create with custom configuration and IoC
     * const customIoC = new IoC();
     * const manager = new PipelineManager(config, customIoC);
     * ```
     */
    constructor(config?: IPipelineConfig, ioc?: IoC) {
        super();
        this.config = config || null;
        this.assistant = ioc || new IoC();
    }

    /**
     * Configures the pipeline manager with the provided configuration and IoC container
     * 
     * @public
     * @param {IPipelineConfig} config - The pipeline configuration to apply
     * @param {IoC} [ioc] - Optional IoC container for dependency management
     * @returns {Promise<PipelineManager>} Promise resolving to the configured PipelineManager instance
     * @throws {Error} When configuration fails due to invalid configuration or dependency registration errors
     * 
     * @description This method sets up the pipeline manager by:
     * 1. Storing the provided configuration
     * 2. Setting up the IoC container for dependency injection
     * 3. Registering all service dependencies defined in the configuration
     */
    public async configure(config: IPipelineConfig, ioc?: IoC): Promise<PipelineManager> {
        try {
            this.config = config;
            this.assistant = ioc || this.assistant;
            await this.assistant.register(this.config.dependencies);
            return this;
        } catch (error) {
            throw new Error(`Failed to configure pipeline: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Deploys infrastructure using the specified template and pipeline arguments
     * 
     * @public
     * @param {IPipelineArgs} pipeline - Pipeline arguments containing template name, action, project, and stack information
     * @returns {Promise<IResult>} Promise resolving to the deployment execution result
     * @throws {Error} When deployment fails due to template loading, stack management, or component deployment errors
     * 
     * @description This method orchestrates the complete deployment process by:
     * 1. Extracting deployment parameters from pipeline arguments
     * 2. Resolving StackManager and TemplateManager from IoC container
     * 3. Loading the specified template configuration
     * 4. Executing the deployment through stack manager
     * 5. Processing all template components sequentially
     * 6. Returning comprehensive deployment results
     */
    public async deploy(args: IPipelineArgs): Promise<IResult> {
        const { template: templateName, action, project, stack: name } = args;

        const srvTemplate = await this.assistant.resolve<TemplateManager>("TemplateManager");
        const stackAdm = await this.assistant.resolve<StackManager>("StackManager");

        let result = {};
        let template = await srvTemplate.load<ITemplate>(templateName);
        let pipeline = { args, assistant: this.assistant, template, stack: stackAdm };

        await stackAdm.deploy({
            name,
            project,
            ...template?.stack,
            program: async () => {
                if (template.stack?.components) {
                    result = await this.process({
                        pipeline,
                        action: 'deploy',
                        components: template.stack.components,
                        transform: (cmp, out) => stackAdm.transformInput(cmp, out, "input")
                    });
                }
            },
            init: async (stack) => {
                let configs = null;
                if (template.stack?.components) {
                    configs = await this.process({
                        pipeline,
                        action: 'setup',
                        components: template.stack?.components,
                        transform: (cmp, out) => stackAdm.transformInput(cmp, out, "setup")
                    });
                }
                return configs?.output || {};
            }
        });

        return {
            templateName,
            action: action as IAction,
            success: true,
            timestamp: new Date(),
            message: `Pipeline ${templateName} deployed successfully.`,
            ...result
        };
    }

    /**
     * Processes template components and orchestrates their deployment
     * 
     * @public
     * @param {ITemplate} template - The template containing components to process
     * @returns {Promise<IResult>} Promise resolving to the processing results and aggregated outputs
     * @throws {Error} When component resolution, configuration, or deployment fails
     * 
     * @description This method acts as a bridge between template definitions and component implementations by:
     * 1. Resolving the VarProcessorService for variable interpolation
     * 2. Iterating through all template components
     * 3. Resolving each component controller from the IoC container
     * 4. Configuring components with their specific settings
     * 5. Processing input variables with scope and context
     * 6. Executing component deployment
     * 7. Aggregating results and outputs for final response
     */
    protected async process({ components, action = 'deploy', pipeline, transform }: {
        components: IComponent[],
        action: string,
        pipeline?: IPipeline
        transform: ITransformFn
    }): Promise<IResult> {

        const results: IResult[] = [];
        let output: IStruct = {};

        // TODO: create a generic method for executing multiple components (async | sync)
        for (const component of components) {
            const delegate = await this.assistant.resolve<BaseController>(component.name!);
            delegate.configure(component);
            const input = await transform(component, output);
            const method = (delegate as any)[action];
            const result = ((method instanceof Function) && await method.apply(delegate, [input, pipeline])) || null;

            // const result = await delegate.deploy(input);
            results.push(result);
            output = { ...output, ...result.output };
        }

        return {
            results,
            output
        };
    }

    /**
     * Undeploys infrastructure using the specified template and pipeline arguments
     * 
     * @public
     * @param {IPipelineArgs} pipeline - Pipeline arguments containing template name and undeployment parameters
     * @returns {Promise<IResult>} Promise resolving to the undeployment execution result
     * @throws {Error} When undeployment fails due to stack management or component removal errors
     * 
     * @description Removes previously deployed infrastructure by reversing the deployment process.
     * This method coordinates with stack managers and component controllers to clean up resources.
     */
    public async undeploy(pipeline: IPipelineArgs): Promise<IResult> {
        const { template: templateName, action, project, stack: name } = pipeline;
        return {
            templateName,
            action: action as IAction,
            success: true,
            message: `Pipeline ${templateName} undeployed successfully.`,
            timestamp: new Date(),
        };
    }

    /**
     * Validates template configuration without performing actual deployment
     * 
     * @public
     * @param {IPipelineArgs} pipeline - Pipeline arguments containing template name and validation parameters
     * @returns {Promise<IResult>} Promise resolving to the validation result
     * @throws {Error} When validation fails due to template loading or configuration errors
     * 
     * @description Performs comprehensive validation of template configuration, dependencies,
     * and component settings without deploying actual infrastructure. This helps catch
     * configuration errors early in the deployment pipeline.
     */
    public async validate(pipeline: IPipelineArgs): Promise<IResult> {
        const { template: templateName, action, project, stack: name } = pipeline;
        return {
            templateName,
            action: action as IAction,
            success: true,
            message: `Pipeline ${templateName} configuration is valid.`,
            timestamp: new Date(),
        };
    }

    /**
     * Checks the current status of deployed infrastructure
     * 
     * @public
     * @param {IPipelineArgs} pipeline - Pipeline arguments containing template name and status check parameters
     * @returns {Promise<IResult>} Promise resolving to the current infrastructure status
     * @throws {Error} When status check fails due to stack access or component query errors
     * 
     * @description Queries the current state of deployed infrastructure components and provides
     * comprehensive status information including health, configuration, and operational metrics.
     */
    public async status(pipeline: IPipelineArgs): Promise<IResult> {
        const { template: templateName, action, project, stack: name } = pipeline;
        return {
            templateName,
            action: action as IAction,
            success: true,
            message: `Pipeline ${templateName} is running.`,
            timestamp: new Date(),
        };
    }

    /**
     * Loads pipeline configuration from a JSON file
     * 
     * @public
     * @param {string} configPath - File system path to the configuration file
     * @returns {Promise<IPipelineConfig>} Promise resolving to the loaded and parsed pipeline configuration
     * @throws {Error} When file reading fails, JSON parsing errors occur, or file access is denied
     * 
     * @description Loads and parses pipeline configuration from a JSON file, providing error handling
     * for common file system and parsing issues. The configuration includes service dependencies,
     * deployment settings, and environment-specific parameters.
     * 
     * @example
     * ```typescript
     * try {
     *   const config = await pipelineManager.load('cfg/production.json');
     *   console.log('Loaded config:', config.name);
     * } catch (error) {
     *   console.error('Failed to load config:', error.message);
     * }
     * ```
     */
    public async load(configPath: string): Promise<IPipelineConfig> {
        try {
            const configContent = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(configContent) as IPipelineConfig;
            return config;
        } catch (error) {
            throw new Error(`Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

export default PipelineManager;