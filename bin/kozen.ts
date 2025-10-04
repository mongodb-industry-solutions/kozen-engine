#!/usr/bin/env ts-node

/**
 * @fileoverview CLI entry point for SecretController
 * @description Handles command-line operations for managing secrets
 * @author MongoDB Solution Assurance Team (SAT)
 * @since 1.0.0
 */

import dotenv from 'dotenv';
import { IArgs } from '../src';
import { KzApp } from '../src/shared/controllers/KzApp';
import { IKzApplication } from '../src/shared/models/App';
import { VCategory } from '../src/shared/models/Types';

/**
 * Main CLI entry point for secret management operations
 * @returns {Promise<void>} Promise that resolves when CLI execution completes
 */
(async function main(): Promise<void> {

    // Create controller and parse arguments
    const app = new KzApp();

    // Initialize application (parse args and load config)
    const opts = app.extract(process.argv);

    // Load environment variables from .env file for non-MCP types
    if (opts.type !== 'mcp' && !process.env.KOZEN_SKIP_DOTENV) {
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
    }

    const { args, config } = await app.init(opts as IArgs);

    try {
        if (!args || !config) {
            throw new Error('No valid configuration was specified');
        }
        await app.register(config);

        const srv = await app.helper?.get<IKzApplication>({
            "key": config.type,
            "path": process.env.KOZEN_APP_PATH || "../../../applications",
            "args": [config, app],
            "lifetime": "singleton"
        });

        if (!srv) {
            throw new Error(`No valid application found for type: ${config.type}`);
        }

        await srv.init(config, app);
        await srv.start(args);

    } catch (error) {
        console.error({
            flow: config && app.getId(config),
            src: 'bin:Kozen',
            category: VCategory.cli.secret,
            message: `❌ CLI execution failed:` + (error as Error).message || error
        });
        process.exit(1);
    }
})();
