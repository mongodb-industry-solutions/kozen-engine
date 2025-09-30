import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
console.log = (...args) => console.error(...args);
console.info = console.log;
console.warn = console.log;
console.debug = console.log;

export class ServerMCP {
    private _node: McpServer;

    get node(): McpServer {
        return this._node;
    }

    constructor(options?: { name: string; version: string }) {
        this._node = new McpServer({
            name: options?.name || "kozen",
            version: options?.version || "1.0.0"
        });
    }

    async start(): Promise<void> {
        const transport = new StdioServerTransport();
        await this.node.connect(transport);
    }
}