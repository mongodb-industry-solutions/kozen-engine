# Deployment Guide

## Overview

This guide covers deployment options for Kozen Engine, from development setup to production deployment and NPM package distribution. The platform supports multiple deployment patterns to accommodate different use cases and environments.

## Deployment Patterns

### 1. Standalone CLI Application

Direct execution of the pipeline engine as a command-line tool.

### 2. NPM Package Integration

Integration into existing applications as a library dependency.

### 3. Container Deployment

Containerized deployment for cloud-native environments.

### 4. Service Platform

Deployment as a service for Infrastructure/Testing as a Service platforms.

## Development Environment Setup

### Prerequisites

- **Node.js**: Version 16.0.0 or higher
- **TypeScript**: Version 5.0.0 or higher
- **Git**: For version control
- **NPM/Yarn**: Package management

### Local Development Setup

```bash
# Clone repository
git clone <repository-url>
cd kozen-engine

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run development server
npm run dev

# Execute pipeline
npm run dev -- --template=demo --config=cfg/config.json --action=deploy
```

### Environment Configuration

Create environment-specific configuration files:

#### Development Environment (`.env.development`)

```env
# Application
NODE_ENV=development
LOG_LEVEL=debug

# Template Storage
TEMPLATE_STORAGE=file
TEMPLATE_PATH=./cfg/templates

# Secret Management
SECRET_PROVIDER=file
SECRET_PATH=./secrets

# Pulumi Backend
PULUMI_BACKEND_URL=file://.pulumi
PULUMI_CONFIG_PASSPHRASE=dev-passphrase

# MongoDB (optional)
MONGODB_URI=mongodb://localhost:27017/kozen-dev
```

#### Production Environment (`.env.production`)

```env
# Application
NODE_ENV=production
LOG_LEVEL=warn

# Template Storage
TEMPLATE_STORAGE=mongodb
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<database>

# Secret Management
SECRET_PROVIDER=aws
AWS_REGION=us-east-1

# Pulumi Backend
PULUMI_BACKEND_URL=s3://your-pulumi-state-bucket
PULUMI_ORG=your-organization

# MongoDB Analytics
MONGODB_ANALYTICS_URI=mongodb+srv://***REDACTED***@analytics.mongodb.net/kozen-analytics
```

## Production Deployment

### 1. Standalone Application Deployment

#### Build for Production

```bash
# Clean previous builds
npm run clean

# Install production dependencies
npm ci --production

# Build optimized bundle
npm run build

# Verify build
node dist/bin/pipeline.js --help
```

#### Production File Structure

```
kozen-engine-production/
├── dist/                    # Compiled JavaScript
│   ├── bin/
│   │   └── pipeline.js      # CLI entry point
│   ├── src/                 # Compiled source
│   └── index.js             # Package entry point
├── cfg/                     # Configuration files
│   ├── config.json          # Main configuration
│   └── templates/           # Template definitions
├── node_modules/            # Dependencies
├── package.json             # Package configuration
└── .env.production          # Environment variables
```

#### System Service Setup (Linux)

Create systemd service for production deployment:

```ini
# /etc/systemd/system/kozen-engine.service
[Unit]
Description=Kozen Engine Pipeline Service
After=network.target

[Service]
Type=simple
User=kozen
WorkingDirectory=/opt/kozen-engine
ExecStart=/usr/bin/node dist/bin/pipeline.js --daemon
Restart=always
RestartSec=10
Environment=NODE_ENV=production
EnvironmentFile=/opt/kozen-engine/.env.production

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable kozen-engine
sudo systemctl start kozen-engine

# Check status
sudo systemctl status kozen-engine
```

### 2. Container Deployment

#### Dockerfile

