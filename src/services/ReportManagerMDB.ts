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
    public async list(filters: { start?: string, end?: string }, options?: ISecretManagerOptions): Promise<PipelineResult[]> {
        try {
            const { mdb } = { ...this.options, ...options };

            if (!mdb) {
                throw new Error("MongoDB configuration is missing in SecretManager options.");
            }

            // Initialize MongoDB client
            const client = await this.initClient({ mdb });

            // Get collection
            const logsCollection = client!.db(mdb.database).collection(mdb.collection || "logs");

            const { start = null, end = null } = filters;

            const dateFilter: Record<string, any> = {};
            if (start) {
                dateFilter.$gte = new Date(start);
            }
            if (end) {
                dateFilter.$lte = new Date(end);
            }

            const pipeline = [
                {
                    $match: {
                        level: "ERROR",
                        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
                    }
                },
                {
                    $group: {
                        _id: "$flow",
                        errors: {
                            $sum: 1
                        },
                        startDate: {
                            $min: "$date"
                        },
                        endDate: {
                            $max: "$date"
                        }
                    }
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
