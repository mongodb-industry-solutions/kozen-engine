import { ChangeStream, ChangeStreamDocument, Collection, Db, Document } from "mongodb";
import { IIoC } from "../../../shared/tools";

export interface ITriggerTools {
    assistant?: IIoC;
    flow?: string;
    changeStream?: ChangeStream<Document, ChangeStreamDocument<Document>>;
    collectionName?: string;
    collection?: Collection<Document>;
    dbName?: string;
    db?: Db;
} 