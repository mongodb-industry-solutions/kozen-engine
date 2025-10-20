/**
 * @fileoverview Controller for managing triggers via CLI
 * @author MongoDB Solution Assurance Team (SAT)
 * @since 1.1.0
 * @version 1.1.0
 */
import path from 'node:path';
import { CLIController } from '../../../applications/cli/controllers/CLIController';
import { IArgs } from '../../../shared/models/Args';
import { IConfig } from '../../../shared/models/Config';
import { FileService } from '../../../shared/services/FileService';
import { IIoC } from '../../../shared/tools';
import { ILogger } from '../../../shared/tools/log/types';
import { ITriggerOptions } from '../models/TriggerOptions';
import { ChangeStreamService } from '../services/ChangeStreamService';

/**
 * @class TriggerCLIController
 * @extends CLIController
 * @description Controller class for managing triggers via CLI
 */
export class TriggerCLIController extends CLIController {

    private srvTrigger?: ChangeStreamService;

    constructor(dependency?: { assistant: IIoC, logger: ILogger, srvTrigger?: ChangeStreamService, srvFile?: FileService }) {
        super(dependency);
        this.srvTrigger = dependency?.srvTrigger;
    }

    /**
     * Starts the trigger service based on provided options.
     * @param {ITriggerOptions} options - Trigger options for initialization
     * @throws {Error} When trigger service initialization fails
     * @public
     */
    public async start(options: ITriggerOptions): Promise<{ await: boolean }> {
        try {
            await this.srvTrigger?.start(options);
            return { await: true };
        } catch (error) {
            this.logger?.error({
                flow: this.getId(options as unknown as IConfig),
                src: 'Controller:Trigger:start',
                message: `❌ Failed to start trigger on <'${options.mdb?.collection}'> collection': ${(error as Error).message}`
            });
            return { await: false };
        }
    }


    /**`
     * Fills and validates CLI arguments for trigger operations.
     * @param {string[] | IArgs} args - Raw command line arguments array or pre-parsed arguments
     * @returns {Promise<IArgs>} Promise resolving to structured template arguments with defaults applied
     * @public
     */
    public async fill(args: string[] | IArgs): Promise<IArgs> {
        let parsed: Partial<IArgs> = this.extract(args);
        parsed.opt = parsed.opt || {};
        parsed.mdb = parsed.mdb || {};
        parsed.opt.key = parsed.opt.key || parsed.key || process.env.KOZEN_TRIGGER_KEY || 'trigger:delegate:default';
        parsed.opt.file = parsed.opt.file || parsed.file || process.env.KOZEN_TRIGGER_FILE;
        parsed.opt.type = 'instance';
        parsed.mdb.collection = parsed.mdb.collection || parsed.collection || process.env.KOZEN_TRIGGER_COLLECTION;
        parsed.mdb.database = parsed.mdb.database || parsed.database || process.env.KOZEN_TRIGGER_DATABASE;
        parsed.mdb.uri = parsed.mdb.uri || parsed.uri || process.env.KOZEN_TRIGGER_URI;
        parsed.mdb.uri = process.env[parsed.mdb.uri] || parsed.mdb.uri;
        this.assistant?.store[parsed.opt.key] && (parsed.opt = { ...this.assistant.store[parsed.opt.key], ...parsed.opt });
        return parsed as IArgs;
    }

    /**
     * Displays comprehensive CLI usage information for secret management operations
     * Shows available commands, options, and examples for the Secret Manager tool
     * 
     * @returns {void}
     * @public
     */
    public async help(): Promise<void> {
        const dir = process.env.DOCS_DIR || path.resolve(__dirname, '../docs');
        const helpText = await this.srvFile?.select('trigger', dir);
        console.log(helpText);
    }
}