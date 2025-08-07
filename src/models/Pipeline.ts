
import { IDependency, IIoC, ILogEntry } from "../tools";
import { IStackManager } from "./Stack";
import { ITemplate } from "./Template";

/**
 * @fileoverview Pipeline configuration models for CLI arguments and deployment settings
 * Defines interfaces for pipeline arguments and configuration management
 * @author MDB SAT
 * @since 1.0.4
 * @version 1.0.5
 */

/**
 * Base CLI arguments interface for pipeline operations
 * @interface ICLIArgs
 */
export interface ICLIArgs {
  /**
   * Help action entry flag for displaying usage information
   * @type {string}
   */
  help?: string;

  /**
   * Configuration file path for pipeline settings
   * @type {string}
   */
  config?: string;

  /**
   * Pipeline operation type to execute
   * @type {string}
   * Supported actions: deploy, undeploy, validate, status
   */
  action: string;
}

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

  /**
   * Optional unique stack identifier for environment isolation
   * @type {string}
   */
  stack?: string;

  /**
   * Optional project organization name for resource grouping
   * @type {string}
   */
  project?: string;
}

/**
 * Secret management CLI arguments interface
 * @interface ISecretArgs
 * @extends ICLIArgs
 */
export interface ISecretArgs extends ICLIArgs {
  /**
   * Secret key identifier for storage and retrieval operations
   * @type {string}
   */
  key?: string;

  /**
   * Secret value content for storage operations
   * @type {string}
   */
  value?: string;
}

/**
 * Secret management CLI arguments interface
 * @interface ILogArgs
 * @extends ICLIArgs
 */
export interface ILogArgs extends ICLIArgs, ILogEntry {
  /**
   * 
   * @type {string}
   */
  dataFromPath?: string;
}

/**
 * Pipeline configuration interface for deployment management
 * @interface IPipelineConfig
 * @extends IPipelineArgs
 */
export interface IPipelineConfig extends IPipelineArgs {

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