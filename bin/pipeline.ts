#!/usr/bin/env node

/**
 * @fileoverview Simple CLI Interface for Infrastructure as Code (IaC) Pipeline
 * @description Lightweight command-line interface that delegates all logic to PipelineController
 * @author IaC Pipeline Team
 * @since 4.0.0
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
import { PipelineController } from '../src/controllers/PipelineController';

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
      console.log(`✅ ${result.action} operation completed successfully`);
      process.exit(0);
    } else {
      console.error(`❌ ${result.action} operation failed`);
      if (result.errors && result.errors.length > 0) {
        result.errors.forEach(error => {
          console.error(`Error: ${error}`);
        });
      }
      process.exit(1);
    }

  } catch (error) {
    console.error('Pipeline execution failed:', error instanceof Error ? error.message : String(error));
    console.error('\nUse --help for usage information');
    process.exit(1);
  }
})();