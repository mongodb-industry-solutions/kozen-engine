# Enhanced IoC (Inversion of Control) Library

A powerful, simplified, and feature-rich dependency injection system built on top of Awilix. This library provides significant improvements for class instantiation, nested dependencies, unified configuration, auto-registration, and performance optimizations.

## 🚀 Key Features

- **✨ Unified Configuration** - Single `ServiceConfig` interface for all scenarios
- **🔄 Auto-Registration** - Automatic service discovery using regex patterns
- **🏭 Async-First Design** - Async `resolve()` with auto-registration support
- **📦 JSON-Serializable** - Store and load configurations from files or databases
- **🔗 Nested Dependencies** - Complex dependency trees made easy
- **🚀 Performance Optimized** - Fast path for common scenarios, intelligent caching
- **⚡ Lifecycle Management** - Singleton, transient, and scoped instances
- **📁 Dynamic Imports** - Load modules on demand
- **🧪 Testing-Friendly** - Easy mock injection for unit tests

## 📋 Quick Start

### Installation

```bash
npm install awilix
# IoC library is included in this project
```

### Basic Usage

```typescript
import { IoC, ServiceConfig } from './tools/ioc';
import { Logger, LogLevel } from './tools/log';

// Create container
const container = new IoC();

// Configure dependencies with unified ServiceConfig
const configs: ServiceConfig[] = [
  {
    key: 'logger',
    target: Logger,
    type: 'class',
    lifetime: 'singleton',
    args: [{ level: LogLevel.INFO, category: 'APP' }]
  }
];

// Register and resolve (async by default with auto-registration)
await container.register(configs);
const logger = await container.resolve<Logger>('logger');
logger.info('IoC container is ready!');
```

## 🔧 ServiceConfig Interface

The `ServiceConfig` interface is a unified configuration type that serves all registration scenarios:

```typescript
export type ServiceConfig = {
  key?: string;                              // Registration key
  target?: any;                              // Class, function, value, or string
  regex?: string;                            // Auto-registration pattern
  type?: 'class' | 'value' | 'function' | 'alias' | 'ref' | 'auto';
  lifetime?: 'singleton' | 'transient' | 'scoped';
  path?: string;                             // Dynamic import path
  file?: string;                             // Direct file path
  args?: JsonValue[];                        // Constructor arguments
  dependencies?: ServiceConfig[] | { [key: string]: ServiceConfig };
};
```

### 🔑 Key Properties Explained

#### **`key?: string`**
The registration key for the service. If not provided, it will be inferred from the class name or target.

```typescript
{ key: 'userService', target: UserService }
{ key: 'logger', target: Logger }
// Auto-inferred: { target: UserService } → key: 'UserService'
```

#### **`target?: any`**
The service target - can be a class constructor, function, value, or string reference.

```typescript
{ target: UserService }              // Class constructor
{ target: () => new Date() }         // Function
{ target: 'Hello World' }            // Value
{ target: 'userService' }            // String reference
```

#### **`regex?: string`**
Regular expression pattern for auto-registration. Used with `type: 'auto'`.

```typescript
{ type: 'auto', regex: '.*Service\\.ts$' }    // Match *Service.ts files
{ type: 'auto', regex: '.*Controller\\.ts$' } // Match *Controller.ts files
{ type: 'auto', regex: '.*Repository\\.ts$' } // Match *Repository.ts files
{ type: 'auto' }                              // Default: '.*' (all files)
```

#### **`type?: 'class' | 'value' | 'function' | 'alias' | 'ref' | 'auto'`**
Defines how the service should be registered:

- **`'class'`** (default): Registers a class constructor
- **`'value'`**: Registers a static value or primitive
- **`'function'`**: Registers a function that returns a value
- **`'alias'`**: Creates an alias to an existing service
- **`'ref'`**: References another registered service
- **`'auto'`**: Enables auto-registration using regex patterns

```typescript
{ type: 'class', target: UserService }
{ type: 'value', target: 'production' }
{ type: 'function', target: () => new Date() }
{ type: 'alias', target: 'userService' }
{ type: 'auto', regex: '.*Service\\.ts$' }
```

#### **`lifetime?: 'singleton' | 'transient' | 'scoped'`**
Controls instance lifecycle and caching behavior:

##### **`'singleton'` - Single Instance Pattern**
- **Behavior**: One instance for the entire application lifetime
- **Memory**: Low footprint, instance cached and reused
- **Performance**: Fastest resolution after initial creation
- **Thread Safety**: Same instance shared across all consumers

