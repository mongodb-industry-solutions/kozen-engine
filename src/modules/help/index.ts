import { KzModule } from "../../shared/controllers/KzModule";
import { IConfig } from "../../shared/models/Config";
import { IDependency } from "../../shared/tools";
import cli from "./configs/cli.json";
import mcp from "./configs/mcp.json";

export class ComponentModule extends KzModule {

    public register(config: IConfig | null, opts?: any): Promise<Record<string, IDependency> | null> {
        return Promise.resolve((config?.type === 'mcp' ? mcp as Record<string, IDependency> : cli) as Record<string, IDependency>);
    }
}