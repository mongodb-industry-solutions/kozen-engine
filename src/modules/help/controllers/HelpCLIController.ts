import path from "path";
import { IModule } from "../../../shared/models/Module";
import { CLIController } from "../../cli/controllers/CLIController";

export class HelpCLIController extends CLIController {
    /**
     * Displays comprehensive CLI usage information and command examples for pipeline operations
     * Shows available templates, actions, and detailed usage patterns for infrastructure management
     * 
     * @returns {void}
     * @public
     */
    public async help(): Promise<void> {
        let dir = process.env.KOZEN_DOCS_DIR || path.resolve(__dirname, '../docs');
        let helpText = await this.srvFile?.select('kozen', dir);
        let map = this.assistant?.map?.module || {};
        let mod = '';
        for (const key of Object.keys(map)) {
            if (key.includes('help')) continue;
            const dep = await this.assistant?.get(key) as IModule;
            const name = dep.metadata?.alias || dep.metadata?.name || key;
            const from = name !== dep.metadata?.name ? `, from <${dep.metadata?.name}>` : '';
            const version = dep.metadata?.version ? `, (v${dep.metadata?.version})` : '';
            dep.metadata?.summary && (mod += `                                    - ${name}: ${dep.metadata?.summary || 'No description available'}${from}${version}\n`);
        }
        helpText = helpText?.replace('{MOD}', mod) || '';
        super.help({ body: helpText });
    }
} 