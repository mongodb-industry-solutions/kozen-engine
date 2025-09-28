import { IMdbClientOpt } from "../tools/mdb/MdbClientOpt";

export interface IReportManagerOptions {
    /**
     * Flow identifier for tracking and logging secret operations
     * @type {string}
     */
    flow?: string;

    /**
     * Secret backend type for storage and retrieval operations
     * @type {string}
     * Supported backends: AWS, MDB, ENV
     */
    type?: string;

    mdb: IMdbClientOpt;
}


export type PipelineResult = {
    _id: string;         // 'flow' grouping key
    errors: number;      // Count of errors
    startDate: Date;     // Date of the first document in the group
    endDate: Date;       // Date of the last document in the group
};

export interface IReportManager {
    /**
     * Secret manager configuration options for backend operations
     * @type {ISecretManagerOptions}
     */
    options: IReportManagerOptions;

    /**
     * Resolves a secret value from the configured backend
     * @param {string} key - The secret key to resolve
     * @param {ISecretManagerOptions} [options] - Optional configuration override
     * @returns {Promise<string | null | undefined | number | boolean>} Promise resolving to the secret value
     * @throws {Error} When secret resolution fails
     */
    resolve(key: string, options?: IReportManagerOptions): Promise<string | null | undefined | number | boolean>;

    list(filters: { start?: string, end?: string }, options?: IReportManagerOptions): Promise<PipelineResult[]>;
}
