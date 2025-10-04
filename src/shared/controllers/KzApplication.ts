import { IKzApplication } from "../models/App";
import { IArgs } from "../models/Args";
import { IConfig } from "../models/Config";
import { IModule } from "../models/Module";

export class KzApplication implements IKzApplication {

    protected app?: IModule;
    protected config?: IConfig

    constructor(config?: IConfig, app?: IModule) {
        this.config = config;
        this.app = app;
    }

    async init(config: IConfig, app: IModule): Promise<void> {
        this.config = config || this.config;
        this.app = app || this.app;
    }

    async start(args?: IArgs): Promise<void> {
        // Application start logic can be added here
    }
}