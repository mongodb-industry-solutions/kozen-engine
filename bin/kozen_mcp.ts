import { AppModule } from "../src/modules/app";
import { MCPController } from "../src/shared/controllers/MCPController";
import { VCategory } from "../src/shared/models/Types";
import { ServerMCP } from "../src/shared/tools/mcp/ServerMCP";

(async () => {
    // Create controller and parse arguments
    const app = new AppModule();

    // Initialize application (parse args and load config)
    process.argv.push('--type=mcp');
    const { args, config } = await app.init(process.argv);

    try {
        const server = new ServerMCP({ name: "kozen", version: "1.0.0" });
        if (!app.helper || !app.logger) {
            throw new Error("App Module not properly initialized: missing helper or logger.");
        }

        app.logger.info({
            flow: app.getId(args),
            src: 'bin:mcp',
            category: VCategory.cmp.exe,
            message: `🚀 Starting MCP server...`
        });

        const modules = [];

        if (!config) {
            throw new Error("App Module not properly initialized: missing config.");
        }

        for (const key in config.modules?.load || []) {
            let module = await app.helper?.get<MCPController>(key + ":controller:mcp") || null;
            if (module) {
                modules.push(module.register(server.node));
            }
        }

        await Promise.all(modules);

        server.start();
    } catch (error) {
        console.error({
            flow: app.getId(args),
            src: 'bin:mcp',
            category: VCategory.cmp.exe,
            message: `❌ MCP execution failed:` + (error as Error).message || error
        });
    }
})();
