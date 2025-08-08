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
  private readonly logger: Console;

  /**
   * Array storing all registered dependency configurations for tracking
   * @private
   */
  private readonly store: IDependency[] = [];

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
    this.logger = logger ?? console;
    this.tpl = new Tpl();

    // Auto-register IoC instance as "assistant" for reuse principle
    this.container.register('IoC', asValue(this));
    // this.logger.info({ src: 'IoC', message: 'Container initialized with assistant auto-registration' });
  }

  /**
   * Gets all registered dependency configurations as readonly array.
   */
  get config(): IDependency[] {
    return [...this.store];
  }

  /**
   * Registers dependencies with recursive processing and auto-registration support.
   */
  async register(dependencies: IDependency[] | IDependencyMap): Promise<void> {
    dependencies = this.toList(dependencies);

    // this.logger.info({ src: 'IoC', message: `Starting registration of ${dependencies.length} dependencies` });

    for (const dependency of dependencies) {
      await this.enroll(dependency);
    }

    // this.logger.info({ src: 'IoC', message: 'All dependencies registered successfully' });
  }

  /**
   * Enrolls single dependency with key determination and recursive processing.
   */
  private async enroll(dependency: IDependency): Promise<void> {

    // Determine dependency key if not provided
    (!dependency.key) && (dependency.key = this.getKey(dependency.target, dependency.type));

    // Store dependency configuration
    this.store.push(dependency);

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

    // this.logger.info({ src: 'IoC', message: `Enrolled dependency: ${dependency.key}` });
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
    // this.logger.info({ src: 'IoC', message: `Auto-registration pattern stored: ${regex}` });
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

        // If no args, pass dependencies object as first parameter
        // If args exist, pass dependencies object as final parameter
        if (!args?.length) {
          constructorArgs.push(dependenciesObject);
        } else {
          constructorArgs.push(dependenciesObject);
        }
      }

      return new Cls(...constructorArgs);
    };

    this.container.register(key!, asFunction(factory)[lifetime]());
  }

  /**
   * Resolves class constructor supporting dynamic imports.
   */
  protected async resolveClass(dependency: IDependency): Promise<IClassConstructor> {
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
    const dependenciesObject: Record<string, any> = {};
    const dependencyArray = this.toList(dependencies);

    for (const dep of dependencyArray) {
      const propertyKey = dep.key!;
      const targetKey = dep.type === 'ref' ? dep.target : propertyKey;
      dependenciesObject[propertyKey] = cradle[targetKey];
    }

    return dependenciesObject;
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
          this.logger.info({ src: 'IoC', message: `Auto-registered dependency: ${key}` });
          return true;
        } catch (error) {
          this.logger.warn({ src: 'IoC', message: `Auto-registration failed for ${key}: ${error instanceof Error ? error.message : String(error)}` });
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
        this.logger.warn({ src: 'IoC', message: `Cannot unregister non-existent dependency: ${key}` });
        continue;
      }

      delete this.container.registrations[key];

      // Remove from registered dependencies list
      const index = this.store.findIndex(dep => dep.key === key);
      if (index !== -1) {
        this.store.splice(index, 1);
      }

      this.logger.info({ src: 'IoC', message: `Unregistered dependency: ${key}` });
    }
  }
} 