**Best for:**
- Stateless services (no mutable state)
- Configuration objects and settings
- Loggers and monitoring services
- Database connection pools
- Utility services and API clients

**Example:**
```typescript
{ key: 'logger', target: Logger, lifetime: 'singleton' }
{ key: 'config', target: AppConfig, lifetime: 'singleton' }
{ key: 'dbPool', target: DatabasePool, lifetime: 'singleton' }
```

##### **`'transient'` - New Instance Pattern (Default)**
- **Behavior**: New instance created on every resolve() call
- **Memory**: Higher usage, no caching
- **Performance**: Slower due to repeated instantiation
- **Isolation**: Complete isolation between consumers

**Best for:**
- Services with mutable state
- Request handlers and controllers
- Temporary objects and processors
- Services needing isolation
- Command objects and event handlers

**Example:**
```typescript
{ key: 'requestHandler', target: RequestHandler, lifetime: 'transient' }
{ key: 'validator', target: DataValidator, lifetime: 'transient' }
{ key: 'processor', target: DataProcessor, lifetime: 'transient' }
```

##### **`'scoped'` - Per-Scope Instance Pattern**
- **Behavior**: One instance per scope (request/transaction)
- **Memory**: Moderate usage, cached within scope
- **Performance**: Good balance between singleton and transient
- **Isolation**: Shared within scope, isolated between scopes

**Best for:**
- Request-specific services
- Database transaction contexts
- User authentication services
- Request-scoped caches
- Services needing request-level state

**Example:**
```typescript
{ key: 'userContext', target: UserContext, lifetime: 'scoped' }
{ key: 'requestCache', target: RequestCache, lifetime: 'scoped' }
{ key: 'authService', target: AuthService, lifetime: 'scoped' }
```

#### **`path?: string`**
Path for dynamic imports when target is a string reference.

```typescript
{ key: 'userService', target: 'UserService', path: './services' }
```

#### **`file?: string`**
Direct file path for module imports. Takes precedence over path/target combination.

```typescript
{ key: 'config', file: './config/database.ts' }
```

#### **`args?: JsonValue[]`**
Static arguments passed to class constructors. Passed before any injected dependencies.

```typescript
{ 
  key: 'database', 
  target: Database, 
  args: ['localhost', 5432, 'mydb'] 
}
```

#### **`dependencies?: ServiceConfig[] | { [key: string]: ServiceConfig }`**
Nested dependencies configuration. Supports both array and object formats.

```typescript
// Array format
{
  key: 'userService',
  target: UserService,
  dependencies: [
    { key: 'logger', target: Logger },
    { key: 'database', target: Database }
  ]
}

// Object format
{
  key: 'userService',
  target: UserService,
  dependencies: {
    logger: { target: Logger },
    database: { target: Database }
  }
}
```

## 📖 Registration Examples

### 1. Class Registration with Arguments

```typescript
{
  key: 'logger',
  target: Logger,
  type: 'class',
  lifetime: 'singleton',
  args: [{ level: LogLevel.INFO, category: 'MAIN' }]
}
```

### 2. Multiple Constructor Arguments

```typescript
{
  key: 'dbService',
  target: DatabaseService,
  type: 'class',
  lifetime: 'singleton',
  args: ['postgresql://localhost:5432/mydb', 25, { ssl: true }]
}
```

### 3. Factory Functions for Complex Dependencies

```typescript
{
  key: 'emailService',
  target: (cradle: any) => new EmailService(
    'smtp.gmail.com', 
    587, 
    cradle.logger
  ),
  type: 'function',
  lifetime: 'singleton'
}
```

### 4. Value Registration

```typescript
{
  key: 'config',
  target: {
    apiUrl: 'https://api.example.com',
    timeout: 30000,
    retries: 3
  },
  type: 'value'
}
```

### 5. Alias Registration

```typescript
{
  key: 'mainLogger',
  target: 'logger',
  type: 'alias'
}
```

### 6. Auto-Registration (New Feature)

```typescript
{
  type: 'auto',
  regex: '.*Service\\.ts$',
  lifetime: 'singleton'
}
```

## 🔄 Auto-Registration

Auto-registration automatically discovers and registers services based on regex patterns:

```typescript
const configs: ServiceConfig[] = [
  // Auto-register all services
  { type: 'auto', regex: '.*Service\\.ts$' },
  
  // Auto-register controllers
  { type: 'auto', regex: '.*Controller\\.ts$', lifetime: 'transient' },
  
  // Auto-register repositories as singletons
  { type: 'auto', regex: '.*Repository\\.ts$', lifetime: 'singleton' }
];

await container.register(configs);

// Services are automatically registered when first resolved
const userService = await container.resolve<UserService>('UserService');
```

