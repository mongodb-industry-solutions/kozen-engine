import { ChangeStream, ChangeStreamDocument, Document, MongoClient } from 'mongodb';
import { IIoC } from '../../../shared/tools';
import { ILogger } from '../../../shared/tools/log/types';
import { ITriggerOptions } from '../models/ITriggerOptions';
import { ITriggerDelegate } from '../models/TriggerDelegate';

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
            this.changeStream = collection.watch();
            this.changeStream.on('change', (change) => this.onChange(change, delegate, options?.flow));
        } catch (error) {
            this.logger?.error({
                flow: options?.flow,
                message: `Error starting change stream: ${error instanceof Error ? error.message : String(error)}`
            });
        }
    }

    async onChange(change: ChangeStreamDocument<Document>, delegate?: ITriggerDelegate, flow?: string): Promise<void> {
        try {
            if (!this.assistant) {
                throw new Error('Dependency injection is not configured properly.');
            }
            if (!delegate) {
                this.logger?.warn({
                    flow,
                    message: 'No delegate defined for handling change events.'
                });
                return;
            }

            const on = delegate.on || delegate.default;
            const handler = delegate[change.operationType as keyof typeof delegate]

            if (typeof handler !== 'function' && typeof on !== 'function') {
                this.logger?.warn({
                    flow,
                    message: `No handler defined for operation type: ${change.operationType}`
                });
                return;
            }

            typeof handler === 'function' && await handler.apply(this, [change]);
            typeof on === 'function' && await on.apply(this, [change, this.assistant]);

        } catch (error) {
            this.logger?.error({
                flow,
                message: `Error handling change event: <${change.operationType}> ${error instanceof Error ? error.message : String(error)}`
            });
        }
    }

    async stop(): Promise<void> {
        await this.changeStream?.close();
        await this.client?.close();
    }
}