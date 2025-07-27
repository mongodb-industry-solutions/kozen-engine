
import { IDependency, IIoC } from "../tools";
import { IStackManager } from "./Stack";
import { ITemplate } from "./Template";

/**
 * @fileoverview Pipeline configuration models for CLI arguments and deployment settings
 * @description Defines interfaces for pipeline arguments and configuration management
 * @author MDB SAT
 * @since 1.0.4
 * @version 1.0.5
 */

/**
 * @interface IPipelineArgs
 * @description CLI arguments interface for pipeline operations
 */
export interface ICLIArgs {
  /**
   * Help action entry
   * @type {string}
   */
  help?: string;

  /**
   * Configuration file path
   * @type {string}
   */
  config?: string;

  /**
   * Pipeline operation type
   * @type {string}
   * @description Supported actions: deploy, undeploy, validate, status
   */
  action: string;
}

export interface IPipelineArgs extends ICLIArgs {

  /**
   * Infrastructure template name
   * @type {string}
   */
  template?: string;

  /**
   * Optional unique stack identifier
   * @type {string}
   */
  stack?: string;

  /**
   * Optional project organization name
   * @type {string}
   */
  project?: string;
}

export interface ISecretArgs extends ICLIArgs {
  key?: string;
  value?: string;
}

/**
 * @interface IPipelineConfig
 * @description Pipeline configuration for deployment management
 */
export interface IPipelineConfig extends IPipelineArgs {

  id?: string;

  /**
   * Pipeline config identifier
   * @type {string}
   */
  name?: string;

  /**
   * Engine version requirements
   * @type {string}
   */
  engine?: string;

  /**
   * Semantic version
   * @type {string}
   */
  version?: string;

  /**
   * Optional pipeline description
   * @type {string}
   */
  description?: string;

  /**
   * Service configuration array for IoC container
   * @type {IDependency[]}
   */
  dependencies?: IDependency[];
}


/**
 * @interface IPipeline
 * @description Pipeline runtime context interface for operation execution
 */
export interface IPipeline {
  id?: string;

  /**
   * CLI arguments for pipeline operation
   * @type {IPipelineArgs}
   */
  args?: IPipelineArgs;

  /**
   * Template definition for infrastructure deployment
   * @type {ITemplate}
   */
  template?: ITemplate;

  /**
   * IoC container for dependency resolution
   * @type {IIoC}
   */
  assistant?: IIoC;

  /**
   * Stack manager for infrastructure operations
   * @type {IStackManager}
   */
  stack?: IStackManager
}