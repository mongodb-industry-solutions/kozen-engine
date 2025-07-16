/**
 * @fileoverview Infrastructure as Code (IaC) Pipeline - Main Entry Point
 * @description Entry point for the IaC Pipeline package, exporting main classes
 * for distribution as an npm package and CLI usage.
 * 
 * @author MongoDB Solutions Assurance Team
 * @version 4.0.0
 * @since 2024-01-01
 * 
 * @example
 * ```typescript
 * import { PipelineManager, IoC } from 'iac-pipeline';
 * 
 * const ioc = new IoC();
 * const pipeline = new PipelineManager(ioc);
 * 
 * // Deploy a template
 * await pipeline.deploy('my-template');
 * 
 * // Validate a template
 * await pipeline.validate('my-template');
 * 
 * // Undeploy a template
 * await pipeline.undeploy('my-template');
 * ```
 */

// Core Components
export { PipelineManager } from './services/PipelineManager';
export { StackManager } from './services/StackManager';

// Core Services


// Controllers
export { PipelineController } from './controllers/PipelineController';


// IoC Container and Tools
export { IoC } from './tools/ioc/IoC';
export { Logger } from './tools/log/Logger';

// Configuration Models
export { IPipelineArgs, IPipelineConfig } from './models/Pipeline';
export { IResult } from './models/Types';

// Infrastructure Components
export { AtlasController } from './components/Atlas';
export { KubernetesController } from './components/Kubernetes';
export { OpsManagerController } from './components/OpsManager';

// Base Controller
export { BaseController } from './controllers/BaseController';

// Type definitions
export * from './tools/ioc/types';
export * from './tools/log/types';

