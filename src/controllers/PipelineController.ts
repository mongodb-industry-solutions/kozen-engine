/**
 * @fileoverview Pipeline Controller - CLI to Service Bridge Component
 * @description Controller that acts as a bridge between CLI input/output operations and the
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
import { IAction, IResult } from '../models/Types';
import { PipelineManager } from '../services/PipelineManager';
import { ILogInput, ILogLevel } from '../tools';

/**
 * @class PipelineController
 * @description CLI bridge controller for handling pipeline operations and user interface interactions.
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
   * Parses command line arguments into structured format
   * 
   * @method parseArguments
   * @param {string[]} args - Command line arguments array
   * @returns {IPipelineArgs} Parsed CLI arguments
   * 
   * @example
   * ```typescript
   * const args = controller.parseArguments(['--template=atlas.basic', '--action=deploy']);
   * // Returns: { template: 'atlas.basic', config: 'config.json', action: 'deploy' }
   * ```
   */
  public parseArguments(args: string[]): IPipelineArgs {
    const parsed: Partial<IPipelineArgs> = {};

    for (const arg of args) {
      if (arg.startsWith('--template=')) {
        parsed.template = arg.split('=')[1];
      } else if (arg.startsWith('--stack=')) {
        parsed.stack = arg.split('=')[1];
      } else if (arg.startsWith('--project=')) {
        parsed.project = arg.split('=')[1];
      } else if (arg.startsWith('--config=')) {
        parsed.config = arg.split('=')[1];
      } else if (arg.startsWith('--action=')) {
        parsed.action = arg.split('=')[1] as IAction;
      }
    }

    return {
      stack: parsed.stack || process.env.KOZEN_STACK || 'dev',
      project: parsed.project || process.env.KOZEN_PROJECT || '',
      template: parsed.template || process.env.KOZEN_TEMPLATE || '',
      config: parsed.config || process.env.KOZEN_CONFIG || 'cfg/config.json',
      action: parsed.action || (process.env.KOZEN_ACTION as IAction) || 'deploy'
    };
  }

  /**
   * Validates CLI arguments for correctness and completeness
   * 
   * @method validateArguments
   * @param {PipelineArgs} args - CLI arguments to validate
   * @throws {Error} If validation fails
   * 
   * @example
   * ```typescript
   * try {
   *   controller.validateArguments(args);
   * } catch (error) {
   *   console.error('Validation failed:', error.message);
   * }
   * ```
   */
  public validateArguments(args: IPipelineArgs): void {
    if (!args.template) {
      throw new Error('Template is required. Use --template=<template-name> or set TEMPLATE environment variable.');
    }

    const validActions = ['deploy', 'undeploy', 'validate', 'destroy', 'status', 'run'];
    if (!validActions.includes(args.action)) {
      throw new Error(`Invalid action: ${args.action}. Must be one of: ${validActions.join(', ')}`);
    }

    if (!fs.existsSync(args.config)) {
      throw new Error(`Configuration file not found: ${args.config}`);
    }
  }

  /**
   * Executes the pipeline operation based on CLI arguments
   * 
   * @method execute
   * @param {PipelineArgs} args - CLI arguments specifying the operation
   * @returns {Promise<ExecutionResult>} Result of the pipeline execution
   * 
   * @example
   * ```typescript
   * const result = await controller.execute({
   *   template: 'atlas.basic',
   *   config: 'cfg/config.json',
   *   action: 'deploy'
   * });
   * 
   * if (result.success) {
   *   console.log('Operation completed successfully');
   * } else {
   *   console.error('Operation failed:', result.errors);
   * }
   * ```
   */
  public async execute(args: IPipelineArgs): Promise<IResult> {
    try {
      // Validate arguments
      this.validateArguments(args);

      // Load configuration
      const config = await this.pipeline.load(args.config);

      // Apply default values if not specified
      this.applyConfigDefaults(config);

      // Validate configuration structure
      this.validateConfiguration(config);

      // Configure pipeline manager
      await this.pipeline.configure(config);

      this.pipeline.logger?.debug({
        src: 'Controller:Pipeline:CLI:execute',
        message: `Executing ${args.action} operation for template: ${args.template}`
      });

      // Execute the requested action
      let result: IResult;
      switch (args.action) {
        case 'deploy':
          result = await this.pipeline.deploy(args);
          break;
        case 'undeploy':
          result = await this.pipeline.undeploy(args);
          break;
        case 'validate':
          result = await this.pipeline.validate(args);
          break;
        case 'status':
          result = await this.pipeline.status(args);
          break;
        default:
          throw new Error(`Unsupported action: ${args.action}`);
      }

      // Log execution result
      await this.logExecutionResult(result);

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.pipeline.logger?.error({
        src: 'Controller:Pipeline:CLI:execute',
        message: `Pipeline execution failed: ${errorMessage}`
      });

      return {
        action: args.action as IAction,
        templateName: args.template,
        success: false,
        duration: 0,
        results: [],
        errors: [errorMessage],
        timestamp: new Date()
      };
    }
  }

  /**
   * Displays usage information for the CLI
   * 
   * @method displayUsage
   * @static
   * 
   * @example
   * ```typescript
   * PipelineController.displayUsage();
   * ```
   */
  public displayUsage(): void {
    console.log(`
Kozen Pipeline CLI
=============================================================================

Usage:
  pipeline --template=<template-name> --config=<config-file> --action=<action> --project=<id> --stack=<id>

Options:
  --template=<name>    Template name to use (required)
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
   * 
   * @private
   * @method applyConfigDefaults
   * @param {PipelineConfig} config - Configuration object to apply defaults to
   */
  private applyConfigDefaults(config: IPipelineConfig): void {
    // Apply stack defaults
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
   * 
   * @private
   * @method validateConfiguration
   * @param {IPipelineConfig} config - Configuration to validate
   * @throws {Error} If configuration is invalid
   */
  private validateConfiguration(config: IPipelineConfig): void {
    if (!config.engine) {
      throw new Error('Invalid configuration: Engine is required');
    }
  }

  /**
   * Logs execution result details
   * 
   * @private
   * @method logExecutionResult
   * @param {IResult} result - Execution result to log
   */
  private logExecutionResult(result: IResult): Promise<void[]> {

    const logs = [];
    if (result.success) {

      logs.push(this.pipeline.logger?.debug({
        src: 'Controller:Pipeline:CLI:ExecutionResult',
        message: `✅ ${result.action} operation completed successfully in ${result.duration}ms`
      }));

      result?.results?.length && logs.push(this.pipeline.logger?.debug({
        src: 'Controller:Pipeline:CLI:ExecutionResult',
        message: `Processed ${result.results.length} component(s)`
      }));

    } else {

      logs.push(this.pipeline.logger?.error({
        src: 'Controller:Pipeline:CLI:ExecutionResult',
        message: `❌ ${result.action} operation failed after ${result.duration}ms`
      }));

      result?.errors?.length && logs.push(...result.errors.map(error => this.pipeline.logger?.error({
        src: 'Controller:Pipeline:CLI:ExecutionResult',
        message: `Error: ${error}`
      })));

    }

    return Promise.all(logs);
  }

  /**
   * Logs a general message - alias for info() method for compatibility
   * @param level - The log level to use
   * @param input - The log input: string/number for simple message, or ILogEntry object for complex logging
   * @example
   * logger.log('General message');
   * logger.log({ message: 'Process completed', data: { duration: '2.5s', items: 150 } });
   */
  log(input: ILogInput, level: ILogLevel = ILogLevel.INFO) {
    return this.pipeline.logger?.log(input, level);
  }
} 