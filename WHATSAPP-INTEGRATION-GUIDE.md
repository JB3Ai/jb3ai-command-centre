# WhatsApp Intelligence Dashboard Integration Guide

This document provides guidance on integrating the WhatsApp Intelligence Dashboard into the JB3AI Command Centre.

## Overview

The WhatsApp Intelligence Dashboard is a comprehensive tool for managing WhatsApp communications, including chat browsing, message search, contact context, audio transcription, and media handling. It integrates with the WhatsApp Bridge, MCP server, and VoiceScript transcription service.

## Architecture Integration

The dashboard consists of:
1. **Frontend**: HTML/JavaScript interface with tabbed navigation
2. **Backend Server**: Node.js/Express server that acts as a proxy to MCP servers
3. **MCP Integration**: Communicates with WhatsApp MCP server for core functionality
4. **VoiceScript Integration**: Handles audio transcription via VoiceScript service
5. **Supabase Integration**: Stores processed messages and reply drafts

## Key Components

### 1. Dashboard Frontend
- Tabbed interface (Chats, Messages, Contacts, Transcribe Audio)
- Two-column layout (lists on left, details on right)
- Responsive design with mobile support
- Real-time API interactions

### 2. Backend Server (server.js)
- REST API endpoints for all dashboard functionality
- MCP communication layer
- VoiceScript proxy for audio transcription
- Supabase integration for data persistence
- Autonomous brain with Gemini AI processing

### 3. MCP Integration
- WhatsApp MCP server for messaging operations
- Tools: search_contacts, send_message, list_messages, etc.
- Structured communication with JSON-RPC protocol

### 4. VoiceScript Integration
- Audio transcription service
- Supports multiple audio formats (.opus, .ogg, .wav, .mp3, .m4a)
- Integration with Azure Whisper for processing

## Integration Options

### Option 1: Direct Embedding
Embed the WhatsApp dashboard as a component within the command centre:
- Use the existing dashboard frontend as a React component
- Integrate backend API endpoints into the command centre's server
- Share authentication and authorization systems

### Option 2: API Gateway Approach
Create an API gateway that exposes WhatsApp functionality:
- Expose key endpoints from the dashboard server
- Implement middleware for command centre authentication
- Provide unified interface for WhatsApp operations

### Option 3: Microservice Approach
Run the dashboard as a separate microservice:
- Deploy the dashboard as a standalone service
- Communicate via HTTP/REST or WebSocket
- Use the command centre's existing MCP management for service coordination

## Implementation Steps

### Step 1: Environment Setup
1. Install required dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

3. Set up required services:
   - WhatsApp Bridge (Go application)
   - VoiceScript Express (Node.js service)
   - MCP server (Python application)
   - Supabase database

### Step 2: Configuration
1. Update `mcp-config.json` with the WhatsApp MCP server configuration
2. Configure environment variables in `.env`:
   - `MCP_SERVER_PATH`: Path to MCP server executable
   - `MCP_CWD`: Path to MCP server directory
   - `VOICESCRIPT_URL`: VoiceScript server URL
   - `GEMINI_API_KEY`: Google Gemini API key
   - `SUPABASE_URL` and `SUPABASE_ANON_KEY`: Supabase credentials

### Step 3: Integration with Command Centre
1. Add MCP server configuration to the command centre's MCP manager
2. Implement API endpoints for WhatsApp functionality
3. Create UI components for WhatsApp dashboard within the command centre
4. Establish authentication and authorization integration

## Key Features to Integrate

### 1. Chat Management
- Browse all WhatsApp chats
- Search chats by name
- View chat details and metadata

### 2. Message Handling
- List messages in a chat
- Search messages by content
- View message context (surrounding messages)
- Send new messages

### 3. Contact Management
- Search contacts by name or phone
- View contact details (JID, message interface)
- Send messages to contacts

### 4. Audio Transcription
- Upload audio files for transcription
- Support for multiple audio formats
- Speaker identification
- Copy/download transcript functionality

### 5. Autonomous Brain
- Gemini-powered message analysis
- Automatic task creation in Google Tasks
- Chat labeling based on content
- Draft reply generation

## Security Considerations

1. **Authentication**: Ensure proper authentication for all WhatsApp operations
2. **Authorization**: Implement role-based access controls
3. **Data Protection**: Secure handling of WhatsApp data, contacts, and media
4. **Privacy Compliance**: Follow privacy regulations for handling personal data
5. **API Security**: Secure all API endpoints with proper validation and rate limiting

## Monitoring and Maintenance

1. **MCP Server Monitoring**: Use the MCP manager scripts to monitor server status
2. **Log Management**: Centralized logging for all components
3. **Health Checks**: Regular health checks for all integrated services
4. **Performance Monitoring**: Monitor response times and resource usage

## Troubleshooting

### Common Issues:
1. **MCP Server Not Starting**: Check Python installation and MCP server path
2. **WhatsApp Bridge Authentication**: Ensure QR code scanning is completed
3. **VoiceScript Connection**: Verify VoiceScript is running on correct port
4. **Database Connectivity**: Confirm Supabase credentials are correct

### Diagnostic Commands:
```bash
# Check MCP server status
./scripts/mcp-manager.sh status

# Restart specific MCP server
./scripts/mcp-manager.sh stop-one whatsapp-mcp
./scripts/mcp-manager.sh start-one whatsapp-mcp

# Check skill bank
node scripts/skill-bank.js list
```

## Future Enhancements

1. **Enhanced AI Integration**: More sophisticated Gemini-based processing
2. **Multi-platform Support**: Extend to other messaging platforms
3. **Advanced Analytics**: Enhanced reporting and visualization
4. **Mobile Integration**: Native mobile application support
5. **Custom Workflows**: Configurable automation rules