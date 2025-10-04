# API Component

## Overview

The API Component is a powerful HTTP client component designed for making REST API calls as part of infrastructure and deployment pipelines. This component provides a standardized interface for executing HTTP requests, handling responses, and integrating with external services while maintaining proper error handling, logging, and result management.

## Features

- **HTTP Methods Support**: GET, POST, PUT, DELETE, PATCH, and more
- **Request Customization**: Headers, body, and query parameters
- **Response Processing**: Automatic JSON parsing with fallback to raw text
- **Error Handling**: Comprehensive HTTP error handling with status codes
- **Authentication Support**: Header-based authentication mechanisms
- **Pipeline Integration**: Seamless integration with Kozen Engine pipeline system
- **Logging**: Structured logging with request/response metrics
- **Timeout Management**: Configurable request timeouts

## Architecture

The API component extends the `KzComponent` and implements the standard component lifecycle:

```typescript
export class API extends KzComponent {
  async run(input?: IStruct, pipeline?: IPipeline): Promise<IResult>;
  async deploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult>;
  async undeploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult>;
  async getInput(input: IStruct, action: string): Promise<IStruct>;
  protected async processResponse<T>(response: Response): Promise<T>;
}
```

## Configuration

### Input Structure Overview

The API component uses an **overloaded input system** that supports separate configurations for `deploy` and `undeploy` actions. Each action contains **IComponentInput metadata structures** that are evaluated at runtime, enabling dynamic and flexible data resolution from various sources including environment variables, secrets, and references to other component outputs.

### Basic Configuration Structure

```json
{
  "name": "API",
  "input": [
    {
      "name": "deploy",
      "value": [
        {
          "name": "url",
          "value": "https://api.example.com/endpoint"
        },
        {
          "name": "method",
          "type": "value",
          "value": "GET"
        },
        {
          "name": "headers",
          "value": [
            {
              "name": "Content-Type",
              "type": "value",
              "value": "application/json"
            }
          ]
        }
      ]
    },
    {
      "name": "undeploy",
      "value": [
        {
          "name": "url",
          "type": "reference",
          "value": "serviceUrl",
          "default": "https://api.example.com/cleanup"
        },
        {
          "name": "method",
          "value": "DELETE"
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

| Type          | Description                             | Example Use Case                |
| ------------- | --------------------------------------- | ------------------------------- |
| `value`       | Static value used as-is                 | Fixed URLs, HTTP methods        |
| `environment` | Environment variable resolution         | `API_BASE_URL`, `NODE_ENV`      |
| `secret`      | Secret management system (AWS SM, etc.) | API keys, authentication tokens |
| `reference`   | Reference to previous component output  | Service URLs, deployment IDs    |
| `protected`   | Protected configuration values          | Sensitive configuration data    |

### Core API Parameters

| Parameter | Type            | Required | Default | Description                                |
| --------- | --------------- | -------- | ------- | ------------------------------------------ |
| `url`     | IComponentInput | Yes      | -       | Target URL for the API request             |
| `method`  | IComponentInput | No       | "GET"   | HTTP method (GET, POST, PUT, DELETE, etc.) |
| `headers` | IComponentInput | No       | {}      | HTTP headers as metadata array             |
| `body`    | IComponentInput | No       | {}      | Request body data (POST, PUT, PATCH)       |
| `params`  | IComponentInput | No       | {}      | Query parameters to append to URL          |

### Advanced Configuration Patterns

#### Headers with Metadata Evaluation

```json
{
  "name": "headers",
  "value": [
    {
      "name": "Content-Type",
      "value": "application/json"
    },
    {
      "name": "Authorization",
      "type": "secret",
      "value": "API_BEARER_TOKEN",
      "description": "Bearer token from AWS Secrets Manager"
    },
    {
      "name": "X-Request-ID",
      "type": "reference",
      "value": "requestId",
      "default": "auto-generated"
    }
  ]
}
```

#### Body with Dynamic Content

```json
{
  "name": "body",
  "type": "value",
  "value": [
    {
      "name": "deploymentId",
      "type": "reference",
      "value": "deploymentId",
      "description": "ID from previous deployment component"
    },
    {
      "name": "environment",
      "type": "environment",
      "value": "NODE_ENV",
      "default": "development"
    },
    {
      "name": "timestamp",
      "value": "${new Date().toISOString()}"
    }
  ]
}
```

#### Query Parameters with Metadata

```json
{
  "name": "params",
  "value": [
    {
      "name": "page",
      "value": 1
    },
    {
      "name": "limit",
      "type": "environment",
      "value": "API_PAGE_LIMIT",
      "default": 10
    },
    {
      "name": "userId",
      "type": "reference",
      "value": "userId",
      "description": "User ID from authentication component"
    }
  ]
}
```

This configuration automatically appends evaluated parameters to the URL: `https://api.example.com/users?page=1&limit=10&userId=12345`

