#!/usr/bin/env ts-node

/**
 * @fileoverview CLI entry point for SecretController
 * @description Handles command-line operations for managing secrets
 * @author MongoDB SA Team
 * @since 1.0.0
 */

import dotenv from 'dotenv';
import { SecretController } from '../src/controllers/SecretController';


(async function main(): Promise<void> {
    try {
        // Load environment variables
        dotenv.config();

        // Create controller and parse arguments
        const controller = new SecretController();
        const args = controller.parseArguments(process.argv);
        await controller.configure(args);

        // Handle help flag
        if (args.help) {
            SecretController.displayUsage();
            process.exit(0);
        }

        // Determine action
        const action = args.action;
        const key = args.key;
        const value = args.value;

        if (!action || !key) {
            controller.logger?.error({
                src: 'bin:Secret',
                message: '❌ Missing required parameters. Use --help for usage information.'
            });
            process.exit(1);
        }

        // Perform the requested action
        switch (action) {
            case 'save': {
                if (!value) {
                    controller.logger?.error({
                        src: 'bin:Secret',
                        message: '❌ Missing value for save action. Use --help for usage information.'
                    });
                    process.exit(1);
                }
                const success = await controller.save(key, value);
                process.exit(success ? 0 : 1);
                break;
            }

            case 'resolve': {
                const resolvedValue = await controller.resolve(key);
                process.exit(resolvedValue ? 0 : 1);
                break;
            }

            default:
                controller.logger?.error({
                    src: 'bin:Secret',
                    message: `❌ Unsupported action: ${action}. Use --help for usage information.`
                });
                process.exit(1);
        }
    } catch (error) {
        console.error({
            src: 'bin:Secret',
            message: `❌ CLI execution failed:` + (error as Error).message || error
        });
        process.exit(1);
    }
})();  
