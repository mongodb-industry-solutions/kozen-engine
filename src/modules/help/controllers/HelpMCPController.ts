import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";
import { MCPController } from "../../../shared/controllers/MCPController";
import { FileService } from "../../../shared/services/FileService";

export class HelpController extends MCPController {

    public async register(server: McpServer): Promise<void> {
        // select tool
        server.registerTool("kozen_tool_help",
            {
                description: "Get information about a specific Kozen tool or tool help content",
                inputSchema: {
                    name: z.string().describe("Kozen Tool name")
                },
            },
            this.select.bind(this)
        );
        // general information
        server.registerTool("kozen_help",
            {
                description: "Get information about Kozen tools and usage",
                inputSchema: {}
            },
            this.list.bind(this)
        );

        this.srvFile = this.srvFile || await this.assistant?.resolve<FileService>('app:file');
    }

    async select(args: { name: string, format?: string }, extra?: any) {
        const { name } = args;
        try {
            if (!name) {
                throw new Error('Tool name is required for get operation');
            }

            const text = await this.srvFile?.select(name);
            if (!text) {
                throw new Error(`Failed to resolve Tool content: ${name} in ${this.srvFile?.dir}`);
            }

            return {
                content: [
                    {
                        type: "text" as const,
                        text
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text" as const,
                        text: `🔍 Tool '${name}' not found or ${(error as Error).message}.`
                    }
                ]
            };
        }
    }

    public async list(options?: { format?: string }): Promise<{ content: { type: "text"; text: string; }[] }> {
        try {
            const text = await this.srvFile?.select('kozen');
            if (!text) {
                throw new Error(`Failed to resolve Kozen content in ${this.srvFile?.dir}`);
            }

            return {
                content: [
                    {
                        type: "text" as const,
                        text
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text" as const,
                        text: `❌ Failed to list templates: ${(error as Error).message}`
                    }
                ]
            };
        }
    }
}