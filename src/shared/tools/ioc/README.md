# IoC Container - Dependency Injection with Auto-Registration

A modern TypeScript IoC (Inversion of Control) container with auto-registration capabilities, built on top of Awilix. Features async-first resolution, recursive dependency management, and simplified configuration.

## 🚀 Key Features

- **✨ Unified Configuration** - Single `IDependency` interface for all scenarios
- **🔄 Auto-Registration** - Automatic service discovery using regex patterns
- **🏭 Async-First Design** - Async `resolve()` with auto-registration support
- **🔗 Recursive Dependencies** - Complex dependency trees made simple
- **⚡ Lifecycle Management** - Singleton, transient, and scoped instances
- **📁 Dynamic Imports** - Load modules on demand
- **🎯 Self-Registration** - Container auto-registers itself as 'IoC'
- **🧪 Testing-Friendly** - Easy mock injection and container introspection

## 📋 Quick Start

### Installation

```bash
npm install awilix
# IoC library is included in this project
```

### Basic Usage

```typescript
import { IoC, IDependency } from "./tools/ioc";
import { Logger, ILogLevel } from "./tools/log";

// Create container
const container = new IoC();

// Configure dependencies
const dependencies: IDependency[] = [
  {
    target: Logger,
    type: "class",
    lifetime: "singleton",
    args: [{ level: ILogLevel.INFO, category: "APP" }],
  },
];

// Register and resolve (async by default)
await container.register(dependencies);
const logger = await container.resolve<Logger>("Logger");
logger.info("IoC container is ready!");
```

## 🔧 IDependency Interface

The `IDependency` interface is the unified configuration for all registration scenarios:

```typescript
interface IDependency {
  key?: string; // Registration key (auto-inferred if not provided)
  target?: any; // Class, function, value, or reference
  regex?: string; // Auto-registration pattern (defaults to .*)
  type?: IDependencyType; // Registration strategy
  as?: IDependencyType; // Alternative type for auto-registration
  lifetime?: IDependencyLifetime; // Instance lifecycle
  path?: string; // Dynamic import path
  file?: string; // Direct file path
  args?: IJSON[]; // Constructor arguments
  dependencies?: IDependencyList | IDependencyMap; // Nested dependencies
}
```

### Registration Types

| Type         | Description                  | Example                                          |
| ------------ | ---------------------------- | ------------------------------------------------ |
| `'class'`    | Class constructor (default)  | `{ target: UserService, type: 'class' }`         |
| `'value'`    | Static value or primitive    | `{ target: 'production', type: 'value' }`        |
| `'function'` | Function stored as value     | `{ target: () => new Date(), type: 'function' }` |
| `'action'`   | Function executed as factory | `{ target: () => new Date(), type: 'action' }`   |
| `'alias'`    | Alias to existing service    | `{ target: 'Logger', type: 'alias' }`            |
| `'ref'`      | Reference to another service | `{ target: 'Logger', type: 'ref' }`              |
| `'auto'`     | Auto-registration pattern    | `{ type: 'auto', path: './services' }`           |

### Lifetime Management

| Lifetime      | Description                   | Use Cases                              |
| ------------- | ----------------------------- | -------------------------------------- |
| `'singleton'` | Single instance per container | Stateless services, loggers, databases |
| `'transient'` | New instance per resolve      | Stateful services, request handlers    |
| `'scoped'`    | Single instance per scope     | Request-specific services              |

## 📖 Usage Examples

### 1. Basic Class Registration

```typescript
const dependencies: IDependency[] = [
  {
    target: Logger,
    type: "class",
    lifetime: "singleton",
    args: [{ level: ILogLevel.DEBUG, category: "MAIN" }],
  },
  {
    key: "userService",
    target: UserService,
    type: "class",
    lifetime: "transient",
  },
];

await container.register(dependencies);
const logger = await container.resolve<Logger>("Logger");
const userService = await container.resolve<UserService>("userService");
```

### 2. Auto-Registration

```typescript
const dependencies: IDependency[] = [
  // Logger for dependencies
  {
    target: Logger,
    type: "class",
    lifetime: "singleton",
    args: [{ level: ILogLevel.DEBUG, category: "MAIN" }],
  },
  // Auto-register all components
  {
    type: "auto",
    path: "../../components",
    lifetime: "singleton",
    args: [{ level: ILogLevel.DEBUG, category: "MAIN" }, "demo"],
    dependencies: [
      { target: "Logger", type: "ref", key: "logger" },
      { target: "IoC", type: "ref", key: "assistant" },
    ],
  },
];

await container.register(dependencies);

// Components auto-registered when first resolved
const calculator = await container.resolve("Calculator");
const greeter = await container.resolve("Greeter");
```

