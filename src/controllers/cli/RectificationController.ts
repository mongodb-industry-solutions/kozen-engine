/**
 * @fileoverview RectificationController - CLI to SecretManager bridge component
 * Controller for managing encrypted secrets through CLI interactions with pluggable SecretManager providers.
 * Supports operations like storing, retrieving, and managing secrets with encryption across multiple backends.
 *
 * @author IaC Pipeline Team
 * @since 1.0.0
 * @version 1.1.0
 */
import { IIAMRectification, IRectificationArg, IRectificationResponse } from '../../models/IAMRectification';
import { ILoggerService } from '../../models/Logger';
import { IConfig } from '../../models/Pipeline';
import { ICLIArgs } from '../../models/Types';
import { FileService } from '../../services/FileService';
import { IIoC } from '../../tools';
import { CLIController } from '../CLIController';

/**
 * @class RectificationController
 * @extends CLIController
 * @description CLI controller for managing reports.
 */
export class RectificationController extends CLIController {

    protected srvIAMScram?: IIAMRectification;

    /**
     * Creates a new RectificationController instance
     *
     * @constructor
     * @param {PipelineManager} pipeline - Optional pipeline manager instance
     */
    constructor(dependency?: { srvIAMScram?: IIAMRectification, assistant: IIoC; logger: ILoggerService; fileSrv?: FileService }) {
        super(dependency);
        this.srvIAMScram = dependency?.srvIAMScram;
    }

    /**
     * Saves an encrypted secret to the configured secret management backend
     * Stores the secret using the resolved SecretManager service with automatic encryption
     * 
     * @param {IRectificationArg} options - options
     * @returns {Promise<IRectificationResponse>} Promise resolving to true if save operation succeeds, false otherwise
     * @throws {Error} When secret manager resolution fails or storage operation encounters errors
     * @public
     */
    public async verifySCRAM(options: IRectificationArg): Promise<IRectificationResponse> {
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
     * Displays comprehensive CLI usage information for secret management operations
     * Shows available commands, options, and examples for the Secret Manager tool
     * 
     * @returns {void}
     * @public
     */
    public async help(): Promise<void> {
        const helpText = await this.fileSrv?.select('iam-rectification');
        console.log(helpText);
    }

    public async fillout(args: string[] | ICLIArgs): Promise<IRectificationArg> {
        let parsed: Partial<IRectificationArg> = this.extract(args);
        parsed.method = parsed.method?.toLocaleUpperCase() || process.env.KOZEN_IAM_METHOD?.toLocaleUpperCase() || "SCRAM";
        parsed.isCluster = parsed.isCluster !== undefined ? parsed.isCluster : true;
        parsed.uriEnv = parsed.uriEnv || process.env.KOZEN_IAM_URI_ENV;
        parsed.protocol = parsed.protocol || (parsed.isCluster ? "mongodb+srv" : "mongodb");
        parsed.action = parsed.action + parsed.method;
        parsed.permissions = typeof parsed.permissions === "string" ? (parsed.permissions as unknown as string).split(",").map(p => p.trim()) : parsed.permissions;
        return parsed as IRectificationArg;
    }
}
