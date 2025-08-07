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
    public static displayHelp(): void {
        console.log(`
            MongoDB Secrets CLI
            ===============================================================================
            
            Usage:
            logger --type=<value> --flow=<value> --category=<value> --message=<value> --data=<key>
            logger --type=<value> --flow=<value> --category=<value> --message=<value> --dataFromFIle=<path>
            
            Options:
            --action=<action>   Action to perform: save, resolve
            --key=<key>         Secret key (required)
            --value=<value>     Secret value (required for save action)
            
            Examples:
            secrets --action=save --key=API_KEY --value=my_super_secret
            secrets --action=resolve --key=API_KEY
            ===============================================================================
        `);
    }

    /**
     * Parses command line arguments into structured format
     * @public
     * @param {string[]} args - Command line arguments array
     * @returns {ILogArgs} Parsed CLI arguments with defaults applied
     */
    public async parseArguments(args: string[]): Promise<ILogArgs> {
        let parsed: Partial<ILogArgs> = this.extract(args);
        parsed.level = parsed.level || 'debug';
        parsed.category = parsed.category || VCategory.cli.logger;
        if (!parsed.data && parsed?.dataFromPath) {
            let content = await readFrom(parsed.dataFromPath);
            parsed.data = JSONT.decode(content);
        }
        return parsed as ILogArgs;
    }
}
