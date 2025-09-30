import { IMetadata, IStruct } from "../../../shared/models/Types";
import { IIoC } from "../../../shared/tools";

export interface IProcessorService {
    /**
     * Optional assistant for IoC resolution.
     * Used for resolving dependencies such as SecretManager.
     */
    assistant?: IIoC;

    /**
     * Processes a list of metadata objects and maps them into structured items and warnings.
     * This method ensures unique items while tracking duplicates if they exist.
     *
     * @param {IMetadata[]} inputs - An array of metadata objects to be processed and mapped.
     * @param {string} [flow] - An optional flow identifier to specify processing context (currently unused).
     * @returns {Promise<{ items: IStruct, warns: IStruct }>} - A promise resolving to an object containing:
     *   - `items`: A structured collection of unique metadata objects.
     *   - `warns`: A structured collection of warnings, specifically tracking duplicates.
     */
    map(inputs: IMetadata[], flow?: string): Promise<{ items: IStruct, warns: IStruct }>;

    /**
     * Processes variable definitions and resolves their values from various sources.
     *
     * @param {IMetadata[]} inputs - Array of variable definitions to process.
     * @param {IStruct} [scope] - Optional scope to use for reference resolution, defaults to instance scope.
     * @returns {Promise<IStruct>} A promise resolving to an object containing resolved variable values.
     * @throws {Error} When variable resolution fails due to missing sources or access issues.
     */
    process(inputs: IMetadata[], scope?: IStruct, flow?: string): Promise<IStruct>;

    /**
     * Transforms a single variable definition by resolving its value from the appropriate source.
     *
     * @param {IMetadata} definition - Variable definition containing type, value, and metadata.
     * @param {IStruct} [scope={}] - Optional scope context for reference variable resolution.
     * @param {IStruct} [result={}] - Result object to accumulate resolved variables.
     * @returns {Promise<IStruct>} Promise resolving to the result object with the resolved variable added.
     */
    transform(definition: IMetadata, scope?: IStruct, result?: IStruct, flow?: string): Promise<IStruct>;
}
