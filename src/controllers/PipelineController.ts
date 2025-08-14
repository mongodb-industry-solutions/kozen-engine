/**
 * @fileoverview Pipeline Controller - CLI to Service Bridge Component
 * Controller that acts as a bridge between CLI input/output operations and the
 * PipelineManager service layer. This controller handles CLI validation, configuration loading,
 * and coordinates with the PipelineManager to execute infrastructure operations.
 * 
 * The PipelineController implements the Bridge pattern by abstracting CLI complexity from
 * the core business logic, enabling different user interfaces (CLI, REST API, GUI) to
 * interact with the same underlying pipeline services without modification.
 * 
 * @author IaC Pipeline Team
 * @since 1.0.4
 * @version 1.0.5
 */
import * as fs from 'fs';
import { ILoggerService } from '../models/Logger';
import { IConfig, IPipelineArgs } from '../models/Pipeline';
import { IAction, ICLIArgs, IResult, VCategory } from '../models/Types';
import { PipelineManager } from '../services/PipelineManager';
import { IIoC } from '../tools';
import { CLIController } from './CLIController';

/**
 * @class PipelineController
 * CLI bridge controller for handling pipeline operations and user interface interactions.
 * This controller serves as the primary interface between command-line operations and the
 * underlying pipeline management services, providing validation, error handling, and user feedback.
 * 
 * The controller abstracts the complexity of CLI argument parsing, configuration loading,
 * and service coordination, enabling clean separation between user interface concerns and
 * business logic implementation.
 *
 * @example
 * ```typescript
 * // Initialize with custom pipeline manager
 * const customPipeline = new PipelineManager(config, customIoC);
 * const controller = new PipelineController(customPipeline);
 *
 * // Process CLI arguments and execute
 * const args = controller.parseArguments(['--template=atlas.basic', '--action=deploy']);
 * const result = await controller.execute(args);
 * ```
 */
export class PipelineController extends CLIController {

  /**
   * Pipeline manager service instance
   *
   * @private
   * @type {PipelineManager}
   */
  public pipeline?: PipelineManager;

  /**
   * Creates a new PipelineController instance
   *
   * @constructor
   * @param {PipelineManager} pipeline - Optional pipeline manager instance
   */
  constructor(dependency?: { assistant: IIoC, logger: ILoggerService, pipeline?: PipelineManager }) {
    super(dependency);
    this.pipeline = dependency?.pipeline;
  }

  /**
   * Parses and processes command line arguments specific to pipeline operations
   * Extends base argument parsing with pipeline-specific defaults like template configuration
   * 
   * @param {string[] | ICLIArgs} args - Raw command line arguments array or pre-parsed arguments
   * @returns {Promise<IPipelineArgs>} Promise resolving to structured pipeline arguments with defaults applied
   * @public
   */
  public async fillout(args: string[] | ICLIArgs): Promise<IPipelineArgs> {
    let parsed: Partial<IPipelineArgs> = this.extract(args);
    Array.isArray(args) && (parsed = { ...(await super.fillout(args)), ...parsed });
    parsed.template = parsed.template || process.env.KOZEN_TEMPLATE || '';
    return parsed as IPipelineArgs;
  }

  /**
   * Initializes the pipeline controller by parsing arguments, loading configuration, and resolving the pipeline manager
   * Extends base initialization to include pipeline manager service resolution
   * 
   * @template T - Type of arguments to return, defaults to ICLIArgs
   * @param {string[] | ICLIArgs} [argv] - Command line arguments or pre-parsed arguments
   * @returns {Promise<{args?: T, config?: IConfig | null}>} Promise resolving to parsed arguments and loaded configuration
   * @throws {Error} When pipeline manager resolution fails or configuration loading errors occur
   * @public
   */
  public async init<T = ICLIArgs>(argv?: string[] | ICLIArgs): Promise<{ args?: T, config?: IConfig | null }> {
    const { args, config } = await super.init<T>(argv);
    this.pipeline = await this.assistant?.resolve<PipelineManager>('PipelineManager');
    return { args: args as T, config };
  }

