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

// CLI app: server and controller
// Applications: CLI and MCP
export { CLIServer } from './applications/cli';
export { CLIController } from './applications/cli/controllers/CLIController';
export { ServerMCP } from './applications/mcp';
export { MCPController } from './applications/mcp/controllers/MCPController';

// Components: runtime components
export { API } from './components/API';
export { Atlas } from './components/Atlas';
export { CLI as CLIComponent } from './components/CLI';
export { DemoFirst } from './components/DemoFirst';
export { DemoSecond } from './components/DemoSecond';
export { Docker } from './components/Docker';
export { K8Pods } from './components/K8Pods';

// Component config types
export { IAtlasConfig } from './components/Atlas/IAtlasConfig';
export { IDockerConfig } from './components/Docker/IDockerConfig';
export { IEcrConfig } from './components/ECR/IEcrConfig';
export { IEksConfig } from './components/EKS/IEksConfig';
export { IK8PodsConfig } from './components/K8Pods/IK8PodsConfig';

// Shared controllers: base classes
export { KzApp } from './shared/controllers/KzApp';
export { KzApplication } from './shared/controllers/KzApplication';
export { KzComponent } from './shared/controllers/KzComponent';
export { KzController } from './shared/controllers/KzController';
export { KzModule } from './shared/controllers/KzModule';

// Modules: pipeline managers
export { PipelineManager } from './modules/pipeline/services/PipelineManager';
export { StackManager } from './modules/pipeline/services/StackManager';
export { StackManagerNode } from './modules/pipeline/services/StackManagerNode';
export { StackManagerPulumi } from './modules/pipeline/services/StackManagerPulumi';

// Modules: services
export { LoggerService } from './modules/logger/services/LoggerService';
export { ReportManager } from './modules/report/services/ReportManager';
export { ReportManagerMDB } from './modules/report/services/ReportManagerMDB';
export { SecretManager } from './modules/secret/services/SecretManager';
export { SecretManagerAWS } from './modules/secret/services/SecretManagerAWS';
export { SecretManagerMDB } from './modules/secret/services/SecretManagerMDB';
export { TemplateManager } from './modules/template/services/TemplateManager';
export { TemplateManagerFile } from './modules/template/services/TemplateManagerFile';
export { TemplateManagerMDB } from './modules/template/services/TemplateManagerMDB';

// Shared services: core services
export { BaseService } from './shared/services/BaseService';
export { FileService } from './shared/services/FileService';
export { ProcessorService } from './shared/services/ProcessorService';

// Modules: CLI and MCP controllers
export { LoggerController } from './modules/logger/controllers/LoggerCLIController';
export { PipelineController } from './modules/pipeline/controllers/PipelineCLIController';
export { PipelineController as PipelineMCPController } from './modules/pipeline/controllers/PipelineMCPController';
export { SecretController } from './modules/secret/controllers/SecretCLIController';
export { SecretController as SecretMCPController } from './modules/secret/controllers/SecretMCPController';
export { TemplateController } from './modules/template/controllers/TemplateCLIController';
export { TemplateController as TemplateMCPController } from './modules/template/controllers/TemplateMCPController';

// Shared tools: utilities and IoC
export * from './shared/tools';
export { JSONT } from './shared/tools';
export { Env } from './shared/tools/env/Env';
export { IoC } from './shared/tools/ioc/IoC';
export { ILogLevel, Logger } from './shared/tools/log';
export { MdbClient } from './shared/tools/mdb/MdbClient';
export { IMdbClientOpt, IMdbClientOpts } from './shared/tools/mdb/MdbClientOpt';
export { EnumUtl, getID, readFrom } from './shared/tools/util';

// Modules: bundle exports
export { LoggerModule } from './modules/logger';
export { PipelineModule } from './modules/pipeline';
export { IAMRectificationModule } from './modules/rectification';
export { ReportModule } from './modules/report';
export { SecretModule } from './modules/secret';
export { TemplateModule } from './modules/template';

// Shared models and component types
export { ILogArgs, ILoggerService } from './modules/logger/models/Logger';
export { IPipeline, IPipelineArgs } from './modules/pipeline/models/Pipeline';
export { IConfigValue, IProgramFn, ISetupFn, IStackConfig, IStackManager, IStackManagerPulumi, IStackOptions } from './modules/pipeline/models/Stack';
export { IComponent, IComponentInput, IComponentOutput, IOutputResult, ITransformFn, ITransformOption } from './shared/models/Component';
// Shared models: export everything
export * from './shared/models/App';
export * from './shared/models/Args';
export * from './shared/models/Component';
export * from './shared/models/Config';
export * from './shared/models/Controller';
export * from './shared/models/Metadata';
export * from './shared/models/Module';
export * from './shared/models/Processor';
export * from './shared/models/Result';
export * from './shared/models/Struct';
export * from './shared/models/Types';

export { ISecretArgs, ISecretManager } from './modules/secret/models/Secret';
export { ITemplate, ITemplateArgs, ITemplateConfig, ITemplateManager } from './modules/template/models/Template';
export { IKzApplication } from './shared/models/App';
export { IArgs } from './shared/models/Args';
export { IConfig } from './shared/models/Config';
export { IController } from './shared/models/Controller';
export { IMetadata } from './shared/models/Metadata';
export { IModule, IModuleOpt } from './shared/models/Module';
export { IProcessorService } from './shared/models/Processor';
export { IResult } from './shared/models/Result';
export { IAction, IAppType, IStruct, IStructType, VCategory } from './shared/models/Types';

// Shared type definitions
export * from './shared/tools/env/types';
export * from './shared/tools/ioc/types';
export * from './shared/tools/log/types';

