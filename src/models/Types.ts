/**
 * @fileoverview Core type definitions and interfaces for pipeline operations
 * @description Defines fundamental types and interfaces used throughout the pipeline system
 * @author MongoDB Solutions Assurance Team
 * @since 4.0.0
 * @version 4.0.0
 */

/**
 * Generic structured data type
 * @typedef {Record<string, any>} IStruct
 */
export type IStruct = Record<string, any>;

/**
 * Pipeline action type definition
 * @typedef {"deploy" | "undeploy" | "validate" | "status"} IAction
 */
export type IAction = "deploy" | "undeploy" | "validate" | "status";

/**
 * Variable source type definition
 * @typedef {"reference" | "value" | "environment" | "secret" | "protected"} IStructType
 */
export type IStructType = "reference" | "value" | "environment" | "secret" | "protected";

/**
 * @interface IStructDef
 * @description Variable definition interface for value resolution
 */
export interface IStructDef {
    /**
     * Actual value or reference key
     * @type {any}
     */
    value: any;

    /**
     * Unique variable identifier
     * @type {string}
     */
    name: string;

    /**
     * Value resolution strategy
     * @type {IStructType}
     */
    type: IStructType;

    /**
     * Variable description
     * @type {string}
     */
    description?: string;

    /**
     * Default fallback value
     * @type {any}
     */
    default?: any;
}

/**
 * @interface IResult
 * @description Comprehensive result interface for pipeline operations
 */
export interface IResult {
    /**
     * Operation success indicator
     * @type {boolean}
     */
    success?: boolean;

    /**
     * Human-readable result message
     * @type {string}
     */
    message?: string;

    /**
     * Error object if operation failed
     * @type {Error}
     */
    error?: Error;

    /**
     * Operation duration in milliseconds
     * @type {number}
     */
    duration?: number;

    /**
     * Array of error messages
     * @type {string[]}
     */
    errors?: string[];

    /**
     * Operation type performed
     * @type {IAction}
     */
    action?: IAction;

    /**
     * Template name used in operation
     * @type {string}
     */
    templateName?: string;

    /**
     * Operation completion timestamp
     * @type {Date}
     */
    timestamp?: Date;

    /**
     * Detailed operation results
     * @type {IResult[]}
     */
    results?: IResult[];

    /**
     * Structured output data for sharing
     * @type {IStruct}
     */
    output?: IStruct;
}