import path from "path";
import { CLIController } from "../../../applications/cli/controllers/CLIController";

export class PipelineController extends CLIController {
    /**
     * Displays comprehensive CLI usage information and command examples for pipeline operations
     * Shows available templates, actions, and detailed usage patterns for infrastructure management
     * 
     * @returns {void}
     * @public
     */
    public async help(): Promise<void> {
        const dir = process.env.DOCS_DIR || path.resolve(__dirname, '../docs');
        const helpText = await this.srvFile?.select('kozen', dir);
        console.log(helpText);
    }
} 