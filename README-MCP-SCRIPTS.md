# MCP Management Scripts and Skill Bank

This document describes the MCP management scripts and skill bank functionality for the JB3AI Command Centre.

## MCP Management Scripts

The MCP manager script provides functionality to start, stop, and monitor multiple MCP servers.

### Features:
- Start all MCP servers at once
- Stop all MCP servers at once
- Check status of all MCP servers
- Start/stop individual MCP servers
- Process management with PID tracking
- Logging for monitoring

### Usage:
```bash
# Make the script executable
chmod +x scripts/mcp-manager.sh

# Start all MCP servers
./scripts/mcp-manager.sh start

# Stop all MCP servers
./scripts/mcp-manager.sh stop

# Check status of all MCP servers
./scripts/mcp-manager.sh status

# Start a specific MCP server
./scripts/mcp-manager.sh start-one whatsapp-mcp

# Stop a specific MCP server
./scripts/mcp-manager.sh stop-one whatsapp-mcp
```

### Configuration:
The MCP configuration is stored in `mcp-config.json` and should contain an array of MCP server configurations with:
- `name`: Unique identifier for the MCP server
- `path`: Path to the MCP server directory
- `port`: Port number to run the MCP server on
- `type`: Type of MCP server (whatsapp, voice, analytics, social)
- `description`: Description of the MCP server

## Skill Bank

The skill bank manager provides functionality to manage global skills for the command centre.

### Features:
- Add new skills to the skill bank
- Remove skills from the skill bank
- List all skills in the skill bank
- Get details about a specific skill
- Check if a skill exists
- Update skill descriptions

### Usage:
```bash
# Initialize the skill bank
node scripts/skill-bank.js init

# Add a new skill
node scripts/skill-bank.js add whatsapp-skill ./skills/whatsapp-skill "WhatsApp integration skill"

# Remove a skill
node scripts/skill-bank.js remove whatsapp-skill

# List all skills
node scripts/skill-bank.js list

# Get a specific skill
node scripts/skill-bank.js get whatsapp-skill

# Check if a skill exists
node scripts/skill-bank.js exists whatsapp-skill

# Update skill description
node scripts/skill-bank.js update-desc whatsapp-skill "Updated WhatsApp integration skill"
```

### Skill Bank Structure:
Skills are stored in the `skills` directory with an index file (`skills/index.json`) that tracks all available skills and their metadata.

## Integration with Command Centre

The MCP management scripts and skill bank are designed to work with the JB3AI Command Centre to:
1. Manage multiple MCP servers that provide different capabilities
2. Maintain a centralized skill bank for reusable components
3. Provide monitoring and control over the MCP ecosystem
4. Enable easy addition/removal of new capabilities

## Requirements

- Bash shell for the MCP manager script
- Node.js for the skill bank manager
- Python for MCP servers (when running them)
- Properly configured MCP server directories