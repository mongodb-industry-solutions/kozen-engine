/**
 * @fileoverview Core type definitions and interfaces for pipeline operations
 * Defines fundamental types and interfaces used throughout the pipeline system
 * @author MDB SAT
 * @since 1.0.4
 * @version 1.0.5
 */

import categoriesData from "../../cfg/const.categories.json";

/**
 * Logging categories configuration imported from external JSON file
 * @type {Object}
 * @readonly
 */
export const VCategory = categoriesData;

/**
 * Generic structured data type for flexible object representation
 * @typedef {Record<string, any>} IStruct
 */
export type IStruct = Record<string, any>;

/**
 * Pipeline action type definition for operation classification
 * @typedef {"deploy" | "undeploy" | "destroy" | "validate" | "status" | "save" | "resolve"} IAction
 */
export type IAction = "deploy" | "undeploy" | "destroy" | "validate" | "status" | "save" | "resolve";

/**
 * Variable source type definition for value resolution strategies
 * @typedef {"reference" | "value" | "environment" | "secret" | "protected"} IStructType
 */
export type IStructType = "reference" | "value" | "environment" | "secret" | "protected";

/**
 * Variable definition interface for value resolution operations
 * @interface IMetadata
 */
export interface IMetadata {
    /**
     * Actual value or reference key for variable resolution
     * @type {any}
     */
    value: any;

    /**
     * Unique variable identifier for reference and tracking
     * @type {string}
     */
    name: string;

    /**
     * Value resolution strategy determining how variable is processed
     * @type {IStructType}
     */
    type?: IStructType;

    /**
     * Variable description for documentation and debugging purposes
     * @type {string}
     */
    description?: string;

    /**
     * Default fallback value when resolution fails or returns null
     * @type {any}
     */
    default?: any;

    /**
     * Additional custom properties for extended metadata functionality
     * @type {any}
     */
    [key: string]: any
}

/**
 * Comprehensive result interface for pipeline operations and responses
 * @interface IResult
 */
export interface IResult {
    /**
     * Operation success indicator for result status validation
     * @type {boolean}
     */
    success?: boolean;

    /**
     * Human-readable result message for user feedback and logging
     * @type {string}
     */
    message?: string;

    /**
     * Error object if operation failed with detailed exception information
     * @type {Error}
     */
    error?: Error;

    /**
     * Operation duration in milliseconds for performance monitoring
     * @type {number}
     */
    duration?: number;

    /**
     * Array of error messages for detailed failure reporting
     * @type {string[]}
     */
    errors?: string[];

    /**
     * Operation type performed for result categorization and tracking
     * @type {IAction}
     */
    action?: IAction;

    /**
     * Stack identifier for environment and deployment context
     * @type {string}
     */
    stackName?: string;

    /**
     * Project logical grouping for resource organization and management
     * @type {string}
     */
    projectName?: string;

    /**
     * Template name used in operation for traceability
     * @type {string}
     */
    templateName?: string;

    /**
     * Operation completion timestamp for audit and monitoring purposes
     * @type {Date}
     */
    timestamp?: Date;

    /**
     * Detailed operation results for nested and complex operations
     * @type {IResult[]}
     */
    results?: IResult[];

    /**
     * Structured output data for sharing between pipeline components
     * @type {IStruct}
     */
    output?: IStruct;
}