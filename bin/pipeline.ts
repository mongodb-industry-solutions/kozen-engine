#!/usr/bin/env node

/**
 * @fileoverview Simple CLI Interface for Infrastructure as Code (IaC) Pipeline
 * @description Lightweight command-line interface that delegates all logic to PipelineController
 * @author IaC Pipeline Team
 * @since 1.0.4
 * 
 * @usage
 * ts-node bin/pipeline.ts --template=basic.project --config=cfg/config.json --action=deploy
 * ts-node bin/pipeline.ts --template=basic.project --config=cfg/config.json --action=undeploy
 * ts-node bin/pipeline.ts --template=basic.project --config=cfg/config.json --action=validate
 * 
 * @example
 * ts-node bin/pipeline.ts --template=atlas.basic --config=cfg/config.json --action=deploy
 * ts-node bin/pipeline.ts --template=k8s.standard --config=cfg/config.json --action=validate
 */
import dotenv from "dotenv";
import { ILogLevel } from "../src";
import { PipelineController } from '../src/controllers/PipelineController';
import { VCategory } from "../src/models/Types";

/**
 * Main CLI entry point
 *
 * @async
 * @function main
 * @description Main function that handles CLI execution by delegating to PipelineController
 * @returns {Promise<void>} Promise that resolves when CLI execution completes
 */
(async function main(): Promise<void> {
  try {
    // Load environment variables
    dotenv.config();

    // Create controller and parse arguments
    const controller = new PipelineController();

    // Check for help flag
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
      controller.displayUsage();
      process.exit(0);
    }

    const args = controller.parseArguments(process.argv.slice(2));

    // Execute pipeline operation
    const result = await controller.execute(args);

    // Handle result
    if (result.success) {
      controller.log({
        src: 'bin:Pipeline',
        message: `✅ ${result.action} operation completed successfully`
      });
      process.exit(0);
    } else {

      controller.log({
        src: 'bin:Pipeline',
        message: `❌ ${result.action} operation failed`
      }, ILogLevel.ERROR);

      result.errors?.length && result.errors.map(error => controller.log({
        src: 'bin:Pipeline',
        message: `Error: ${error}`
      }, ILogLevel.ERROR))

      process.exit(1);
    }

  } catch (error) {
    console.error({
      src: 'bin:Pipeline',
      category: VCategory.core.pipeline,
      message: 'Pipeline execution failed:' + (error instanceof Error ? error.message : String(error))
    });
    console.error('\nUse --help for usage information');
    process.exit(1);
  }
})();