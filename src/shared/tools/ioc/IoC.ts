import { aliasTo, asClass, asFunction, asValue, AwilixContainer, createContainer } from 'awilix';
import { promises as fsp } from 'fs';
import { createRequire } from 'module';
import * as _path from 'path';
import { pathToFileURL } from 'url';
import { ITplVars, Tpl } from './tpl';
import { IClassConstructor, IDependency, IDependencyClassMap, IDependencyMap, IIoC, IModuleType } from './types';

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
   * @public
   */
  public store: IDependencyMap;

  /**
   * Map of dependency categories for organized grouping
   * @public
   */
  public map: IDependencyClassMap;

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
    this.store = {};
    this.map = {};

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
      (!dependency.category) && (dependency.category = 'core');

      if (this.store[dependency.key!]) {
        // this.logger?.info({ src: 'IoC', message: `Cached dependency: ${dependency.key}` });
        return;
      }

      if (!dependency.target) {
        dependency.target = dependency.key?.split(':').pop() || '';
      }

      // Store dependency configuration
      this.store[dependency.key] = dependency;
      !this.map[dependency.category] && (this.map[dependency.category] = {});
      this.map[dependency.category][dependency.key] = dependency;

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
      this.logger?.warn({ src: 'IoC', message: `Failed to enroll dependency: ${error instanceof Error ? error.message : String(error)}` });
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
        this.registerObject(dependency, target);
        break;

      case 'alias':
        this.registerAlias(dependency, target);
        break;

      case 'ref':
        this.registerAlias(dependency, target);
        break;

      case 'class':
        dependency.raw = dependency.raw === undefined ? false : !!dependency.raw;
        // Resolve class constructor
        const Cls = await this.resolveClass(dependency);
        await this.registerClass(dependency, Cls);
        break;

      case 'object':
      case 'instance':
        dependency.raw = dependency.raw === undefined ? true : !!dependency.raw;
        const aim = await this.resolveClass(dependency);
        if (typeof aim !== 'object') {
          this.registerClass(dependency, aim as IClassConstructor);
        } else {
          this.registerObject(dependency, aim);
        }
        break;

      default:
        throw new Error(`Unsupported dependency type: ${type}`);
    }
  }

  /**
   * Registers class with constructor arguments and dependency injection.
   */
  protected registerClass(dependency: IDependency, Cls: IClassConstructor): void {
    const { key, lifetime = 'transient', args, dependencies } = dependency;

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

  protected registerObject(dependency: IDependency, target: Object): void {
    this.container.register(dependency.key!, asValue(target));
  }

  protected registerAlias(dependency: IDependency, target: string): void {
    this.container.register(dependency.key!, aliasTo(target));
  }

  protected registerMethod(dependency: IDependency, target: Function): void {
    const { key, lifetime = 'transient' } = dependency;
    this.container.register(key!, asFunction(target as (...args: any[]) => any)[lifetime]());
  }

  /**
   * Resolves class constructor supporting dynamic imports.
   */
  protected async resolveClass(dependency: IDependency): Promise<IClassConstructor> {
    let { target, path, file, key, raw = false } = dependency;

    if (typeof target === 'function') {
      return target as IClassConstructor;
    }

    if (typeof target === 'string') {
      let modulePath = file ?? (path ? `${path}/${target}` : null) ?? target;

      if (!modulePath) {
        throw new Error(`Path required for dynamic import of: ${target}`);
      }

      try {
        const nodeRequire = typeof require === 'function' ? require : createRequire(__filename);
        modulePath = nodeRequire.resolve(modulePath);
        const isESModule = await this.isEsmModule(modulePath, dependency);
        let importedModule: any;
        if (isESModule) {
          importedModule = await this.dynamicImport(modulePath);
        } else {
          try {
            importedModule = nodeRequire(modulePath);
          } catch (err: any) {
            if (err && (err.code === 'ERR_REQUIRE_ESM' || /must be imported using ESM/.test(String(err.message)))) {
              importedModule = await this.dynamicImport(modulePath);
            } else {
              throw err;
            }
          }
        }
        this.store[key!].file = modulePath;
        this.store[key!].path = _path.dirname(modulePath);
        if (raw) {
          return importedModule;
        }
        return importedModule.default ?? importedModule[target] ?? importedModule; // Object.values(importedModule)[0] as IClassConstructor;
      } catch (error) {
        throw new Error(`Failed to import module ${modulePath}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    throw new Error(`Invalid class target for dependency: ${key}`);
  }

  /**
   * Determines whether a resolved file should be treated as an ES module.
   */
  private async isEsmModule(resolvedPath: string, dependency: IDependency): Promise<boolean> {
    dependency.moduleType = dependency.moduleType?.toLocaleLowerCase() as IModuleType;
    if (dependency.moduleType === 'esm' || dependency.moduleType === 'mjs' || dependency.moduleType === 'module') return true;
    if (dependency.moduleType === 'cjs' || dependency.moduleType === 'commonjs') return false;
    if (resolvedPath.endsWith('.mjs')) return true;
    if (resolvedPath.endsWith('.cjs')) return false;
    // For .js, check nearest package.json "type" field
    const pkgType = await this.findNearestPackageType(resolvedPath);
    return pkgType === 'module';
  }

  /**
   * Walks up directories from a file to find nearest package.json and returns its "type" field.
   */
  private async findNearestPackageType(resolvedPath: string): Promise<'module' | 'commonjs' | null> {
    try {
      let skip = process.env.KOZEN_IOC_MOD_SKIP || '@kozen';
      let mod = process.env.KOZEN_IOC_MOD_TYPE || 'commonjs';
      let dir = _path.dirname(resolvedPath);
      if (resolvedPath.indexOf(skip) !== -1) {
        return mod as 'module' | 'commonjs';
      }
      const root = _path.parse(dir).root;
      while (true) {
        const pkgPath = _path.join(dir, 'package.json');
        try {
          const content = await fsp.readFile(pkgPath, 'utf-8');
          const json = JSON.parse(content) as { type?: string };
          if (json && typeof json.type === 'string') {
            return json.type === 'module' ? 'module' : 'commonjs';
          }
          return 'commonjs';
        } catch {
          // not found in this dir -> continue up
        }
        if (dir === root) break;
        dir = _path.dirname(dir);
      }
    } catch {
      // ignore
    }
    return 'module';
  }

  /**
   * Performs a dynamic import using a runtime construct to avoid TS downlevel transforms.
   */
  private async dynamicImport(resolvedPath: string): Promise<any> {
    const url = pathToFileURL(resolvedPath).href;
    // Using Function constructor prevents TypeScript from transforming import()
    const dynamicImporter = new Function('u', 'return import(u)') as (u: string) => Promise<any>;
    return dynamicImporter(url);
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
      this.logger?.warn({ src: 'IoC', message: `Failed to get dependency: ${error instanceof Error ? error.message : String(error)}` });
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
          this.logger?.warn({ src: 'IoC', message: `Auto-registration failed for ${key}: ${error instanceof Error ? error.message : String(error)}` });
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