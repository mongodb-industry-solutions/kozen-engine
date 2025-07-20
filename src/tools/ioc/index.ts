/**
 * IoC (Inversion of Control) Container Module
 * 
 * Exports all necessary types and classes for dependency injection,
 * auto-registration, and container management.
 */

// Main IoC container class
export { IoC } from './IoC';

// Core interfaces and types
export { IDependency, IIoC } from './types';

// Type utilities for advanced usage
export { 
  IClassConstructor, 
  IFunction, 
  IJSON,
  IDependencyMap,
  IDependencyList,
  IDependencyType,
  IDependencyLifetime
} from './types'; 