import fs from 'fs';
import path from 'path';
import { KzModule } from "../../shared/controllers/KzModule";
import { IConfig } from "../../shared/models/Config";
import { IDependency } from "../../shared/tools";
import cli from "./configs/cli.json";
import mcp from "./configs/mcp.json";

export class HelpModule extends KzModule {
    constructor(dependency?: any) {
        super(dependency);
        try {
            const pac = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../../package.json'), 'utf-8'));
            this.metadata.version = pac.version;
            this.metadata.author = pac.author;
            this.metadata.license = pac.license;
            this.metadata.uri = pac.homepage;
        }
        catch (error) {
            this.assistant?.logger?.warn({
                src: 'Module:Help',
                msg: `Failed to load package.json metadata: ${(error as Error).message}`
            });
        }
    }

    public register(config: IConfig | null, opts?: any): Promise<Record<string, IDependency> | null> {
        return Promise.resolve((config?.type === 'mcp' ? mcp as Record<string, IDependency> : cli) as Record<string, IDependency>);
    }
}