## Runtime Metadata Evaluation

The API component performs **deep input evaluation** before executing the `run` method. This process:

1. **Resolves Environment Variables**: `type: "environment"` fetches values from system environment
2. **Retrieves Secrets**: `type: "secret"` accesses values from Key Management Systems (AWS Secrets Manager, etc.)
3. **References Component Outputs**: `type: "reference"` gets values from previous pipeline component results
4. **Applies Default Values**: Uses `default` when resolution fails or returns null
5. **Passes Static Values**: `type: "value"` uses values as-is without transformation

### Component Output Exposure

API component results are automatically exposed through the pipeline **output system**, making them accessible to all subsequent components in the pipeline sequence. This enables powerful component chaining and data flow patterns.

## Usage Examples

### Example 1: Simple GET Request

```json
{
  "name": "API",
  "input": [
    {
      "name": "deploy",
      "value": [
        {
          "name": "url",
          "value": "https://jsonplaceholder.typicode.com/posts/1"
        },
        {
          "name": "method",
          "value": "GET"
        }
      ]
    }
  ]
}
```

### Example 2: POST Request with Metadata-Driven Body

```json
{
  "name": "API",
  "input": [
    {
      "name": "deploy",
      "value": [
        {
          "name": "url",
          "value": "https://jsonplaceholder.typicode.com/posts"
        },
        {
          "name": "method",
          "value": "POST"
        },
        {
          "name": "headers",
          "value": [
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        {
          "name": "body",
          "value": [
            {
              "name": "title",
              "type": "environment",
              "value": "POST_TITLE",
              "default": "Default Title"
            },
            {
              "name": "content",
              "type": "reference",
              "value": "generatedContent",
              "description": "Content from previous component"
            },
            {
              "name": "userId",
              "type": "secret",
              "value": "USER_ID_SECRET",
              "default": 1
            }
          ]
        }
      ]
    }
  ]
}
```

### Example 3: Authentication with Bearer Token

```json
{
  "name": "API",
  "input": [
    {
      "name": "deploy",
      "value": [
        {
          "name": "url",
          "value": "https://api.github.com/user"
        },
        {
          "name": "headers",
          "value": [
            {
              "name": "Authorization",
              "value": "Bearer ghp_your_token_here"
            },
            {
              "name": "Accept",
              "value": "application/vnd.github.v3+json"
            }
          ]
        }
      ]
    }
  ]
}
```

### Example 4: API with Query Parameters

```json
{
  "name": "API",
  "input": [
    {
      "name": "deploy",
      "value": [
        {
          "name": "url",
          "value": "https://rickandmortyapi.com/api/character"
        },
        {
          "name": "params",
          "value": [
            {
              "name": "page",
              "value": 2
            },
            {
              "name": "status",
              "value": "alive"
            }
          ]
        }
      ]
    }
  ]
}
```

