/**
 * @fileoverview Kozen Engine - Main Entry Point for Dynamic Infrastructure & Testing Platform
 * @description Main entry point for the Kozen Engine package, providing comprehensive exports
 * for infrastructure deployment, testing automation, and pipeline management.
 * 
 * The Kozen Engine is a mono-stack pipeline platform that transforms JSON configuration
 * files into powerful, automated infrastructure and testing workflows, supporting
 * Infrastructure as a Service (IaaS) and Testing as a Service (TaaS) platforms.
 * 
 * @author MongoDB Solution Assurance Team (SAT)
 * @version 1.1.0
 * @since 2024-01-01
 * 
 * @example
 * ```typescript
 * import { PipelineManager, IoC, CLIController } from 'kozen-engine';
 * 
 * // Initialize IoC container and pipeline manager
 * const ioc = new IoC();
 * const pipeline = new PipelineManager(ioc);
 * 
 * // Deploy infrastructure template
 * await pipeline.deploy({
 *   template: 'atlas.basic',
 *   action: 'deploy',
 *   stack: 'production'
 * });
 * 
 * // Run validation and tests
 * await pipeline.validate({
 *   template: 'demo',
 *   action: 'validate',
 *   stack: 'test'
 * });
 * 
 * // CLI usage
 * const cli = new CLIController();
 * const { args, config } = await cli.init();
 * ```
 */

// Core Pipeline Management
export { PipelineManager } from './services/PipelineManager';
export { StackManager } from './services/StackManager';

// Service Layer
export { LoggerService } from './services/LoggerService';
export { SecretManager } from './services/SecretManager';
export { TemplateManager } from './services/TemplateManager';

// Controllers
export { BaseController } from './controllers/BaseController';
export { LoggerController } from './controllers/cli/LoggerController';
export { PipelineController } from './controllers/cli/PipelineController';
export { SecretController } from './controllers/cli/SecretController';
export { TemplateController } from './controllers/cli/TemplateController';
export { CLIController } from './controllers/CLIController';

// IoC Container and Utilities
export { Env } from './tools/env/Env';
export { IoC } from './tools/ioc/IoC';
export { ILogLevel, Logger } from './tools/log';
export { EnumUtl, getID, readFrom } from './tools/util';

// Models and Interfaces
export { IComponent, IComponentInput, IComponentOutput, ITransformFn } from './models/Component';
export { ILogArgs, ILoggerService } from './models/Logger';
export { IConfig, IPipelineArgs } from './models/Pipeline';
export { ISecretArgs, ISecretManager } from './models/Secret';
export { ITemplate, ITemplateArgs, ITemplateConfig, ITemplateManager } from './models/Template';
export { IAction, ICLIArgs, IMetadata, IResult } from './models/Types';

// Type definitions
export * from './tools/env/types';
export * from './tools/ioc/types';
export * from './tools/log/types';