## 🔗 Nested Dependencies

The IoC container supports complex nested dependency configurations in multiple formats, allowing for flexible and maintainable dependency trees.

### Array Format (Recommended)

The array format is the most straightforward and provides clear dependency ordering:

```typescript
{
  key: 'userService',
  target: UserService,
  dependencies: [
    { key: 'logger', target: Logger, lifetime: 'singleton' },
    { key: 'database', target: Database, lifetime: 'singleton' },
    { key: 'validator', target: UserValidator, lifetime: 'transient' }
  ]
}
```

### Object Format

The object format allows for named dependencies and is useful for complex scenarios:

```typescript
{
  key: 'orderService',
  target: OrderService,
  dependencies: {
    logger: { target: Logger, lifetime: 'singleton' },
    database: { target: Database, lifetime: 'singleton' },
    paymentGateway: { 
      target: PaymentGateway, 
      lifetime: 'singleton',
      args: ['stripe', 'sk_test_123'] 
    },
    emailService: { 
      target: EmailService, 
      lifetime: 'singleton',
      dependencies: [
        { key: 'logger', target: Logger, lifetime: 'singleton' }
      ]
    }
  }
}
```

### Multi-Level Nesting

Complex applications often require deep dependency hierarchies:

```typescript
{
  key: 'applicationService',
  target: ApplicationService,
  dependencies: [
    {
      key: 'userModule',
      target: UserModule,
      dependencies: [
        { key: 'userRepository', target: UserRepository, lifetime: 'singleton' },
        { key: 'userValidator', target: UserValidator, lifetime: 'transient' },
        {
          key: 'authService',
          target: AuthService,
          dependencies: [
            { key: 'jwtService', target: JWTService, lifetime: 'singleton' },
            { key: 'passwordService', target: PasswordService, lifetime: 'singleton' }
          ]
        }
      ]
    },
    {
      key: 'orderModule',
      target: OrderModule,
      dependencies: [
        { key: 'orderRepository', target: OrderRepository, lifetime: 'singleton' },
        { key: 'inventoryService', target: InventoryService, lifetime: 'singleton' },
        { key: 'paymentProcessor', target: PaymentProcessor, lifetime: 'transient' }
      ]
    }
  ]
}
```

### Conditional Dependencies

Dependencies can be conditionally registered based on environment or configuration:

```typescript
const getDatabaseConfig = (env: string): ServiceConfig => {
  if (env === 'production') {
    return {
      key: 'database',
      target: PostgreSQLDatabase,
      lifetime: 'singleton',
      args: [process.env.DATABASE_URL]
    };
  }
  return {
    key: 'database',
    target: SQLiteDatabase,
    lifetime: 'singleton',
    args: [':memory:']
  };
};

const configs: ServiceConfig[] = [
  {
    key: 'userService',
    target: UserService,
    dependencies: [
      getDatabaseConfig(process.env.NODE_ENV || 'development'),
      { key: 'logger', target: Logger, lifetime: 'singleton' }
    ]
  }
];
```

### Factory Function Dependencies

For complex initialization logic, use factory functions with dependencies:

```typescript
{
  key: 'complexService',
  target: (cradle: any) => {
    const config = cradle.config;
    const logger = cradle.logger;
    const database = cradle.database;
    
    // Complex initialization logic
    const service = new ComplexService(config, logger);
    service.setDatabase(database);
    service.initialize();
    
    return service;
  },
  type: 'function',
  lifetime: 'singleton',
  dependencies: [
    { key: 'config', target: AppConfig, lifetime: 'singleton' },
    { key: 'logger', target: Logger, lifetime: 'singleton' },
    { key: 'database', target: Database, lifetime: 'singleton' }
  ]
}
```

## 🧪 Integration Testing

The IoC container is designed to be testing-friendly, supporting easy mock injection and test isolation.

### Basic Test Setup

```typescript
describe('UserService Integration Tests', () => {
  let container: IoC;
  let userService: UserService;
  
  beforeEach(async () => {
    container = new IoC();
    
    // Register test configuration
    const testConfigs: ServiceConfig[] = [
      {
        key: 'database',
        target: InMemoryDatabase,
        lifetime: 'singleton'
      },
      {
        key: 'logger',
        target: TestLogger,
        lifetime: 'singleton'
      },
      {
        key: 'userService',
        target: UserService,
        dependencies: [
          { key: 'database', target: InMemoryDatabase },
          { key: 'logger', target: TestLogger }
        ]
      }
    ];
    
    await container.register(testConfigs);
    userService = await container.resolve<UserService>('userService');
  });
  
  afterEach(() => {
    container.unregister(['userService', 'database', 'logger']);
  });
  
  test('should create user successfully', async () => {
    const userData = { name: 'John Doe', email: 'john@example.com' };
    const user = await userService.createUser(userData);
    
    expect(user.id).toBeDefined();
    expect(user.name).toBe('John Doe');
  });
});
```