  /**
   * Executes infrastructure deployment using the specified pipeline template
   * Deploys all components defined in the template and tracks execution metrics
   * 
   * @param {IPipelineArgs} args - Pipeline deployment arguments including template and configuration
   * @returns {Promise<IResult | null>} Promise resolving to deployment result or null if deployment fails
   * @public
   */
  public async deploy(args: IPipelineArgs) {
    try {
      const startTime = Date.now();
      const result = await this.pipeline?.deploy(args);
      this.logger?.debug({
        flow: this.getId(args as unknown as IConfig),
        src: 'Controller:Pipeline:Deploy',
        data: {
          output: result?.output,
          action: result?.action,
          errors: result?.errors || [],
          duration: Date.now() - startTime,
          template: result?.templateName,
          components: (result?.results?.length || 1) - 1
        }
      });
      return result;
    } catch (error) {
      this.logger?.error({
        flow: this.getId(args as unknown as IConfig),
        src: 'Controller:Pipeline:deploy',
        message: `❌ Failed to perform action deploy: ${(error as Error).message}`
      });
      return null;
    }
  }

  /**
   * Stops and removes active pipeline resources without deleting their definitions
   * Gracefully shuts down deployed components while preserving configuration
   * 
   * @param {IPipelineArgs} args - Pipeline undeployment arguments including template and configuration
   * @returns {Promise<IResult | null>} Promise resolving to undeployment result or null if operation fails
   * @public
   */
  public async undeploy(args: IPipelineArgs) {
    try {
      const startTime = Date.now();
      const result = await this.pipeline?.undeploy(args);
      this.logger?.debug({
        flow: this.getId(args as unknown as IConfig),
        src: 'Controller:Pipeline:Undeploy',
        data: {
          output: result?.output,
          action: result?.action,
          errors: result?.errors || [],
          duration: Date.now() - startTime,
          template: result?.templateName,
          components: (result?.results?.length || 1) - 1
        }
      });
      return result;
    } catch (error) {
      this.logger?.error({
        flow: this.getId(args as unknown as IConfig),
        src: 'Controller:Pipeline:undeploy',
        message: `❌ Failed to perform action undeploy: ${(error as Error).message}`
      });
      return null;
    }
  }

  /**
   * Permanently destroys pipeline resources and their definitions
   * Completely removes all components, data, and configuration from the deployment
   * 
   * @param {IPipelineArgs} args - Pipeline destruction arguments including template and configuration
   * @returns {Promise<IResult | null>} Promise resolving to destruction result or null if operation fails
   * @public
   */
  public async destroy(args: IPipelineArgs) {
    try {
      const startTime = Date.now();
      const result = await this.pipeline?.destroy(args);
      this.logger?.debug({
        flow: this.getId(args as unknown as IConfig),
        src: 'Controller:Pipeline:Destroy',
        data: {
          output: result?.output,
          action: result?.action,
          errors: result?.errors || [],
          duration: Date.now() - startTime,
          template: result?.templateName,
          components: (result?.results?.length || 1) - 1
        }
      });
      return result;
    } catch (error) {
      this.logger?.error({
        flow: this.getId(args as unknown as IConfig),
        src: 'Controller:Pipeline:Destroy',
        message: `❌ Failed to perform action destroy: ${(error as Error).message}`
      });
      return null;
    }
  }

  /**
   * Checks the current operational status and health of pipeline resources
   * Provides detailed information about component states and system health
   * 
   * @param {IPipelineArgs} args - Pipeline status check arguments including template and configuration
   * @returns {Promise<IResult | null>} Promise resolving to status information or null if check fails
   * @public
   */
  public async status(args: IPipelineArgs) {
    try {
      const startTime = Date.now();
      const result = await this.pipeline?.status(args);
      this.logger?.debug({
        flow: this.getId(args as unknown as IConfig),
        src: 'Controller:Pipeline:Status',
        data: {
          output: result?.output,
          action: result?.action,
          errors: result?.errors || [],
          duration: Date.now() - startTime,
          template: result?.templateName,
          components: (result?.results?.length || 1) - 1
        }
      });
      return result;
    } catch (error) {
      this.logger?.error({
        flow: this.getId(args as unknown as IConfig),
        src: 'Controller:Pipeline:Status',
        message: `❌ Failed to perform action status: ${(error as Error).message}`
      });
      return null;
    }
  }