### Example 5: PUT Request for Resource Update

```json
{
  "name": "API",
  "input": [
    {
      "name": "deploy",
      "value": [
        {
          "name": "url",
          "value": "https://jsonplaceholder.typicode.com/posts/1"
        },
        {
          "name": "method",
          "value": "PUT"
        },
        {
          "name": "headers",
          "value": [
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        {
          "name": "body",
          "value": {
            "id": 1,
            "title": "Updated Title",
            "body": "Updated content",
            "userId": 1
          }
        }
      ]
    }
  ]
}
```

### Example 6: DELETE Request

```json
{
  "name": "API",
  "input": [
    {
      "name": "undeploy",
      "value": [
        {
          "name": "url",
          "value": "https://jsonplaceholder.typicode.com/posts/1"
        },
        {
          "name": "method",
          "value": "DELETE"
        }
      ]
    }
  ]
}
```

## Output Format

The API component returns a standardized result object:

```typescript
interface IResult {
  templateName?: string;
  success: boolean;
  message: string;
  timestamp: Date;
  duration: number;
  output?: any; // Parsed response data
  error?: Error;
}
```

### Success Response Example

```json
{
  "templateName": "demo",
  "success": true,
  "message": "API call completed successfully.",
  "timestamp": "2024-12-01T10:30:00.000Z",
  "duration": 750,
  "output": {
    "userId": 1,
    "id": 1,
    "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
    "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
  }
}
```

### Error Response Example

```json
{
  "templateName": "demo",
  "success": false,
  "message": "API call failed.",
  "timestamp": "2024-12-01T10:30:00.000Z",
  "duration": 500,
  "error": {
    "message": "API call failed with status 404: Not Found"
  }
}
```

## Advanced Features

### Environment Variable Integration

```json
{
  "name": "API",
  "input": [
    {
      "name": "deploy",
      "value": [
        {
          "name": "url",
          "value": {
            "type": "environment",
            "name": "apiUrl",
            "value": "API_BASE_URL",
            "default": "https://api.example.com"
          }
        },
        {
          "name": "headers",
          "value": [
            {
              "name": "Authorization",
              "value": {
                "type": "secret",
                "name": "apiToken",
                "value": "API_TOKEN"
              }
            }
          ]
        }
      ]
    }
  ]
}
```

### Reference Integration

```json
{
  "name": "API",
  "input": [
    {
      "name": "deploy",
      "value": [
        {
          "name": "url",
          "value": "https://api.example.com/notify"
        },
        {
          "name": "method",
          "value": "POST"
        },
        {
          "name": "body",
          "value": [
            {
              "type": "reference",
              "name": "deploymentId",
              "value": "deploymentId",
              "description": "ID from previous deployment"
            }
          ]
        }
      ]
    }
  ]
}
```

### Conditional Requests

```json
{
  "name": "API",
  "input": [
    {
      "name": "deploy",
      "value": [
        {
          "name": "url",
          "value": "https://api.example.com/health"
        }
      ]
    },
    {
      "name": "undeploy",
      "value": [
        {
          "name": "url",
          "value": "https://api.example.com/shutdown"
        },
        {
          "name": "method",
          "value": "POST"
        }
      ]
    }
  ]
}
```

## Authentication Methods

### 1. Bearer Token Authentication

```json
{
  "headers": [
    {
      "name": "Authorization",
      "value": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  ]
}
```

### 2. API Key Authentication

```json
{
  "headers": [
    {
      "name": "X-API-Key",
      "value": "your-api-key-here"
    }
  ]
}
```

### 3. Basic Authentication

```json
{
  "headers": [
    {
      "name": "Authorization",
      "value": "Basic dXNlcm5hbWU6cGFzc3dvcmQ="
    }
  ]
}
```

### 4. Custom Authentication Headers

```json
{
  "headers": [
    {
      "name": "X-Auth-Token",
      "value": "custom-token"
    },
    {
      "name": "X-User-ID",
      "value": "user123"
    }
  ]
}
```

