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

The API component extends the `BaseController` and implements the standard component lifecycle:

```typescript
export class API extends BaseController {
  async run(input?: IStruct, pipeline?: IPipeline): Promise<IResult>
  async deploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult>
  async undeploy(input?: IStruct, pipeline?: IPipeline): Promise<IResult>
  async getInput(input: IStruct, action: string): Promise<IStruct>
  protected async processResponse<T>(response: Response): Promise<T>
}
```

## Configuration

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
          "value": "GET"
        },
        {
          "name": "headers",
          "value": [
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        }
      ]
    }
  ]
}
```

### Input Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | string | Yes | - | The target URL for the API request |
| `method` | string | No | "GET" | HTTP method (GET, POST, PUT, DELETE, etc.) |
| `headers` | object | No | {} | HTTP headers as key-value pairs |
| `body` | object | No | {} | Request body data (for POST, PUT, PATCH) |
| `params` | object | No | {} | Query parameters to append to URL |

### Header Configuration

Headers can be configured in multiple formats:

#### Array Format
```json
{
  "headers": [
    {
      "name": "Content-Type",
      "value": "application/json"
    },
    {
      "name": "Authorization",
      "value": "Bearer token123"
    }
  ]
}
```

#### Object Format
```json
{
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer token123",
    "X-API-Version": "v1"
  }
}
```

### Query Parameters

Query parameters are automatically appended to the URL:

```json
{
  "url": "https://api.example.com/users",
  "params": {
    "page": 1,
    "limit": 10,
    "sort": "name"
  }
}
```

Results in: `https://api.example.com/users?page=1&limit=10&sort=name`

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

### Example 2: POST Request with Body

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
          "value": {
            "title": "foo",
            "body": "bar",
            "userId": 1
          }
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
  output?: any;           // Parsed response data
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