#!/usr/bin/env ts-node

/**
 * @fileoverview CLI entry point for SecretController
 * @description Handles command-line operations for managing secrets
 * @author MongoDB SA Team
 * @since 1.0.0
 */

import dotenv from 'dotenv';
import { CLIController } from '../src/controllers/CLIController';
import { VCategory } from '../src/models/Types';

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
    const cli = new CLIController();
    const { args } = await cli.init(process.argv);

    try {
        if (!args?.controller) {
            throw new Error('No valid controller was specified');
        }

        if (!args?.action) {
            throw new Error('No valid action was specified');
        }

        if (args.controller === 'Controller' && args.action === 'help') {
            return cli.help();
        }

        const controller = await cli.helper?.resolve(args.controller) as any;

        if (!controller) {
            throw new Error('No valid controller found');
        }

        const options = { ...args, ...(await controller.fillout(args)) };
        const action = controller[args.action];
        if (!action) {
            throw new Error('No valid action found');
        }

        const result = await action.apply(controller, [options]);

        args.action !== 'help' && cli.log({
            flow: cli.getId(args),
            src: 'bin:Kozen',
            data: {
                params: options,
                result
            }
        });

        await cli.wait();
        process.exit(0);
    } catch (error) {
        console.error({
            flow: cli.getId(args),
            src: 'bin:Kozen',
            category: VCategory.cli.secret,
            message: `❌ CLI execution failed:` + (error as Error).message || error
        });
        cli.help()
        process.exit(1);
    }
})();  
