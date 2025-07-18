import { IIoC } from "../tools";
import { IMetadata, IStruct } from "./Types";

export interface IVarProcessorService {
    /**
     * Optional assistant for IoC resolution.
     * Used for resolving dependencies such as SecretManager.
     */
    assistant?: IIoC;

    /**
     * Processes variable definitions and resolves their values from various sources.
     *   
     * @param {IMetadata[]} inputs - Array of variable definitions to process.
     * @param {IStruct} [scope] - Optional scope to use for reference resolution, defaults to instance scope.
     * @returns {Promise<IStruct>} A promise resolving to an object containing resolved variable values.
     * @throws {Error} When variable resolution fails due to missing sources or access issues.
     */
    process(inputs: IMetadata[], scope?: IStruct): Promise<IStruct>;

    /**
     * Transforms a single variable definition by resolving its value from the appropriate source.
     *   
     * @param {IMetadata} definition - Variable definition containing type, value, and metadata.
     * @param {IStruct} [scope={}] - Optional scope context for reference variable resolution.
     * @param {IStruct} [result={}] - Result object to accumulate resolved variables.
     * @returns {Promise<IStruct>} Promise resolving to the result object with the resolved variable added.
     */
    transform(definition: IMetadata, scope?: IStruct, result?: IStruct): Promise<IStruct>;
}  
