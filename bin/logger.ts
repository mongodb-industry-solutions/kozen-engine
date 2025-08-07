#!/usr/bin/env ts-node

/**
 * @fileoverview CLI entry point for LoggerController
 * @description Handles command-line operations for managing secrets
 * @author MongoDB SA Team
 * @since 1.0.0
 */

import dotenv from 'dotenv';
import { LoggerController } from '../src/controllers/LoggerController';
import { ISecretArgs } from '../src/models/Pipeline';

/**
 * Main CLI entry point for secret management operations
 * @returns {Promise<void>} Promise that resolves when CLI execution completes
 */
(async function main(): Promise<void> {
    try {
        // Load environment variables
        dotenv.config();

        // Create controller and parse arguments
        const controller = new LoggerController();
        const args = await controller.init<ISecretArgs>(process.argv);

        // Handle help flag
        if (args.help) {
            LoggerController.displayHelp();
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

        process.exit(1);
    } catch (error) {
        console.error({
            src: 'bin:Secret',
            message: `❌ CLI execution failed:` + (error as Error).message || error
        });
        process.exit(1);
    }
})();  
