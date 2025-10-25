import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { KzController } from "../../../shared/controllers/KzController";

export abstract class MCPController extends KzController {
    public abstract register(server: McpServer): Promise<void>;
}