### Mock Injection

Replace real services with mocks for isolated testing:

```typescript
describe('OrderService with Mocks', () => {
  let container: IoC;
  let orderService: OrderService;
  let mockPaymentGateway: jest.Mocked<PaymentGateway>;
  let mockEmailService: jest.Mocked<EmailService>;
  
  beforeEach(async () => {
    container = new IoC();
    
    // Create mocks
    mockPaymentGateway = {
      processPayment: jest.fn().mockResolvedValue({ success: true, transactionId: '123' }),
      refundPayment: jest.fn().mockResolvedValue({ success: true })
    };
    
    mockEmailService = {
      sendEmail: jest.fn().mockResolvedValue(true),
      sendOrderConfirmation: jest.fn().mockResolvedValue(true)
    };
    
    const testConfigs: ServiceConfig[] = [
      {
        key: 'paymentGateway',
        target: mockPaymentGateway,
        type: 'value'
      },
      {
        key: 'emailService',
        target: mockEmailService,
        type: 'value'
      },
      {
        key: 'orderService',
        target: OrderService,
        dependencies: [
          { key: 'paymentGateway', target: mockPaymentGateway, type: 'value' },
          { key: 'emailService', target: mockEmailService, type: 'value' }
        ]
      }
    ];
    
    await container.register(testConfigs);
    orderService = await container.resolve<OrderService>('orderService');
  });
  
  test('should process order and send confirmation', async () => {
    const order = { id: '1', total: 100, items: [] };
    
    await orderService.processOrder(order);
    
    expect(mockPaymentGateway.processPayment).toHaveBeenCalledWith(order);
    expect(mockEmailService.sendOrderConfirmation).toHaveBeenCalledWith(order);
  });
});
```

### Environment-Specific Testing

Test different configurations for various environments:

```typescript
describe('Environment-Specific Tests', () => {
  const testEnvironments = ['development', 'staging', 'production'];
  
  testEnvironments.forEach(env => {
    describe(`${env} environment`, () => {
      let container: IoC;
      
      beforeEach(async () => {
        container = new IoC();
        
        const configs = getEnvironmentConfig(env);
        await container.register(configs);
      });
      
      test('should have correct database configuration', async () => {
        const database = await container.resolve<Database>('database');
        
        if (env === 'production') {
          expect(database.constructor.name).toBe('PostgreSQLDatabase');
        } else {
          expect(database.constructor.name).toBe('SQLiteDatabase');
        }
      });
    });
  });
});
```

### Integration with Testing Frameworks

#### Jest Integration

```typescript
// jest.setup.ts
import { IoC } from './src/tools/ioc';

declare global {
  var testContainer: IoC;
}

beforeEach(() => {
  global.testContainer = new IoC();
});

afterEach(() => {
  if (global.testContainer) {
    global.testContainer.unregister(global.testContainer.getRegisteredKeys());
  }
});

// test helper
export const createTestContainer = async (configs: ServiceConfig[]): Promise<IoC> => {
  const container = new IoC();
  await container.register(configs);
  return container;
};
```

#### Mocha Integration

```typescript
// test-helpers.ts
import { IoC, ServiceConfig } from './src/tools/ioc';

export class TestContainerManager {
  private containers: IoC[] = [];
  
  async createContainer(configs: ServiceConfig[]): Promise<IoC> {
    const container = new IoC();
    await container.register(configs);
    this.containers.push(container);
    return container;
  }
  
  cleanup(): void {
    this.containers.forEach(container => {
      container.unregister(container.getRegisteredKeys());
    });
    this.containers = [];
  }
}

// In your test files
describe('Service Tests', () => {
  const testManager = new TestContainerManager();
  
  afterEach(() => {
    testManager.cleanup();
  });
  
  it('should work with test container', async () => {
    const container = await testManager.createContainer([
      { key: 'service', target: MyService }
    ]);
    
    const service = await container.resolve<MyService>('service');
    expect(service).toBeDefined();
  });
});
```

## 🌍 Real-World Examples

### E-commerce Application

A complete e-commerce system with multiple modules and complex dependencies:

