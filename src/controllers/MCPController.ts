import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { CLIController } from "./CLIController";

export abstract class MCPController extends CLIController {

    public abstract register(server: McpServer): Promise<void>;
}