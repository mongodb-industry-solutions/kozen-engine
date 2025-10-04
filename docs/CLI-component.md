# CLI Component

## Overview

The CLI Component is a versatile execution component that enables the execution of command-line interface commands as part of infrastructure and deployment pipelines. This component provides a standardized interface for running shell commands, scripts, and system utilities while maintaining proper logging, error handling, and result management.

## Features

- **Command Execution**: Execute any CLI command with arguments
- **Flexible Argument Handling**: Support for array-based and object-based arguments
- **Cross-Platform Support**: Works on Windows, Linux, and macOS
- **Error Management**: Comprehensive error handling with detailed output
- **Output Processing**: Automatic JSON parsing when applicable
- **Pipeline Integration**: Seamless integration with the Kozen Engine pipeline system
- **Logging**: Structured logging with execution metrics

## Architecture

The CLI component extends the `KzComponent` and implements the standard component lifecycle:

```typescript
export class CLI extends KzComponent {
  async run(input?: IStruct, pipeline?: IPipeline): Promise<IResult>;
  async deploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult>;
  async undeploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult>;
  async getInput(input: IStruct, action: string): Promise<IStruct>;
}
```

## Configuration

### Input Structure Overview

The CLI component uses an **overloaded input system** that supports separate configurations for `deploy` and `undeploy` actions. Each action contains **IComponentInput metadata structures** that are evaluated at runtime, enabling dynamic command construction from various sources including environment variables, secrets, and references to other component outputs.

### Basic Configuration Structure

```json
{
  "name": "CLI",
  "input": [
    {
      "name": "deploy",
      "value": [
        {
          "name": "cmd",
          "value": "docker"
        },
        {
          "name": "args",
          "value": [
            {
              "name": "action",
              "value": "run"
            },
            {
              "name": "image",
              "type": "environment",
              "value": "DOCKER_IMAGE",
              "default": "nginx:latest"
            }
          ]
        }
      ]
    },
    {
      "name": "undeploy",
      "value": [
        {
          "name": "cmd",
          "value": "docker"
        },
        {
          "name": "args",
          "value": [
            {
              "name": "action",
              "value": "stop"
            },
            {
              "name": "container",
              "type": "reference",
              "value": "containerId",
              "description": "Container ID from deploy phase"
            }
          ]
        }
      ]
    }
  ]
}
```

### IComponentInput Metadata Structure

Each input parameter follows the **IComponentInput** (IMetadata) structure for runtime evaluation:

```typescript
interface IComponentInput {
  name: string; // Parameter identifier
  type?: IStructType; // Resolution strategy
  value: any; // Actual value or reference key
  description?: string; // Documentation
  default?: any; // Fallback value
}
```

### Input Resolution Types

| Type          | Description                             | Example Use Case                 |
| ------------- | --------------------------------------- | -------------------------------- |
| `value`       | Static value used as-is                 | Fixed commands, static arguments |
| `environment` | Environment variable resolution         | `DOCKER_IMAGE`, `NODE_ENV`       |
| `secret`      | Secret management system (AWS SM, etc.) | Database passwords, API keys     |
| `reference`   | Reference to previous component output  | Container IDs, file paths        |
| `protected`   | Protected configuration values          | Sensitive configuration data     |

### Core CLI Parameters

| Parameter   | Type            | Required | Description                           |
| ----------- | --------------- | -------- | ------------------------------------- |
| `cmd`       | IComponentInput | Yes      | The base command to execute           |
| `args`      | IComponentInput | No       | Command arguments as metadata array   |
| `[...argv]` | IComponentInput | No       | Additional arguments appended to args |

### Advanced Argument Configuration Patterns

#### Dynamic Arguments with Metadata Evaluation

```json
{
  "name": "args",
  "value": [
    {
      "name": "subcommand",
      "value": "apply"
    },
    {
      "name": "filename",
      "type": "reference",
      "value": "manifestPath",
      "description": "Path from previous component output"
    },
    {
      "name": "namespace",
      "type": "environment",
      "value": "KUBE_NAMESPACE",
      "default": "default"
    },
    {
      "name": "token",
      "type": "secret",
      "value": "KUBE_AUTH_TOKEN",
      "description": "Kubernetes authentication token"
    }
  ]
}
```

#### Conditional Command Construction

```json
{
  "name": "deploy",
  "value": [
    {
      "name": "cmd",
      "type": "environment",
      "value": "DEPLOY_COMMAND",
      "default": "kubectl"
    },
    {
      "name": "args",
      "value": [
        {
          "name": "action",
          "value": "apply"
        },
        {
          "name": "context",
          "type": "reference",
          "value": "kubeContext",
          "default": "production"
        }
      ]
    }
  ]
}
```

