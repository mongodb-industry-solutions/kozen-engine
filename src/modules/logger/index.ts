import { KzModule } from "../../shared/controllers/KzModule";
import { IConfig } from "../../shared/models/Config";
import { IDependency } from "../../shared/tools";
import cli from "./configs/cli.json";
import ioc from "./configs/ioc.json";

export class LoggerModule extends KzModule {

    public register(config: IConfig | null, opts?: any): Promise<Record<string, IDependency> | null> {
        let merged = config?.type === 'cli' ? { ...ioc, ...cli } : ioc;
        return Promise.resolve(merged as Record<string, IDependency>);
    }
}