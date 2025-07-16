import { IIoC } from "../tools";

/**
 * @fileoverview Base Service - Foundation Class for All Services
 * @description Abstract base class that provides common functionality and dependency injection
 * capabilities for all service classes in the application. This class establishes a consistent
 * pattern for service implementation and ensures proper IoC container integration.
 * 
 * All service classes should extend this base class to maintain consistency in dependency
 * management and to benefit from shared functionality across the service layer.
 * 
 * @abstract
 * @class BaseService
 * @author MongoDB Solutions Assurance Team
 * @since 4.0.0
 * @version 4.0.0
 * 
 * @example
 * ```typescript
 * // Implementing a custom service
 * export class MyCustomService extends BaseService {
 *   public async processData(data: any): Promise<any> {
 *     // Access IoC container through inherited assistant property
 *     const logger = await this.assistant.resolve<Logger>('Logger');
 *     
 *     logger.info('Processing data...');
 *     // Custom service logic here
 *     
 *     return processedData;
 *   }
 * }
 * ```
 */
export class BaseService {
    /**
     * IoC container instance for dependency management
     * 
     * @protected
     * @type {IIoC}
     * @description Protected IoC container providing dependency injection capabilities
     * to derived service classes. This allows services to resolve dependencies without
     * tight coupling to specific implementations, promoting modularity and testability.
     * 
     * The assistant property enables services to:
     * - Resolve other services and dependencies
     * - Maintain loose coupling between components
     * - Support dependency injection patterns
     * - Enable easy mocking for unit testing
     * 
     * @example
     * ```typescript
     * // Resolving dependencies in derived service classes
     * export class EmailService extends BaseService {
     *   public async sendEmail(recipient: string, message: string): Promise<void> {
     *     const logger = await this.assistant.resolve<Logger>('Logger');
     *     const configService = await this.assistant.resolve<ConfigService>('ConfigService');
     *     
     *     logger.info(`Sending email to ${recipient}`);
     *     // Email sending logic using resolved dependencies
     *   }
     * }
     * ```
     */
    protected assistant!: IIoC;
}