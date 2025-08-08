/**
 * @fileoverview LoggerController - CLI to Logger bridge component
 * Controller for managing logging operations through CLI interactions with the LoggerService.
 * Supports operations like writing log entries with various levels and data formats.
 *
 * @author IaC Pipeline Team
 * @since 1.0.0
 * @version 1.1.0
 */
import { ILogArgs } from '../models/Logger';
import { VCategory } from '../models/Types';
import { JSONT, readFrom } from '../tools';
import { CLIController } from './CLIController';

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
    public help(): void {
        console.log(`
===============================================================================
Kozen Engine - Logger Manager Tool
===============================================================================

Description:
    Manage system logs, application events, and monitoring data through the
    Kozen Engine logging infrastructure. Supports multiple log levels, structured
    data logging, and file-based log processing.

Usage:
    kozen --action=logger:log [options] --message=<text>
    kozen --action=logger:log [options] --file=<path>
    kozen --controller=logger --action=log [options]

Core Options:
    --stack=<id>                    Environment identifier (dev, test, prod)
                                    (default: from NODE_ENV or 'dev')
    --project=<id>                  Project identifier for log organization
                                    (default: auto-generated timestamp ID)
    --config=<file>                 Configuration file path
                                    (default: cfg/config.json)
    --controller=logger             Explicitly set controller to logger
    --action=<[controller:]action>  Action to perform. Available actions:
                                    - log: Write a log entry to the logging system
                                    - help: Display this help information

Logging Options:
    --flow=<id>                     Flow identifier for request/operation tracking
                                    (useful for tracing multi-step operations)
    --level=<level>                 Log severity level. Available levels:
                                    ERROR, WARN, INFO, DEBUG, VERBOSE
                                    (default: debug)
    --message=<text>                Log message text (required if --data not provided)
    --data=<content>                Structured data content (JSON, objects)
    --file=<path>                   Read log data from file (JSON format)
    --category=<tag>                Classification tag for log filtering
                                    (default: CLI.LOGGER)
    --src=<location>                Source location identifier for debugging

Environment Variables:
    KOZEN_CONFIG                    Default value assigned to the --config property
    KOZEN_ACTION                    Default value assigned to the --action property
    KOZEN_STACK                     Default value assigned to the --stack property
    KOZEN_PROJECT                   Default value assigned to the --project property

    KOZEN_LOG_FILE                  Default value assigned to the --file property, Ex: tmp/report-jest.json
    KOZEN_LOG_LEVEL                 Default value assigned to the --level property, Ex: ERROR

Examples:
    # Basic text logging
    kozen --action=logger:log --level=info --message="Application started"
    
    # Structured data logging with flow tracking
    kozen --action=logger:log --level=debug --flow=K2025080509533 --message="User login" --data='{"userId": "123", "timestamp": "2025-01-01T10:00:00Z"}'
    
    # File-based logging (read JSON data from file)
    kozen --action=logger:log --level=error --file=./logs/error-report.json
    
    # Alternative syntax with explicit controller
    kozen --controller=logger --action=log --level=warn --message="Configuration updated"
    
    # Categorized logging for filtering
    kozen --action=logger:log --category=SECURITY --level=warn --message="Failed login attempt"
===============================================================================
        `);
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
