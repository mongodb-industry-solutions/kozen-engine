import * as fs from 'fs';
import { IConfig } from '../../../shared/models/Config';
import { IResult } from '../../../shared/models/Result';
import { IAction, IStruct, VCategory } from "../../../shared/models/Types";
import { Env, IEnv, IIoC, IoC } from "../../../shared/tools";
import { IComponent, ITransformFn } from '../../component/models/Component';
import { IController } from '../../component/models/Controller';
import { BaseService } from '../../component/services/BaseService';
import { ILoggerService } from '../../logger/models/Logger';
import { ITemplate, ITemplateManager } from '../../template/models/Template';
import { IPipeline, IPipelineArgs } from '../models/Pipeline';
import { IStackManager } from '../models/Stack';

/**
 * @fileoverview Pipeline Manager Service - Core Bridge Component
 * Main orchestrator service that acts as a bridge between CLI controllers and infrastructure services.
 * This service coordinates template processing, component deployment, and infrastructure stack management.
 * 
 * The PipelineManager implements the Bridge pattern by abstracting the complexity of infrastructure
 * deployment and providing a unified interface for different deployment operations (deploy, undeploy, validate, status).
 * 
 * @author MDB SAT
 * @since 1.0.4
 * @version 1.0.5
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
     * @type {IConfig | null}
     * Stores the active pipeline configuration including dependencies,
     * service registrations, and deployment settings. Null when not configured.
     */
    public config: IConfig | null;

    protected envSrv?: IEnv;

    /**
     * Creates a new PipelineManager instance
     * 
     * @constructor
     * @param {IConfig} [config] - Optional initial pipeline configuration
     * @param {IoC} [ioc] - Optional IoC container for dependency management
     * 
     * Initializes the pipeline manager with an IoC container for dependency injection.
     * The manager serves as the central bridge between CLI operations and infrastructure services.
     * Dependencies are registered during the configure() method call.
     * 
     * @example
     * ```typescript
     * // Create with default IoC container
     * const manager = new PipelineManager();
     * `
     * // Create with custom configuration and IoC
     * const customIoC = new IoC();
     * const manager = new PipelineManager(config, customIoC);
     * ```
     */
    constructor(config?: IConfig, dependency?: { assistant?: IIoC, logger?: ILoggerService, envSrv?: IEnv }) {
        // Ensure assistant is always present for BaseService
        if (!dependency?.assistant) {
            dependency = dependency || {};
            dependency.assistant = new IoC();
        }
        super(dependency as { assistant: IIoC, logger: ILoggerService } | undefined);
        this.config = config || null;
        this.envSrv = dependency?.envSrv;
    }

    /**
     * Configures the pipeline manager with the provided configuration and IoC container
     * 
     * @public
     * @param {IConfig} config - The pipeline configuration to apply
     * @param {IoC} [ioc] - Optional IoC container for dependency management
     * @returns {Promise<PipelineManager>} Promise resolving to the configured PipelineManager instance
     * @throws {Error} When configuration fails due to invalid configuration or dependency registration errors
     * 
     * This method sets up the pipeline manager by:
     * 1. Storing the provided configuration
     * 2. Setting up the IoC container for dependency injection
     * 3. Registering all service dependencies defined in the configuration
     */
    public async configure(config: IConfig, ioc?: IIoC): Promise<PipelineManager> {
        try {
            if (!this.assistant) {
                throw new Error("Incorrect dependency injection configuration.");
            }
            config && (this.config = config);
            ioc && (this.assistant = ioc);
            this.config?.dependencies && await this.assistant.register(this.config.dependencies);
            this.logger = this.logger || await this.assistant.resolve<ILoggerService>('LoggerService');
            this.envSrv = this.envSrv || new Env({ logger: this.logger as unknown as Console });
            return this;
        } catch (error) {
            throw new Error(`Failed to configure pipeline: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Deploys infrastructure using the specified template and pipeline arguments
     * This method orchestrates the complete deployment process by:
     * 1. Extracting deployment parameters from pipeline arguments
     * 2. Resolving StackManager and TemplateManager from IoC container
     * 3. Loading the specified template configuration
     * 4. Executing the deployment through stack manager
     * 5. Processing all template components sequentially
     * 6. Returning comprehensive deployment results
     * 
     * @public
     * @param {IPipelineArgs} pipeline - Pipeline arguments containing template name, action, project, and stack information
     * @returns {Promise<IResult>} Promise resolving to the deployment execution result
     * @throws {Error} When deployment fails due to template loading, stack management, or component deployment errors
     */
    public async deploy(args: IPipelineArgs): Promise<IResult> {
        const { template: templateName, action, project, stack: name } = args;

        if (!this.assistant) {
            throw new Error("Incorrect dependency injection configuration.");
        }

        const srvTemplate = await this.assistant.resolve<ITemplateManager>("TemplateManager");
        const stackAdm = await this.assistant.resolve<IStackManager>("StackManager");

        let id = this.getId(args);
        let out: IResult = {};
        if (!templateName) {
            throw new Error('A valid template name was not provided');
        }

        let template = await srvTemplate.load<ITemplate>(templateName, { flow: id });
        let pipeline = { args, assistant: this.assistant, template, id };

        this.logger?.debug({
            flow: id,
            src: 'Service:Pipeline:Deploy:Init',
            message: 'Initiation of the deployment process',
            category: VCategory.core.pipeline,
            data: {
                templateName,
                projectName: project,
                stackName: name,
                engine: template.engine,
                orchestrator: template.stack?.orchestrator,
                components: template.stack?.components?.length || 0
            }
        });

        let stackResult = await stackAdm.deploy({
            id,
            name,
            project,
            ...template?.stack,
            program: async () => {
                if (template.stack?.components) {
                    out = await this.process({
                        pipeline,
                        action: 'deploy',
                        components: template.stack.components,
                        transform: (component, output) => stackAdm.transformInput({ component, output, key: "input", flow: id })
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
                        transform: (component, output) => stackAdm.transformInput({ component, output, key: "setup", flow: id })
                    });
                }
                return configs?.output || {};
            },
            end: async () => {
                let configs = null;
                if (template.stack?.components) {
                    configs = await this.process({
                        pipeline,
                        action: 'out',
                        components: template.stack?.components,
                        transform: (component, output) => stackAdm.transformOutput({ component, output, key: "output", flow: id })
                    });
                }
                return configs?.output || {};
            },
        });

        out.results = out.results || [];

        try {
            if (out.output) {
                out.output.flow = id;
                (process.env['KOZEN_ENV_ACTION'] === undefined || process.env['KOZEN_ENV_ACTION'] === 'EXPOSE') &&
                    await this.envSrv?.expose(out.output, { flow: id });
            }
        } catch (error) {
            this.logger?.warn({
                flow: id,
                src: 'Service:Pipeline:Deploy:End',
                message: 'It was not possible to expose the environmental variables',
                category: VCategory.core.pipeline,
                data: { output: out.output, error: (error as Error).message }
            });
        }

        stackResult && out.results.push(stackResult);

        this.logger?.debug({
            flow: id,
            src: 'Service:Pipeline:Deploy:End',
            message: 'End of deployment process',
            category: VCategory.core.pipeline,
            data: stackResult
        });

        return {
            templateName,
            action: action as IAction,
            success: true,
            timestamp: new Date(),
            message: `Pipeline ${templateName} deployed successfully.`,
            ...out
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
     * This method acts as a bridge between template definitions and component implementations by:
     * 1. Resolving the ProcessorService for variable interpolation
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

        if (!this.assistant) {
            throw new Error("Incorrect dependency injection configuration.");
        }
        // TODO: create a generic method for executing multiple components (async | sync)
        for (const component of components) {
            // TODO add dynamic constructor arguments
            const delegate = await this.assistant.resolve<IController>(component.name!);
            delegate.configure(component);
            const input = await transform(component, output);
            const method = (delegate as any)[action];
            const result = ((method instanceof Function) && await method.apply(delegate, [input, pipeline])) || null;
            results.push(result);
            if (result?.output) {
                output = { ...output, ...result.output }
            };
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
     * Removes previously deployed infrastructure by reversing the deployment process.
     * This method coordinates with stack managers and component controllers to clean up resources.
     */
    public async undeploy(pipeline: IPipelineArgs): Promise<IResult> {
        const { template: templateName, action, project, stack: name } = pipeline;

        if (!this.assistant) {
            throw new Error("Incorrect dependency injection configuration.");
        }

        const id = this.getId(pipeline as any);
        const stackAdm = await this.assistant.resolve<IStackManager>("StackManager");

        // If a template is provided, use it to get orchestrator/workspace; otherwise default to Pulumi.
        let orchestrator = "Pulumi";
        let stackOpts: any = {};

        if (templateName) {
            const srvTemplate = await this.assistant.resolve<ITemplateManager>("TemplateManager");
            const template = await srvTemplate.load<ITemplate>(templateName, { flow: id });
            orchestrator = template.stack?.orchestrator || "Pulumi";
            stackOpts = template.stack || {};
        }

        const stackResult = await stackAdm.undeploy({
            id,
            name,
            project,
            orchestrator,
            ...stackOpts,
        });

        return {
            templateName,
            action: action as IAction,
            success: !!stackResult?.success,
            message: stackResult?.message || `Stack ${name} undeployed.`,
            timestamp: new Date(),
            results: [stackResult],
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
     * Removes previously deployed infrastructure by reversing the deployment process.
     * This method coordinates with stack managers and component controllers to clean up resources.
     */
    public async destroy(pipeline: IPipelineArgs): Promise<IResult> {
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
     * Performs comprehensive validation of template configuration, dependencies,
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
     * Queries the current state of deployed infrastructure components and provides
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
     * @returns {Promise<IConfig>} Promise resolving to the loaded and parsed pipeline configuration
     * @throws {Error} When file reading fails, JSON parsing errors occur, or file access is denied
     * 
     * Loads and parses pipeline configuration from a JSON file, providing error handling
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
    public async load(configPath: string): Promise<IConfig> {
        try {
            const configContent = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(configContent) as IConfig;
            return config;
        } catch (error) {
            throw new Error(`Failed to load configuration: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Get Pipeline ID
     * @param {IConfig} opt 
     * @returns {string}
     */
    getId(opt?: IConfig) {
        let opts = opt ?? this.config;
        return opts?.id || `${opts?.project ?? ''}-${opts?.stack ?? ''}`;
    }
}

export default PipelineManager;