## Runtime Metadata Evaluation

The CLI component performs **deep input evaluation** before executing the `run` method. This process:

1. **Resolves Environment Variables**: `type: "environment"` fetches values from system environment
2. **Retrieves Secrets**: `type: "secret"` accesses values from Key Management Systems (AWS Secrets Manager, etc.)
3. **References Component Outputs**: `type: "reference"` gets values from previous pipeline component results
4. **Applies Default Values**: Uses `default` when resolution fails or returns null
5. **Constructs Command**: Builds the final command string from evaluated metadata

### Component Output Exposure

CLI component results are automatically exposed through the pipeline **output system**, making command execution results accessible to all subsequent components in the pipeline sequence. This enables command chaining and result-based decision making.

## Usage Examples

### Example 1: Dynamic Directory Listing

```json
{
  "name": "CLI",
  "input": [
    {
      "name": "deploy",
      "value": [
        {
          "name": "cmd",
          "value": "ls"
        },
        {
          "name": "args",
          "value": [
            {
              "name": "flags",
              "value": "-la"
            },
            {
              "name": "path",
              "type": "environment",
              "value": "TARGET_DIRECTORY",
              "default": "/home/user"
            }
          ]
        }
      ]
    }
  ]
}
```

### Example 2: Docker Container Lifecycle Management

```json
{
  "name": "CLI",
  "input": [
    {
      "name": "deploy",
      "type": "value",
      "value": [
        {
          "name": "cmd",
          "type": "value",
          "value": "docker"
        },
        {
          "name": "args",
          "type": "value",
          "value": [
            {
              "name": "action",
              "type": "value",
              "value": "run"
            },
            {
              "name": "detach",
              "type": "value",
              "value": "-d"
            },
            {
              "name": "name",
              "type": "environment",
              "value": "CONTAINER_NAME",
              "default": "my-app"
            },
            {
              "name": "port",
              "type": "reference",
              "value": "portMapping",
              "default": "8080:80"
            },
            {
              "name": "image",
              "type": "secret",
              "value": "DOCKER_IMAGE",
              "default": "nginx:latest"
            }
          ]
        }
      ]
    },
    {
      "name": "undeploy",
      "type": "value",
      "value": [
        {
          "name": "cmd",
          "type": "value",
          "value": "docker"
        },
        {
          "name": "args",
          "type": "value",
          "value": [
            {
              "name": "action",
              "type": "value",
              "value": "stop"
            },
            {
              "name": "container",
              "type": "reference",
              "value": "containerName",
              "description": "Container name from deploy phase"
            }
          ]
        }
      ]
    }
  ]
}
```

### Example 3: Kubernetes Deployment

```json
{
  "name": "CLI",
  "input": [
    {
      "name": "deploy",
      "value": [
        {
          "name": "cmd",
          "value": "kubectl"
        },
        {
          "name": "args",
          "value": ["apply", "-f", "deployment.yaml"]
        }
      ]
    },
    {
      "name": "undeploy",
      "value": [
        {
          "name": "cmd",
          "value": "kubectl"
        },
        {
          "name": "args",
          "value": ["delete", "-f", "deployment.yaml"]
        }
      ]
    }
  ]
}
```

### Example 4: NPM Package Management

```json
{
  "name": "CLI",
  "input": [
    {
      "name": "deploy",
      "value": [
        {
          "name": "cmd",
          "value": "npm"
        },
        {
          "name": "args",
          "value": ["install", "--production"]
        }
      ]
    }
  ]
}
```

### Example 5: Git Operations

```json
{
  "name": "CLI",
  "input": [
    {
      "name": "deploy",
      "value": [
        {
          "name": "cmd",
          "value": "git"
        },
        {
          "name": "args",
          "value": ["clone", "https://github.com/user/repo.git", "/tmp/repo"]
        }
      ]
    }
  ]
}
```

## Output Format

The CLI component returns a standardized result object:

```typescript
interface IResult {
  templateName?: string;
  success: boolean;
  message: string;
  timestamp: Date;
  duration: number;
  output?: {
    raw: string; // Raw command output
    processed: IStruct; // Parsed output (JSON if applicable)
  };
  error?: Error;
}
```

### Success Response Example

```json
{
  "templateName": "demo",
  "success": true,
  "message": "Command executed successfully.",
  "timestamp": "2024-12-01T10:30:00.000Z",
  "duration": 1250,
  "output": {
    "raw": "total 4\ndrwxr-xr-x 2 user user 4096 Dec  1 10:30 documents\n",
    "processed": {
      "raw": "total 4\ndrwxr-xr-x 2 user user 4096 Dec  1 10:30 documents\n"
    }
  }
}
```

