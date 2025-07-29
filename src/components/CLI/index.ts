import { exec } from 'child_process';
import { BaseController } from '../../controllers/BaseController';
import { IPipeline } from '../../models/Pipeline';
import { IResult, IStruct, VCategory } from '../../models/Types';

/**
 * CLI Component Controller for executing commands in the CLI
 * This component demonstrates command execution and output retrieval logic
 */
export class CLI extends BaseController {
    /**
     * Executes a CLI command using the provided input and pipeline context
     * @param input - Input parameters with CLI command to execute
     * @param pipeline - Optional pipeline context for contextual logging and configuration
     * @returns Promise resolving to execution result with success status and output
     */
    async run(input?: IStruct, pipeline?: IPipeline): Promise<IResult> {

        let startTime = Date.now();
        let { cmd, args = [], ...argv } = input || {};

        if (!Array.isArray(args) && typeof args === 'object') {
            args = Object.values(args);
        }

        for (let i in argv) {
            argv[i] && args.push(argv[i])
        }

        let command = `${cmd} ${args.join(" ")}`;

        this.logger?.info({
            flow: pipeline?.id,
            category: VCategory.cmp.iac,
            src: 'Component:CLI:run',
            message: `Executing command: ${command}`,
            data: {
                componentName: this.config.name,
                templateName: pipeline?.template?.name,
                stackName: pipeline?.stack?.config?.name,
                projectName: pipeline?.stack?.config?.project,
                prefix: this.getPrefix(pipeline),
            }
        });

        try {
            let result = await this.executeCommand(command);

            let duration = Date.now() - startTime;
            this.logger?.info({
                flow: pipeline?.id,
                category: VCategory.cmp.iac,
                src: 'Component:CLI:run',
                message: `Command executed successfully: ${command}`,
                data: { duration, result },
            });

            let output = { raw: result, processed: this.processOutput(result) };

            return {
                templateName: pipeline?.template?.name,
                success: true,
                message: `Command executed successfully.`,
                timestamp: new Date(),
                duration,
                output
            };
        } catch (error) {
            const duration = Date.now() - startTime;
            this.logger?.error({
                flow: pipeline?.id,
                category: VCategory.cmp.iac,
                src: 'Component:CLI:run',
                message: `Command execution failed: ${command}`,
                data: { duration, error },
            });

            return {
                templateName: pipeline?.template?.name,
                success: false,
                message: `Command execution failed.`,
                timestamp: new Date(),
                duration,
                error: (error as Error),
            };
        }
    }

    /**
     * Executes a shell command and returns its output
     * @param command - Command to execute
     * @returns Promise resolving to command output
     */
    private executeCommand(command: string): Promise<string> {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(stderr || error.message);
                } else {
                    resolve(stdout);
                }
            });
        });
    }

    /**
     * Processes raw command output for structured analysis
     * @param output - Raw command output string
     * @returns Processed structured output
     */
    private processOutput(output: string): IStruct {
        try {
            // Example processing: if output can be parsed as JSON, return JSON object
            return JSON.parse(output);
        } catch {
            // If not JSON, return raw output as string
            return { raw: output };
        }
    }

    /**
     * Deploy logic for CLI component (calls `run` method indirectly)
     */
    async deploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult> {
        let inpuTmp = await this.getInput(input || {}, 'deploy');
        return await this.run(inpuTmp, pipeline);
    }

    /**
     * Undeploy logic for CLI component
     * (For simplicity, no CLI command execution required here)
     */
    async undeploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult> {
        let inpuTmp = await this.getInput(input || {}, 'undeploy');
        return await this.run(inpuTmp, pipeline);
    }

    async getInput(input: IStruct, action: string = 'deploy'): Promise<IStruct> {
        let result = input;
        input[action] && (result = await this.transformInput({ component: { input: input[action] }, key: 'input' }));
        result.args && (result.args = await this.transformInput({ component: { input: result.args }, key: 'input' }));
        return result;
    }
}

export default CLI;
