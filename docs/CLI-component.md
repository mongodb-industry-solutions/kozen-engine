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

The CLI component extends the `BaseController` and implements the standard component lifecycle:

```typescript
export class CLI extends BaseController {
  async run(input?: IStruct, pipeline?: IPipeline): Promise<IResult>
  async deploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult>
  async undeploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult>
  async getInput(input: IStruct, action: string): Promise<IStruct>
}
```

## Configuration

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
          "value": "command_to_execute"
        },
        {
          "name": "args",
          "value": ["arg1", "arg2", "arg3"]
        }
      ]
    }
  ]
}
```

### Input Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `cmd` | string | Yes | The base command to execute |
| `args` | array/object | No | Command arguments (can be array or key-value object) |
| `[...argv]` | any | No | Additional arguments that will be appended to args |

### Argument Handling

The CLI component supports flexible argument handling:

#### Array-based Arguments
```json
{
  "cmd": "ls",
  "args": ["-la", "/home/user"]
}
```

#### Object-based Arguments
```json
{
  "cmd": "docker",
  "args": {
    "action": "run",
    "detach": "-d",
    "port": "-p 8080:80",
    "image": "nginx:latest"
  }
}
```

#### Mixed Arguments
```json
{
  "cmd": "kubectl",
  "args": ["get", "pods"],
  "namespace": "-n production",
  "output": "-o json"
}
```

## Usage Examples

### Example 1: Basic Directory Listing

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
          "value": ["-la", "/home/user"]
        }
      ]
    }
  ]
}
```

### Example 2: Docker Container Management

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
          "value": ["run", "-d", "--name", "my-app", "-p", "8080:80", "nginx:latest"]
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
          "value": ["stop", "my-app"]
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
    raw: string;           // Raw command output
    processed: IStruct;    // Parsed output (JSON if applicable)
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
          "value": ["-c", "if [ \"$NODE_ENV\" = \"production\" ]; then npm run build:prod; else npm run build:dev; fi"]
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