```dockerfile
# Multi-stage build for optimized production image
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json tsconfig.json ./
COPY src/ src/

# Install dependencies and build
RUN npm ci --only=production && \
    npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S kozen && \
    adduser -S kozen -u 1001 -G kozen

WORKDIR /app

# Copy built application
COPY --from=builder --chown=kozen:kozen /app/dist ./dist
COPY --from=builder --chown=kozen:kozen /app/node_modules ./node_modules
COPY --from=builder --chown=kozen:kozen /app/package.json ./

# Copy configuration templates
COPY --chown=kozen:kozen cfg/ ./cfg/

# Switch to non-root user
USER kozen

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node dist/bin/pipeline.js --action=health || exit 1

# Expose port (if running as service)
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Default command
CMD ["node", "dist/bin/pipeline.js"]
```

#### Docker Compose for Development

```yaml
# docker-compose.yml
version: "3.8"

services:
  kozen-engine:
    build: .
    environment:
      - NODE_ENV=development
      - LOG_LEVEL=debug
      - MONGODB_URI=mongodb://mongo:27017/kozen
    volumes:
      - ./cfg:/app/cfg
      - pulumi-state:/app/.pulumi
    depends_on:
      - mongo
    networks:
      - kozen-network

  mongo:
    image: mongo:7.0
    environment:
      - MONGO_INITDB_DATABASE=kozen
    volumes:
      - mongo-data:/data/db
    ports:
      - "27017:27017"
    networks:
      - kozen-network

volumes:
  mongo-data:
  pulumi-state:

networks:
  kozen-network:
    driver: bridge
```

#### Kubernetes Deployment

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: kozen-engine
---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: kozen-config
  namespace: kozen-engine
data:
  config.json: |
    {
      "name": "kozen-production",
      "engine": "kozen",
      "version": "4.0.0",
      "dependencies": [
        {
          "key": "StackManagerPulumi",
          "target": "StackManagerPulumi",
          "type": "class",
          "lifetime": "singleton"
        }
      ]
    }
---
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: kozen-secrets
  namespace: kozen-engine
type: Opaque
data:
  mongodb-uri: <base64-encoded-uri>
  aws-access-key-id: <base64-encoded-key>
  aws-secret-access-key: <base64-encoded-secret>
  pulumi-passphrase: <base64-encoded-passphrase>
---
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kozen-engine
  namespace: kozen-engine
spec:
  replicas: 2
  selector:
    matchLabels:
      app: kozen-engine
  template:
    metadata:
      labels:
        app: kozen-engine
    spec:
      containers:
        - name: kozen-engine
          image: kozen-engine:latest
          imagePullPolicy: Always
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
            - name: LOG_LEVEL
              value: "info"
            - name: MONGODB_URI
              valueFrom:
                secretKeyRef:
                  name: kozen-secrets
                  key: mongodb-uri
            - name: AWS_ACCESS_KEY_ID
              valueFrom:
                secretKeyRef:
                  name: kozen-secrets
                  key: aws-access-key-id
            - name: AWS_SECRET_ACCESS_KEY
              valueFrom:
                secretKeyRef:
                  name: kozen-secrets
                  key: aws-secret-access-key
            - name: PULUMI_CONFIG_PASSPHRASE
              valueFrom:
                secretKeyRef:
                  name: kozen-secrets
                  key: pulumi-passphrase
          volumeMounts:
            - name: config-volume
              mountPath: /app/cfg/config.json
              subPath: config.json
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            exec:
              command:
                - node
                - dist/bin/pipeline.js
                - --action=health
            initialDelaySeconds: 30
            periodSeconds: 30
          readinessProbe:
            exec:
              command:
                - node
                - dist/bin/pipeline.js
                - --action=health
            initialDelaySeconds: 5
            periodSeconds: 10
      volumes:
        - name: config-volume
          configMap:
            name: kozen-config
---
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: kozen-engine-service
  namespace: kozen-engine
