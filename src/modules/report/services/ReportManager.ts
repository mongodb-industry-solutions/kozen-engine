/**
 * @fileoverview report Manager Service - report Resolution Bridge Component
 * Bridge service for managing reports from various backends (AWS, MongoDB, environment variables)
 * @author MDB SAT
 * @since 1.0.4
 * @version 1.0.5
 */
import { VCategory } from "../../../shared/models/Types";
import { BaseService } from "../../../shared/services/BaseService";
import { IIoC } from "../../../shared/tools";
import { ILoggerService } from "../../logger/models/Logger";
import { IReportManager, IReportManagerOptions, PipelineResult } from "../models/Report";

/**
 * @class ReportManager
 * @extends BaseService
 * Bridge service for report resolution from multiple backends
 */
export class ReportManager extends BaseService implements IReportManager {
    /**
     * report manager configuration options
     * @protected
     * @type {IReportManagerOptions | undefined}
     */
    protected _options?: IReportManagerOptions;

    /**
     * Gets the current report manager configuration options
     * @public
     * @readonly
     * @type {IReportManagerOptions}
     * @returns {IReportManagerOptions} The current report manager configuration
     * @throws {Error} When configuration is not initialized
     */
    get options(): IReportManagerOptions {
        return this._options!;
    }

    /**
     * Sets the report manager configuration options
     * @public
     * @param {IReportManagerOptions} value - report manager configuration to set
     */
    set options(value: IReportManagerOptions) {
        this._options = value;
    }

    /**
     * Creates a new ReportManager instance
     * @constructor
     * @param {IReportManagerOptions} [options] - Optional report manager configuration
     */
    constructor(options?: IReportManagerOptions, dep?: { assistant: IIoC, logger: ILoggerService }) {
        super(dep);
        this.options = options!;
        this.prefix = 'report:manager:';
    }

    /**
     * Resolves a report value from the configured backend
     * @public
     * @param {string} key - The report key to resolve
     * @param {IReportManagerOptions} [options] - Optional configuration override
     * @returns {Promise<string | null | undefined | number | boolean>} Promise resolving to the report value
     * @throws {Error} When report resolution fails
     */
    public async resolve(key: string, options?: IReportManagerOptions): Promise<string | null | undefined | number | boolean> {
        const value = await this.getValue(key, options);
        return value ?? process.env[key];
    }

    /**
     * Retrieves report value from configured backend delegate
     * @protected
     * @param {string} key - The report key to resolve
     * @param {IReportManagerOptions} [options] - Optional configuration override
     * @returns {Promise<string | null | undefined | number | boolean>} Promise resolving to report value or null
     * @throws {Error} When report resolution fails or configuration is invalid
     */
    protected async getValue(key: string, options?: IReportManagerOptions): Promise<string | null | undefined | number | boolean> {
        try {
            if (!this.assistant) {
                throw new Error("Incorrect dependency injection configuration.");
            }
            options = { ...this.options, ...options };
            options.type = (options.type || 'mdb').toLowerCase();
            const controller = await this.getDelegate<IReportManager>(options.type);
            return await controller.resolve(key, options);
        }
        catch (error) {
            this.logger?.error({
                flow: options?.flow,
                category: VCategory.core.report,
                src: 'Service:ReportManager:getValue',
                message: (error as Error).message
            });
            return null;
        }
    }

    /**
     * Resolves a report value from the configured backend
     * @public
     * @param {string} key - The report key to resolve
     * @param {IReportManagerOptions} [options] - Optional configuration override
     * @returns {Promise<string | null | undefined | number | boolean>} Promise resolving to the report value
     * @throws {Error} When report resolution fails
     */
    public async list(filters: { start?: string, end?: string }, options?: IReportManagerOptions): Promise<PipelineResult[]> {
        try {
            if (!this.assistant) {
                throw new Error("Incorrect dependency injection configuration.");
            }
            options = { ...this.options, ...options };
            if (!this.options?.type) {
                throw new Error("ReportManager options or type is not defined.");
            }
            const controller = await this.getDelegate<IReportManager>(options.type || 'MDB');
            return controller.list(filters, options);
        }
        catch (error) {
            this.logger?.error({
                flow: options?.flow,
                category: VCategory.core.report,
                src: 'Service:ReportManager:list',
                message: (error as Error).message
            });
            return [];
        }
    }

}

export default ReportManager;