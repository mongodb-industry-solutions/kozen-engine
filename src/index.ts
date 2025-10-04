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
 * @since 2025-07-01
 */

// Core Pipeline Management
export { PipelineManager } from './modules/pipeline/services/PipelineManager';
export { StackManager } from './modules/pipeline/services/StackManager';

// Service Layer
export { LoggerService } from './modules/logger/services/LoggerService';
export { SecretManager } from './modules/secret/services/SecretManager';
export { TemplateManager } from './modules/template/services/TemplateManager';

// Controllers
export { LoggerController } from './modules/logger/controllers/LoggerCLIController';
export { PipelineController } from './modules/pipeline/controllers/PipelineCLIController';
export { SecretController } from './modules/secret/controllers/SecretCLIController';
export { TemplateController } from './modules/template/controllers/TemplateCLIController';
export { KzComponent } from './shared/controllers/KzComponent';

// IoC Container and Utilities
export { Env } from './shared/tools/env/Env';
export { IoC } from './shared/tools/ioc/IoC';
export { ILogLevel, Logger } from './shared/tools/log';
export { EnumUtl, getID, readFrom } from './shared/tools/util';

// Models and Interfaces
export { ILogArgs, ILoggerService } from './modules/logger/models/Logger';
export { IPipelineArgs } from './modules/pipeline/models/Pipeline';
export { IComponent, IComponentInput, IComponentOutput, ITransformFn } from './shared/models/Component';

export { ISecretArgs, ISecretManager } from './modules/secret/models/Secret';
export { ITemplate, ITemplateArgs, ITemplateConfig, ITemplateManager } from './modules/template/models/Template';
export { IArgs } from './shared/models/Args';
export { IConfig } from './shared/models/Config';
export { IMetadata } from './shared/models/Metadata';
export { IResult } from './shared/models/Result';
export { IAction, IStruct, VCategory } from './shared/models/Types';

// Type definitions
export * from './shared/tools/env/types';
export * from './shared/tools/ioc/types';
export * from './shared/tools/log/types';

