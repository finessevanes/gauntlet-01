#!/bin/bash

# Quick help display for PR automation

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
cat "$SCRIPT_DIR/.pr-cheatsheet"
echo ""
echo -e "${BLUE}For complete docs:${NC}"
echo -e "  ${CYAN}less QUICK-PR-GUIDE.md${NC}      Quick reference"
echo -e "  ${CYAN}less PR-AUTOMATION.md${NC}       Full documentation"
echo ""