spec:
  selector:
    app: kozen-engine
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP
```

### 3. Cloud Platform Deployment

#### AWS ECS Deployment

```json
{
  "family": "kozen-engine",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/kozen-engine-task-role",
  "containerDefinitions": [
    {
      "name": "kozen-engine",
      "image": "your-account.dkr.ecr.region.amazonaws.com/kozen-engine:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "AWS_REGION",
          "value": "us-east-1"
        }
      ],
      "secrets": [
        {
          "name": "MONGODB_URI",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:kozen/mongodb-uri"
        },
        {
          "name": "PULUMI_CONFIG_PASSPHRASE",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:kozen/pulumi-passphrase"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/kozen-engine",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### Azure Container Instances

```yaml
# azure-container-instance.yaml
apiVersion: "2021-03-01"
location: eastus
type: Microsoft.ContainerInstance/containerGroups
properties:
  containers:
    - name: kozen-engine
      properties:
        image: kozenengine.azurecr.io/kozen-engine:latest
        ports:
          - port: 3000
            protocol: TCP
        environmentVariables:
          - name: NODE_ENV
            value: production
          - name: LOG_LEVEL
            value: info
          - name: MONGODB_URI
            secureValue: mongodb+srv://<user>:<pass>@<cluster>/<database>
        resources:
          requests:
            cpu: 0.5
            memoryInGB: 1
  osType: Linux
  restartPolicy: Always
  ipAddress:
    type: Public
    ports:
      - protocol: TCP
        port: 3000
```

## NPM Package Distribution

### Package Configuration

#### package.json for NPM Distribution

```json
{
  "name": "kozen-engine",
  "version": "4.0.0",
  "description": "Dynamic Infrastructure and Testing Pipeline Platform",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "kozen": "dist/bin/pipeline.js",
    "kozen-pipeline": "dist/bin/pipeline.js"
  },
  "files": ["dist/**/*", "cfg/**/*", "templates/**/*", "README.md", "LICENSE"],
  "scripts": {
    "prepublishOnly": "npm run build && npm run test",
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src/**/*.ts"
  },
  "keywords": [
    "infrastructure",
    "testing",
    "pipeline",
    "iac",
    "mongodb",
    "pulumi",
    "automation"
  ],
  "author": "Your Organization",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/kozen-engine.git"
  },
  "bugs": {
    "url": "https://github.com/your-org/kozen-engine/issues"
  },
  "homepage": "https://github.com/your-org/kozen-engine#readme",
  "engines": {
    "node": ">=16.0.0"
  },
  "peerDependencies": {
    "@pulumi/pulumi": ">=3.0.0"
  },
  "dependencies": {
    "awilix": "^8.0.0",
    "mongodb": "^6.0.0"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0"
  }
}
```

#### TypeScript Configuration for Distribution

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": false,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```

### Publishing Process

#### Automated Publishing with GitHub Actions

```yaml
# .github/workflows/publish.yml
name: Publish to NPM

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          registry-url: "https://registry.npmjs.org"

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build package
        run: npm run build

      - name: Publish to NPM
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

#### Manual Publishing Process

```bash
# Version bump
npm version patch  # or minor, major

# Build for distribution
npm run build

# Run tests
npm test

# Publish to NPM
npm publish

# Publish with tag
npm publish --tag beta
```

### Package Integration Examples

#### Basic Usage in Applications

```typescript
// app.ts
import { PipelineManager, IoC } from "kozen-engine";

async function main() {
  const container = IoC.getInstance();
  const pipeline = new PipelineManager(container);

  await pipeline.configure({
    template: "infrastructure-deploy",
    config: "./config/production.json",
    action: "deploy",
  });

  const result = await pipeline.deploy({
    template: "infrastructure-deploy",
    config: "./config/production.json",
    action: "deploy",
  });

  console.log(`Deployment result: ${result.success}`);
}

main().catch(console.error);
```

#### Express.js API Integration

```typescript
// server.ts
import express from "express";
import { PipelineManager, IoC } from "kozen-engine";

const app = express();
app.use(express.json());

const container = IoC.getInstance();
const pipeline = new PipelineManager(container);

app.post("/api/deploy", async (req, res) => {
  try {
    const { template, environment } = req.body;

    const result = await pipeline.deploy({
      template,
      config: `./config/${environment}.json`,
      action: "deploy",
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Kozen Engine API server running on port 3000");
});
```

## Production Monitoring

### Health Checks

```typescript
// health.ts
export class HealthChecker {
  async checkHealth(): Promise<any> {
    const checks = {
      database: await this.checkDatabase(),
      secrets: await this.checkSecrets(),
      templates: await this.checkTemplates(),
      pulumi: await this.checkPulumi(),
    };

    const healthy = Object.values(checks).every(
      (check) => check.status === "ok"
    );

    return {
      status: healthy ? "healthy" : "unhealthy",
      timestamp: new Date(),
      checks,
    };
  }

  private async checkDatabase(): Promise<any> {
    try {
      // Database connectivity check
      return { status: "ok", message: "Database connected" };
    } catch (error) {
      return { status: "error", message: error.message };
    }
  }
}
```

### Logging Configuration

```typescript
// logging.ts
import { Logger } from "kozen-engine";

const productionLogger = new Logger({
  level: "info",
  category: "Production",
  processors: [
    new MongoDBLogProcessor(process.env.MONGODB_LOGS_URI),
    new FileLogProcessor("/var/log/kozen/application.log"),
  ],
});

export { productionLogger };
```

### Metrics Collection

```typescript
// metrics.ts
export class MetricsCollector {
  async collectMetrics(): Promise<any> {
    return {
      pipeline_executions_total: await this.getPipelineExecutions(),
      success_rate: await this.getSuccessRate(),
      average_execution_time: await this.getAverageExecutionTime(),
      active_deployments: await this.getActiveDeployments(),
    };
  }
}
```

## Security Considerations

### Production Security Checklist

- [ ] **Environment Variables**: All secrets stored in environment variables or secret management
- [ ] **File Permissions**: Proper file permissions for configuration files
- [ ] **Network Security**: Firewall rules and network isolation
- [ ] **Container Security**: Non-root user, minimal base image
- [ ] **Dependency Security**: Regular dependency updates and vulnerability scanning
- [ ] **Access Control**: Proper IAM roles and permissions
- [ ] **Audit Logging**: Comprehensive audit trail for all operations

### Secret Management in Production

```bash
# AWS Secrets Manager
aws secretsmanager create-secret \
    --name "kozen-engine/mongodb-uri" \
    --description "MongoDB connection string for Kozen Engine" \
    --secret-string "mongodb+srv://<user>:<pass>@<cluster>/<database>"

# Azure Key Vault
az keyvault secret set \
    --vault-name "kozen-vault" \
    --name "mongodb-uri" \
    --value "mongodb+srv://<user>:<pass>@<cluster>/<database>"

# Kubernetes Secrets
kubectl create secret generic kozen-secrets \
    --from-literal=mongodb-uri="mongodb+srv://<user>:<pass>@<cluster>/<database>" \
    --namespace=kozen-engine
```

### Network Security

```yaml
# k8s/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: kozen-engine-netpol
  namespace: kozen-engine
spec:
  podSelector:
    matchLabels:
      app: kozen-engine
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: allowed-namespace
      ports:
        - protocol: TCP
          port: 3000
  egress:
    - to: []
      ports:
        - protocol: TCP
          port: 443 # HTTPS
        - protocol: TCP
          port: 27017 # MongoDB
```

## Performance Optimization

### Production Optimization Settings

```json
{
  "name": "kozen-production-optimized",
  "dependencies": [
    {
      "key": "Logger",
      "target": "Logger",
      "type": "class",
      "lifetime": "singleton",
      "args": [
        {
          "level": "warn",
          "category": "Production",
          "bufferSize": 1000,
          "flushInterval": 5000
        }
      ]
    }
  ]
}
```

### Resource Limits

```yaml
# Resource limits for Kubernetes
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

This comprehensive deployment guide ensures successful deployment of Kozen Engine across different environments and use cases, from development to enterprise production deployments.
