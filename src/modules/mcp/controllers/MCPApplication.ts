import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { KzApplication } from "../../../shared/controllers/KzApplication";
import { IConfig } from "../../../shared/models/Config";
import { IModule } from "../../../shared/models/Module";
import { MCPController } from "./MCPController";

console.log = (...args) => console.error(...args);
console.info = console.log;
console.warn = console.log;
console.debug = console.log;

export class MCPApplication extends KzApplication {
    private _node: McpServer;

    get node(): McpServer {
        return this._node;
    }

    constructor(config?: IConfig, app?: IModule, options?: { name: string; version: string }) {
        super(config, app);
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
        node = node || this._node;
        app = app || this.app;
        const modules = [Promise.resolve()];
        const mods = app.helper?.map?.module;
        if (!config || config.modules?.load === undefined) {
            throw new Error("App Module not properly initialized: missing config.");
        }
        for (const key in mods) {
            let mod = await app.helper?.get<IModule>(key);
            let name = mod?.metadata?.alias || mod?.metadata?.name || key;
            let ctl = name && await app.helper?.get<MCPController>(name + ":controller:mcp") || null;
            ctl && modules.push(ctl.register(node));
        }
        await Promise.all(modules);
    }
}

export default MCPApplication;