```typescript
// E-commerce IoC Configuration
const ecommerceConfigs: ServiceConfig[] = [
  // Core Infrastructure
  {
    key: 'database',
    target: PostgreSQLDatabase,
    lifetime: 'singleton',
    args: [process.env.DATABASE_URL]
  },
  {
    key: 'cache',
    target: RedisCache,
    lifetime: 'singleton',
    args: [process.env.REDIS_URL]
  },
  {
    key: 'logger',
    target: WinstonLogger,
    lifetime: 'singleton',
    args: [{ level: 'info', service: 'ecommerce' }]
  },
  
  // User Management Module
  {
    key: 'userRepository',
    target: UserRepository,
    lifetime: 'singleton',
    dependencies: [
      { key: 'database', target: PostgreSQLDatabase },
      { key: 'logger', target: WinstonLogger }
    ]
  },
  {
    key: 'authService',
    target: AuthService,
    lifetime: 'singleton',
    dependencies: [
      { key: 'userRepository', target: UserRepository },
      { key: 'jwtService', target: JWTService, lifetime: 'singleton' },
      { key: 'passwordService', target: PasswordService, lifetime: 'singleton' }
    ]
  },
  
  // Product Management Module
  {
    key: 'productRepository',
    target: ProductRepository,
    lifetime: 'singleton',
    dependencies: [
      { key: 'database', target: PostgreSQLDatabase },
      { key: 'cache', target: RedisCache }
    ]
  },
  {
    key: 'inventoryService',
    target: InventoryService,
    lifetime: 'singleton',
    dependencies: [
      { key: 'productRepository', target: ProductRepository },
      { key: 'logger', target: WinstonLogger }
    ]
  },
  
  // Order Processing Module
  {
    key: 'orderRepository',
    target: OrderRepository,
    lifetime: 'singleton',
    dependencies: [
      { key: 'database', target: PostgreSQLDatabase }
    ]
  },
  {
    key: 'paymentGateway',
    target: StripePaymentGateway,
    lifetime: 'singleton',
    args: [process.env.STRIPE_SECRET_KEY]
  },
  {
    key: 'orderService',
    target: OrderService,
    lifetime: 'transient',
    dependencies: [
      { key: 'orderRepository', target: OrderRepository },
      { key: 'inventoryService', target: InventoryService },
      { key: 'paymentGateway', target: StripePaymentGateway },
      { key: 'emailService', target: EmailService },
      { key: 'logger', target: WinstonLogger }
    ]
  },
  
  // Notification Services
  {
    key: 'emailService',
    target: SendGridEmailService,
    lifetime: 'singleton',
    args: [process.env.SENDGRID_API_KEY],
    dependencies: [
      { key: 'logger', target: WinstonLogger }
    ]
  },
  {
    key: 'smsService',
    target: TwilioSMSService,
    lifetime: 'singleton',
    args: [process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN]
  },
  
  // Auto-register controllers
  { type: 'auto', regex: '.*Controller\\.ts$', lifetime: 'transient' },
  
  // Auto-register middleware
  { type: 'auto', regex: '.*Middleware\\.ts$', lifetime: 'singleton' }
];

// Initialize the container
const container = new IoC();
await container.register(ecommerceConfigs);

// Use in Express.js application
app.use(async (req, res, next) => {
  req.container = container.createScope();
  next();
});
```

### Microservices Architecture

Configuration for a microservice with external dependencies:

```typescript
// User Service Microservice
const userServiceConfigs: ServiceConfig[] = [
  // Database
  {
    key: 'userDatabase',
    target: MongoDB,
    lifetime: 'singleton',
    args: [process.env.MONGODB_URI]
  },
  
  // External Services
  {
    key: 'authServiceClient',
    target: AuthServiceClient,
    lifetime: 'singleton',
    args: [process.env.AUTH_SERVICE_URL],
    dependencies: [
      { key: 'httpClient', target: AxiosHttpClient, lifetime: 'singleton' }
    ]
  },
  {
    key: 'notificationServiceClient',
    target: NotificationServiceClient,
    lifetime: 'singleton',
    args: [process.env.NOTIFICATION_SERVICE_URL]
  },
  
  // Message Queue
  {
    key: 'messageQueue',
    target: RabbitMQClient,
    lifetime: 'singleton',
    args: [process.env.RABBITMQ_URL]
  },
  
  // Business Logic
  {
    key: 'userService',
    target: UserService,
    lifetime: 'transient',
    dependencies: [
      { key: 'userDatabase', target: MongoDB },
      { key: 'authServiceClient', target: AuthServiceClient },
      { key: 'messageQueue', target: RabbitMQClient },
      { key: 'logger', target: Logger, lifetime: 'singleton' }
    ]
  },
  
  // Event Handlers
  {
    key: 'userEventHandler',
    target: UserEventHandler,
    lifetime: 'singleton',
    dependencies: [
      { key: 'userService', target: UserService },
      { key: 'messageQueue', target: RabbitMQClient }
    ]
  }
];
```

