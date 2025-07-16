import { Lifetime } from 'awilix';

/**
 * Represents a value that can be serialized to JSON
 */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/**
 * Unified service configuration for dependency injection.
 * This type serves all registration scenarios including:
 * - Direct service registration
 * - JSON-serializable configuration
 * - Nested dependency configuration
 * - Auto-registration patterns
 */
export type ServiceConfig = {
  /**
   * The key to register the dependency with in the container.
   * If not provided, it will be inferred from the class name or string target.
   * 
   * @example
   * ```typescript
   * { key: 'userService', target: UserService }
   * { key: 'logger', target: Logger }
   * ```
   */
  key?: string;

  /**
   * The target: Class constructor, function, value, alias, string, or reference key.
   * Optional for auto-registration where the target is discovered automatically.
   * 
   * @example
   * ```typescript
   * { target: UserService }              // Class constructor
   * { target: () => new Date() }         // Function
   * { target: 'Hello World' }            // Value
   * { target: 'userService' }            // Alias/Reference
   * ```
   */
  target?: any;

  /**
   * Regular expression pattern for auto-registration.
   * Used when type is 'auto' to match file paths and automatically register services.
   * If not provided, defaults to '.*' (matches all files).
   * 
   * @example
   * ```typescript
   * { type: 'auto', regex: '.*Service\\.ts$' }    // Match all *Service.ts files
   * { type: 'auto', regex: '.*Controller\\.ts$' } // Match all *Controller.ts files
   * { type: 'auto', regex: '.*Repository\\.ts$' } // Match all *Repository.ts files
   * ```
   */
  regex?: string;

  /**
   * The type of dependency being registered.
   * 
   * - **'class'**: Registers a class constructor (default)
   * - **'value'**: Registers a static value or primitive
   * - **'function'**: Registers a function that returns a value
   * - **'alias'**: Creates an alias to an existing registered service
   * - **'ref'**: References another registered service
   * - **'auto'**: Enables auto-registration using regex patterns
   * 
   * @default 'class'
   * 
   * @example
   * ```typescript
   * { type: 'class', target: UserService }
   * { type: 'value', target: 'production' }
   * { type: 'function', target: () => new Date() }
   * { type: 'alias', target: 'userService' }
   * { type: 'auto', regex: '.*Service\\.ts$' }
   * ```
   */
  type?: 'class' | 'value' | 'function' | 'alias' | 'ref' | 'auto';

  /**
   * The lifecycle management strategy for the dependency.
   * Controls how instances are created, cached, and reused across the application.
   * 
   * ## Lifetime Options:
   * 
   * ### **'singleton'** - Single Instance Pattern
   * - **Behavior**: Creates ONE instance for the entire application lifetime
   * - **Caching**: Instance is cached and reused for all resolve() calls
   * - **Thread Safety**: Same instance shared across all parts of the application
   * - **Memory**: Low memory footprint, instance created once and reused
   * - **Performance**: Fastest resolution after initial creation
   * 
   * **Best for:**
   * - Stateless services (no mutable state)
   * - Configuration objects and settings
   * - Loggers and monitoring services
   * - Database connection pools
   * - Utility services and helpers
   * - API clients and external service wrappers
   * 
   * **Avoid for:**
   * - Services with mutable state
   * - Request-specific data holders
   * - Services that need isolation between calls
   * 
   * ### **'transient'** - New Instance Pattern (Default)
   * - **Behavior**: Creates a NEW instance on every resolve() call
   * - **Caching**: No caching, always creates fresh instances
   * - **Isolation**: Complete isolation between different consumers
   * - **Memory**: Higher memory usage, new instance per resolution
   * - **Performance**: Slower due to repeated instantiation
   * 
   * **Best for:**
   * - Services with mutable state
   * - Request handlers and controllers
   * - Temporary objects and processors
   * - Services that need isolation
   * - Command objects and event handlers
   * - Services with constructor side effects
   * 
   * **Avoid for:**
   * - Expensive-to-create objects
   * - Stateless services (use singleton instead)
   * - Services that need to maintain state across calls
   * 
   * ### **'scoped'** - Per-Scope Instance Pattern
   * - **Behavior**: Creates ONE instance per scope (request/transaction)
   * - **Caching**: Instance cached within the scope, new instance per scope
   * - **Isolation**: Shared within scope, isolated between scopes
   * - **Memory**: Moderate memory usage, one instance per scope
   * - **Performance**: Good balance between singleton and transient
   * 
   * **Best for:**
   * - Request-specific services (HTTP requests, user sessions)
   * - Transaction handlers and database contexts
   * - User context and authentication services
   * - Request-scoped caches and temporary storage
   * - Services that need request-level state
   * 
   * **Avoid for:**
   * - Application-wide services (use singleton)
   * - Services that don't need request isolation (use singleton)
   * - Expensive services that don't need per-request instances
   * 
   * @default 'transient'
   * 
   * @example
   * ```typescript
   * // Singleton - Application-wide services
   * { key: 'logger', target: Logger, lifetime: 'singleton' }
   * { key: 'config', target: AppConfig, lifetime: 'singleton' }
   * { key: 'database', target: DatabasePool, lifetime: 'singleton' }
   * 
   * // Transient - Isolated, stateful services
   * { key: 'requestHandler', target: RequestHandler, lifetime: 'transient' }
   * { key: 'validator', target: DataValidator, lifetime: 'transient' }
   * { key: 'processor', target: DataProcessor, lifetime: 'transient' }
   * 
   * // Scoped - Request-specific services
   * { key: 'userContext', target: UserContext, lifetime: 'scoped' }
   * { key: 'requestCache', target: RequestCache, lifetime: 'scoped' }
   * { key: 'authService', target: AuthService, lifetime: 'scoped' }
   * ```
   */
  lifetime?: 'singleton' | 'transient' | 'scoped';

  /**
   * Path for dynamic imports when the target is a string.
   * Used for lazy loading modules at runtime.
   * 
   * @example
   * ```typescript
   * { key: 'userService', target: 'UserService', path: './services' }
   * ```
   */
  path?: string;

  /**
   * Direct file path for module imports.
   * Takes precedence over path/target combination.
   * 
   * @example
   * ```typescript
   * { key: 'config', file: './config/database.ts' }
   * ```
   */
  file?: string;

  /**
   * Arguments to pass to the class constructor when type is 'class'.
   * These are static arguments that will be passed before any injected dependencies.
   * 
   * @example
   * ```typescript
   * { 
   *   key: 'database', 
   *   target: Database, 
   *   type: 'class',
   *   args: ['localhost', 5432, 'mydb'] 
   * }
   * ```
   */
  args?: JsonValue[];

  /**
   * Nested dependencies configuration.
   * Can be an array of ServiceConfig objects or an object with key-value pairs.
   * These dependencies will be injected into the service being registered.
   * 
   * @example
   * ```typescript
   * // Array format
   * {
   *   key: 'userService',
   *   target: UserService,
   *   dependencies: [
   *     { key: 'logger', target: Logger },
   *     { key: 'database', target: Database }
   *   ]
   * }
   * 
   * // Object format
   * {
   *   key: 'userService',
   *   target: UserService,
   *   dependencies: {
   *     logger: { target: Logger },
   *     database: { target: Database }
   *   }
   * }
   * ```
   */
  dependencies?: ServiceConfig[] | { [key: string]: ServiceConfig };
};

