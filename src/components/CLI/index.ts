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

        const startTime = Date.now();
        const { cmd, args = [], ...argv } = input || {};
        for (let i in argv) {
            argv[i] && args.push(argv[i])
        }

        const command = `${cmd} ${args.join(" ")}`;

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
            const result = await this.executeCommand(command);

            const duration = Date.now() - startTime;
            this.logger?.info({
                flow: pipeline?.id,
                category: VCategory.cmp.iac,
                src: 'Component:CLI:run',
                message: `Command executed successfully: ${command}`,
                data: { duration, result },
            });

            const output = { raw: result, processed: this.processOutput(result) };

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
        let inpuTmp = { ...input };
        inpuTmp.cmd = inpuTmp.cmd ?? inpuTmp.cmdDeploy;
        inpuTmp.args = inpuTmp.args ?? inpuTmp.argsDeploy;
        delete inpuTmp['cmdDeploy'];
        delete inpuTmp["argsDeploy"];
        delete inpuTmp["cmdUndeploy"];
        delete inpuTmp["argsUndeploy"];
        return await this.run(inpuTmp, pipeline);
    }

    /**
     * Undeploy logic for CLI component
     * (For simplicity, no CLI command execution required here)
     */
    async undeploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult> {
        let inpuTmp = { ...input };
        inpuTmp.cmd = inpuTmp.cmd ?? inpuTmp.cmdDeploy;
        inpuTmp.args = inpuTmp.args ?? inpuTmp.argsDeploy;
        delete inpuTmp['cmdDeploy'];
        delete inpuTmp["argsDeploy"];
        delete inpuTmp["cmdUndeploy"];
        delete inpuTmp["argsUndeploy"];
        return await this.run(inpuTmp, pipeline);
    }
}

export default CLI;
