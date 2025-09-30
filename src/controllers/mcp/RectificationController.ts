import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";
import { IIAMRectification, IRectificationOption } from "../../models/IAMRectification";
import { MCPController } from "../MCPController";

export class RectificationController extends MCPController {

    public async register(server: McpServer): Promise<void> {
        // list reports
        server.registerTool("kozen_iam_rectification_verify_scram",
            {
                description: "Execute a conditional rectification process to evaluate roles and permissions associated with a provided MongoDB connection string using the SCRAM authentication method.",
                inputSchema: {
                    host: z.string()
                        .describe("Host of the MongoDB instance. Format: hostname or IP address.")
                        .optional(),
                    app: z.string()
                        .describe("Application identifier or name associated with the connection.")
                        .optional(),
                    uri: z.string()
                        .describe("Full MongoDB connection string to execute rectification upon.")
                        .optional(),
                    uriEnv: z.string()
                        .describe("Environment variable containing the connection URI.")
                        .optional(),
                    username: z.string()
                        .describe("Username for authentication.")
                        .optional(),
                    password: z.string()
                        .describe("Password for authentication.")
                        .optional(),
                    method: z.enum(["SCRAM-SHA-1", "SCRAM-SHA-256"])
                        .describe("Authentication method to use, defaults to SCRAM.")
                        .optional(),
                    protocol: z.enum(["mongodb", "mongodb+srv"])
                        .describe(
                            "Protocol indicating the connection type (either standalone or clustered)."
                        )
                        .optional(),
                    isCluster: z.boolean()
                        .describe("True if the target instance is part of a cluster.")
                        .optional(),
                    permissions: z.array(z.string())
                        .describe(
                            "List of permissions to rectify using CSV format. For example: read, write, admin."
                        ),
                },
            },
            this.verifySCRAM.bind(this)
        );
    }

    public async verifySCRAM(options?: IRectificationOption): Promise<{ content: { type: "text"; text: string; }[] }> {
        try {
            options = options || {} as IRectificationOption;
            options.isCluster = options.isCluster !== undefined ? options.isCluster : true;
            options.protocol = options.protocol || (options.isCluster ? "mongodb+srv" : "mongodb");
            options.permissions = typeof options.permissions === "string" ? (options.permissions as unknown as string).split(",").map(p => p.trim()) : options.permissions;

            const srvIAMScram = await this.assistant?.resolve<IIAMRectification>('IAMRectificationScram');
            const result = await srvIAMScram!.rectify(options);

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