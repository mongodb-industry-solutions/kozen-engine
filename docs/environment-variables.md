# Environment Variables Reference

This document provides a comprehensive reference for all environment variables used in Kozen Engine, with special focus on KOZEN-prefixed variables and their configuration options.

## 📋 Table of Contents

- [Overview](#overview)
- [Core KOZEN Variables](#core-kozen-variables)
- [Pipeline Configuration Variables](#pipeline-configuration-variables)
- [Environment Management Variables](#environment-management-variables)
- [Secret Management Variables](#secret-management-variables)
- [Cloud Provider Variables](#cloud-provider-variables)
- [MongoDB Configuration Variables](#mongodb-configuration-variables)
- [System Variables](#system-variables)
- [Configuration Examples](#configuration-examples)

## Overview

Kozen Engine uses environment variables for configuration management, allowing flexible deployment across different environments and cloud providers. Variables are organized into several categories:

- **KOZEN\_\*** - Core Kozen Engine configuration
- **AWS\_\*** - Amazon Web Services integration
- **ATLAS\_\*** - MongoDB Atlas configuration
- **MONGODB\_\*** - MongoDB database settings
- **PULUMI\_\*** - Pulumi backend configuration

## Core KOZEN Variables

### KOZEN_STACK

- **Purpose**: Defines the deployment stack environment
- **Default**: `dev` (falls back to `NODE_ENV`)
- **Usage**: Determines which configuration stack to use for deployment
- **Example**: `KOZEN_STACK=production`
- **Location**: `src/controllers/PipelineController.ts:114`

### KOZEN_PROJECT

- **Purpose**: Specifies the project identifier for the pipeline
- **Default**: Auto-generated unique ID
- **Usage**: Used for resource naming and organization
- **Example**: `KOZEN_PROJECT=MyApp-v1.2`
- **Location**: `src/controllers/PipelineController.ts:115`

### KOZEN_TEMPLATE

- **Purpose**: Defines which template to use for pipeline execution
- **Default**: Empty string (requires manual specification)
- **Usage**: References template files in `cfg/templates/`
- **Example**: `KOZEN_TEMPLATE=atlas.basic`
- **Location**: `src/controllers/PipelineController.ts:116`

### KOZEN_CONFIG

- **Purpose**: Path to the main configuration file
- **Default**: `cfg/config.json`
- **Usage**: Specifies the primary configuration file location
- **Example**: `KOZEN_CONFIG=cfg/production-config.json`
- **Location**: Multiple files (PipelineController, SecretController)

### KOZEN_ACTION

- **Purpose**: Defines the action to perform on the pipeline
- **Default**: `deploy`
- **Valid Values**: `deploy`, `undeploy`, `validate`, `preview`
- **Usage**: Controls what operation the pipeline should execute
- **Example**: `KOZEN_ACTION=validate`
- **Location**: `src/controllers/PipelineController.ts:118`

## Pipeline Configuration Variables

### KOZEN_ENV_PREFIX

- **Purpose**: Sets the prefix for exposed environment variables
- **Default**: `KOZEN_PL`
- **Usage**: Used by the Env class to prefix variables when exposing them globally
- **Example**: `KOZEN_ENV_PREFIX=MYAPP`
- **Location**: `src/tools/env/Env.ts:22`

### KOZEN_ENV_SCOPE

- **Purpose**: Defines the scope for environment variable persistence
- **Default**: `GLOBAL`
- **Valid Values**: `GLOBAL`, `LOCAL`
- **Usage**: Controls whether variables are set globally or locally
- **Example**: `KOZEN_ENV_SCOPE=LOCAL`
- **Location**: `src/tools/env/Env.ts:85,95`

### KOZEN_ENV_LIMIT

- **Purpose**: Sets character limit for environment variable values
- **Default**: `1024`
- **Usage**: Prevents extremely long values from being set as environment variables
- **Example**: `KOZEN_ENV_LIMIT=2048`
- **Location**: `src/tools/env/Env.ts:120`

### KOZEN_ENV_QUOTE

- **Purpose**: Character used to replace quotes in environment variable values, especially for JSON encodings
- **Default**: `§`
- **Usage**: Sanitizes values by replacing problematic quote characters
- **Example**: `KOZEN_ENV_QUOTE=#`
- **Location**: `src/tools/env/Env.ts:121`

### KOZEN_ENV_ACTION

- **Purpose**: Controls whether pipeline outputs should be exposed as environment variables
- **Default**: `undefined` (means EXPOSE)
- **Valid Values**: `EXPOSE`, any other value disables exposure
- **Usage**: Determines if pipeline results are made available as env vars
- **Example**: `KOZEN_ENV_ACTION=EXPOSE`
- **Location**: `src/services/PipelineManager.ts:201`

## Secret Management Variables

### KOZEN_SM_ACTION

- **Purpose**: Default action for secret management operations
- **Default**: `resolve`
- **Valid Values**: `resolve`, `store`, `delete`, `list`
- **Usage**: Specifies what operation to perform on secrets
- **Example**: `KOZEN_SM_ACTION=store`
- **Location**: `src/controllers/SecretController.ts:181`

### KOZEN_SM_KEY

- **Purpose**: Default key name for secret operations
- **Default**: `undefined`
- **Usage**: Specifies which secret key to operate on
- **Example**: `KOZEN_SM_KEY=database-password`
- **Location**: `src/controllers/SecretController.ts:182`

### KOZEN_SM_VAL

- **Purpose**: Default value for secret storage operations
- **Default**: `undefined`
- **Usage**: Provides the value to store when creating/updating secrets
- **Example**: `KOZEN_SM_VAL=super-secret-value`
- **Location**: `src/controllers/SecretController.ts:184`

### KOZEN_SM_ALT

- **Purpose**: Alternative key name for MongoDB secret management
- **Default**: Auto-generated from database and collection names
- **Usage**: Provides fallback key naming for MongoDB-based secrets
- **Example**: `KOZEN_SM_ALT=prod-secrets.alt`
- **Location**: `src/services/SecretManagerMDB.ts:207`

## Cloud Provider Variables

### AWS Variables

#### AWS_REGION

- **Purpose**: AWS region for service operations
- **Default**: `us-east-1`
- **Usage**: Specifies which AWS region to use for deployments
- **Example**: `AWS_REGION=us-west-2`
- **Location**: `src/services/SecretManagerAWS.ts:75`

#### AWS_ACCESS_KEY_ID

- **Purpose**: AWS access key for authentication
- **Default**: `undefined`
- **Usage**: Required for AWS API authentication
- **Example**: `AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE`
- **Location**: Multiple files (ProcessorService, api-reference docs)

#### AWS_SECRET_ACCESS_KEY

- **Purpose**: AWS secret access key for authentication
- **Default**: `undefined`
- **Usage**: Required for AWS API authentication (sensitive)
- **Example**: `AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`
- **Location**: Multiple files (ProcessorService, api-reference docs)

### MongoDB Atlas Variables

#### ATLAS_PUBLIC_KEY

- **Purpose**: MongoDB Atlas API public key
- **Default**: `undefined`
- **Usage**: Required for Atlas cluster management
- **Example**: `ATLAS_PUBLIC_KEY=your-atlas-public-key`
- **Location**: `src/components/Atlas/index.ts:53,66`

#### ATLAS_PRIVATE_KEY

- **Purpose**: MongoDB Atlas API private key
- **Default**: `undefined`
- **Usage**: Required for Atlas cluster management (sensitive)
- **Example**: `ATLAS_PRIVATE_KEY=your-atlas-private-key`
- **Location**: `src/components/Atlas/index.ts:54,67`

#### ATLAS_PROJECT_ID

- **Purpose**: MongoDB Atlas project identifier
- **Default**: `undefined`
- **Usage**: Specifies which Atlas project to deploy resources in
- **Example**: `ATLAS_PROJECT_ID=507f1f77bcf86cd799439011`
- **Location**: `src/components/Atlas/index.ts:55`

## MongoDB Configuration Variables

### MONGODB_URI

- **Purpose**: Connection string for MongoDB database
- **Default**: `undefined`
- **Usage**: Used for template storage and logging when MongoDB backend is selected
- **Example**: `MONGODB_URI=mongodb://localhost:27017/kozen`
- **Location**: `src/services/TemplateManager.ts:96`

### MDB_MASTER_KEY

- **Purpose**: Master key for MongoDB Client-Side Field Level Encryption (CSFLE)
- **Default**: Auto-generated local key
- **Usage**: Required for encrypted secret storage in MongoDB
- **Example**: `MDB_MASTER_KEY=base64-encoded-master-key`
- **Location**: `src/services/SecretManagerMDB.ts:229`

## System Variables

### NODE_ENV

- **Purpose**: Node.js environment setting
- **Default**: `development`
- **Usage**: Used as fallback for KOZEN_STACK and general environment detection
- **Example**: `NODE_ENV=production`
- **Location**: `src/controllers/PipelineController.ts:114`

### SHELL

- **Purpose**: Current shell type (Unix/Linux/macOS)
- **Default**: System default
- **Usage**: Used to determine shell profile file for environment variable persistence
- **Example**: `SHELL=/bin/zsh`
- **Location**: `src/tools/env/Env.ts:149`

### HOME

- **Purpose**: User home directory path
- **Default**: System default
- **Usage**: Used to locate Kubernetes config and shell profiles
- **Example**: `HOME=/Users/username`
- **Location**: `src/components/K8Pods/index.ts:21`

### PULUMI_CONFIG_PASSPHRASE

- **Purpose**: Passphrase for Pulumi state encryption
- **Default**: `undefined`
- **Usage**: Required for encrypted Pulumi backends
- **Example**: `PULUMI_CONFIG_PASSPHRASE=my-secure-passphrase`
- **Location**: Referenced in documentation and examples

## Configuration Examples

### Development Environment (.env.development)

```bash
# Core Kozen Configuration
KOZEN_STACK=dev
KOZEN_PROJECT=MyApp-Dev
KOZEN_TEMPLATE=demo
KOZEN_CONFIG=cfg/config.json
KOZEN_ACTION=deploy

# Environment Management
KOZEN_ENV_PREFIX=MYAPP_DEV
KOZEN_ENV_SCOPE=LOCAL
KOZEN_ENV_LIMIT=1024
KOZEN_ENV_ACTION=EXPOSE

# Secret Management
KOZEN_SM_ACTION=resolve
KOZEN_SM_ALT=dev-secrets.alt

# System
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/kozen-dev

# AWS (if using AWS components)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# MongoDB Atlas (if using Atlas components)
ATLAS_PUBLIC_KEY=your-atlas-public-key
ATLAS_PRIVATE_KEY=your-atlas-private-key
ATLAS_PROJECT_ID=your-project-id
```

### Production Environment (.env.production)

```bash
# Core Kozen Configuration
KOZEN_STACK=production
KOZEN_PROJECT=MyApp-Prod
KOZEN_TEMPLATE=atlas.basic
KOZEN_CONFIG=cfg/production-config.json
KOZEN_ACTION=deploy

# Environment Management
KOZEN_ENV_PREFIX=MYAPP_PROD
KOZEN_ENV_SCOPE=GLOBAL
KOZEN_ENV_LIMIT=2048
KOZEN_ENV_ACTION=EXPOSE

# Secret Management
KOZEN_SM_ACTION=resolve
KOZEN_SM_ALT=prod-secrets.alt

# System
NODE_ENV=production

# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/kozen-prod

# AWS
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=prod-access-key
AWS_SECRET_ACCESS_KEY=prod-secret-key

# MongoDB Atlas
ATLAS_PUBLIC_KEY=prod-atlas-public-key
ATLAS_PRIVATE_KEY=prod-atlas-private-key
ATLAS_PROJECT_ID=prod-project-id

# Pulumi
PULUMI_CONFIG_PASSPHRASE=production-passphrase
```

### Testing Environment (.env.test)

```bash
# Core Kozen Configuration
KOZEN_STACK=test
KOZEN_PROJECT=MyApp-Test
KOZEN_TEMPLATE=demo
KOZEN_CONFIG=cfg/test-config.json
KOZEN_ACTION=validate

# Environment Management
KOZEN_ENV_PREFIX=MYAPP_TEST
KOZEN_ENV_SCOPE=LOCAL
KOZEN_ENV_LIMIT=1024

# Secret Management
KOZEN_SM_ACTION=resolve

# System
NODE_ENV=test

# MongoDB
MONGODB_URI=mongodb://localhost:27017/kozen-test
```

## Best Practices

1. **Security**: Never commit sensitive variables (passwords, keys) to version control
2. **Environment Separation**: Use different values for dev/test/prod environments
3. **Naming Convention**: Follow the KOZEN\_ prefix for custom Kozen-specific variables
4. **Documentation**: Document any custom environment variables you add
5. **Validation**: Always provide sensible defaults for non-sensitive variables
6. **Encryption**: Use encrypted storage for production secrets (AWS Secrets Manager, MongoDB CSFLE)

## Related Documentation

- [Configuration Guide](configuration.md) - General configuration management
- [Deployment Guide](deployment.md) - Production deployment with environment variables
- [Contributing Guide](contributing.md) - Adding new environment variables
- [API Reference](api-reference.md) - Environment variable usage in API components
