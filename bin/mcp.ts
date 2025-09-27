import { CLIController } from "../src";
import { HelpController } from "../src/controllers/mcp/HelpController";
import { SecretController } from "../src/controllers/mcp/SecretController";
import { TemplateController } from "../src/controllers/mcp/TemplateController";
import { VCategory } from "../src/models/Types";
import { ServerMCP } from "../src/tools/mcp/ServerMCP";

(async () => {
    const cli = new CLIController();
    const { args } = await cli.init(process.argv);
    try {
        const server = new ServerMCP({ name: "kozen", version: "1.0.0" });
        if (!cli.helper || !cli.logger) {
            throw new Error("CLIController not properly initialized: missing helper or logger.");
        }

        cli.logger.info({
            flow: cli.getId(args),
            src: 'bin:mcp',
            category: VCategory.cmp.exe,
            message: `🚀 Starting MCP server...`
        });

        const ops = { assistant: cli.helper, logger: cli.logger };

        await Promise.all([
            new TemplateController(ops).register(server.node),
            new HelpController(ops).register(server.node),
            new SecretController(ops).register(server.node)
        ]);

        server.start();
    } catch (error) {
        console.error({
            flow: cli.getId(args),
            src: 'bin:mcp',
            category: VCategory.cmp.exe,
            message: `❌ MCP execution failed:` + (error as Error).message || error
        });
    }
})();
