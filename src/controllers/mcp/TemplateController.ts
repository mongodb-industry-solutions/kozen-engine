import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";
import { MCPController } from "../MCPController";

export class TemplateController extends MCPController {

    public async register(server: McpServer): Promise<void> {
        // list templates 
        server.registerTool("kozen_template_select",
            {
                title: "kozen_template_select",
                description: "Get template content",
                inputSchema: { name: z.string().describe("Template name") }
            },
            this.list.bind(this)
        )
    }

    async list(args: { name: string }, extra?: any) {
        return {
            content: [
                {
                    type: "text" as const,
                    text: `${args.name} it is good`
                }
            ]
        };
    }
}