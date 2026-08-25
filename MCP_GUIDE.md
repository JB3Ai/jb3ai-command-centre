# MCP (Model Context Protocol) Server Guide

This guide explains how to work with MCP servers in the jb3ai-command-centre project, including both local and remote configurations.

## Overview

MCP (Model Context Protocol) servers provide a standardized way to expose tools and resources to AI models. The jb3ai-command-centre project includes infrastructure for managing MCP servers through the `mcp-manager.sh` script and integrates with the Supabase database for tracking various integrations.

## Existing MCP Integrations

The project currently has 4 MCP integrations defined in the database:

1. **apple-mcp**: Apple Notes + iMessage integration (endpoint: tunnel.jb3ai.com:8765)
2. **whatsapp-mcp**: WhatsApp Bridge (endpoint: localhost:8080)
3. **filesystem-mcp**: Filesystem MCP (endpoint: local)
4. **supabase-mcp**: Supabase MCP (endpoint: hosted)

These are defined in `supabase/migrations/003_seed_integrations.sql`.

## MCP Manager Script

The `mcp-manager.sh` script provides command-line management of MCP servers:

### Available Commands:
- `start <name>` - Start an MCP server
- `stop <name>` - Stop an MCP server
- `status <name>` - Check status of an MCP server
- `list` - List all MCP servers
- `monitor` - Monitor all MCP servers
- `add-config <name> <file>` - Add MCP configuration
- `remove-config <name>` - Remove MCP configuration
- `install-skill <name>` - Install a global skill
- `remove-skill <name>` - Remove a global skill

### Example Usage:
```bash
# List available MCP servers
./mcp-manager.sh list

# Start a specific MCP server
./mcp-manager.sh start filesystem-mcp

# Check status of all MCP servers
./mcp-manager.sh monitor

# Add a new MCP configuration
./mcp-manager.sh add-config my-mcp ./my-mcp-config.json
```

## Creating MCP Server Configurations

MCP server configurations are JSON files that define the server's capabilities. Here's the structure:

### Basic Structure:
```json
{
  "version": "experimental",
  "name": "unique-server-name",
  "description": "Description of the MCP server",
  "tools": [...],
  "resources": [...]
}
```

### Tools Definition:
Tools are callable functions that the AI can invoke:

```json
{
  "name": "tool_name",
  "description": "What this tool does",
  "inputSchema": {
    "type": "object",
    "properties": {
      // Define input parameters
    },
    "required": ["required", "parameters"]
  }
}
```

### Resources Definition:
Resources provide data that can be accessed by the AI:

```json
{
  "name": "resource_name",
  "description": "Description of the resource",
  "schema": {
    // Define the structure of the data
  }
}
```

## Local MCP Server Example

The `example-local-mcp.json` file demonstrates a local MCP server with filesystem access:

```json
{
  "version": "experimental",
  "name": "example-local-mcp",
  "description": "Example local MCP server for demonstration",
  "tools": [
    {
      "name": "local_filesystem_access",
      "description": "Access to local filesystem operations",
      "inputSchema": {
        "type": "object",
        "properties": {
          "operation": {
            "type": "string",
            "enum": ["read", "write", "list", "delete"]
          },
          "path": {
            "type": "string",
            "description": "File or directory path"
          },
          "content": {
            "type": "string",
            "description": "Content to write (for write operations)"
          }
        },
        "required": ["operation", "path"]
      }
    }
  ]
}
```

## Remote MCP Server Example

The `example-remote-mcp.json` file demonstrates a remote MCP server with API capabilities:

```json
{
  "version": "experimental",
  "name": "example-remote-mcp",
  "description": "Example remote MCP server for demonstration",
  "tools": [
    {
      "name": "remote_api_call",
      "description": "Make API calls to external services",
      "inputSchema": {
        "type": "object",
        "properties": {
          "method": {
            "type": "string",
            "enum": ["GET", "POST", "PUT", "DELETE"]
          },
          "url": {
            "type": "string",
            "description": "Full URL for the API call"
          },
          "headers": {
            "type": "object",
            "description": "HTTP headers to include"
          },
          "body": {
            "type": "string",
            "description": "Request body for POST/PUT"
          }
        },
        "required": ["method", "url"]
      }
    }
  ]
}
```

## Integration with Cline Settings

The system-level MCP settings are stored in:
`../../Users/jono_8poat5m/AppData/Roaming/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

This file contains the `mcpServers` configuration that connects to the Claude IDE.

## Setting Up New MCP Servers

1. **Create the configuration file** - Define your MCP server in a JSON file following the structure above
2. **Add to the manager** - Use `mcp-manager.sh add-config` to register the configuration
3. **Update the database** - If needed, add the integration to `hub_sync_status` table in Supabase
4. **Configure security** - Ensure proper authentication and authorization for your MCP server
5. **Start the server** - Use `mcp-manager.sh start` to launch your server

## Best Practices

- Use descriptive names for tools and resources
- Validate input parameters thoroughly
- Implement proper error handling
- Keep sensitive information secure
- Document your MCP server capabilities
- Test thoroughly before deployment

## Troubleshooting

- Check the MCP manager logs in `~/.mcp/mcp-manager.log`
- Verify configuration file syntax
- Ensure the MCP server is running and accessible
- Check firewall/network connectivity for remote servers
- Review Claude IDE settings for MCP integration

## Security Considerations

- Limit access to sensitive system resources
- Implement proper authentication for remote MCP servers
- Validate all inputs to prevent injection attacks
- Use HTTPS for remote MCP connections
- Regularly audit MCP server access logs