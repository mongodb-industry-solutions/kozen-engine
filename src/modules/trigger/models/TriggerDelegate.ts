import { ChangeStreamDocument, Document } from "mongodb";
import { ITriggerTools } from "./TriggerTools";

export interface ITriggerDelegate {
    default?: (change: ChangeStreamDocument<Document>, tools?: ITriggerTools) => void;
    on?: (change: ChangeStreamDocument<Document>, tools?: ITriggerTools) => void;
    insert?: (change: ChangeStreamDocument<Document>, tools?: ITriggerTools) => void;
    update?: (change: ChangeStreamDocument<Document>, tools?: ITriggerTools) => void;
    delete?: (change: ChangeStreamDocument<Document>, tools?: ITriggerTools) => void;
    replace?: (change: ChangeStreamDocument<Document>, tools?: ITriggerTools) => void;
}