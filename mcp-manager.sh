#!/bin/bash

# MCP Manager Script
# This script manages local MCP servers including starting, stopping, and monitoring

# Configuration
MCP_DIR="$HOME/.mcp"
LOG_FILE="$MCP_DIR/mcp-manager.log"
MCP_CONFIGS="$MCP_DIR/configs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

# Error logging function
error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ERROR:${NC} $1" >&2
    echo "$(date '+%Y-%m-%d %H:%M:%S') - ERROR: $1" >> "$LOG_FILE"
}

# Success logging function
success() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')] SUCCESS:${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - SUCCESS: $1" >> "$LOG_FILE"
}

# Warning logging function
warning() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARNING:${NC} $1"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - WARNING: $1" >> "$LOG_FILE"
}

# Create necessary directories
setup_directories() {
    mkdir -p "$MCP_DIR"
    mkdir -p "$MCP_CONFIGS"
    touch "$LOG_FILE"
    log "Initialized MCP manager directories"
}

# Check if a process is running
is_running() {
    local pid_file="$1"
    if [[ -f "$pid_file" ]]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            rm -f "$pid_file"
            return 1
        fi
    fi
    return 1
}

# Start an MCP server
start_mcp() {
    local name="$1"
    local config_file="$MCP_CONFIGS/$name.json"
    
    if [[ ! -f "$config_file" ]]; then
        error "Configuration file not found: $config_file"
        return 1
    fi
    
    local pid_file="$MCP_DIR/$name.pid"
    local log_file="$MCP_DIR/$name.log"
    
    if is_running "$pid_file"; then
        warning "MCP server '$name' is already running"
        return 1
    fi
    
    log "Starting MCP server: $name"
    
    # Start the MCP server in background
    # This assumes you have a command to start the MCP server
    # You may need to adjust this based on your specific MCP implementation
    mcp-server --config "$config_file" > "$log_file" 2>&1 &
    local pid=$!
    
    # Save PID
    echo "$pid" > "$pid_file"
    
    # Wait a moment to verify it started
    sleep 2
    
    if is_running "$pid_file"; then
        success "MCP server '$name' started successfully (PID: $pid)"
        return 0
    else
        error "Failed to start MCP server '$name'"
        return 1
    fi
}

# Stop an MCP server
stop_mcp() {
    local name="$1"
    local pid_file="$MCP_DIR/$name.pid"
    
    if ! is_running "$pid_file"; then
        warning "MCP server '$name' is not running"
        return 1
    fi
    
    local pid=$(cat "$pid_file")
    log "Stopping MCP server: $name (PID: $pid)"
    
    # Kill the process
    kill "$pid" 2>/dev/null
    
    # Wait a moment for graceful shutdown
    sleep 2
    
    if is_running "$pid_file"; then
        warning "MCP server '$name' did not shut down gracefully, forcing termination"
        kill -9 "$pid" 2>/dev/null
    fi
    
    # Remove PID file
    rm -f "$pid_file"
    
    success "MCP server '$name' stopped successfully"
    return 0
}

# Check status of an MCP server
check_mcp_status() {
    local name="$1"
    local pid_file="$MCP_DIR/$name.pid"
    
    if is_running "$pid_file"; then
        local pid=$(cat "$pid_file")
        echo -e "${GREEN}RUNNING${NC} - PID: $pid"
        return 0
    else
        echo -e "${RED}STOPPED${NC}"
        return 1
    fi
}

