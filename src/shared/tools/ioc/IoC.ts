import { aliasTo, asClass, asFunction, asValue, AwilixContainer, createContainer } from 'awilix';
import { ITplVars, Tpl } from './tpl';
import { IClassConstructor, IDependency, IDependencyMap, IIoC } from './types';

/**
 * IoC container with auto-registration and recursive dependency resolution.
 */
export class IoC implements IIoC {
  /**
   * Awilix container instance for dependency registration and resolution
   * @private
   */
  private readonly container: AwilixContainer;

  /**
   * Console instance for logging container operations and debug information
   * @private
   */
  public logger: Console | null;

  /**
   * Array storing all registered dependency configurations for tracking
   * @private
   */
  public store: IDependencyMap = {};

  /**
   * Cache map storing auto-registration patterns by regex keys
   * @private
   */
  private readonly cache = new Map<string, IDependency>();

  /**
   * Template resolver instance for processing file path templates
   * @private
   */
  private readonly tpl: Tpl;

  /**
   * Initializes container with optional logger and auto-registers itself.
   */
  constructor(logger?: Console) {
    this.container = createContainer();
    this.logger = logger ?? null;
    this.tpl = new Tpl();

    // Auto-register IoC instance as "assistant" for reuse principle
    this.container.register('IoC', asValue(this));
    // this.logger?.info({ src: 'IoC', message: 'Container initialized with assistant auto-registration' });
  }

  /**
   * Gets all registered dependency configurations as readonly array.
   */
  get config(): IDependencyMap {
    return { ...this.store };
  }

  /**
   * Registers dependencies with recursive processing and auto-registration support.
   */
  async register(dependencies: IDependency[] | IDependencyMap): Promise<void> {
    // dependencies = this.toList(dependencies);
    // this.logger?.info({ src: 'IoC', message: `Starting registration of ${dependencies.length} dependencies` });
    let deps = dependencies as IDependencyMap;
    for (const key in deps) {
      const dependency = deps[key];
      !Array.isArray(dependencies) && ((dependency as IDependency).key = key);
      await this.enroll(dependency);
    }
    // this.logger?.info({ src: 'IoC', message: 'All dependencies registered successfully' });
  }

  /**
   * Enrolls single dependency with key determination and recursive processing.
   */
  private async enroll(dependency: IDependency): Promise<void> {
    try {
      // Determine dependency key if not provided
      (!dependency.key) && (dependency.key = this.getKey(dependency.target, dependency.type));

      if (this.store[dependency.key!]) {
        // this.logger?.info({ src: 'IoC', message: `Cached dependency: ${dependency.key}` });
        return;
      }

      if (!dependency.target) {
        dependency.target = dependency.key?.split(':').pop() || '';
      }

      // Store dependency configuration
      this.store[dependency.key!] = dependency;

      // Handle auto-registration storage
      if (dependency.type === 'auto') {
        this.storeAutoRegistration(dependency);
        return;
      }

      // Use template for file path resolution
      if (dependency.template && !dependency.file) {
        dependency.file = this.tpl.resolve(dependency.template, dependency as ITplVars);
      }

      // Process nested dependencies recursively
      if (dependency.dependencies) {
        await this.register(dependency.dependencies);
      }

      // Execute registration strategy
      await this.executeRegistrationStrategy(dependency);

      // this.logger?.info({ src: 'IoC', message: `Enrolled dependency: ${dependency.key}` });
    }
    catch (error) {
      // this.logger?.error({ src: 'IoC', message: `Failed to enroll dependency: ${error instanceof Error ? error.message : String(error)}` });
    }
  }

  /**
   * Determines dependency key from target and type.
   */
  protected getKey(target: any, type?: string): string {
    if (typeof target === 'string') return target;
    if (typeof target === 'function' && target.name) return target.name;
    if (type === 'auto') return 'auto-' + Math.random().toString(36).substr(2, 9);
    throw new Error('Unable to determine dependency key');
  }

  /**
   * Stores auto-registration pattern with default regex.
   */
  protected storeAutoRegistration(dependency: IDependency): void {
    const regex = dependency.regex ?? '.*';
    this.cache.set(regex, dependency);
    // this.logger?.info({ src: 'IoC', message: `Auto-registration pattern stored: ${regex}` });
  }

  /**
   * Converts dependency map to array format.
   */
  protected toList(dependencies: IDependency[] | IDependencyMap): IDependency[] {
    const dependencyArray = Array.isArray(dependencies)
      ? dependencies
      : Object.entries(dependencies).map(([key, dep]) => ({ ...dep, key }));
    return dependencyArray;
  }

  /**
   * Executes registration strategy based on dependency type.
   */
  protected async executeRegistrationStrategy(dependency: IDependency): Promise<void> {
    const { key, target, type = 'class', lifetime = 'transient' } = dependency;

    switch (type) {
      case 'value':
        this.container.register(key!, asValue(target));
        break;

      case 'action':
        if (typeof target !== 'function') {
          throw new Error(`Invalid function target for dependency: ${key}`);
        }
        this.container.register(key!, asFunction(target)[lifetime]());
        break;

      case 'function':
      case 'method':
        if (typeof target !== 'function') {
          throw new Error(`Invalid function target for dependency: ${key}`);
        }
        this.container.register(key!, asValue(target));
        break;

      case 'alias':
        this.container.register(key!, aliasTo(target));
        break;

      case 'ref':
        this.container.register(key!, aliasTo(target));
        break;

      case 'class':
        await this.registerClass(dependency);
        break;

      case 'object':
      case 'instance':
        const obj = await this.resolveClass(dependency, true);
        this.container.register(key!, asValue(obj));
        break;

      default:
        throw new Error(`Unsupported dependency type: ${type}`);
    }
  }

