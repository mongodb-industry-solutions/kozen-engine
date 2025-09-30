import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";
import { MCPController } from "../../../shared/controllers/MCPController";
import { ISecretManager } from "../models/Secret";

export class SecretController extends MCPController {

    public async register(server: McpServer): Promise<void> {
        // select secrets
        server.registerTool("kozen_secret_select",
            {
                description: "Get secret content",
                inputSchema: {
                    key: z.string().describe("secret key")
                },
            },
            this.select.bind(this)
        );
        // list secrets
        server.registerTool("kozen_secret_save",
            {
                description: "Create or update a secret",
                inputSchema: {
                    key: z.string().describe("secret key"),
                    value: z.string().optional().describe("secret value")
                }
            },
            this.create.bind(this)
        );
    }

    public async select(args: { key: string }, extra?: any) {
        const { key } = args;
        try {
            if (!key) {
                throw new Error('Secret key is required for get operation');
            }

            const srvSecret = await this.assistant?.resolve<ISecretManager>('SecretManager');
            const value = await srvSecret!.resolve(key);
            if (!value) {
                throw new Error('Failed to resolve secret key');
            }

            return {
                content: [
                    {
                        type: "text" as const,
                        text: JSON.stringify({ key, value }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text" as const,
                        text: `🔍 Secret '${key}' not found or ${(error as Error).message}.`
                    }
                ]
            };
        }
    }

    public async create(options?: { key?: string, value?: string }): Promise<{ content: { type: "text"; text: string; }[] }> {
        try {
            const { key, value } = options || {};

            if (!key || !value) {
                throw new Error('Secret key and value are required for save operation');
            }

            const srvSecret = await this.assistant?.resolve<ISecretManager>('SecretManager');
            const result = await srvSecret!.save(key, value);

            return {
                content: [
                    {
                        type: "text" as const,
                        text: String(result)
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text" as const,
                        text: `❌ Failed to create a secret: ${(error as Error).message}`
                    }
                ]
            };
        }
    }
}