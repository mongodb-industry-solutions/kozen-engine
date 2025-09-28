/**
 * @fileoverview MongoDB Report Manager Service
 * @author MDB SAT
 * @since 1.0.0
 * @version 1.0.1
 */

import { IReportManager, IReportManagerOptions, PipelineResult } from "../models/Report";
import { ISecretManagerOptions } from "../models/Secret";
import { VCategory } from "../models/Types";
import MdbClient from "../tools/mdb/MdbClient";

/**
 * @class ReportManagerMDB
 * @extends ReportManager
 * MongoDB-specific implementation of report management with aggregation support
 */
export class ReportManagerMDB extends MdbClient implements IReportManager {

    resolve(key: string, options?: IReportManagerOptions): Promise<string | null | undefined | number | boolean> {
        throw new Error("Method not implemented.");
    }

    /**
     * Retrieves a list of log reports from MongoDB based on the provided filters
     * @public
     * @param {Object} filters
     * @param {Object} filters.start - Optional start date filter (ISO string)
     * @param {Object} filters.end - Optional end date filter (ISO string)
     * @param {ISecretManagerOptions} [options] - Optional configuration override.
     * @returns {Promise<PipelineResult[]>} Promise resolving the list of log reports
     * @throws {Error} When operation fails
     */
    public async list(filters: { start?: string, end?: string, range?: number }, options?: ISecretManagerOptions): Promise<PipelineResult[]> {
        try {
            const { mdb } = { ...this.options, ...options };

            if (!mdb) {
                throw new Error("MongoDB configuration is missing in SecretManager options.");
            }

            // Initialize MongoDB client
            const client = await this.initClient({ mdb });

            // Get collection
            const logsCollection = client!.db(mdb.database).collection(mdb.collection || "logs");

            // Determine date range
            const DEFAULT_RANGE_DAYS = Number(process.env.KOSEN_REPORT_RANGE) || filters.range || 10;
            const now = new Date();
            const start = filters?.start ? new Date(filters.start) : new Date(now.setDate(now.getDate() - DEFAULT_RANGE_DAYS));
            const end = filters?.end ? new Date(filters.end) : new Date();

            const dateFilter = {
                $gte: start,
                $lte: end
            };

            const pipeline = [
                {
                    $addFields: {
                        date: {
                            $dateFromString: {
                                dateString: "$date",
                                onError: null,
                                onNull: null
                            },
                        },
                    },
                },
                {
                    $match: { date: dateFilter }
                },
                {
                    $group: {
                        _id: "$flow",
                        flow: { $first: "$flow" }, // The flow value is taken directly from the documents being grouped
                        dateStart: { $min: "$date" }, // The earliest date in the group
                        dateEnd: { $max: "$date" }, // The latest date in the group
                        errors: { $sum: { $cond: [{ $eq: ["$level", "ERROR"] }, 1, 0] } },
                        warns: { $sum: { $cond: [{ $eq: ["$level", "WARN"] }, 1, 0] } },
                        messages: { $push: "$message" },
                        templateName: { $first: { $cond: [{ $ne: ["$data.templateName", null] }, "$data.templateName", null] } },
                        engine: { $first: { $cond: [{ $ne: ["$data.engine", null] }, "$data.engine", null] } },
                        orchestrator: { $first: { $cond: [{ $ne: ["$data.orchestrator", null] }, "$data.orchestrator", null] } },
                        components: { $first: { $cond: [{ $ne: ["$data.components", null] }, "$data.components", null] } },
                    },
                },
                {
                    $addFields: {
                        // Calculate the difference between dateStart and dateEnd in milliseconds
                        duration: { $subtract: ["$dateEnd", "$dateStart"] }
                    },
                },
                {
                    $project: {
                        _id: 0,
                        flow: 1,
                        errors: 1,
                        warns: 1,
                        dateStart: 1,
                        dateEnd: 1,
                        duration: 1,
                        messages: 1,
                        templateName: 1,
                        engine: 1,
                        orchestrator: 1,
                        components: 1,
                    },
                }
            ];

            // Use the aggregate method with the expected type, PipelineResult
            const results: PipelineResult[] = await logsCollection.aggregate<PipelineResult>(pipeline).toArray();
            return results;
        } catch (error) {
            this.logger?.error({
                flow: options?.flow,
                category: VCategory.core.secret,
                src: 'Service:Secret:MDB:save',
                message: `Failed to get MongoDB logs. ${(error as Error).message}`
            });
            throw error;
        }
    }
}

export default ReportManagerMDB;
