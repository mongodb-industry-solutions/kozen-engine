import { Lifetime } from 'awilix';

/**
 * JSON-serializable value types for dependency injection configurations.
 */
export type IJSON = string | number | boolean | null | IJSON[] | { [key: string]: IJSON };

/**
 * Class constructor type with generic typing support.
 */
export type IClassConstructor<T = {}> = new (...args: any[]) => T;

/**
 * Function type for dependency injection and factory methods.
 */
export type IFunction<T = any> = (...args: any[]) => T;

/**
 * Dependency configuration map with string keys.
 */
export type IDependencyMap = { [key: string]: IDependency };

/**
 * Array of dependency configuration objects.
 */
export type IDependencyList = IDependency[];

/**
 * Available dependency registration type strategies.
 */
export type IDependencyType = 'class' | 'value' | 'function' | 'method' | 'action' | 'alias' | 'ref' | 'auto';

/**
 * Instance lifecycle management strategies for dependency caching.
 */
export type IDependencyLifetime = 'singleton' | 'transient' | 'scoped';

/**
 * Unified dependency configuration for all registration scenarios.
 */
export interface IDependency {
  /**
   * Registration key for container identification.
   */
  key?: string;

  /**
   * Target class, function, value, or reference.
   */
  target?: any;

  /**
   * Regex pattern for auto-registration matching.
   */
  regex?: string;

  /**
   * Dependency registration type strategy.
   */
  type?: IDependencyType;

  /**
   * Alternative dependency registration type strategy.
   */
  as?: IDependencyType;

  /**
   * Instance lifecycle management strategy.
   */
  lifetime?: IDependencyLifetime;

  /**
   * Directory path for dynamic module imports.
   */
  path?: string;

  /**
   * Direct file path for module imports.
   */
  file?: string;

  /**
   * Constructor arguments passed before dependencies.
   */
  args?: IJSON[];

  /**
   * Nested dependencies for injection.
   */
  dependencies?: IDependencyList | IDependencyMap;
}

/**
 * IoC container interface for dependency injection operations.
 */
export interface IIoC {
  /**
   * Registers dependencies from array or map.
   */
  register(dependencies: IDependency[] | IDependencyMap): Promise<void>;

  /**
   * Unregisters dependencies by keys.
   */
  unregister(keys: string[]): void;

  /**
   * Resolves dependency with auto-registration support.
   */
  resolve<T = any>(key: string): Promise<T>;

  /**
   * Resolves dependency synchronously without auto-registration.
   */
  resolveSync<T = any>(key: string): T;

  /**
   * Gets all registered dependency configurations.
   */
  readonly config: IDependency[];
} 