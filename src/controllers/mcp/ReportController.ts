import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";
import { IReportManager } from "../../models/Report";
import { MCPController } from "../MCPController";

export class ReportController extends MCPController {

    public async register(server: McpServer): Promise<void> {
        // list reports
        server.registerTool("kozen_report_list",
            {
                description: "List all excecuted pipelines as reports",
                inputSchema: {
                    start: z.string().describe("start date filter").optional(),
                    end: z.string().describe("end date filter").optional()
                }
            },
            this.list.bind(this)
        );
    }

    public async list(options?: { start?: string, end?: string }): Promise<{ content: { type: "text"; text: string; }[] }> {
        try {
            const { start, end } = options || {};

            const srvReport = await this.assistant?.resolve<IReportManager>('ReportManager');
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
                        text: `❌ Failed to retrive the report list: ${(error as Error).message}`
                    }
                ]
            };
        }
    }
}