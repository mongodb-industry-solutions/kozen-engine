import { IArgs } from "../../../shared/models/Args";

export interface IRectificationOption {
    host?: string;
    app?: string;
    uri?: string;
    uriEnv?: string;
    username?: string;
    password?: string;
    method?: string;
    protocol?: string;
    isCluster?: boolean;
    permissions: Array<string>;
}

export interface IRectificationOptionX509 extends IRectificationOption {
    key?: string;
    cert?: string;
    ca?: string;
    certPath?: string;
    caPath?: string;
}

export interface IRectificationResponse {
    permissions: {
        extra: string[];
        missing: string[];
        present: string[];
    };
    username?: string;
    roles?: Array<string>;
}

export interface IIAMRectification {
    rectify(options: IRectificationOption): Promise<IRectificationResponse>;
}

export interface IRectificationScramArg extends IArgs, IRectificationOption { }

export interface IRectificationX509Arg extends IArgs, IRectificationOptionX509 { }