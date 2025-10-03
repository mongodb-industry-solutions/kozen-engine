import { AppModule } from "../src/modules/app";
import { VCategory } from "../src/shared/models/Types";
import { ServerMCP } from "../src/shared/tools/mcp/ServerMCP";

(async () => {
    // Create controller and parse arguments
    const app = new AppModule();

    // Initialize application (parse args and load config)
    process.argv.push('--type=mcp');
    const { args, config } = await app.init(process.argv);

    try {
        if (!config) {
            throw new Error("App Module not properly initialized: missing config.");
        }

        await app.register(config);
        const server = new ServerMCP({ name: "kozen", version: "1.0.0" });

        if (!app.helper || !app.logger) {
            throw new Error("App Module not properly initialized: missing helper or logger.");
        }

        await server.init(config, app);

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
