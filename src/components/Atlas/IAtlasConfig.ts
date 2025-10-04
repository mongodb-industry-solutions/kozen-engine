import { IStruct } from "../../shared/models/Types";

export interface IAtlasConfig extends IStruct {

    providerName?: string;
    /**
     * The type of MongoDB cluster to deploy.
     * - REPLICASET: A standard replica set cluster (recommended for most use cases)
     * - SHARDED: A sharded cluster for horizontal scaling (for large datasets)
     * 
     * @type {"REPLICASET" | "SHARDED"}
     * @example "REPLICASET"
     */
    clusterType: "REPLICASET" | "SHARDED";

    /**
     * Array of replication specifications that define the cluster's topology.
     * Each specification defines the number of shards and the configuration
     * for each region where the cluster will be deployed.
     * 
     * @type {Array<{numShards: number, regionsConfigs: Array<{regionName: string, electableNodes: number, priority: number, readOnlyNodes: number}>}>}
     * @example
     * ```typescript
     * replicationSpecs: [{
     *   numShards: 1,
     *   regionsConfigs: [{
     *     regionName: "US_EAST_1",
     *     electableNodes: 3,
     *     priority: 7,
     *     readOnlyNodes: 0
     *   }]
     * }]
     * ```
     */
    replicationSpecs: Array<{
        /**
         * Number of shards for this replication specification.
         * For REPLICASET clusters, this should be 1.
         * For SHARDED clusters, this can be multiple shards.
         * 
         * @type {number}
         * @minimum 1
         * @example 1
         */
        numShards: number;

        /**
         * Array of region configurations for this replication specification.
         * Defines how the cluster nodes are distributed across different regions.
         * 
         * @type {Array<{regionName: string, electableNodes: number, priority: number, readOnlyNodes: number}>}
         */
        regionsConfigs: Array<{
            /**
             * The Atlas region name where nodes will be deployed.
             * Must be a valid MongoDB Atlas region identifier.
             * 
             * @type {string}
             * @example "US_EAST_1" | "US_WEST_2" | "EU_WEST_1"
             */
            regionName: string;

            /**
             * Number of electable nodes (voting members) in this region.
             * These nodes can become primary and participate in elections.
             * 
             * @type {number}
             * @minimum 1
             * @example 3
             */
            electableNodes: number;

            /**
             * Election priority for nodes in this region.
             * Higher values have higher priority to become primary.
             * 
             * @type {number}
             * @minimum 0
             * @maximum 100
             * @example 7
             */
            priority: number;

            /**
             * Number of read-only nodes in this region.
             * These nodes cannot become primary but can serve read operations.
             * 
             * @type {number}
             * @minimum 0
             * @example 0
             */
            readOnlyNodes: number;
        }>;
    }>;

    /**
     * Whether to enable cloud backup for this cluster.
     * When enabled, Atlas will automatically create backups of your data.
     * 
     * @type {boolean}
     * @default true
     * @example true
     */
    cloudBackup: boolean;

    /**
     * Whether to enable automatic disk scaling for this cluster.
     * When enabled, Atlas will automatically increase storage capacity as needed.
     * 
     * @type {boolean}
     * @default true
     * @example true
     */
    autoScalingDiskGbEnabled: boolean;

    /**
     * The major version of MongoDB to deploy.
     * Should be a valid MongoDB version number.
     * 
     * @type {string}
     * @example "8.0" | "7.0" | "6.0"
     */
    mongoDbMajorVersion: string;

    /**
     * The instance size name for the cluster nodes.
     * This determines the compute and memory resources allocated to each node.
     * 
     * @type {string}
     * @example "M10" | "M20" | "M30" | "M40" | "M50" | "M60" | "M80"
     */
    providerInstanceSizeName: string;

    /**
     * Optional array of labels to apply to the cluster for organization and billing.
     * Labels are key-value pairs that help categorize and manage resources.
     * 
     * @type {Array<{key: string, value: string}>}
     * @optional
     * @example
     * ```typescript
     * labels: [
     *   { key: "environment", value: "production" },
     *   { key: "team", value: "backend" },
     *   { key: "cost-center", value: "engineering" }
     * ]
     * ```
     */
    labels?: Array<{ key: string; value: string }>;
}