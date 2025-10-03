/**
 * @fileoverview LoggerController - CLI to Logger bridge component
 * Controller for managing logging operations through CLI interactions with the LoggerService.
 * Supports operations like writing log entries with various levels and data formats.
 *
 * @author IaC Pipeline Team
 * @since 1.0.0
 * @version 1.1.0
 */
import path from 'path';
import { CLIController } from '../../../shared/controllers/CLIController';
import { VCategory } from '../../../shared/models/Types';
import { JSONT, readFrom } from '../../../shared/tools';
import { ILogArgs } from '../models/Logger';

/**
 * @class LoggerController
 * @extends CLIController
 * @description CLI controller for managing logging operations and log data processing.
 * 
 * This controller provides command-line interface for interacting with the Kozen Engine
 * logging system, allowing users to write log entries, process log files, and manage
 * log data through CLI commands.
 * 
 * @example
 * ```typescript
 * const loggerController = new LoggerController();
 * await loggerController.init(['--action=log', '--message=Test message']);
 * ```
 */
export class LoggerController extends CLIController {

    /**
     * Displays comprehensive CLI usage information for logging operations
     * Shows available commands, options, and examples for the Logger Manager tool
     * 
     * @returns {void}
     * @public
     */
    public async help(): Promise<void> {
        const dir = process.env.DOCS_DIR || path.resolve(__dirname, '../docs');
        const helpText = await this.srvFile?.select('logger', dir);
        console.log(helpText);
    }

    /**
     * Parses and processes command line arguments specific to logging operations
     * Extends base argument parsing with logger-specific defaults and file processing
     * 
     * @param {string[]} args - Raw command line arguments array
     * @returns {Promise<ILogArgs>} Promise resolving to structured log arguments with defaults applied
     * @throws {Error} When file reading fails or JSON parsing errors occur
     * @public
     */
    public async fill(args: string[]): Promise<ILogArgs> {
        let parsed: Partial<ILogArgs> = this.extract(args);
        parsed.level = parsed.level || 'debug';
        parsed.category = parsed.category || VCategory.cli.logger;
        parsed.file = parsed?.file || process.env['KOZEN_LOG_FILE'];
        parsed.level = parsed?.level || process.env['KOZEN_LOG_LEVEL'];
        if (!parsed.data && parsed?.file) {
            let content = await readFrom(parsed.file);
            parsed.data = JSONT.decode(content);
            delete parsed['file'];
        }
        return parsed as ILogArgs;
    }
}
