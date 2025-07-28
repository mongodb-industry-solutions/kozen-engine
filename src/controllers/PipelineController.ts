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
 * 
 * @example
 * ```typescript
 * // Basic CLI bridge usage
 * const controller = new PipelineController();
 * 
 * // Parse command line arguments
 * const args = controller.parseArguments(process.argv.slice(2));
 * 
 * // Execute pipeline operation
 * const result = await controller.execute(args);
 * 
 * if (result.success) {
 *   console.log('✅ Operation completed successfully');
 *   process.exit(0);
 * } else {
 *   console.error('❌ Operation failed:', result.errors);
 *   process.exit(1);
 * }
 * ```
 */
import * as fs from 'fs';
import { IPipelineArgs, IPipelineConfig } from '../models/Pipeline';
import { IAction, IResult, VCategory } from '../models/Types';
import { PipelineManager } from '../services/PipelineManager';
import { getID, ILogInput, ILogLevel } from '../tools';

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
export class PipelineController {

  /**
   * Pipeline manager service instance
   * 
   * @private
   * @type {PipelineManager}
   */
  private pipeline: PipelineManager;

  /**
   * Creates a new PipelineController instance
   * 
   * @constructor
   * @param {PipelineManager} pipeline - Optional pipeline manager instance
   */
  constructor(pipeline?: PipelineManager) {
    this.pipeline = pipeline || new PipelineManager();
  }

  /**
   * Extracts key-value pairs from CLI argument string
   * @protected
   * @param {string} arg - Single CLI argument in --key=value format
   * @returns {{ key: string, value: string } | null} Parsed key-value pair or null if invalid format
   */
  protected extract(arg: string): { key: string, value: string } | null {
    // Define a regular expression to match "--key=value"
    const argRegex = /^--([a-zA-Z0-9]+)=(.*)$/;
    const match = arg.match(argRegex);
    if (!match) {
      return null;
    }
    // Destructure the captured groups
    const [, key, value] = match;
    return { key, value };
  }

  /**
   * Parses command line arguments into structured format
   * @public
   * @param {string[]} args - Command line arguments array
   * @returns {IPipelineArgs} Parsed CLI arguments with defaults applied
   */
  public parseArguments(args: string[]): IPipelineArgs {
    const parsed: Partial<IPipelineArgs> = {};

    for (const arg of args) {
      let meta = this.extract(arg);
      meta && (parsed[meta?.key as keyof IPipelineArgs] = meta?.value);
    }

    return {
      stack: (parsed.stack || process.env.KOZEN_STACK || process.env["NODE_ENV"] || 'dev').toUpperCase(),
      project: parsed.project || process.env.KOZEN_PROJECT || getID(),
      template: parsed.template || process.env.KOZEN_TEMPLATE || '',
      config: parsed.config || process.env.KOZEN_CONFIG || 'cfg/config.json',
      action: parsed.action || (process.env.KOZEN_ACTION as IAction) || 'deploy'
    };
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
      this.pipeline.logger?.info({
        flow: this.getId(args),
        category: VCategory.core.pipeline,
        src: 'Controller:Pipeline:Init',
        message: `Executing ${args.action} operation for template: ${args.template}`
      });

      // Load configuration
      const config = args?.config && await this.pipeline.load(args.config);
      if (!config) {
        throw new Error(`Configuration file not found: ${args.config}`);
      }

      // Apply default values if not specified
      this.applyConfigDefaults(config, args);

      // Validate configuration structure
      this.validateConfiguration(config);

      // Configure pipeline manager
      await this.pipeline.configure(config);

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
        this.pipeline.logger?.debug({
          flow: config.id,
          category: VCategory.core.pipeline,
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
        this.pipeline.logger?.error({
          flow: this.getId(args),
          category: VCategory.core.pipeline,
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

      this.pipeline.logger?.error({
        flow: this.getId(args),
        category: VCategory.core.pipeline,
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
  public displayUsage(): void {
    console.log(`
Kozen Pipeline CLI
=============================================================================

Usage:
  pipeline --template=<template-name> --config=<config-file> --action=<action> --project=<id> --stack=<id>

Options:
  --template=<n>    Template name to use (required)
  --stack=<id>         Environment identifier (optional) (default: autogenerated, e.g., 'dev')
  --project=<id>       Project identifier (optional) (default: autogenerated, e.g., 'K2025071525')
  --config=<file>      Configuration file path (optional) (default: cfg/config.json)
  --action=<action>    Action to perform: deploy, undeploy, validate, status (optional) (default: deploy)

Environment Variables:
  TEMPLATE             Template name
  CONFIG               Configuration file path
  ACTION               Action to perform

Examples:
  pipeline --template=atlas.basic --config=cfg/config.json --action=deploy --project=K2025071525  --stack=production
  pipeline --template=ops.manager --config=cfg/production.json --action=undeploy --project=K2025071525
  pipeline --template=k8s.standard --action=validate
  pipeline --template=k8s.standard --action=status
=============================================================================
`);
  }

  /**
   * Applies default values to configuration if not specified
   * @private
   * @param {IPipelineConfig} config - Configuration object to apply defaults to
   * @param {IPipelineArgs} [arg] - Optional CLI arguments for context
   */
  private applyConfigDefaults(config: IPipelineConfig, arg?: IPipelineArgs): void {
    // Apply stack defaults
    config.id = this.getId(arg);
    config.name = config.name || 'DefaultPipeline';
    config.engine = config.engine || 'default';
    config.version = config.version || '1.0.0';
    config.description = config.description || 'Infrastructure as Code Pipeline';
    // Ensure dependencies is an array
    if (!Array.isArray(config.dependencies)) {
      config.dependencies = [];
    }
  }

  /**
   * Validates configuration structure and required fields
   * @private
   * @param {IPipelineConfig} config - Configuration to validate
   * @throws {Error} When configuration is invalid or missing required fields
   */
  private validateConfiguration(config: IPipelineConfig): void {
    if (!config.engine) {
      throw new Error('Invalid configuration: Engine is required');
    }
  }

  /**
   * Logs a message using the pipeline logger with specified level
   * @public
   * @param {ILogInput} input - Log input message or structured log object
   * @param {ILogLevel} [level] - Log level, defaults to INFO
   * @returns {void | Promise<void>} Log operation result
   */
  public log(input: ILogInput, level: ILogLevel = ILogLevel.INFO) {
    if (typeof input === 'object') {
      input.category = VCategory.core.pipeline;
    }
    return this.pipeline.logger?.log(input, level);
  }

  /**
   * Waits for all pending logger operations to complete
   * @public
   * @returns {Promise<void>} Promise that resolves when all log operations complete
   */
  public async await(): Promise<void> {
    if (this.pipeline.logger?.stack) {
      await Promise.all(this.pipeline.logger?.stack)
    }
  }

  /**
   * Generates unique pipeline identifier from configuration options
   * @public
   * @param {IPipelineConfig} [opt] - Optional pipeline configuration for ID generation
   * @returns {string} Generated pipeline identifier
   */
  public getId(opt?: IPipelineConfig) {
    return this.pipeline.getId(opt);
  }
} 