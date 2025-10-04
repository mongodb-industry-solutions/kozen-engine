/**
 * @fileoverview Core type definitions and interfaces for pipeline operations
 * Defines fundamental types and interfaces used throughout the pipeline system
 * @author MDB SAT
 * @since 1.0.4
 * @version 1.0.5
 */

import categoriesData from "../../../cfg/const.categories.json";

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
 * @typedef {"deploy" | "undeploy" | "destroy" | "validate" | "status" } IAction
 */
export type IAction = "deploy" | "undeploy" | "destroy" | "validate" | "status";

/**
 * Variable source type definition for value resolution strategies
 * @typedef {"reference" | "value" | "environment" | "secret" | "protected"} IStructType
 */
export type IStructType = "reference" | "value" | "environment" | "secret" | "protected";


export type IAppType = 'cli' | 'mcp' | 'rest' | 'sdk' | 'graphql' | 'rpc';