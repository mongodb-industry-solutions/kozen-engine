import { exec } from 'child_process';
import { BaseController } from '../../controllers/BaseController';
import { IComponent } from '../../models/Component';
import { IPipeline } from '../../models/Pipeline';
import { IResult, IStruct, VCategory } from '../../models/Types';

/**
 * CLI Component Controller for executing commands in the CLI
 * This component demonstrates command execution and output retrieval logic
 */
export class CLI extends BaseController {

    /**
     * Returns metadata describing CLI inputs and outputs.
     * @returns {Promise<IComponent>} Component metadata definition.
     */
    public metadata(): Promise<IComponent> {
        return Promise.resolve({
            description: 'Execute shell commands and return their output',
            engine: '^1.0.5',
            input: [
                { name: 'deploy', description: 'Inputs for deploy action', format: 'Array<any>' },
                { name: 'undeploy', description: 'Inputs for undeploy action', format: 'Array<any>' },
                { name: 'cmd', description: 'Command to execute', format: 'string' },
                { name: 'args', description: 'Arguments for the command', format: 'Array<string>' }
            ],
            output: [
                { name: 'raw', description: 'Raw command output', format: 'string' },
                { name: 'processed', description: 'Processed/parsed output', format: 'any' }
            ]
        });
    }
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
            category: VCategory.cmp.exe,
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
                category: VCategory.cmp.exe,
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
                category: VCategory.cmp.exe,
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
     * Deploys the CLI component by executing the run method with processed input parameters
     * @param input - Optional input parameters containing deployment commands and configuration
     * @param pipeline - Optional pipeline context for deployment execution
     * @returns Promise resolving to deployment result with command execution status and output
     */
    async deploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult> {
        let inpuTmp = await this.getInput(input || {}, 'deploy');
        return await this.run(inpuTmp, pipeline);
    }

    /**
     * Undeploys the CLI component by executing the run method with processed input parameters
     * Note: For CLI components, undeploy typically means executing cleanup or teardown commands
     * @param input - Optional input parameters containing undeployment commands and configuration
     * @param pipeline - Optional pipeline context for undeployment execution
     * @returns Promise resolving to undeployment result with command execution status and output
     */
    async undeploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult> {
        let inpuTmp = await this.getInput(input || {}, 'undeploy');
        return await this.run(inpuTmp, pipeline);
    }

    /**
     * Processes and transforms input parameters for CLI command execution based on the specified action
     * Handles action-specific input transformations and processes command arguments
     * @param input - Raw input parameters containing command and arguments to be processed
     * @param action - Action type ('deploy' or 'undeploy') that determines input processing logic
     * @returns Promise resolving to processed input structure ready for CLI command execution
     */
    async getInput(input: IStruct, action: string = 'deploy'): Promise<IStruct> {
        let result = input;
        input[action] && (result = await this.transformInput({ component: { input: input[action] }, key: 'input' }));
        result.args && (result.args = await this.transformInput({ component: { input: result.args }, key: 'input' }));
        return result;
    }
}

export default CLI;
