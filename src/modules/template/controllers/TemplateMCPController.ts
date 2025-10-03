import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";
import { MCPController } from "../../../shared/controllers/MCPController";
import { ITemplateManager } from "../models/Template";

export class TemplateController extends MCPController {

    public async register(server: McpServer): Promise<void> {
        // select templates
        server.registerTool("kozen_template_select",
            {
                description: "Get template content",
                inputSchema: {
                    name: z.string().describe("Template name"),
                    format: z.string().optional().describe("Output format, e.g., json, yaml").default("json")
                },
            },
            this.select.bind(this)
        );
        // list templates
        server.registerTool("kozen_template_list",
            {
                description: "Get template list",
                inputSchema: {
                    format: z.string().optional().describe("Output format, e.g., json, yaml").default("json")
                }
            },
            this.list.bind(this)
        );
    }

    async select(args: { name: string, format?: string }, extra?: any) {
        const { name, format = 'json' } = args;
        try {
            if (!name) {
                throw new Error('Template name is required for get operation');
            }

            const templateManager = await this.assistant?.resolve<ITemplateManager>('template:manager');
            if (!templateManager) {
                throw new Error('Failed to resolve TemplateManager service');
            }

            const template = await templateManager.load(name);

            if (template) {
                this.logger?.info({
                    flow: this.getId(),
                    src: 'Controller:Template:get',
                    message: `✅ Retrieved template '${name}' successfully.`,
                    data: { templateName: name, format }
                });
            } else {
                this.logger?.info({
                    flow: this.getId(),
                    src: 'Controller:Template:get',
                    message: `🔍 Template '${name}' not found.`
                });
            }

            return {
                content: [
                    {
                        type: "text" as const,
                        text: JSON.stringify(template, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text" as const,
                        text: `🔍 Template '${name}' not found or ${(error as Error).message}.`
                    }
                ]
            };
        }
    }

    public async list(options?: { format?: string }): Promise<{ content: { type: "text"; text: string; }[] }> {
        try {
            const { format = 'table' } = options || {};

            const templateManager = await this.assistant?.resolve<ITemplateManager>('template:manager');
            if (!templateManager) {
                throw new Error('Failed to resolve TemplateManager service');
            }

            const templates = await templateManager.list();

            return {
                content: [
                    {
                        type: "text" as const,
                        text: JSON.stringify(templates, null, 2)
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