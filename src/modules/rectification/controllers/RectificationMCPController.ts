import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";
import { MCPController } from "../../../applications/mcp/controllers/MCPController";
import { IIAMRectification, IRectificationOption, IRectificationOptionX509 } from "../models/IAMRectification";

export class RectificationController extends MCPController {

    public async register(server: McpServer): Promise<void> {
        // common schema
        const inputSchema = {
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
        } as const;
        // list reports
        server.registerTool("kozen_iam_rectification_verify_scram",
            {
                description: "Execute a conditional rectification process to evaluate roles and permissions associated with a provided MongoDB connection string using the SCRAM authentication method.",
                inputSchema
            },
            this.verifySCRAM.bind(this)
        );
        // x509 reports
        server.registerTool("kozen_iam_rectification_verify_x509",
            {
                description: "Execute a conditional rectification process to evaluate roles and permissions associated with a provided MongoDB connection string using the X.509 authentication method.",
                inputSchema: {
                    ...inputSchema,
                    key: z.string()
                        .describe("PEM-formatted private key for X.509 authentication.")
                        .optional(),
                    cert: z.string()
                        .describe("PEM-formatted certificate for X.509 authentication.")
                        .optional(),
                    ca: z.string()
                        .describe("PEM-formatted CA certificate for X.509 authentication.")
                        .optional(),
                    certPath: z.string()
                        .describe("File path to the PEM-formatted certificate.")
                        .optional(),
                    caPath: z.string()
                        .describe("File path to the PEM-formatted CA certificate.")
                        .optional()
                }
            },
            this.verifyX509.bind(this)
        );
    }

    public async verifySCRAM(options?: IRectificationOption): Promise<{ content: { type: "text"; text: string; }[] }> {
        try {
            options = options || {} as IRectificationOption;
            options.isCluster = options.isCluster !== undefined ? options.isCluster : true;
            options.protocol = options.protocol || (options.isCluster ? "mongodb+srv" : "mongodb");
            options.permissions = typeof options.permissions === "string" ? (options.permissions as unknown as string).split(",").map(p => p.trim()) : options.permissions;

            const srvIAMScram = await this.assistant?.resolve<IIAMRectification>('iam:rectification:scram');
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

    public async verifyX509(options?: IRectificationOptionX509): Promise<{ content: { type: "text"; text: string; }[] }> {
        try {
            options = options || {} as IRectificationOptionX509;
            options.isCluster = options.isCluster !== undefined ? options.isCluster : true;
            options.protocol = options.protocol || (options.isCluster ? "mongodb+srv" : "mongodb");
            options.permissions = typeof options.permissions === "string" ? (options.permissions as unknown as string).split(",").map(p => p.trim()) : options.permissions;

            const srvIAMX509 = await this.assistant?.resolve<IIAMRectification>('iam:rectification:x509');
            const result = await srvIAMX509!.rectify(options);

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