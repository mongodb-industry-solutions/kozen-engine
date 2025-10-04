
import { IArgs } from "../../../shared/models/Args";
import { IIoC } from "../../../shared/tools";
import { ITemplate } from "../../template/models/Template";
import { IStackManager } from "./Stack";

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
 * @extends IArgs
 */
export interface IPipelineArgs extends IArgs {
  /**
   * Infrastructure template name for deployment operations
   * @type {string}
   */
  template?: string;
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