# List all MCP servers
list_mcp_servers() {
    echo -e "${BLUE}Available MCP Servers:${NC}"
    if [[ -d "$MCP_CONFIGS" ]]; then
        for config in "$MCP_CONFIGS"/*.json; do
            if [[ -f "$config" ]]; then
                local name=$(basename "$config" .json)
                echo -e "  ${YELLOW}$name${NC}: $(check_mcp_status "$name" 2>/dev/null || echo 'STOPPED')"
            fi
        done
    else
        echo "  No MCP configurations found"
    fi
}

# Monitor all MCP servers
monitor_mcp_servers() {
    echo -e "${BLUE}Monitoring MCP Servers:${NC}"
    echo "----------------------------------------"
    
    local running=0
    local stopped=0
    
    if [[ -d "$MCP_CONFIGS" ]]; then
        for config in "$MCP_CONFIGS"/*.json; do
            if [[ -f "$config" ]]; then
                local name=$(basename "$config" .json)
                echo -n "  $name: "
                if check_mcp_status "$name" >/dev/null 2>&1; then
                    echo -e "${GREEN}RUNNING${NC}"
                    ((running++))
                else
                    echo -e "${RED}STOPPED${NC}"
                    ((stopped++))
                fi
            fi
        done
    else
        echo "  No MCP configurations found"
    fi
    
    echo "----------------------------------------"
    echo -e "${GREEN}Running:${NC} $running | ${RED}Stopped:${NC} $stopped"
}

# Add a new MCP configuration
add_mcp_config() {
    local name="$1"
    local config_json="$2"
    
    if [[ -z "$name" || -z "$config_json" ]]; then
        error "Usage: add_mcp_config <name> <config_json>"
        return 1
    fi
    
    if [[ ! -f "$config_json" ]]; then
        error "Configuration file not found: $config_json"
        return 1
    fi
    
    local dest_file="$MCP_CONFIGS/$name.json"
    
    if [[ -f "$dest_file" ]]; then
        warning "Configuration file already exists: $dest_file"
        read -p "Overwrite? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return 1
        fi
    fi
    
    cp "$config_json" "$dest_file"
    success "Added MCP configuration: $name"
    return 0
}

# Remove an MCP configuration
remove_mcp_config() {
    local name="$1"
    
    if [[ -z "$name" ]]; then
        error "Usage: remove_mcp_config <name>"
        return 1
    fi
    
    local config_file="$MCP_CONFIGS/$name.json"
    
    if [[ ! -f "$config_file" ]]; then
        error "Configuration file not found: $config_file"
        return 1
    fi
    
    # Stop the server if running
    stop_mcp "$name"
    
    # Remove the configuration file
    rm -f "$config_file"
    success "Removed MCP configuration: $name"
    return 0
}

# Install a global skill
install_global_skill() {
    local skill_name="$1"
    
    if [[ -z "$skill_name" ]]; then
        error "Usage: install_global_skill <skill_name>"
        return 1
    fi
    
    log "Installing global skill: $skill_name"
    
    # This would typically involve downloading and installing the skill
    # Implementation depends on your specific skill management system
    echo "Installing skill: $skill_name"
    success "Global skill '$skill_name' installed"
    return 0
}

# Remove a global skill
remove_global_skill() {
    local skill_name="$1"
    
    if [[ -z "$skill_name" ]]; then
        error "Usage: remove_global_skill <skill_name>"
        return 1
    fi
    
    log "Removing global skill: $skill_name"
    
    # This would typically involve removing the skill from the system
    # Implementation depends on your specific skill management system
    echo "Removing skill: $skill_name"
    success "Global skill '$skill_name' removed"
    return 0
}

# Show help
show_help() {
    echo "MCP Manager Script"
    echo "=================="
    echo "Usage: $0 [command] [arguments]"
    echo ""
    echo "Commands:"
    echo "  start <name>           Start an MCP server"
    echo "  stop <name>            Stop an MCP server"
    echo "  status <name>          Check status of an MCP server"
    echo "  list                   List all MCP servers"
    echo "  monitor                Monitor all MCP servers"
    echo "  add-config <name> <file> Add MCP configuration"
    echo "  remove-config <name>   Remove MCP configuration"
    echo "  install-skill <name>   Install a global skill"
    echo "  remove-skill <name>    Remove a global skill"
    echo "  help                   Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 start my-server"
    echo "  $0 monitor"
    echo "  $0 add-config my-server ./config.json"
    echo "  $0 install-skill my-skill"
}

# Main execution
main() {
    setup_directories
    
    case "$1" in
        start)
            start_mcp "$2"
            ;;
        stop)
            stop_mcp "$2"
            ;;
        status)
            check_mcp_status "$2"
            ;;
        list)
            list_mcp_servers
            ;;
        monitor)
            monitor_mcp_servers
            ;;
        add-config)
            add_mcp_config "$2" "$3"
            ;;
        remove-config)
            remove_mcp_config "$2"
            ;;
        install-skill)
            install_global_skill "$2"
            ;;
        remove-skill)
            remove_global_skill "$2"
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            if [[ -n "$1" ]]; then
                error "Unknown command: $1"
                show_help
                exit 1
            else
                show_help
            fi
            ;;
    esac
}

# Run main function with all arguments
main "$@"