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
   * Parses command line arguments into structured format
   * @public
   * @param {string[]} args - Command line arguments array
   * @returns {ISecretArgs} Parsed CLI arguments with defaults applied
   */
  public async fillout(args: string[] | ICLIArgs): Promise<IPipelineArgs> {
    let parsed: Partial<IPipelineArgs> = this.extract(args);
    Array.isArray(args) && (parsed = { ...(await super.fillout(args)), ...parsed });
    parsed.template = parsed.template || process.env.KOZEN_TEMPLATE || '';
    return parsed as IPipelineArgs;
  }

  public async init<T = ICLIArgs>(argv?: string[] | ICLIArgs): Promise<{ args?: T, config?: IConfig | null }> {
    const { args, config } = await super.init<T>(argv);
    this.pipeline = await this.assistant?.resolve<PipelineManager>('PipelineManager');
    return { args: args as T, config };
  }

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
    if (!args.template) {
      throw new Error('Template is required. Use --template=<template-name> or set TEMPLATE environment variable.');
    }

    const validActions = ['deploy', 'undeploy', 'validate', 'destroy', 'status', 'run'];
    if (!validActions.includes(args.action)) {
      throw new Error(`Invalid action: ${args.action}. Must be one of: ${validActions.join(', ')}`);
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
   * Displays CLI usage information and command examples
   * @public
   */
  public help(): void {
    console.log(`
===============================================================================
Kozen Engine (Pipeline Manager Tool)
=============================================================================

Usage:
    pipeline --template=<template-name> [--config=<config-file>] [--action=<action>] [--project=<id>] [--stack=<id>]

Options:
    --stack=<id>                    Environment identifier (optional) (default: autogenerated, e.g., 'dev')
    --project=<id>                  Project identifier (optional) (default: autogenerated, e.g., 'K2025071525')
    --config=<file>                 Configuration file path (optional) (default: cfg/config.json)
    --controller=logger             Set controller name as logger (required if not specified in the action)
    --action=<[controller:]action>  Action to be performed within the Logger Manager tool. The possible values are:
                                    - deploy: Provision and launch the resources defined in the pipeline.
                                    - undeploy: Stop and remove active resources without deleting their definitions.
                                    - destroy: Permanently delete resources and their definitions from the pipeline.
                                    - status: Check the current state or health of the pipeline and its resources.
                                    - validate: Ensure the pipeline configuration and resources are correctly defined and ready for deployment.

    --template=<n>                  Defines which template to use for pipeline execution, based on the template name (required)

Environment Variables:
    KOZEN_CONFIG                    Default value assigned to the --config property
    KOZEN_ACTION                    Default value assigned to the --action property
    KOZEN_STACK                     Default value assigned to the --stack property
    KOZEN_PROJECT                   Default value assigned to the --project property

    KOZEN_TEMPLATE                  Default value assigned to the --stack property

Examples:
    pipeline --template=atlas.basic --config=cfg/config.json --action=deploy --project=K2025071525  --stack=production
    pipeline --template=ops.manager --config=cfg/production.json --action=undeploy --project=K2025071525
    pipeline --template=k8s.standard --action=validate
    pipeline --template=k8s.standard --action=status
=============================================================================
    `);
  }
} 