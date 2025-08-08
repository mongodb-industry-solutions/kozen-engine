/**
 * @fileoverview LoggerController - CLI to SecretManager bridge component
 * Controller for managing secrets in MongoDB through CLI interactions using SecretManagerMDB.
 * Supports operations like saving and resolving secrets using encryption.
 *
 * @author IaC Pipeline Team
 * @since 1.0.0
 * @version 1.1.0
 */
import { ILogArgs } from '../models/Logger';
import { VCategory } from '../models/Types';
import { JSONT, readFrom } from '../tools';
import { CLIController } from './CLIController';

export class LoggerController extends CLIController {

    /**
     * Displays CLI usage information for working with secrets
     * @public
     * @static
     */
    public help(): void {
        console.log(`
===============================================================================
Kozen Engine (Logger Manager Tool)
===============================================================================

Usage:
    kozen --action=logger:log --type=<value> --flow=<value> --category=<value> --message=<value> --data=<key>
    kozen --action=logger:log --type=<value> --flow=<value> --category=<value> --message=<value> --dataFromFIle=<path>

Options:
    --controller=logger             Set controller name as logger (required if not specified in the action)
    --action=<[controller:]action>  Action to be performed within the Logger Manager tool. The possible values are:
                                    - log: Insert or update the value of a logger

    --flow=<key>                    Flow ID tracker (optional)
    --message=<value>               Text message to log (required if data property not specified)
    --data=<value>                  Data content (required if message property not specified)
    --file=<value>                  Data content from file (required if message and data property not specified)
    --category=<value>              Tag for classification purpose (optional)
    --src=<value>                   Locator tag mainly use in the source code (optional)

Examples:
    kozen --action=logger:log --type=debug --flow=K2025080509533 --message="Checking data" --data=2345
    kozen --action=log --controller=logger --type=error --file=/tmp/data.playwright.output.json
===============================================================================
        `);
    }

    /**
     * Parses command line arguments into structured format
     * @public
     * @param {string[]} args - Command line arguments array
     * @returns {ILogArgs} Parsed CLI arguments with defaults applied
     */
    public async fillout(args: string[]): Promise<ILogArgs> {
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
