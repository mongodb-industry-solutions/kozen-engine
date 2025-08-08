
import { IDependency, IIoC } from "../tools";
import { IStackManager } from "./Stack";
import { ITemplate } from "./Template";
import { ICLIArgs } from "./Types";

/**
 * @fileoverview Pipeline configuration models for CLI arguments and deployment settings
 * Defines interfaces for pipeline arguments and configuration management
 * @author MDB SAT
 * @since 1.0.4
 * @version 1.0.5
 */

/**
 * Extended pipeline arguments interface with template and deployment options
 * @interface IPipelineArgs
 * @extends ICLIArgs
 */
export interface IPipelineArgs extends ICLIArgs {
  /**
   * Infrastructure template name for deployment operations
   * @type {string}
   */
  template?: string;
}

/**
 * Kozen configuration interface for deployment management
 * @interface IConfig
 * @extends IPipelineArgs
 */
export interface IConfig extends IPipelineArgs {

  /**
   * Unique pipeline instance identifier for tracking and logging
   * @type {string}
   */
  id?: string;

  /**
   * Pipeline configuration identifier for human-readable naming
   * @type {string}
   */
  name?: string;

  /**
   * Engine version requirements for compatibility validation
   * @type {string}
   */
  engine?: string;

  /**
   * Semantic version for pipeline configuration versioning
   * @type {string}
   */
  version?: string;

  /**
   * Optional pipeline description for documentation purposes
   * @type {string}
   */
  description?: string;

  /**
   * Service configuration array for IoC container dependency injection
   * @type {IDependency[]}
   */
  dependencies?: IDependency[];
}

/**
 * Pipeline runtime context interface for operation execution
 * @interface IPipeline
 */
export interface IPipeline {
  /**
   * Unique pipeline runtime identifier for execution tracking
   * @type {string}
   */
  id?: string;

  /**
   * CLI arguments for pipeline operation execution
   * @type {IPipelineArgs}
   */
  args?: IPipelineArgs;

  /**
   * Template definition for infrastructure deployment configuration
   * @type {ITemplate}
   */
  template?: ITemplate;

  /**
   * IoC container for dependency resolution and service management
   * @type {IIoC}
   */
  assistant?: IIoC;

  /**
   * Stack manager for infrastructure operations and resource management
   * @type {IStackManager}
   */
  stack?: IStackManager
}