import { KzModule } from "../../shared/controllers/KzModule";
import { IConfig } from "../../shared/models/Config";
import { IDependency } from "../../shared/tools";
import cli from "./configs/cli.json";
import ioc from "./configs/ioc.json";

export class LoggerModule extends KzModule {
    constructor(dependency?: any) {
        super(dependency);
        this.metadata.summary = 'Manage system logs and monitoring data';
        this.metadata.alias = 'logger';
    }

    public register(config: IConfig | null, opts?: any): Promise<Record<string, IDependency> | null> {
        let merged = config?.type === 'cli' ? { ...ioc, ...cli } : ioc;
        return Promise.resolve(merged as Record<string, IDependency>);
    }
}