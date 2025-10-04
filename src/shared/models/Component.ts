/**
 * @fileoverview Component model definitions for the Kozen Engine pipeline system
 * Defines interfaces and types for infrastructure and testing components that form
 * the building blocks of dynamic pipelines in the Kozen Engine.
 * 
 * Components can perform various operations including:
 * - Infrastructure deployment (AWS, MongoDB Atlas, Kubernetes)
 * - Test execution (end-to-end, integration, performance)
 * - Data processing and transformation
 * - API calls and external service integration
 * 
 * @author IaC Pipeline Team
 * @since 1.0.0
 * @version 1.1.0
 */

import { IMetadata } from "./Metadata";
import { IStruct } from "./Types";

/**
 * Component output data structure containing metadata and results from component execution
 * Used to pass execution results between pipeline components
 * @typedef {IMetadata} IComponentOutput
 */
export type IComponentOutput = IMetadata;

/**
 * Component input data structure containing configuration and input parameters
 * Used to provide initialization data and runtime parameters to components
 * @typedef {IMetadata} IComponentInput
 */
export type IComponentInput = IMetadata;


/**
 * @interface IComponent
 * @description Infrastructure and testing component configuration interface.
 * Defines the structure for pipeline components that can perform various operations
 * including infrastructure deployment, testing execution, data processing, and API calls.
 * 
 * Components are the building blocks of Kozen Engine pipelines, each responsible for
 * a specific aspect of the deployment or testing workflow.
 */
export interface IComponent {

    /**
     * Unique component identifier within the pipeline
     * Used for component tracking, logging, and dependency resolution
     * @type {string}
     * @optional
     */
    id?: string;

    /**
     * Human-readable component name for display and identification purposes
     * Should be descriptive of the component's primary function
     * @type {string}
     * @optional
     */
    name?: string;

    /**
     * Detailed description of the component's purpose and functionality
     * Used for documentation and pipeline understanding
     * @type {string}
     * @optional
     */
    description?: string;

    /**
     * Component version following semantic versioning (semver) format
     * Used for compatibility checking and version management
     * @type {string}
     * @optional
     * @example '1.2.3', '2.0.0-beta.1'
     */
    version?: string;

    /**
     * Specifies which engine version should handle the component execution
     * @type {string}
     * @optional
     * @example '^1.2.3'
     */
    engine?: string;

    /**
     * Pipeline orchestration tool name supported or required
     * @type {string}
     * @optional
     * @example 'pulumi', 'node', 'terraform', 'kubernetes'
     */
    orchestrator?: string;

    /**
     * Expected output structure that the component will produce after execution
     * Used for data flow validation and inter-component communication
     * @type {Array<IComponentOutput> | Record<string, IComponentOutput>}
     * @optional
     */
    output?: Array<IComponentOutput> | Record<string, IComponentOutput>;

    /**
     * Required input parameters and configuration data for component execution
     * Defines the data contract that must be satisfied for successful execution
     * @type {Array<IComponentInput> | Record<string, IComponentInput>}
     * @optional
     */
    input?: Array<IComponentInput> | Record<string, IComponentInput>;

    /**
     * Component-specific configuration parameters and setup options
     * Contains initialization settings, provider configurations, and runtime options
     * @type {Array<IMetadata> | Record<string, IMetadata>}
     * @optional
     */
    setup?: Array<IMetadata> | Record<string, IMetadata>;

    /**
     * Specifies the components or modules required for proper functionality or execution.
     * @type {Array<IMetadata> | Record<string, IMetadata>}
     * @optional
     */
    dependency?: Array<IMetadata> | Record<string, IMetadata>;

    /**
     * Additional custom properties for component extensibility
     * Allows components to define custom configuration options beyond the standard interface
     * @type {any}
     */
    [key: string]: any;
}


/**
 * Transform function type for processing component input data and pipeline output
 * Used to modify or transform data as it flows between pipeline components
 *
 * @typedef {(component: IComponent, output: IStruct) => Promise<IStruct>} ITransformFn
 * @param {IComponent} component - The component configuration requesting the transformation
 * @param {IStruct} output - The output data from previous pipeline stages to be transformed
 * @returns {Promise<IStruct>} Promise resolving to the transformed data structure
 */
export type ITransformFn = (component: IComponent, output: IStruct) => Promise<IStruct>;

export type IOutputResult = { items?: IStruct, warns?: IStruct };
/**
 * @interface ITransformOption
 * @description Configuration options for data transformation operations between pipeline components.
 * Provides context and parameters for executing transform functions during pipeline execution.
 */
export interface ITransformOption {
    /**
     * Unique flow identifier for tracking the transformation operation
     * Used for logging and debugging transformation processes
     * @type {string}
     * @optional
     */
    flow?: string;

    /**
     * Component configuration that is requesting or involved in the transformation
     * Provides context about the component that needs the transformed data
     * @type {IComponent}
     * @required
     */
    component: IComponent;

    /**
     * Output data from previous pipeline stages to be transformed
     * Contains the raw data that needs to be processed or modified
     * @type {IStruct}
     * @optional
     */
    output?: IStruct;

    /**
     * Specific key or identifier for the transformation operation
     * Used to identify which transformation rule or logic to apply
     * @type {string}
     * @optional
     */
    key?: string;
}