  /**
   * Validates pipeline configuration and ensures resources are correctly defined
   * Performs comprehensive checks without deploying actual infrastructure
   * 
   * @param {IPipelineArgs} args - Pipeline validation arguments including template and configuration
   * @returns {Promise<IResult | null>} Promise resolving to validation result or null if validation fails
   * @public
   */
  public async validate(args: IPipelineArgs) {
    try {
      const startTime = Date.now();
      const result = await this.pipeline?.validate(args);
      this.logger?.debug({
        flow: this.getId(args as unknown as IConfig),
        src: 'Controller:Pipeline:Validate',
        data: {
          output: result?.output,
          action: result?.action,
          duration: Date.now() - startTime,
          template: result?.templateName,
          components: (result?.results?.length || 1) - 1
        }
      });
      return result;
    } catch (error) {
      this.logger?.error({
        flow: this.getId(args as unknown as IConfig),
        src: 'Controller:Pipeline:Validate',
        message: `❌ Failed to perform action validate: ${(error as Error).message}`
      });
      return null;
    }
  }

  /**
   * Validates CLI arguments for correctness and completeness
   * @public
   * @param {IPipelineArgs} args - CLI arguments to validate
   * @throws {Error} When validation fails due to missing or invalid arguments
   */
  public validateArguments(args: IPipelineArgs): void {
    const validActions = ['deploy', 'undeploy', 'validate', 'destroy', 'status', 'run'];
    if (!validActions.includes(args.action)) {
      throw new Error(`Invalid action: ${args.action}. Must be one of: ${validActions.join(', ')}`);
    }

    // Only require template for actions that need it
    const requiresTemplate = ['deploy', 'validate'];
    if (requiresTemplate.includes(args.action) && !args.template) {
      throw new Error('Template is required for this action. Use --template=<template-name> or set TEMPLATE environment variable.');
    }

    if (!args?.config || !fs.existsSync(args.config)) {
      throw new Error(`Configuration file not found: ${args.config}`);
    }
  }