### 3. Complex Dependencies

```typescript
const dependencies: IDependency[] = [
  {
    key: "businessService",
    target: "BusinessService",
    type: "class",
    path: "../../components",
    lifetime: "transient",
    dependencies: [
      { target: "Calculator", type: "ref", key: "calculator" },
      { target: "Greeter", type: "ref", key: "greeter" },
      { target: "Logger", type: "ref", key: "logger" },
      { target: "IoC", type: "ref", key: "assistant" },
    ],
  },
];

await container.register(dependencies);
const businessService = await container.resolve("businessService");
```

### 4. Values and Functions

```typescript
const dependencies: IDependency[] = [
  // Static values
  { key: "appName", target: "My Application", type: "value" },
  { key: "version", target: "1.0.0", type: "value" },
  { key: "environment", target: "production", type: "value" },

  // Function stored as value
  {
    key: "timestampFunction",
    target: () => new Date().toISOString(),
    type: "function",
  },

  // Function executed as factory
  {
    key: "timestampAction",
    target: () => new Date().toISOString(),
    type: "action",
  },
];

await container.register(dependencies);

const appName = await container.resolve<string>("appName");
const timestampFn = await container.resolve<() => string>("timestampFunction");
const timestamp = await container.resolve<string>("timestampAction");
```

### 5. Aliases and References

```typescript
const dependencies: IDependency[] = [
  // Base service
  {
    target: Logger,
    type: "class",
    lifetime: "singleton",
  },

  // Create aliases
  { key: "mainLogger", target: "Logger", type: "alias" },
  { key: "log", target: "Logger", type: "alias" },

  // App with implicit dependency injection
  {
    key: "app",
    target: "App",
    type: "class",
    path: "../../components",
    lifetime: "singleton",
    // App constructor uses { greeter } destructuring pattern
  },
];

await container.register(dependencies);
const logger = await container.resolve("Logger");
const mainLogger = await container.resolve("mainLogger");
// logger === mainLogger (same instance)
```

## 🔄 Constructor Patterns

The IoC container supports a specific constructor pattern for dependency injection:

### Simple Dependencies (No Args)

```typescript
export class Greeter {
  private logger: Logger;

  constructor({ logger }: { logger: Logger }) {
    this.logger = logger;
  }
}
```

### With Args and Dependencies

```typescript
export class Calculator {
  private name?: string;
  private logger?: Logger;
  private assistant?: IIoC;
  private options?: { level: string; category: string };

  constructor(
    param1: { level: string; category: string },
    param2: string,
    param3: { logger: Logger; assistant: IIoC }
  ) {
    this.logger = param3.logger;
    this.assistant = param3.assistant;
    this.options = param1;
    this.name = param2;
  }
}
```

### Registration for Complex Constructor

```typescript
{
  target: Calculator,
  type: 'class',
  lifetime: 'singleton',
  args: [{ level: ILogLevel.DEBUG, category: 'MAIN' }, "demo"],
  dependencies: [
    { target: 'Logger', type: 'ref', key: 'logger' },
    { target: 'IoC', type: 'ref', key: 'assistant' }
  ]
}
```

## 🎯 Auto-Registration

Auto-registration automatically discovers and registers services using regex patterns:

```typescript
const dependencies: IDependency[] = [
  // Auto-register all services (default regex: .*)
  {
    type: "auto",
    path: "./services",
    lifetime: "singleton",
  },

  // Auto-register specific patterns
  {
    type: "auto",
    regex: ".*Controller\\.ts$",
    path: "./controllers",
    lifetime: "transient",
  },

  // Auto-register with dependencies
  {
    type: "auto",
    path: "./components",
    lifetime: "singleton",
    dependencies: [{ target: "Logger", type: "ref", key: "logger" }],
  },
];

await container.register(dependencies);

// Services auto-registered when first resolved
const userService = await container.resolve("UserService");
const userController = await container.resolve("UserController");
```

### How Auto-Registration Works

1. **Pattern Storage**: Auto-registration patterns stored in internal cache
2. **Lazy Loading**: Services loaded only when first requested
3. **Dynamic Import**: Uses ES6 dynamic imports for module loading
4. **Dependency Injection**: Auto-registered services get configured dependencies
5. **Caching**: Successfully registered services cached for performance

## 📦 Container Methods

### Core Methods

