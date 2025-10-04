/**
 * IoC (Inversion of Control) Container Module
 * 
 * Exports all necessary types and classes for dependency injection,
 * auto-registration, and container management.
 */

// Main IoC container class
export { IoC } from './IoC';
export { ITplResolver, ITplVars, Tpl } from './tpl';

// Core interfaces and types
export { IDependency, IIoC } from './types';

// Type utilities for advanced usage
export {
  IClassConstructor, IDependencyLifetime, IDependencyList, IDependencyMap, IDependencyType, IFunction,
  IJSON
} from './types';