### Error Response Example

```json
{
  "templateName": "demo",
  "success": false,
  "message": "Command execution failed.",
  "timestamp": "2024-12-01T10:30:00.000Z",
  "duration": 500,
  "error": {
    "message": "Command 'invalidcommand' not found"
  }
}
```

## Advanced Features

### Environment Variable Integration

```json
{
  "name": "CLI",
  "input": [
    {
      "name": "deploy",
      "value": [
        {
          "name": "cmd",
          "value": "echo"
        },
        {
          "name": "args",
          "value": ["$NODE_ENV"]
        }
      ]
    }
  ]
}
```

### Reference Integration

```json
{
  "name": "CLI",
  "input": [
    {
      "name": "deploy",
      "value": [
        {
          "name": "cmd",
          "value": "curl"
        },
        {
          "name": "args",
          "value": [
            {
              "type": "reference",
              "name": "url",
              "value": "serviceUrl",
              "default": "http://localhost:8080"
            }
          ]
        }
      ]
    }
  ]
}
```

### Conditional Execution

```json
{
  "name": "CLI",
  "input": [
    {
      "name": "deploy",
      "value": [
        {
          "name": "cmd",
          "value": "bash"
        },
        {
          "name": "args",
          "value": [
            "-c",
            "if [ \"$NODE_ENV\" = \"production\" ]; then npm run build:prod; else npm run build:dev; fi"
          ]
        }
      ]
    }
  ]
}
```

## Best Practices

### 1. Security Considerations

- **Input Validation**: Always validate command inputs to prevent injection attacks
- **Restricted Commands**: Consider implementing a whitelist of allowed commands
- **User Permissions**: Run commands with minimal required permissions
- **Sensitive Data**: Avoid passing sensitive data as command-line arguments

### 2. Error Handling

- **Timeout Management**: Implement timeouts for long-running commands
- **Retry Logic**: Consider retry mechanisms for transient failures
- **Cleanup**: Ensure proper cleanup of resources created by commands

### 3. Performance Optimization

- **Async Execution**: Use asynchronous execution for non-blocking operations
- **Resource Limits**: Set appropriate memory and CPU limits
- **Output Buffering**: Handle large outputs efficiently

### 4. Cross-Platform Compatibility

- **Path Separators**: Use appropriate path separators for different OS
- **Command Availability**: Check command availability before execution
- **Shell Differences**: Account for shell differences between platforms

## Common Use Cases

### 1. Infrastructure Deployment

- **Terraform**: `terraform apply -auto-approve`
- **Ansible**: `ansible-playbook site.yml`
- **Helm**: `helm install myapp ./chart`

### 2. Application Deployment

- **Docker**: Container building and deployment
- **Kubernetes**: Resource management and deployment
- **Cloud CLI**: AWS/Azure/GCP resource management

### 3. Testing and Validation

- **Unit Tests**: `npm test`
- **Integration Tests**: Custom test scripts
- **Health Checks**: `curl -f http://localhost:8080/health`

### 4. Data Operations

- **Database Migrations**: Database schema updates
- **Data Import/Export**: ETL operations
- **Backup Operations**: Database and file backups

## Troubleshooting

### Common Issues

1. **Command Not Found**

   - Verify command is installed and in PATH
   - Check spelling and case sensitivity

2. **Permission Denied**

   - Verify user permissions
   - Check file and directory permissions

3. **Timeout Errors**

   - Increase timeout settings
   - Optimize command performance

4. **Output Parsing Failures**
   - Verify output format
   - Handle non-JSON outputs appropriately

### Debugging Tips

- Use `echo` commands to verify variable substitution
- Test commands manually before pipeline integration
- Check system logs for additional error information
- Verify environment variables and path settings

## Integration Examples

### Pipeline Integration

```json
{
  "components": [
    {
      "name": "CLI",
      "input": [
        {
          "name": "deploy",
          "value": [
            {
              "name": "cmd",
              "value": "docker"
            },
            {
              "name": "args",
              "value": ["build", "-t", "myapp:latest", "."]
            }
          ]
        }
      ],
      "output": [
        {
          "type": "reference",
          "name": "imageId",
          "value": "imageId",
          "description": "Built Docker image ID"
        }
      ]
    }
  ]
}
```

This CLI component provides a powerful and flexible way to integrate any command-line tool or script into your infrastructure and deployment pipelines, ensuring consistent execution, proper error handling, and comprehensive logging.
