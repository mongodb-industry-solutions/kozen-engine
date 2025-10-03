import { IStructType } from "./Types";

/**
 * Metadata definition interface for value resolution operations
 * @interface IMetadata
 */
export interface IMetadata {
    /**
     * Unique variable identifier for reference and tracking
     * @type {string}
     */
    name?: string;

    /**
     * Variable description for documentation and debugging purposes
     * @type {string}
     */
    description?: string;

    /**
     * Actual value or reference key for variable resolution
     * @type {any}
     */
    value?: any;

    /**
     * List of allowable or supported values for the variable
     * @type {Array<any>}
     */
    range?: Array<any>;

    /**
     * Value resolution strategy determining how variable is processed
     * @type {IStructType}
     */
    type?: IStructType;

    /**
     * Default fallback value when resolution fails or returns null
     * @type {any}
     */
    default?: any;

    /**
     * The format defines the expected data type of a variable.
     * @type {string}
     */
    format?: string

    /**
     * Additional custom properties for extended metadata functionality
     * @type {any}
     */
    [key: string]: any;
}