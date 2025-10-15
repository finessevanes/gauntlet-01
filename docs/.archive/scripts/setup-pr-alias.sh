#!/bin/bash

# =============================================================================
# setup-pr-alias.sh - Quick Setup for PR Creation Alias
# =============================================================================
# 
# This script adds a global 'pr' alias to your shell configuration
# so you can create PRs from anywhere by just typing 'pr'
#
# Usage:
#   ./setup-pr-alias.sh
#
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ${BLUE}PR Alias Setup${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get the absolute path to create-pr.sh
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PR_SCRIPT="$SCRIPT_DIR/create-pr.sh"

echo -e "${BLUE}ℹ${NC} Script location: $PR_SCRIPT"
echo ""

# Detect shell
SHELL_CONFIG=""
if [ -n "$ZSH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
    SHELL_NAME="zsh"
elif [ -n "$BASH_VERSION" ]; then
    if [ -f "$HOME/.bash_profile" ]; then
        SHELL_CONFIG="$HOME/.bash_profile"
    else
        SHELL_CONFIG="$HOME/.bashrc"
    fi
    SHELL_NAME="bash"
else
    echo -e "${YELLOW}⚠${NC} Could not detect shell type"
    read -p "Enter your shell config file path (e.g., ~/.zshrc): " SHELL_CONFIG
    SHELL_NAME="your shell"
fi

echo -e "${GREEN}✓${NC} Detected shell: $SHELL_NAME"
echo -e "${GREEN}✓${NC} Config file: $SHELL_CONFIG"
echo ""

# Check if alias already exists
if grep -q "alias pr=" "$SHELL_CONFIG" 2>/dev/null; then
    echo -e "${YELLOW}⚠${NC} Alias 'pr' already exists in $SHELL_CONFIG"
    echo ""
    grep "alias pr=" "$SHELL_CONFIG"
    echo ""
    read -p "Do you want to replace it? [y/N]: " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
    # Remove old alias
    sed -i.bak '/alias pr=/d' "$SHELL_CONFIG"
fi

# Add alias to shell config
echo "" >> "$SHELL_CONFIG"
echo "# PR Creation Script Alias (added by setup-pr-alias.sh)" >> "$SHELL_CONFIG"
echo "alias pr=\"$PR_SCRIPT\"" >> "$SHELL_CONFIG"

echo -e "${GREEN}✓${NC} Alias added to $SHELL_CONFIG"
echo ""

# Instructions
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ${GREEN}Setup Complete!${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "To activate the alias, run:"
echo -e "  ${BLUE}source $SHELL_CONFIG${NC}"
echo ""
echo "Or simply open a new terminal window."
echo ""
echo "Then, from any branch in your repository, just type:"
echo -e "  ${GREEN}pr${NC}"
echo ""
echo "That's it! 🎉"
echo ""

# Offer to source now
read -p "$(echo -e ${CYAN}Activate now in this terminal? [Y/n]:${NC} )" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    source "$SHELL_CONFIG"
    echo -e "${GREEN}✓${NC} Alias activated!"
    echo ""
    echo "Try it now! Just type: ${GREEN}pr${NC}"
fi