### GraphQL API Server

IoC configuration for a GraphQL API with complex resolvers:

```typescript
// GraphQL Server Configuration
const graphQLConfigs: ServiceConfig[] = [
  // Data Layer
  {
    key: 'prisma',
    target: PrismaClient,
    lifetime: 'singleton'
  },
  {
    key: 'redis',
    target: RedisClient,
    lifetime: 'singleton',
    args: [process.env.REDIS_URL]
  },
  
  // Repositories
  {
    key: 'userRepository',
    target: UserRepository,
    lifetime: 'singleton',
    dependencies: [
      { key: 'prisma', target: PrismaClient }
    ]
  },
  {
    key: 'postRepository',
    target: PostRepository,
    lifetime: 'singleton',
    dependencies: [
      { key: 'prisma', target: PrismaClient }
    ]
  },
  
  // Services
  {
    key: 'userService',
    target: UserService,
    lifetime: 'singleton',
    dependencies: [
      { key: 'userRepository', target: UserRepository },
      { key: 'redis', target: RedisClient }
    ]
  },
  {
    key: 'postService',
    target: PostService,
    lifetime: 'singleton',
    dependencies: [
      { key: 'postRepository', target: PostRepository },
      { key: 'userService', target: UserService }
    ]
  },
  
  // GraphQL Resolvers
  {
    key: 'userResolver',
    target: UserResolver,
    lifetime: 'singleton',
    dependencies: [
      { key: 'userService', target: UserService }
    ]
  },
  {
    key: 'postResolver',
    target: PostResolver,
    lifetime: 'singleton',
    dependencies: [
      { key: 'postService', target: PostService }
    ]
  },
  
  // Context Factory
  {
    key: 'contextFactory',
    target: (cradle: any) => ({
      user: cradle.userService,
      post: cradle.postService,
      db: cradle.prisma
    }),
    type: 'function',
    lifetime: 'singleton'
  }
];

// GraphQL Server Setup
const container = new IoC();
await container.register(graphQLConfigs);

const server = new ApolloServer({
  typeDefs,
  resolvers: {
    Query: {
      users: await container.resolve('userResolver'),
      posts: await container.resolve('postResolver')
    }
  },
  context: async () => {
    const contextFactory = await container.resolve('contextFactory');
    return contextFactory();
  }
});
```

### Multi-Tenant SaaS Application

Configuration for a multi-tenant application with tenant-specific services:

```typescript
// Multi-Tenant Configuration Factory
const createTenantContainer = async (tenantId: string): Promise<IoC> => {
  const container = new IoC();
  
  const tenantConfigs: ServiceConfig[] = [
    // Tenant-specific database
    {
      key: 'tenantDatabase',
      target: TenantDatabase,
      lifetime: 'singleton',
      args: [tenantId, process.env.DATABASE_URL]
    },
    
    // Tenant-specific cache
    {
      key: 'tenantCache',
      target: TenantCache,
      lifetime: 'singleton',
      args: [tenantId, process.env.REDIS_URL]
    },
    
    // Tenant-specific services
    {
      key: 'tenantService',
      target: TenantService,
      lifetime: 'singleton',
      dependencies: [
        { key: 'tenantDatabase', target: TenantDatabase },
        { key: 'tenantCache', target: TenantCache }
      ]
    },
    
    // Shared services
    {
      key: 'auditService',
      target: AuditService,
      lifetime: 'singleton',
      dependencies: [
        { key: 'auditDatabase', target: AuditDatabase, lifetime: 'singleton' }
      ]
    },
    
    // Auto-register tenant-specific modules
    { type: 'auto', regex: `.*${tenantId}.*Service\\.ts$`, lifetime: 'singleton' }
  ];
  
  await container.register(tenantConfigs);
  return container;
};

// Usage in middleware
app.use(async (req, res, next) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  req.tenantContainer = await createTenantContainer(tenantId);
  next();
});
```

## 🚀 Container Methods

### Core Methods

#### **`register(configs: ServiceConfig[]): Promise<void>`**
Registers multiple services using ServiceConfig objects.

