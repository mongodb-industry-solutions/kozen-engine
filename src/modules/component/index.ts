import { KzModule } from "../../shared/controllers/KzModule";
import { IDependency } from "../../shared/tools";
import { IConfig } from "../app/models/Config";
import ioc from "./configs/ioc.json";

export class ComponentModule extends KzModule {

    public register(config: IConfig | null, opts?: any): Promise<Record<string, IDependency> | null> {
        return Promise.resolve(ioc as Record<string, IDependency>);
    }
}