  /**
   * Executes the pipeline operation based on CLI arguments
   * @public
   * @param {IPipelineArgs} args - CLI arguments specifying the operation
   * @returns {Promise<IResult>} Promise resolving to pipeline execution result
   * @throws {Error} When execution fails due to configuration or runtime errors
   */
  public async execute(args: IPipelineArgs): Promise<IResult> {
    const exeStart = performance.now();
    try {
      // Validate arguments
      this.validateArguments(args);
      this.pipeline?.logger?.info({
        flow: this.getId(args),
        category: VCategory.cli.pipeline,
        src: 'Controller:Pipeline:Init',
        message: `Executing ${args.action} operation for template: ${args.template}`
      });

      // Load configuration
      const config = args?.config && await this.pipeline?.load(args.config);
      if (!config) {
        throw new Error(`Configuration file not found: ${args.config}`);
      }

      // Configure pipeline manager
      await this.pipeline?.configure(config);

      // Execute the requested action
      const method = (this.pipeline as any)[args.action];
      if (!(method instanceof Function)) {
        throw new Error(`Unsupported action: ${args.action}`);
      }
      const result: IResult = await method.apply(this.pipeline, [args]);
      const exeEnd = performance.now();
      const duration = (exeEnd - exeStart).toFixed(3);

      // Log execution result
      if (result.success) {
        this.pipeline?.logger?.debug({
          flow: config.id,
          category: VCategory.cli.pipeline,
          src: 'Controller:Pipeline:End',
          message: `✅ ${result.action} operation completed successfully in ${duration} ms`,
          data: {
            action: args.action,
            stack: args.stack,
            project: args.project,
            template: result.templateName,
            components: result.results?.length || 0,
            duration
          }
        })
      } else {
        this.pipeline?.logger?.error({
          flow: this.getId(args),
          category: VCategory.cli.pipeline,
          src: 'Controller:Pipeline:End',
          message: `❌ ${result.action} operation failed after ${duration} ms`,
          data: {
            action: args.action,
            stack: args.stack,
            project: args.project,
            template: result.templateName,
            components: (result.results?.length || 1) - 1,
            duration,
            error: result.error
          }
        })
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const exeEnd = performance.now();
      const duration = (exeEnd - exeStart).toFixed(3);

      this.pipeline?.logger?.error({
        flow: this.getId(args),
        category: VCategory.cli.pipeline,
        src: 'Controller:Pipeline:Execute',
        message: `Pipeline execution failed: ${errorMessage} in ${duration} ms`,
        data: {
          action: args.action as IAction,
          template: args.template,
          duration
        }
      });

      return {
        success: false,
        action: args.action as IAction,
        templateName: args.template,
        duration: Number(duration),
        errors: [errorMessage],
        timestamp: new Date()
      };
    }
  }

  /**
   * Displays comprehensive CLI usage information and command examples for pipeline operations
   * Shows available templates, actions, and detailed usage patterns for infrastructure management
   * 
   * @returns {void}
   * @public
   */
  public help(): void {
    console.log(`
===============================================================================
Kozen Engine (Pipeline Manager Tool)
===============================================================================

Description:
    Deploy, manage, and orchestrate dynamic infrastructure and testing pipelines.
    Execute Infrastructure as Code (IaC) operations with automated testing,
    data collection, and comprehensive monitoring across multiple cloud providers.

Usage:
    kozen --action=pipeline:<action> --template=<name> [options]
    kozen --controller=pipeline --action=<action> --template=<name> [options]

Core Options:
    --stack=<id>                    Environment identifier (dev, test, staging, prod)
                                    (default: from NODE_ENV or 'dev')
    --project=<id>                  Project identifier for resource organization
                                    (default: auto-generated timestamp ID)
    --config=<file>                 Configuration file path containing service definitions
                                    (default: cfg/config.json)
    --controller=pipeline           Explicitly set controller to pipeline
    --template=<name>               Template name for pipeline execution (REQUIRED)
                                    Examples: atlas.basic, k8s.standard, demo
    --action=<[controller:]action>  Pipeline operation to perform:

Available Actions:
    deploy                          Provision and launch all pipeline resources
                                    - Creates infrastructure components
                                    - Executes testing workflows
                                    - Collects deployment metrics
    
    undeploy                        Gracefully stop active resources
                                    - Stops running services
                                    - Preserves data and configuration
                                    - Maintains resource definitions
    
    destroy                         Permanently remove all pipeline resources
                                    - Deletes infrastructure components
                                    - Removes all data and configurations
                                    - Cleans up cloud provider resources
    
    validate                        Verify pipeline configuration and readiness
                                    - Checks template syntax and dependencies
                                    - Validates cloud provider credentials
                                    - Ensures all prerequisites are met
    
    status                          Check current pipeline and resource health
                                    - Reports component operational status
                                    - Shows resource utilization metrics
                                    - Identifies configuration drift

Environment Variables:
    KOZEN_CONFIG                    Default value assigned to the --config property
    KOZEN_ACTION                    Default value assigned to the --action property
    KOZEN_STACK                     Default value assigned to the --stack property
    KOZEN_PROJECT                   Default value assigned to the --project property

    KOZEN_TEMPLATE                  Default value assigned to the --stack property

Common Templates:
    atlas.basic                     MongoDB Atlas cluster deployment
    k8s.standard                    Standard Kubernetes application deployment
    demo                            Demo pipeline with testing components
    ops.manager                     MongoDB Ops Manager deployment

Examples:
    # Deploy MongoDB Atlas cluster in production
    kozen --action=pipeline:deploy --template=atlas.basic --stack=production --config=cfg/prod-config.json
    
    # Validate Kubernetes deployment configuration
    kozen --action=pipeline:validate --template=k8s.standard
    
    # Check status of demo pipeline
    kozen --controller=pipeline --action=status --template=demo --stack=dev
    
    # Undeploy development environment
    kozen --action=pipeline:undeploy --template=atlas.basic --stack=dev
    
    # Completely destroy test resources
    kozen --action=pipeline:destroy --template=k8s.standard --stack=test
    
    # Deploy with custom project identifier
    kozen --action=pipeline:deploy --template=atlas.basic --project=MyApp-v2.1 --stack=staging
===============================================================================
    `);
  }
} 