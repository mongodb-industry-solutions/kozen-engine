import { BaseController } from '../../controllers/BaseController';
import { IPipeline } from '../../models/Pipeline';
import { IResult, IStruct, VCategory } from '../../models/Types';

/**
 * API Component Controller for executing REST API calls
 * This component demonstrates API request execution and response retrieval logic
 */
export class API extends BaseController {
    /**
     * Executes a REST API call using the provided input and pipeline context
     * @param input - Input parameters containing API details like URL, method, headers, and body
     * @param pipeline - Optional pipeline context for contextual logging and configuration
     * @returns Promise resolving to request result with success status and response data
     */
    public async run(input?: IStruct, pipeline?: IPipeline): Promise<IResult> {
        const startTime = Date.now();
        const { url, method = 'GET', headers = {}, body = {}, params = {} } = input || {};

        if (!url) {
            throw new Error('No URL provided in input.');
        }

        // Formulate query string if queryParams are provided
        const queryString = params
            ? '?' + new URLSearchParams(params as Record<string, string>).toString()
            : '';

        const fullUrl = `${url}${queryString}`;

        this.logger?.info({
            flow: pipeline?.id,
            category: VCategory.cmp.iac,
            src: 'Component:API:run',
            message: `Making an API call: ${method} ${fullUrl}`,
            data: {
                componentName: this.config.name,
                templateName: pipeline?.template?.name,
                stackName: pipeline?.stack?.config?.name,
                projectName: pipeline?.stack?.config?.project,
                prefix: this.getPrefix(pipeline),
                headers,
                body,
            }
        });

        try {
            const response = await fetch(fullUrl, { method, headers, body: body ? JSON.stringify(body) : undefined });
            const result = await this.processResponse(response);

            const duration = Date.now() - startTime;

            this.logger?.info({
                flow: pipeline?.id,
                category: VCategory.cmp.api,
                src: 'Component:API:run',
                message: `API call completed successfully: ${method} ${fullUrl}`,
                data: { duration, result },
            });

            return {
                templateName: pipeline?.template?.name,
                success: true,
                message: `API call completed successfully.`,
                timestamp: new Date(),
                duration,
                output: result,
            };
        } catch (error) {
            const duration = Date.now() - startTime;

            this.logger?.error({
                flow: pipeline?.id,
                category: VCategory.cmp.api,
                src: 'Component:API:run',
                message: `API call failed: ${method} ${fullUrl}`,
                data: { duration, error },
            });

            return {
                templateName: pipeline?.template?.name,
                success: false,
                message: `API call failed.`,
                timestamp: new Date(),
                duration,
                error: (error as Error),
            };
        }
    }

    /**
     * Processes the HTTP response from the API call
     * @param response - HTTP response object
     * @returns Promise resolving to processed response data
     */
    protected async processResponse<T = IStruct>(response: Response): Promise<T> {
        if (!response.ok) {
            throw new Error(`API call failed with status ${response.status}: ${response.statusText}`);
        }
        try {
            return await response.json() as T;
        } catch {
            return { raw: await response.text() } as unknown as T;
        }
    }

    /**
     * Deploys the API component by executing the run method with processed input parameters
     * @param input - Optional input parameters containing deployment configuration
     * @param pipeline - Optional pipeline context for deployment execution
     * @returns Promise resolving to deployment result with success status and response data
     */
    async deploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult> {
        let inpuTmp = await this.getInput(input || {}, 'deploy');
        return await this.run(inpuTmp, pipeline);
    }

    /**
     * Undeploys the API component by executing the run method with processed input parameters
     * Note: For API components, undeploy typically means executing cleanup API calls
     * @param input - Optional input parameters containing undeployment configuration
     * @param pipeline - Optional pipeline context for undeployment execution
     * @returns Promise resolving to undeployment result with success status and response data
     */
    async undeploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult> {
        let inpuTmp = await this.getInput(input || {}, 'undeploy');
        return await this.run(inpuTmp, pipeline);
    }

    /**
     * Processes and transforms input parameters for API requests based on the specified action
     * Handles action-specific input transformations and processes headers, body, and params
     * @param input - Raw input parameters to be processed
     * @param action - Action type ('deploy' or 'undeploy') that determines input processing logic
     * @returns Promise resolving to processed input structure ready for API execution
     */
    async getInput(input: IStruct, action: string = 'deploy'): Promise<IStruct> {
        let result = input;
        input[action] && (result = await this.transformInput({ component: { input: input[action] }, key: 'input' }));
        result.headers && (result.headers = await this.transformInput({ component: { input: result.headers }, key: 'input' }));
        result.body && (result.body = await this.transformInput({ component: { input: result.body }, key: 'input' }));
        result.params && (result.params = await this.transformInput({ component: { input: result.params }, key: 'input' }));
        return result;
    }
}

export default API;