```typescript
const configs: ServiceConfig[] = [
  { key: 'logger', target: Logger, lifetime: 'singleton' },
  { key: 'userService', target: UserService }
];

await container.register(configs);
```

#### **`resolve<T>(key: string): Promise<T>`**
Resolves a service asynchronously with auto-registration support.

```typescript
const logger = await container.resolve<Logger>('logger');
const userService = await container.resolve<UserService>('UserService'); // Auto-registered
```

#### **`resolveSync<T>(key: string): T`**
Resolves a service synchronously without auto-registration.

```typescript
const logger = container.resolveSync<Logger>('logger');
```

#### **`registerFromJson(configs: ServiceConfig[], classRegistry?: ClassRegistry): Promise<void>`**
Registers services from JSON configuration with optional class registry.

```typescript
const jsonConfigs: ServiceConfig[] = [
  { key: 'logger', target: 'Logger', type: 'class' }
];

const classRegistry = {
  Logger: Logger,
  UserService: UserService
};

await container.registerFromJson(jsonConfigs, classRegistry);
```

#### **`unregister(keys: string[]): void`**
Unregisters services from the container.

```typescript
container.unregister(['logger', 'userService']);
```

#### **`exportToJson(): ServiceConfig[]`**
Exports current container configuration.

```typescript
const config = container.exportToJson();
console.log('Container configuration:', config);
```

### Utility Methods

#### **`getRegisteredKeys(): string[]`**
Returns all registered service keys.

```typescript
const keys = container.getRegisteredKeys();
console.log('Registered services:', keys);
```

#### **`isRegistered(key: string): boolean`**
Checks if a service is registered.

```typescript
if (container.isRegistered('logger')) {
  console.log('Logger is registered');
}
```

#### **`createScope(): AwilixContainer`**
Creates a new scope for scoped dependencies.

```typescript
const scope = container.createScope();
```

## 💾 JSON Configuration

### Loading from File

```typescript
// config.json
[
  {
    "key": "logger",
    "target": "Logger",
    "type": "class",
    "lifetime": "singleton",
    "args": [{ "level": "INFO", "category": "APP" }]
  }
]

// TypeScript
const classRegistry = { Logger, UserService };
await container.loadFromJsonFile('./config.json', classRegistry);
```

### Saving to File

```typescript
await container.saveToJsonFile('./output-config.json');
```

## 🧪 Testing

### Mock Injection

```typescript
// Test setup
const mockLogger = {
  info: jest.fn(),
  error: jest.fn()
};

const testConfigs: ServiceConfig[] = [
  { key: 'logger', target: mockLogger, type: 'value' }
];

await container.register(testConfigs);

// Test
const service = await container.resolve<UserService>('userService');
service.doSomething();
expect(mockLogger.info).toHaveBeenCalled();
```

## 🔧 Advanced Patterns

### Conditional Registration

```typescript
const configs: ServiceConfig[] = [
  {
    key: 'logger',
    target: process.env.NODE_ENV === 'production' ? ProductionLogger : DevLogger,
    type: 'class',
    lifetime: 'singleton'
  }
];
```

### Environment-Specific Configuration

```typescript
const getServiceConfig = (environment: string): ServiceConfig[] => {
  const baseConfigs: ServiceConfig[] = [
    { key: 'logger', target: Logger, lifetime: 'singleton' }
  ];

  if (environment === 'production') {
    return [
      ...baseConfigs,
      { key: 'cache', target: RedisCache, lifetime: 'singleton' }
    ];
  }

  return [
    ...baseConfigs,
    { key: 'cache', target: MemoryCache, lifetime: 'singleton' }
  ];
};
```

### Factory Pattern with Dependencies

```typescript
{
  key: 'complexService',
  target: (cradle: any) => new ComplexService(
    cradle.logger,
    cradle.database,
    cradle.cache
  ),
  type: 'function',
  lifetime: 'singleton'
}
```

## 📈 Performance Optimizations

### Built-in Optimizations

- **Fast Path**: `registerFromJson` uses fast path when no string targets need conversion
- **Intelligent Caching**: Auto-registration cache prevents repeated file system operations
- **Efficient Lookups**: Map-based storage for O(1) service resolution
- **Minimal Object Creation**: Reduced memory allocations in hot paths

### Best Practices

1. **Use Singleton for Stateless Services**: Reduces memory and improves performance
2. **Minimize Transient Services**: Use only when isolation is required
3. **Batch Register**: Register multiple services in single `register()` call
4. **Auto-Registration**: Use specific regex patterns to avoid unnecessary scans

## 📊 Comparison with Previous Versions

