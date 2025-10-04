import { IAction, IStruct } from "./Types";

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