  /**
   * Registers class with constructor arguments and dependency injection.
   */
  protected async registerClass(dependency: IDependency): Promise<void> {
    const { key, target, lifetime = 'transient', args, dependencies, path, file } = dependency;

    // Resolve class constructor
    const Cls = await this.resolveClass(dependency);

    // Use simple class registration for cases without special configuration
    if (!args?.length && !dependencies?.length && key) {
      this.container.register(key, asClass(Cls)[lifetime]());
      return;
    }

    // Create factory function with enhanced argument handling
    const factory = (cradle: any) => {
      const constructorArgs: any[] = [];

      // Add static arguments first
      if (args?.length) {
        constructorArgs.push(...args);
      }

      // Add dependencies object as final parameter if dependencies exist
      if (dependencies) {
        const dependenciesObject = this.build(cradle, dependencies);
        constructorArgs.push(dependenciesObject)
      }

      return new Cls(...constructorArgs);
    };

    this.container.register(key!, asFunction(factory)[lifetime]());
  }

  /**
   * Resolves class constructor supporting dynamic imports.
   */
  protected async resolveClass(dependency: IDependency, raw: boolean = false): Promise<IClassConstructor> {
    let { target, path, file, key } = dependency;

    if (typeof target === 'function') {
      return target as IClassConstructor;
    }

    if (typeof target === 'string') {
      const modulePath = file ?? (path ? `${path}/${target}` : null);

      if (!modulePath) {
        throw new Error(`Path required for dynamic import of: ${target}`);
      }

      try {
        const importedModule = await import(modulePath);
        if (raw) {
          return importedModule;
        }
        return importedModule.default ?? importedModule[target] ?? Object.values(importedModule)[0] as IClassConstructor;
      } catch (error) {
        throw new Error(`Failed to import module ${modulePath}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    throw new Error(`Invalid class target for dependency: ${key}`);
  }

  /**
   * Builds dependencies object for constructor injection.
   */
  protected build(cradle: any, dependencies: IDependency[] | IDependencyMap): Record<string, any> {
    const depMap: Record<string, any> = {};
    const deps = dependencies as IDependencyMap;
    for (const key in deps) {
      let dep = deps[key];
      !Array.isArray(dependencies) && (dep.key = key);
      let propertyKey = dep.key!;
      let targetKey = dep.type === 'ref' ? dep.target : propertyKey;
      depMap[propertyKey] = cradle[targetKey];
    }
    return depMap;
  }

  /**
   * Safely resolve dependency with auto-registration support.
   */
  public async get<T = any>(key: string | IDependency): Promise<T | null> {
    try {
      if (typeof key !== 'string') {
        let index = key.key || this.getKey(key.target, key.type);
        await this.register({ [index]: key });
        key = index;
      }
      return await this.resolve<T>(key);
    } catch (error) {
      // this.logger?.error({ src: 'IoC', message: `Failed to save get dependency: ${error instanceof Error ? error.message : String(error)}` });
      return null;
    }
  }

  /**
   * Resolves dependency with auto-registration support.
   */
  public async resolve<T = any>(key: string): Promise<T> {
    try {
      return this.container.resolve<T>(key);
    } catch (error) {
      // Attempt auto-registration if resolution fails
      const autoRegistered = await this.attemptAutoRegistration(key);
      if (autoRegistered) {
        return this.container.resolve<T>(key);
      }
      throw error;
    }
  }

  /**
   * Resolves dependency synchronously without auto-registration.
   */
  public resolveSync<T = any>(key: string): T {
    return this.container.resolve<T>(key);
  }

  /**
   * Attempts auto-registration by matching key patterns.
   */
  protected async attemptAutoRegistration(key: string): Promise<boolean> {
    for (const [regex, pattern] of this.cache.entries()) {
      if (new RegExp(regex).test(key)) {
        try {
          await this.performAutoRegistration(key, pattern);
          // this.logger?.info({ src: 'IoC', message: `Auto-registered dependency: ${key}` });
          return true;
        } catch (error) {
          // this.logger?.warn({ src: 'IoC', message: `Auto-registration failed for ${key}: ${error instanceof Error ? error.message : String(error)}` });
        }
      }
    }
    return false;
  }

  /**
   * Performs auto-registration by creating and enrolling dependency.
   */
  protected async performAutoRegistration(key: string, pattern: IDependency): Promise<void> {
    const modulePath = pattern.file ?? (pattern.path ? `${pattern.path}/${key}` : null);

    if (!modulePath) {
      throw new Error(`No path specified for auto-registration: ${key}`);
    }

    const autoRegisteredDependency: IDependency = {
      ...pattern,
      key,
      target: key,
      type: pattern.as || 'class',
      lifetime: pattern.lifetime ?? 'transient'
    };

    await this.enroll(autoRegisteredDependency);
  }

  /**
   * Unregisters dependencies by removing registrations and configurations.
   */
  public unregister(keys: string[]): void {
    for (const key of keys) {
      if (!this.container.registrations[key]) {
        this.logger?.warn({ src: 'IoC', message: `Cannot unregister non-existent dependency: ${key}` });
        continue;
      }
      delete this.container.registrations[key];
      delete this.store[key];
      // this.logger?.info({ src: 'IoC', message: `Unregistered dependency: ${key}` });
    }
  }
} 