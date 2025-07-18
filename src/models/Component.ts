import { IMetadata, IStruct } from "./Types";

/**
 * Component output data type
 * @typedef {any} IComponentOutput
 */
export type IComponentOutput = IMetadata;

/**
 * Component input data type
 * @typedef {any} IComponentInput
 */
export type IComponentInput = IMetadata;


/**
 * @interface IComponent
 * @description Infrastructure component configuration interface
 */
export interface IComponent {
    /**
     * Unique component identifier
     * @type {string}
     */
    name?: string;

    /**
     * Component description
     * @type {string}
     */
    description?: string;

    /**
     * Component version
     * @type {string}
     */
    version?: string;

    /**
     * Engine requirements
     * @type {string}
     */
    engine?: string;

    /**
     * Expected component output
     * @type {IComponentOutput}
     */
    output?: IComponentOutput;

    /**
     * Required input parameters
     * @type {IComponentInput}
     */
    input?: IComponentInput;

    /**
     * Configuration parameters
     * @type {any}
     */
    setup?: IMetadata;

    /**
     * Additional custom properties
     * @type {any}
     */
    [key: string]: any;
}


/**
 * Transform function type for component input processing
 * @typedef {(component: IComponent, output: IStruct) => Promise<IStruct>} ITransformFn
 */
export type ITransformFn = (component: IComponent, output: IStruct) => Promise<IStruct>;