import { KzModule } from "../../shared/controllers/KzModule";
import { IConfig } from "../../shared/models/Config";
import { IDependency } from "../../shared/tools";

export class MCPModule extends KzModule {
    public register(config?: IConfig | null, opts?: any): Promise<Record<string, IDependency> | null> {
        return Promise.resolve(({
            "application:mcp": {
                "target": "MCPApplication",
                "type": "class",
                "path": "../../../modules/mcp/controllers",
                "category": "application",
                "lifetime": "singleton"
            }
        }) as Record<string, IDependency>);
    }
}

export default MCPModule;