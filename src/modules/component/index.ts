import { KzModule } from "../../shared/controllers/KzModule";
import { IConfig } from "../../shared/models/Config";
import { IDependency } from "../../shared/tools";
import ioc from "./configs/ioc.json";

export class ComponentModule extends KzModule {

    public register(config: IConfig | null, opts?: any): Promise<Record<string, IDependency> | null> {
        return Promise.resolve(ioc as Record<string, IDependency>);
    }
}