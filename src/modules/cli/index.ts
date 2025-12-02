import { KzModule } from "../../shared/controllers/KzModule";
import { IConfig } from "../../shared/models/Config";
import { IDependency } from "../../shared/tools";

export class CLIModule extends KzModule {
    public register(config?: IConfig | null, opts?: any): Promise<Record<string, IDependency> | null> {
        return Promise.resolve(({
            "application:cli": {
                "target": "CLIApplication",
                "type": "class",
                "path": "../../../modules/cli/controllers",
                "category": "application",
                "lifetime": "singleton"
            }
        }) as Record<string, IDependency>);
    }
}

export default CLIModule;
