#!/bin/bash

# MCP Manager Script for JB3AI Command Centre
# This script manages local MCP servers including starting, stopping, and monitoring status

# Configuration
MCP_CONFIG_FILE="mcp-config.json"
LOG_FILE="mcp-manager.log"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Function to start all MCP servers
start_all_mcp() {
    log "Starting all MCP servers..."
    
    if [ ! -f "$MCP_CONFIG_FILE" ]; then
        echo "Error: MCP configuration file not found: $MCP_CONFIG_FILE"
        log "Error: MCP configuration file not found: $MCP_CONFIG_FILE"
        exit 1
    fi
    
    # Create logs and pids directories if they don't exist
    mkdir -p logs pids
    
    # Read MCP configurations and start each one
    jq -r '.[] | "\(.name) \(.path) \(.port)"' "$MCP_CONFIG_FILE" | while read -r name path port; do
        if [ -n "$name" ] && [ -n "$path" ] && [ -n "$port" ]; then
            echo "Starting MCP server: $name"
            log "Starting MCP server: $name"
            
            # Start the MCP server in background
            cd "$path" || continue
            nohup python -m mcp.server --port "$port" > "../logs/mcp-$name.log" 2>&1 &
            PID=$!
            
            # Save PID for future management
            echo "$PID" > "../pids/mcp-$name.pid"
            echo "Started MCP server $name with PID: $PID"
            log "Started MCP server $name with PID: $PID"
        fi
    done
    
    echo "All MCP servers started"
    log "All MCP servers started"
}

# Function to stop all MCP servers
stop_all_mcp() {
    log "Stopping all MCP servers..."
    
    # Kill all MCP processes
    if [ -d "pids" ]; then
        for pid_file in pids/mcp-*.pid; do
            if [ -f "$pid_file" ]; then
                PID=$(cat "$pid_file")
                echo "Stopping MCP server with PID: $PID"
                log "Stopping MCP server with PID: $PID"
                kill "$PID" 2>/dev/null
                rm "$pid_file"
            fi
        done
    fi
    
    echo "All MCP servers stopped"
    log "All MCP servers stopped"
}

# Function to check MCP server status
check_mcp_status() {
    log "Checking MCP server status..."
    
    if [ ! -f "$MCP_CONFIG_FILE" ]; then
        echo "Error: MCP configuration file not found: $MCP_CONFIG_FILE"
        log "Error: MCP configuration file not found: $MCP_CONFIG_FILE"
        exit 1
    fi
    
    echo "MCP Server Status:"
    echo "=================="
    
    jq -r '.[] | "\(.name) \(.path) \(.port)"' "$MCP_CONFIG_FILE" | while read -r name path port; do
        if [ -n "$name" ] && [ -n "$path" ] && [ -n "$port" ]; then
            # Check if process is running
            if [ -f "pids/mcp-$name.pid" ]; then
                PID=$(cat "pids/mcp-$name.pid")
                if ps -p "$PID" > /dev/null 2>&1; then
                    echo "✓ $name (Running, PID: $PID)"
                    log "$name is running with PID: $PID"
                else
                    echo "✗ $name (Stopped, PID file exists but process not found)"
                    log "$name is stopped, but PID file exists"
                fi
            else
                echo "○ $name (Stopped)"
                log "$name is stopped"
            fi
        fi
    done
}

# Function to start a specific MCP server
start_mcp() {
    local server_name="$1"
    
    if [ -z "$server_name" ]; then
        echo "Usage: start_mcp <server_name>"
        exit 1
    fi
    
    log "Starting MCP server: $server_name"
    
    # Find the server in config
    local server_config=$(jq -r --arg name "$server_name" '.[] | select(.name==$name) | "\(.name) \(.path) \(.port)"' "$MCP_CONFIG_FILE")
    
    if [ -z "$server_config" ]; then
        echo "Error: MCP server '$server_name' not found in configuration"
        log "Error: MCP server '$server_name' not found in configuration"
        exit 1
    fi
    
    local name=$(echo "$server_config" | cut -d' ' -f1)
    local path=$(echo "$server_config" | cut -d' ' -f2)
    local port=$(echo "$server_config" | cut -d' ' -f3)
    
    echo "Starting MCP server: $name"
    log "Starting MCP server: $name"
    
    # Create logs directory if it doesn't exist
    mkdir -p logs
    
    # Start the MCP server
    cd "$path" || exit 1
    nohup python -m mcp.server --port "$port" > "../logs/mcp-$name.log" 2>&1 &
    PID=$!
    
    # Save PID for future management
    echo "$PID" > "../pids/mcp-$name.pid"
    echo "Started MCP server $name with PID: $PID"
    log "Started MCP server $name with PID: $PID"
}

# Function to stop a specific MCP server
stop_mcp() {
    local server_name="$1"
    
    if [ -z "$server_name" ]; then
        echo "Usage: stop_mcp <server_name>"
        exit 1
    fi
    
    log "Stopping MCP server: $server_name"
    
    if [ -f "pids/mcp-$server_name.pid" ]; then
        PID=$(cat "pids/mcp-$server_name.pid")
        echo "Stopping MCP server: $server_name (PID: $PID)"
        log "Stopping MCP server: $server_name (PID: $PID)"
        kill "$PID" 2>/dev/null
        rm "pids/mcp-$server_name.pid"
        echo "Stopped MCP server: $server_name"
        log "Stopped MCP server: $server_name"
    else
        echo "MCP server $server_name not running or PID file not found"
        log "MCP server $server_name not running or PID file not found"
    fi
}

# Main script logic
case "$1" in
    start)
        start_all_mcp
        ;;
    stop)
        stop_all_mcp
        ;;
    status)
        check_mcp_status
        ;;
    start-one)
        start_mcp "$2"
        ;;
    stop-one)
        stop_mcp "$2"
        ;;
    *)
        echo "Usage: $0 {start|stop|status|start-one <name>|stop-one <name>}"
        echo "Commands:"
        echo "  start        - Start all MCP servers"
        echo "  stop         - Stop all MCP servers"
        echo "  status       - Check status of all MCP servers"
        echo "  start-one <name> - Start a specific MCP server"
        echo "  stop-one <name>  - Stop a specific MCP server"
        exit 1
        ;;
esac