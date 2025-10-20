import { ChangeStream, ChangeStreamDocument, Document, MongoClient } from 'mongodb';
import { IIoC } from '../../../shared/tools';
import { ILogger } from '../../../shared/tools/log/types';
import { ITriggerDelegate } from '../models/TriggerDelegate';
import { ITriggerOptions } from '../models/TriggerOptions';
import { ITriggerTools } from '../models/TriggerTools';

export class ChangeStreamService {
    private client?: MongoClient;
    private changeStream?: ChangeStream;
    private options?: ITriggerOptions;
    protected assistant?: IIoC | null;
    public logger?: ILogger | null;

    constructor(dependency?: { assistant: IIoC, logger: ILogger }) {
        this.assistant = dependency?.assistant ?? null;
        this.logger = dependency?.logger ?? null;
    }

    async start(options?: ITriggerOptions): Promise<void> {
        options = options || this.options;
        try {
            if (!this.assistant || !options?.opt) {
                throw new Error('Dependency injection is not configured properly.');
            }
            if (!this.client && options?.mdb?.uri) {
                this.client = new MongoClient(options.mdb.uri);
            } else {
                throw new Error('MongoDB client is not initialized properly.');
            }
            const delegate = await this.assistant.get<ITriggerDelegate>(options.opt);
            if (!delegate) {
                throw new Error('Trigger delegate could not be resolved.');
            }
            await this.client.connect();
            if (!options?.mdb?.database || !options?.mdb?.collection) {
                throw new Error('MongoDB database or collection is not specified in options.');
            }
            const db = this.client.db(options.mdb.database);
            const collection = db.collection(options.mdb.collection);
            const tools = {
                assistant: this.assistant || undefined,
                flow: options?.flow,
                changeStream: this.changeStream,
                collectionName: options?.mdb?.collection,
                collection: collection,
                dbName: options?.mdb?.database,
                db: db
            };
            this.changeStream = collection.watch();
            this.changeStream.on('change', (change) => this.onChange(change, delegate, tools));
            this.logger?.info({
                flow: options?.flow,
                message: `Trigger as service started`,
                data: {
                    database: options.mdb.database,
                    collection: options.mdb.collection
                }
            });
        } catch (error) {
            this.logger?.error({
                flow: options?.flow,
                src: 'Service:Trigger:start',
                message: `Error starting change stream: ${error instanceof Error ? error.message : String(error)}`
            });
        }
    }

    async onChange(change: ChangeStreamDocument<Document>, delegate?: ITriggerDelegate, tools?: ITriggerTools): Promise<void> {
        try {
            if (!this.assistant) {
                throw new Error('Dependency injection is not configured properly.');
            }
            if (!delegate) {
                this.logger?.warn({
                    flow: tools?.flow,
                    message: 'No delegate defined for handling change events.'
                });
                return;
            }

            const on = delegate.on || delegate.default;
            const handler = delegate[change.operationType as keyof typeof delegate]

            if (typeof handler !== 'function' && typeof on !== 'function') {
                this.logger?.warn({
                    flow: tools?.flow,
                    message: `No handler defined for operation type: ${change.operationType}`
                });
                return;
            }

            typeof handler === 'function' && await handler.apply(this, [change, tools]);
            typeof on === 'function' && await on.apply(this, [change, tools]);

        } catch (error) {
            this.logger?.error({
                flow: tools?.flow,
                src: 'Service:Trigger:onChange',
                message: `Error handling change event: <${change.operationType}> ${error instanceof Error ? error.message : String(error)}`
            });
        }
    }

    async stop(): Promise<void> {
        await this.changeStream?.close();
        await this.client?.close();
    }
}