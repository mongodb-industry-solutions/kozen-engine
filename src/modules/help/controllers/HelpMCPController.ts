import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import path from "path";
import { z } from "zod";
import { FileService } from "../../../shared/services/FileService";
import { CLIController } from "../../cli/controllers/CLIController";
import { MCPController } from "../../mcp/controllers/MCPController";

export class HelpMCPController extends MCPController {

    public async register(server: McpServer): Promise<void> {

        // general information
        server.registerTool("kozen_help",
            {
                description: "Get information about all Kozen tools/modules",
                inputSchema: {}
            },
            this.list.bind(this)
        );

        // select tool specific help
        server.registerTool("kozen_module",
            {
                description: "Get information about a specific Kozen tool/module or tool help content",
                inputSchema: {
                    name: z.string().describe("Kozen Tool/Module name")
                },
            },
            this.select.bind(this)
        );

        this.srvFile = this.srvFile || await this.assistant?.resolve<FileService>('core:file');
    }

    async select(args: { name: string, format?: string }) {
        const { name } = args;
        try {
            if (!name) {
                throw new Error('Tool name is required for get operation');
            }
            const ctl = await this.assistant?.get<CLIController>(`${name}:controller:cli`);
            const text = await ctl?.help();
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
            const dir = process.env.DOCS_DIR || path.resolve(__dirname, '../docs');
            const text = await this.srvFile?.select('kozen', dir);
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