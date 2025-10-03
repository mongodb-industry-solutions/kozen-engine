import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";
import { MCPController } from "../../../shared/controllers/MCPController";
import { IReportManager } from "../models/Report";

export class ReportController extends MCPController {

    public async register(server: McpServer): Promise<void> {
        // list reports
        server.registerTool("kozen_report_list",
            {
                description: "Retrieve detailed reports of all executed Kozen pipelines, filtered by a specified date range or a default value if no range is provided",
                inputSchema: {
                    start: z.string().describe("Optional start date for the filter in ISO format.").optional(),
                    end: z.string().describe("Optional end date for the filter in ISO format.").optional(),
                    range: z.number().describe("Optional number of days to filter data from today backward. Defaults to a predefined value.").optional()
                }
            },
            this.list.bind(this)
        );
    }

    public async list(options?: { start?: string, end?: string }): Promise<{ content: { type: "text"; text: string; }[] }> {
        try {
            const { start, end } = options || {};

            const srvReport = await this.assistant?.resolve<IReportManager>('report:manager');
            const result = await srvReport!.list({ start, end });

            return {
                content: [
                    {
                        type: "text" as const,
                        text: JSON.stringify(result, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text" as const,
                        text: `❌ Failed to retrieve the report list: ${(error as Error).message}`
                    }
                ]
            };
        }
    }
}