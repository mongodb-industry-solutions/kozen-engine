### Self‑Hosted Triggers with Kozen (Layered: Basic → Advanced)

Kozen can run MongoDB Change Stream–based triggers on your own infrastructure. If you’ve used MongoDB Atlas Triggers, think of this as a self‑hosted alternative: you write a small JavaScript file (the delegate) that exports simple functions per operation, and Kozen wires everything up to stream change events into your code.

- Atlas context: MongoDB Atlas provides a fully managed Triggers service. Kozen offers a similar capability you can run anywhere (local, on‑prem, cloud), while keeping your logic in a single, easy‑to‑maintain JS file.

Basic → Advanced overview:
- Basic: install Kozen, point to your `.env`, and use the existing example delegate below.
- Intermediate: understand how Kozen routes events to your handlers and how to configure environment variables safely.
- Advanced: adopt best practices for idempotency, security, performance, and operations.

Parameters passed to your handlers:
- change: A MongoDB Change Stream document describing what happened.
  - Common fields:
    - `operationType`: 'insert' | 'update' | 'delete' | 'replace' | ...
    - `ns`: `{ db, coll }` (namespace)
    - `documentKey`: identifier of the affected document (e.g., `{ _id: ... }`)
    - For updates: `updateDescription` including `updatedFields`, `removedFields`, `truncatedArrays`
- tools: Runtime helpers provided by Kozen so your handler can log and interact with the database safely and consistently.

```ts
// Tools your handler receives from Kozen
export interface ITriggerTools {
    assistant?: IIoC;                // Includes assistant.logger for structured logs
    flow?: string;                   // Correlation id for tracing a single event
    changeStream?: ChangeStream;     // Underlying change stream (rarely needed)
    collectionName?: string;         // Target collection name
    collection?: Collection;         // Ready-to-use MongoDB collection handle
    dbName?: string;                 // Target database name
    db?: Db;                         // Ready-to-use MongoDB db handle
}
```

How handler resolution works:
- Kozen finds an operation‑specific function by name from your delegate (e.g., `insert`, `update`, `delete`, `replace`).
- Kozen also calls a catch‑all handler if present: `on` or `default`.
- If no appropriate handler exists, Kozen logs a warning and skips the event.
- Errors in handlers are caught and logged; the stream continues running.

Configuration tips:
- Required:
  - `KOZEN_TRIGGER_FILE`: absolute path to your delegate JavaScript file.
  - `KOZEN_TRIGGER_DATABASE`: database name 
  - `KOZEN_TRIGGER_COLLECTION`: collection name 
  - `KOZEN_TRIGGER_URI`: connection string to the MongoDB server
- Optional:
  - `KOZEN_TRIGGER_KEY` (defaults to `trigger:delegate:default`).
  - `KOZEN_LOG_LEVEL`, `KOZEN_LOG_TYPE` for log verbosity/format.

Best practices:
- Keep handlers small and idempotent; handle partial updates and potential retries.
- Use least‑privilege credentials; grant write only if your logic updates documents.
- Avoid heavy I/O inside handlers; offload to queues/background workers if needed.
- Separate delegates per collection/domain for clarity and maintainability.
- Run under a process manager (PM2/systemd) or containers/orchestration for resilience.

Quick checklist:
- Install Kozen.
- Write the delegate with `insert`/`update`/`delete`/`replace` and optional `on`/`default`.
- Fill `.env` with `KOZEN_TRIGGER_*` settings.
- Start the service (see Command below) and verify logs.

### Install 
```shell
/home/user> npm install @mongodb-solution-assurance/kozen
```

### Command:

```shell
/home/user> npx kozen --action=trigger:start --envFile=/home/user/.env
```

### Trigger Example 

FILE: `/home/user/mytrigger.js`

```js
export async function update(change, tools) {
  const { collection, assistant, flow } = tools;

  // Log the change event using the tool's logger if available
  assistant?.logger?.info({
    flow,
    message: "Change detected:",
    data: {
      ns: change.ns,
      operationType: change.operationType,
      documentKey: change.documentKey,
      updatedFields: change?.updateDescription?.updatedFields,
      removedFields: change?.updateDescription?.removedFields,
      truncatedArrays: change?.updateDescription?.truncatedArrays,
    },
  });

  // Fetch the updated full document
  const updatedDoc = await collection.findOne(change.documentKey);

  // Add extra fields or validate the data
  if (updatedDoc) {
    // Example of adding a new field
    updatedDoc.extraField = "Added by Kozen Trigger";

    // Update the collection with the new fields
    await collection.updateOne(change.documentKey, { $set: updatedDoc });
  }

  // Log the updated document using the tool's logger if available
  assistant?.logger?.info({
    flow,
    message: "Updated document",
    data: updatedDoc,
  });
}

export default function (change, tools) {
  const { assistant, flow } = tools;
  assistant?.logger?.info({
    flow,
    message: "Change detected:",
    data: {
      operationType: change.operationType,
      database: tools.dbName,
      collection: tools.collectionName,
      documentKey: change.documentKey,
    },
  });
}
```

### Environment File Example

FILE: `/home/user/.env`
```env
KOZEN_LOG_LEVEL=INFO
KOZEN_LOG_TYPE=object

KOZEN_TRIGGER_FILE=/home/user/mytrigger.js
KOZEN_TRIGGER_DATABASE=test
KOZEN_TRIGGER_COLLECTION=logs
KOZEN_TRIGGER_URI=mongodb+srv://***REDACTED***@cluster0.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0
```

### Logs Example

```
{
  flow: '2025102011354943',
  message: 'Trigger as service started',
  data: { database: 'test', collection: 'logs' },
  level: 'INFO',
  date: '2025-10-20T09:35:49.982Z'
}
{
  flow: 'K2025102011354733-DEV',
  src: 'bin:Kozen',
  data: {
    params: {
      action: 'start',
      envFile: '/home/user/.env',
      stack: 'DEV',
      project: 'K2025102011354733',
      type: 'cli',
      module: 'trigger:controller:cli'
    }
  },
  category: 'cli:tool',
  level: 'INFO',
  date: '2025-10-20T09:35:49.983Z'
}
{
  flow: '2025102011360093',
  message: 'Change detected:',
  data: {
    ns: { db: 'test', coll: 'logs' },
    operationType: 'update',
    documentKey: { _id: new ObjectId('68ee5fa8731b780c175fdbef') },
    updatedFields: { des: 'Ttest5', name: 'TdeTmo' },
    removedFields: [],
    truncatedArrays: []
  },
  level: 'INFO',
  date: '2025-10-20T09:36:00.431Z'
}
{
  flow: '2025102011360041',
  message: 'Updated document',
  data: {
    _id: new ObjectId('68ee5fa8731b780c175fdbef'),
    des: 'Ttest5',
    name: 'TdeTmo',
    extraField: 'Added by Kozen Trigger'
  },
  level: 'INFO',
  date: '2025-10-20T09:36:00.664Z'
}
{
  flow: '2025102011360055',
  message: 'Change detected:',
  data: {
    operationType: 'update',
    database: 'test',
    collection: 'logs',
    documentKey: { _id: new ObjectId('68ee5fa8731b780c175fdbef') }
  },
  level: 'INFO',
  date: '2025-10-20T09:36:00.666Z'
}
```