```typescript
// Register dependencies
await container.register(dependencies: IDependency[]): Promise<void>

// Resolve with auto-registration
const service = await container.resolve<T>(key: string): Promise<T>

// Resolve synchronously (no auto-registration)
const service = container.resolveSync<T>(key: string): T

// Unregister services
container.unregister(keys: string[]): void

// Get all registered dependencies
const allDeps = container.config: IDependency[]
```

### Example Usage

```typescript
const container = new IoC();

// Register services
await container.register([
  { target: Logger, type: "class", lifetime: "singleton" },
  { target: UserService, type: "class" },
]);

// Resolve services
const logger = await container.resolve<Logger>("Logger");
const userService = await container.resolve<UserService>("UserService");

// Container introspection
const registeredDeps = container.config;
console.log(`Total dependencies: ${registeredDeps.length}`);
registeredDeps.forEach((dep) => console.log(`- ${dep.key} (${dep.type})`));

// Cleanup
container.unregister(["Logger", "UserService"]);
```

## 🧪 Testing

### Mock Injection

```typescript
describe("UserService Tests", () => {
  let container: IoC;

  beforeEach(async () => {
    container = new IoC();

    // Mock logger
    const mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
    };

    const testDependencies: IDependency[] = [
      { key: "logger", target: mockLogger, type: "value" },
      {
        key: "userService",
        target: UserService,
        dependencies: [{ target: "logger", type: "ref", key: "logger" }],
      },
    ];

    await container.register(testDependencies);
  });

  test("should use mock logger", async () => {
    const userService = await container.resolve<UserService>("userService");
    userService.createUser({ name: "Test" });

    const mockLogger = await container.resolve("logger");
    expect(mockLogger.info).toHaveBeenCalled();
  });
});
```

### Container Isolation

```typescript
describe("Service Integration Tests", () => {
  test("should have isolated containers", async () => {
    const container1 = new IoC();
    const container2 = new IoC();

    await container1.register([
      { key: "value", target: "container1", type: "value" },
    ]);

    await container2.register([
      { key: "value", target: "container2", type: "value" },
    ]);

    const value1 = await container1.resolve<string>("value");
    const value2 = await container2.resolve<string>("value");

    expect(value1).toBe("container1");
    expect(value2).toBe("container2");
  });
});
```

## 🚀 Advanced Patterns

### Environment-Specific Configuration

```typescript
const getEnvironmentDependencies = (env: string): IDependency[] => [
  {
    key: "database",
    target: env === "production" ? PostgreSQLDatabase : SQLiteDatabase,
    type: "class",
    lifetime: "singleton",
    args: env === "production" ? [process.env.DATABASE_URL] : [":memory:"],
  },
];

const container = new IoC();
await container.register(getEnvironmentDependencies(process.env.NODE_ENV));
```

### Factory Pattern with Dependencies

```typescript
{
  key: 'complexService',
  target: (options: any, dependencies: { logger: Logger, database: Database }) => {
    const service = new ComplexService(options, dependencies.logger);
    service.setDatabase(dependencies.database);
    return service;
  },
  type: 'action',
  lifetime: 'singleton',
  args: [{ timeout: 30000 }],
  dependencies: [
    { target: 'Logger', type: 'ref', key: 'logger' },
    { target: 'Database', type: 'ref', key: 'database' }
  ]
}
```

### Conditional Dependencies

```typescript
const dependencies: IDependency[] = [
  // Base services
  { target: Logger, type: "class", lifetime: "singleton" },

  // Conditional cache
  ...(process.env.REDIS_URL
    ? [
        {
          key: "cache",
          target: RedisCache,
          type: "class",
          lifetime: "singleton",
          args: [process.env.REDIS_URL],
        },
      ]
    : [
        {
          key: "cache",
          target: MemoryCache,
          type: "class",
          lifetime: "singleton",
        },
      ]),
];
```

## 📊 Performance Features

### Built-in Optimizations

- **Lazy Loading**: Services loaded only when needed
- **Auto-Registration Cache**: Patterns cached to avoid repeated processing
- **Singleton Reuse**: Efficient instance management
- **Fast Resolution**: Direct container resolution for registered services

### Best Practices

1. **Use Singletons for Stateless Services**: Reduces memory and improves performance
2. **Minimize Transient Services**: Use only when isolation is required
3. **Specific Auto-Registration Patterns**: Use precise regex to avoid unnecessary scans
4. **Batch Registration**: Register multiple dependencies in single call

## 🔧 Self-Registration Feature

The IoC container automatically registers itself as 'IoC', enabling dependency injection of the container:

