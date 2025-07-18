
import { IIoC, ServiceConfig } from "../tools";
import { IStackManager } from "./Stack";
import { ITemplate } from "./Template";

/**
 * @fileoverview Pipeline configuration models for CLI arguments and deployment settings
 * @description Defines interfaces for pipeline arguments and configuration management
 * @author MDB SAT
 * @since 4.0.0
 * @version 4.0.0
 */

/**
 * @interface IPipelineArgs
 * @description CLI arguments interface for pipeline operations
 */
export interface IPipelineArgs {
  /**
   * Infrastructure template name
   * @type {string}
   */
  template: string;

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

  /**
   * Configuration file path
   * @type {string}
   */
  config: string;

  /**
   * Pipeline operation type
   * @type {string}
   * @description Supported actions: deploy, undeploy, validate, status
   */
  action: string;
}

/**
 * @interface IPipelineConfig
 * @description Pipeline configuration for deployment management
 */
export interface IPipelineConfig {
  /**
   * Pipeline identifier
   * @type {string}
   */
  name: string;

  /**
   * Engine version requirements
   * @type {string}
   */
  engine: string;

  /**
   * Semantic version
   * @type {string}
   */
  version: string;

  /**
   * Optional pipeline description
   * @type {string}
   */
  description?: string;

  /**
   * Service configuration array for IoC container
   * @type {ServiceConfig[]}
   */
  dependencies: ServiceConfig[];
}


export interface IPipeline {
  args?: IPipelineArgs;

  template?: ITemplate;

  assistant?: IIoC;

  stack?: IStackManager
}