import { KzModule } from "../../shared/controllers/KzModule";
import { IConfig } from "../../shared/models/Config";
import { IDependency } from "../../shared/tools";

import cli from "./configs/cli.json";
import ioc from "./configs/ioc.json";
import mcp from "./configs/mcp.json";

export class ReportModule extends KzModule {

    public register(config: IConfig | null, opts?: any): Promise<Record<string, IDependency> | null> {
        let dep = {};
        switch (config?.type) {
            case 'mcp':
                dep = { ...ioc, ...mcp };
                break;
            case 'cli':
                dep = { ...ioc, ...cli };
                break;
            default:
                dep = ioc;
                break;
        }
        return Promise.resolve(dep as Record<string, IDependency>);
    }
}