| Feature | Previous | Current |
|---------|----------|---------|
| Configuration Types | `RegistrationConfig` + `JsonRegistrationConfig` | Unified `ServiceConfig` |
| Primary Resolution | `resolveAsync()` | `resolve()` (with auto-registration) |
| Auto-Registration | Manual | Built-in with regex patterns |
| JSON Support | Separate interface | Unified interface |
| Performance | Good | Optimized with fast paths |
| Type Safety | Good | Enhanced with unified types |

## 🚀 Migration Guide

### From Previous Versions

```typescript
// Before
import { RegistrationConfig } from './tools/ioc';
const config: RegistrationConfig = { ... };
await container.resolveAsync('service');

// After
import { ServiceConfig } from './tools/ioc';
const config: ServiceConfig = { ... };
await container.resolve('service');
```

## 🌟 Alternative: KsDp Library

If you're looking for a comprehensive design patterns library that includes IoC/DI as part of a larger ecosystem, consider **KsDp** - a complete Design Patterns Library that offers much more than just dependency injection.

### What is KsDp?

**KsDp (Ksike Design Patterns)** is a comprehensive library containing reusable Object-Oriented Design and functional programming elements. It's an ambitious attempt to combine implementations of:

- **GoF (Gang of Four)** patterns
- **GRASP** patterns  
- **IoC (Inversion of Control)**
- **DI (Dependency Injection)**
- **SOLID** principles
- **DRY, KISS, SoC** and other fundamental principles

### KsDp vs This IoC Library

| Feature | This IoC Library | KsDp Library |
|---------|------------------|--------------|
| **Focus** | Specialized IoC/DI container | Complete design patterns ecosystem |
| **Scope** | Dependency injection only | 20+ design patterns + principles |
| **Size** | Lightweight, focused | Comprehensive, full-featured |
| **Learning Curve** | Simple, easy to adopt | Requires broader design patterns knowledge |
| **Use Case** | Pure IoC/DI needs | Full application architecture with multiple patterns |

### Pattern Categories in KsDp

#### **Integration Patterns:**
- **IoC** - Inversion of Control
- **DI** - Dependency Injection  
- **LS** - Service Locator pattern
- **Hook** - Event-driven programming

#### **Creational Patterns:**
- Abstract Factory, Builder, Factory Method, Prototype, Singleton

#### **Structural Patterns:**
- Adapter, Bridge, Composite, Decorator, Facade, Flyweight, Proxy

#### **Behavioral Patterns:**
- Chain of Responsibility, Command, Interpreter, Iterator, Mediator, Memento, Observer, State, Strategy, Template Method, Visitor

### When to Choose KsDp

Choose **KsDp** when you:

- Need multiple design patterns in your application
- Want a proven, comprehensive patterns library
- Are building complex applications requiring various architectural patterns
- Prefer an all-in-one solution from a mature ecosystem
- Want to learn and implement industry-standard design patterns

Choose **this IoC library** when you:

- Only need dependency injection functionality
- Want a lightweight, focused solution
- Prefer modern TypeScript-first design
- Need async-first resolution with auto-registration
- Want detailed documentation and examples specific to IoC

### Installation & Getting Started

```bash
# Install KsDp
npm install ksdp

# Basic usage example
const { IoC } = require('ksdp');
const container = new IoC();

// KsDp also includes many other patterns
const { Singleton, Observer, Factory } = require('ksdp');
```

### Learn More

- **npm Package**: [`ksdp`](https://www.npmjs.com/package/ksdp)
- **GitHub Repository**: [ameksike/ksdp](https://github.com/ameksike/ksdp)
- **Ksike Ecosystem**: Complete microframework ecosystem including:
  - **KsMf** - Microframework (WEB, REST API, CLI, Proxy)
  - **KsDp** - Design Patterns Library (This one!)
  - **KsCryp** - Cryptographic Library (RSA, JWT, x509, etc.)
  - **KsHook** - Event Driven Library
  - **KsEval** - Expression Evaluator Library
  - **KsWC** - Web API deployment Library
  - **KsTpl** - Template Engine

### Final Recommendation

Both libraries serve different purposes and can even be used together:

- Use **this IoC library** for modern, TypeScript-first dependency injection with advanced features like auto-registration
- Use **KsDp** when you need a comprehensive design patterns toolkit for complex application architecture

The choice depends on your specific needs: focused IoC/DI functionality versus comprehensive design patterns implementation.

## 🤝 Contributing

This IoC library is part of a larger design patterns project. For contributions, please refer to the main project documentation.

## 📄 License

This project is licensed under the MIT License. 