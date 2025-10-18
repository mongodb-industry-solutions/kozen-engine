import { IDependency } from "../../../shared/tools";
import { IMdbClientOpt } from "../../../shared/tools/mdb/MdbClientOpt";

/**
 * Configuration interface for trigger management
 * @interface ITriggerOptions
 */
export interface ITriggerOptions {
    /**
     * Flow identifier for tracking and logging trigger operations
     * @type {string}
     */
    flow?: string;

    /**
     * Dependency injection options for trigger delegate resolution
     * @type {IDependency}
     */
    opt?: IDependency;

    /**
     * MongoDB storage configuration for encrypted secret management
     * @type {Object}
     */
    mdb?: IMdbClientOpt;
}