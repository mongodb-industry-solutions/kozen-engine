import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MCPController } from "../../controllers/MCPController";
import { IConfig } from "../../models/Config";
import { IModule } from "../../models/Module";
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
        this.node.server.onerror = (error) => {
            console.error("MCP Server Error:", error);
        }
        await this.node.connect(transport);

    }

    async init(config: IConfig, app: IModule, node?: McpServer): Promise<void> {
        const modules = [Promise.resolve()];
        node = node || this._node;

        if (!config || config.modules?.load === undefined) {
            throw new Error("App Module not properly initialized: missing config.");
        }

        for (const key in config.modules.load || []) {
            let item = config.modules?.load[key];
            let name = typeof item === 'string' ? item : item.name;
            let module = name && await app.helper?.get<MCPController>(name + ":controller:mcp") || null;
            if (module) {
                modules.push(module.register(node));
            }
        }

        await Promise.all(modules);
    }
}