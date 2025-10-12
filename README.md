# Kozen — Task Execution Framework

Kozen is a lightweight Task Execution Framework (Jenkins‑style) for building custom automation with first‑class IaC and testing support. It ships as an NPM package for easy integration in Node.js projects.

## Features

- Config‑driven pipelines from JSON templates
- Strong IaC orchestration with pluggable managers (e.g., Pulumi, Terraform)
- Test execution: end‑to‑end, integration, performance
- Extensible components and dependency injection container
- Secret and template managers
- Structured logging; optional MongoDB storage
- Cross‑platform environment utilities

## Installation

```bash
npm install @mongodb-solution-assurance/kozen
```

## Quick usage

```typescript
import { IoC, PipelineManager } from '@mongodb-solution-assurance/kozen';

const ioc = new IoC();
const pipeline = new PipelineManager(ioc);

await pipeline.deploy({ template: 'atlas.basic', config: 'cfg/config.json', action: 'deploy' });
```

## Documentation

- Wiki (official): https://github.com/mongodb-industry-solutions/kozen-engine/wiki
- Issues: https://github.com/mongodb-industry-solutions/kozen-engine/issues

## License

MIT © MongoDB Industry Solutions
