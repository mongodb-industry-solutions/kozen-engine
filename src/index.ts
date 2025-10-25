/**
 * @fileoverview Main export file for Kozen Engine
 * @description The Kozen is a Task Automation Framework designed to support Infrastructure as a Service (IaaS) and Testing as a Service (TaaS) platforms.
 * @author MongoDB Solution Assurance Team (SAT)
 * @version 1.1.0
 * @since 2025-07-01
 */

// CLI app: server and controller
// Applications: CLI and MCP
export { CLIServer } from './modules/cli/controllers/CLIApplication';
export { CLIController } from './modules/cli/controllers/CLIController';
export { ServerMCP } from './modules/mcp/controllers/MCPApplication';
export { MCPController } from './modules/mcp/controllers/MCPController';

// Shared controllers: base classes
export { KzApp } from './shared/controllers/KzApp';
export { KzApplication } from './shared/controllers/KzApplication';
export { KzComponent } from './shared/controllers/KzComponent';
export { KzController } from './shared/controllers/KzController';
export { KzModule } from './shared/controllers/KzModule';

// Modules: services
export { LoggerService } from './modules/logger/services/LoggerService';
export { SecretManager } from './modules/secret/services/SecretManager';
export { SecretManagerAWS } from './modules/secret/services/SecretManagerAWS';
export { SecretManagerMDB } from './modules/secret/services/SecretManagerMDB';
// Modules: CLI and MCP controllers
export { LoggerController } from './modules/logger/controllers/LoggerCLIController';
export { SecretController } from './modules/secret/controllers/SecretCLIController';
export { SecretController as SecretMCPController } from './modules/secret/controllers/SecretMCPController';


// Shared services: core services
export { BaseService } from './shared/services/BaseService';
export { FileService } from './shared/services/FileService';
export { ProcessorService } from './shared/services/ProcessorService';

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
export { SecretModule } from './modules/secret';

// Shared models and component types
export { ILogArgs, ILoggerService } from './modules/logger/models/Logger';
export { IComponent, IComponentInput, IComponentOutput, IOutputResult, ITransformFn, ITransformOption } from './shared/models/Component';

// Shared models: export everything
export * from './shared/models/App';
export * from './shared/models/Args';
export * from './shared/models/Bundle';
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

