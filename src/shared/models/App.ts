import { IArgs } from "./Args";
import { IConfig } from "./Config";
import { IModule } from "./Module";

export interface IKzApplication {
    init(config: IConfig, app: IModule): Promise<void>;
    start(args?: IArgs): Promise<void>;
}