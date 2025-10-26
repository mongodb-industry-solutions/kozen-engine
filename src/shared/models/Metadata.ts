import { IDependency } from "../tools";
import { IStructType } from "./Types";

/**
 * Interface describing a method within the bundle
 */
export interface IMethod {
    name: string;               // The unique name of the method
    description: string;        // A detailed description of what the method does
    propertyNames: string[];    // List of property names used or referenced by the method
}

/**
 * Interface describing a property within the bundle
 */
export interface IProperty {
    name: string;               // The unique name of the property
    description: string;        // A detailed description of the property
    defaultValue: any;          // The default value of the property
    environmentKey?: string;    // Optional: Corresponding key in environment variables
}

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
     * A concise summary about the bundle's purpose
     * @type {string}
     */
    summary?: string;

    /**
     * List of methods provided by the bundle
     * @type {IMethod[]}
     */
    methods?: IMethod[];

    /**
     * List of properties exposed by the bundle
     * @type {IProperty[]}
     */
    properties?: IProperty[];

    /**
     * Names of other bundles that this bundle depends on
     * @type {Array<string | IDependency>}
     */
    dependencies?: Array<string | IDependency>;

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

    src?: IDependency;

    /**
     * Additional custom properties for extended metadata functionality
     * @type {any}
     */
    [key: string]: any;
}

/**
 * Interface representing a Bundle, using the enhanced Metadata
 */
export interface IBundle {
    /**
     * Descriptive metadata for the bundle
     * @type {IMetadata}
     */
    metadata: IMetadata;
}