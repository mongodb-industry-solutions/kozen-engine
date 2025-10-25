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
 * Interface describing Metadata used in the Bundle
 */
export interface IMetadata {
    name: string;               // The unique name of the bundle
    description: string;        // A detailed description of the bundle
    summary: string;            // A concise summary about the bundle's purpose
    methods: IMethod[];         // Details of the methods provided by the bundle
    properties: IProperty[];    // Details of the properties exposed by the bundle
    dependencies: string[];     // Names of other bundles that this bundle depends on
}

/**
 * Interface representing a Bundle, using the enhanced Metadata
 */
export interface IBundle {
    metadata: IMetadata;        // Descriptive metadata for the bundle
}