## Best Practices

### 1. Security Considerations

- **Secure Credentials**: Use secret management for API keys and tokens
- **HTTPS**: Always use HTTPS for production API calls
- **Input Validation**: Validate all input parameters before making requests
- **Rate Limiting**: Respect API rate limits and implement backoff strategies

### 2. Error Handling

- **Status Codes**: Handle different HTTP status codes appropriately
- **Timeout Management**: Set appropriate timeouts for API requests
- **Retry Logic**: Implement retry mechanisms for transient failures
- **Circuit Breaker**: Consider circuit breaker patterns for unreliable APIs

### 3. Performance Optimization

- **Connection Reuse**: Reuse connections when possible
- **Compression**: Use gzip compression for large payloads
- **Caching**: Implement caching for frequently accessed data
- **Parallel Requests**: Make parallel requests when possible

### 4. Monitoring and Logging

- **Request Tracking**: Log all API requests with unique identifiers
- **Performance Metrics**: Track response times and success rates
- **Error Alerting**: Set up alerts for API failures
- **Usage Analytics**: Monitor API usage patterns

## Common Use Cases

### 1. Infrastructure Monitoring

- **Health Checks**: Verify service availability
- **Metrics Collection**: Gather performance metrics
- **Status Updates**: Report deployment status

### 2. Service Integration

- **Webhook Notifications**: Send notifications to external services
- **Data Synchronization**: Sync data between systems
- **Third-party APIs**: Integrate with external services

### 3. Testing and Validation

- **API Testing**: Validate API responses
- **Smoke Tests**: Perform basic functionality checks
- **Load Testing**: Generate load for performance testing

### 4. Configuration Management

- **Dynamic Configuration**: Fetch configuration from APIs
- **Feature Flags**: Check feature enablement
- **Environment Setup**: Configure services via APIs

## Response Processing

### Automatic JSON Parsing

The component automatically attempts to parse JSON responses:

```typescript
// Successful JSON parsing
{
  "output": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}

// Fallback to raw text
{
  "output": {
    "raw": "Plain text response"
  }
}
```

### Custom Response Handling

For complex response processing, extend the component:

```typescript
protected async processResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`API call failed with status ${response.status}: ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type');

  if (contentType?.includes('application/json')) {
    return await response.json() as T;
  } else if (contentType?.includes('application/xml')) {
    return { xml: await response.text() } as unknown as T;
  } else {
    return { raw: await response.text() } as unknown as T;
  }
}
```

## Troubleshooting

### Common Issues

1. **CORS Errors**

   - Verify CORS configuration on target API
   - Use server-side requests instead of client-side

2. **Authentication Failures**

   - Verify token validity and expiration
   - Check authentication header format

3. **Timeout Errors**

   - Increase timeout settings
   - Check network connectivity

4. **SSL Certificate Issues**
   - Verify certificate validity
   - Use appropriate certificate handling

### Debugging Tips

- Log request details before sending
- Verify URL formatting and parameters
- Test APIs manually with tools like curl or Postman
- Check API documentation for required headers and formats

## Integration Examples

### Pipeline Integration with References

```json
{
  "components": [
    {
      "name": "DeployService",
      "output": [
        {
          "name": "serviceUrl",
          "description": "Deployed service URL"
        }
      ]
    },
    {
      "name": "API",
      "input": [
        {
          "name": "deploy",
          "value": [
            {
              "name": "url",
              "value": {
                "type": "reference",
                "name": "healthCheck",
                "value": "serviceUrl",
                "default": "http://localhost:8080"
              }
            }
          ]
        }
      ]
    }
  ]
}
```

This API component provides a robust and flexible way to integrate HTTP API calls into your infrastructure and deployment pipelines, ensuring reliable communication with external services while maintaining proper error handling and comprehensive logging.
