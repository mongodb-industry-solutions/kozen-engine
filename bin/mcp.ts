import { CLIController } from "../src";
import { HelpController } from "../src/modules/help/controllers/HelpMCPController";
import { RectificationController } from "../src/modules/rectification/controllers/RectificationMCPController";
import { ReportController } from "../src/modules/report/controllers/ReportMCPController";
import { SecretController } from "../src/modules/secret/controllers/SecretMCPController";
import { TemplateController } from "../src/modules/template/controllers/TemplateMCPController";
import { VCategory } from "../src/shared/models/Types";
import { ServerMCP } from "../src/shared/tools/mcp/ServerMCP";

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
            new SecretController(ops).register(server.node),
            new ReportController(ops).register(server.node),
            new RectificationController(ops).register(server.node)
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