/**
 * Class constructor type with proper typing
 */
export type ClassConstructor<T = {}> = new (...args: any[]) => T;

/**
 * Function type for dependency injection
 */
export type DependencyFunction<T = any> = (...args: any[]) => T;

/**
 * IoC container interface - defines the contract for dependency injection containers
 */
export interface IIoC {
  /**
   * Registers dependencies based on the provided configuration objects.
   * @param configs - An array of service configurations.
   */
  register(configs: ServiceConfig[]): Promise<void>;

  /**
   * Registers dependencies from JSON configuration
   * @param configs - An array of JSON-serializable service configurations
   * @param classRegistry - Registry of class constructors for JSON config (optional)
   */
  registerFromJson(configs: ServiceConfig[], classRegistry?: { [key: string]: ClassConstructor }): Promise<void>;

  /**
   * Unregisters dependencies from the container based on their keys.
   * @param keys - An array of keys to unregister.
   */
  unregister(keys: string[]): void;

  /**
   * Resolves a dependency from the container with auto-registration support.
   * If the dependency is not found, attempts to auto-register it using regex patterns.
   * @param key - The key of the dependency to resolve.
   * @returns The resolved dependency.
   */
  resolve<T>(key: string): Promise<T>;
  resolve(key: string): Promise<any>;

  /**
   * Resolves a dependency from the container synchronously without auto-registration.
   * @param key - The key of the dependency to resolve.
   * @returns The resolved dependency.
   */
  resolveSync<T>(key: string): T;
  resolveSync(key: string): any;

  /**
   * @deprecated Use resolve() instead. This method is kept for backward compatibility.
   */
  resolveAsync<T>(key: string): Promise<T>;
  resolveAsync(key: string): Promise<any>;

  /**
   * Exports current container configuration to JSON format
   * @returns Array of service configurations
   */
  exportToJson(): ServiceConfig[];
} 