```typescript
export class SomeService {
  constructor({ logger, assistant }: { logger: Logger, assistant: IIoC }) {
    this.logger = logger;
    this.container = assistant; // Access to the IoC container
  }

  async loadDynamicService(serviceName: string) {
    return await this.container.resolve(serviceName);
  }
}

// Registration
{
  target: SomeService,
  dependencies: [
    { target: 'Logger', type: 'ref', key: 'logger' },
    { target: 'IoC', type: 'ref', key: 'assistant' }
  ]
}
```

## 💡 Real-World Example

Complete application setup with auto-registration:

```typescript
import { IoC, IDependency } from "./tools/ioc";
import { Logger, ILogLevel } from "./tools/log";

async function setupApplication() {
  const container = new IoC();

  const dependencies: IDependency[] = [
    // Core infrastructure
    {
      target: Logger,
      type: "class",
      lifetime: "singleton",
      args: [{ level: ILogLevel.INFO, category: "APP" }],
    },

    // Auto-register all services
    {
      type: "auto",
      path: "./services",
      lifetime: "singleton",
      dependencies: [
        { target: "Logger", type: "ref", key: "logger" },
        { target: "IoC", type: "ref", key: "assistant" },
      ],
    },

    // Auto-register controllers as transient
    {
      type: "auto",
      regex: ".*Controller\\.ts$",
      path: "./controllers",
      lifetime: "transient",
      dependencies: [{ target: "Logger", type: "ref", key: "logger" }],
    },

    // Configuration values
    { key: "appName", target: "My Application", type: "value" },
    { key: "version", target: "2.0.0", type: "value" },
    {
      key: "environment",
      target: process.env.NODE_ENV || "development",
      type: "value",
    },
  ];

  await container.register(dependencies);

  // Application ready
  const logger = await container.resolve<Logger>("Logger");
  const appName = await container.resolve<string>("appName");
  logger.info(`${appName} initialized successfully`);

  return container;
}

// Usage
const container = await setupApplication();
const userController = await container.resolve("UserController");
```

## 🤝 Integration with Other Libraries

### Express.js Integration

```typescript
import express from "express";

const app = express();
const container = await setupApplication();

// Middleware for dependency injection
app.use(async (req, res, next) => {
  req.container = container;
  req.logger = await container.resolve<Logger>("Logger");
  next();
});

// Route handlers can access dependencies
app.get("/users", async (req, res) => {
  const userService = await req.container.resolve("UserService");
  const users = await userService.getAllUsers();
  res.json(users);
});
```

### NestJS-like Decorators (Manual Implementation)

```typescript
// Custom decorator for dependency injection
function Inject(token: string) {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    // Store metadata for dependency injection
    Reflect.defineMetadata("inject:tokens", token, target, parameterIndex);
  };
}

// Usage
export class UserService {
  constructor(
    @Inject("Logger") private logger: Logger,
    @Inject("Database") private database: Database
  ) {}
}
```

## 📄 Type Definitions

```typescript
// Available exports
export {
  IoC, // Main container class
  IDependency, // Dependency configuration interface
  IIoC, // Container interface
  IClassConstructor, // Class constructor type
  IFunction, // Function type
  IJSON, // JSON-serializable values
  IDependencyMap, // Dependency map type
  IDependencyList, // Dependency list type
  IDependencyType, // Registration types
  IDependencyLifetime, // Lifetime types
} from "./tools/ioc";
```

## 🔗 Comparison with Other IoC Containers

| Feature                 | This IoC           | Awilix        | InversifyJS                  | TSyringe                     |
| ----------------------- | ------------------ | ------------- | ---------------------------- | ---------------------------- |
| **Auto-Registration**   | ✅ Regex patterns  | ❌ Manual     | ❌ Manual                    | ❌ Manual                    |
| **Async Resolution**    | ✅ Default         | ✅ Available  | ❌ Sync only                 | ❌ Sync only                 |
| **Zero Dependencies**   | ❌ Requires Awilix | ✅ Standalone | ❌ Requires reflect-metadata | ❌ Requires reflect-metadata |
| **TypeScript First**    | ✅ Native          | ✅ Native     | ✅ Native                    | ✅ Native                    |
| **Configuration Style** | JSON-like objects  | Code-based    | Decorator-based              | Decorator-based              |
| **Dynamic Imports**     | ✅ Built-in        | ❌ Manual     | ❌ Manual                    | ❌ Manual                    |

## 📄 License

This project is licensed under the MIT License.

---

**Ready to revolutionize your dependency injection? Start with the basic examples and explore the power of auto-registration! 🚀**
