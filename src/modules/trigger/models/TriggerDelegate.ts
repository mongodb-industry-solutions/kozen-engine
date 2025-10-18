import { ChangeStreamDocument, Document } from "mongodb";
import { IIoC } from "../../../shared/tools";

export interface ITriggerDelegate {
    default?: (change: ChangeStreamDocument<Document>, assistant?: IIoC) => void;
    on?: (change: ChangeStreamDocument<Document>, assistant?: IIoC) => void;
    insert?: (change: ChangeStreamDocument<Document>, assistant?: IIoC) => void;
    update?: (change: ChangeStreamDocument<Document>, assistant?: IIoC) => void;
    delete?: (change: ChangeStreamDocument<Document>, assistant?: IIoC) => void;
    replace?: (change: ChangeStreamDocument<Document>, assistant?: IIoC) => void;
}

// export declare type GenericListener = (...args: any[]) => void;