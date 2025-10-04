/**
 * @fileoverview RectificationCLIController - CLI to SecretManager bridge component
 * Controller for managing encrypted secrets through CLI interactions with pluggable SecretManager providers.
 * Supports operations like storing, retrieving, and managing secrets with encryption across multiple backends.
 *
 * @author IaC Pipeline Team
 * @since 1.0.0
 * @version 1.1.0
 */
import path from 'path';
import { CLIController } from '../../../applications/cli/controllers/CLIController';
import { IArgs } from '../../../shared/models/Args';
import { IConfig } from '../../../shared/models/Config';
import { FileService } from '../../../shared/services/FileService';
import { IIoC } from '../../../shared/tools';
import { ILogger } from '../../../shared/tools/log/types';
import { IIAMRectification, IRectificationResponse, IRectificationScramArg, IRectificationX509Arg } from '../models/IAMRectification';

/**
 * @class RectificationCLIController
 * @extends CLIController
 * @description CLI controller for managing reports.
 */
export class RectificationCLIController extends CLIController {

    protected srvIAMScram?: IIAMRectification;
    protected srvIAMX509?: IIAMRectification;

    /**
     * Creates a new RectificationCLIController instance
     *
     * @constructor
     * @param {PipelineManager} pipeline - Optional pipeline manager instance
     */
    constructor(dependency?: { srvIAMScram?: IIAMRectification, srvIAMX509?: IIAMRectification, assistant: IIoC; logger: ILogger; srvFile?: FileService }) {
        super(dependency);
        this.srvIAMScram = dependency?.srvIAMScram;
        this.srvIAMX509 = dependency?.srvIAMX509;
    }

    /**
     * Validates and executes the SCRAM rectification process
     * 
     * @param {IRectificationScramArg} options - options
     * @returns {Promise<IRectificationResponse>} Promise resolving to true if save operation succeeds, false otherwise
     * @throws {Error} When secret manager resolution fails or storage operation encounters errors
     * @public
     */
    public async verifySCRAM(options: IRectificationScramArg): Promise<IRectificationResponse> {
        try {
            const result = await this.srvIAMScram!.rectify(options);
            return result;
        } catch (error) {
            this.logger?.error({
                flow: this.getId(options as unknown as IConfig),
                src: 'Controller:Secret:set',
                message: `❌ Failed to retrieve reports: ${(error as Error).message}`
            });
            return null as unknown as IRectificationResponse;
        }
    }

    /**
     * Validates and rectifies IAM roles and permissions using X.509 authentication
     * 
     * @param {IRectificationX509Arg} options - options
     * @returns {Promise<IRectificationResponse>} Promise resolving to true if save operation succeeds, false otherwise
     * @throws {Error} When secret manager resolution fails or storage operation encounters errors
     * @public
     */
    public async verifyX509(options: IRectificationX509Arg): Promise<IRectificationResponse> {
        try {
            const result = await this.srvIAMX509!.rectify(options);
            return result;
        } catch (error) {
            this.logger?.error({
                flow: this.getId(options as unknown as IConfig),
                src: 'Controller:Secret:set',
                message: `❌ Failed to retrieve reports: ${(error as Error).message}`
            });
            return null as unknown as IRectificationResponse;
        }
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
        const helpText = await this.srvFile?.select('rectification', dir);
        console.log(helpText);
    }

    public async fill(args: string[] | IArgs): Promise<IRectificationScramArg> {
        let parsed: Partial<IRectificationScramArg> = this.extract(args);
        parsed.method = parsed.method?.toLocaleUpperCase() || process.env.KOZEN_IAM_METHOD?.toLocaleUpperCase() || "SCRAM";
        parsed.isCluster = parsed.isCluster !== undefined ? parsed.isCluster : true;
        parsed.uriEnv = parsed.uriEnv || process.env.KOZEN_IAM_URI_ENV;
        parsed.protocol = parsed.protocol || (parsed.isCluster ? "mongodb+srv" : "mongodb");
        parsed.action = parsed.action + parsed.method;
        parsed.permissions = typeof parsed.permissions === "string" ? (parsed.permissions as unknown as string).split(",").map(p => p.trim()) : parsed.permissions;
        return parsed as IRectificationScramArg;
    }
}
