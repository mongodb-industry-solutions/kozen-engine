#!/usr/bin/env ts-node

/**
 * @fileoverview CLI entry point for SecretController
 * @description Handles command-line operations for managing secrets
 * @author MongoDB SA Team
 * @since 1.0.0
 */

import dotenv from 'dotenv';
import { AppModule } from '../src/modules/app';
import { CLIServer } from '../src/modules/app/services/CLIServer';
import { VCategory } from '../src/shared/models/Types';

// Load environment variables
try {
    dotenv.config();
}
catch (error) {
    console.error({
        src: 'bin:Kozen',
        category: VCategory.cli.tool,
        message: `❌ Load local environment failed:` + (error as Error).message || error
    });
}

/**
 * Main CLI entry point for secret management operations
 * @returns {Promise<void>} Promise that resolves when CLI execution completes
 */
(async function main(): Promise<void> {

    // Create controller and parse arguments
    const app = new AppModule();

    // Initialize application (parse args and load config)
    process.argv.push('--type=cli');
    const { args, config } = await app.init(process.argv);

    try {
        if (!args || !config) {
            throw new Error('No valid configuration was specified');
        }

        await app.register(config);
        const { result, options } = await (new CLIServer(app)).dispatch(args);

        args.action !== 'help' && app.log({
            flow: (config && app.getId(config)) || undefined,
            src: 'bin:Kozen',
            data: {
                params: options,
                result
            }
        });

        await app.wait();
        process.exit(0);
    } catch (error) {
        console.error({
            flow: config && app.getId(config),
            src: 'bin:Kozen',
            category: VCategory.cli.secret,
            message: `❌ CLI execution failed:` + (error as Error).message || error
        });
        // app.help()
        process.exit(1);
    }
})();  
