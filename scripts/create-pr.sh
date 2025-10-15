#!/bin/bash

# PR Automation Script
# Usage: ./create-pr.sh [base-branch]
# Examples:
#   ./create-pr.sh          # Create PR to main
#   ./create-pr.sh develop  # Create PR to develop

set -e

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Base branch (default to main, but can be overridden)
BASE_BRANCH="${1:-main}"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                         PR AUTOMATION SCRIPT                             ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}✗ GitHub CLI (gh) is not installed${NC}"
    echo -e "  Install with: ${YELLOW}brew install gh${NC}"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}✗ GitHub CLI is not authenticated${NC}"
    echo -e "  Authenticate with: ${YELLOW}gh auth login${NC}"
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "$CURRENT_BRANCH" = "$BASE_BRANCH" ]; then
    echo -e "${RED}✗ You are on the ${BASE_BRANCH} branch${NC}"
    echo -e "  Create a feature branch first: ${YELLOW}git checkout -b feature/my-feature${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Current branch: ${YELLOW}$CURRENT_BRANCH${NC}"
echo -e "${GREEN}✓${NC} Target branch: ${YELLOW}$BASE_BRANCH${NC}"
echo ""

# Check if there are commits to push
COMMITS_AHEAD=$(git rev-list --count $BASE_BRANCH..HEAD 2>/dev/null || echo "0")

if [ "$COMMITS_AHEAD" = "0" ]; then
    echo -e "${RED}✗ No commits found on this branch${NC}"
    echo -e "  Make some commits first!"
    exit 1
fi

echo -e "${GREEN}✓${NC} Found $COMMITS_AHEAD commit(s) to push"
echo ""

# Push the branch
echo -e "${BLUE}→${NC} Pushing branch to origin..."
git push -u origin "$CURRENT_BRANCH" 2>&1 | sed 's/^/  /'
echo ""

# Generate PR title from branch name
PR_TITLE=$(echo "$CURRENT_BRANCH" | sed 's/^feature\///' | sed 's/^fix\///' | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g')

# Try to find PR summary document
PR_NUMBER=""
if [[ $CURRENT_BRANCH =~ pr-([0-9]+) ]]; then
    PR_NUMBER="${BASH_REMATCH[1]}"
fi

PR_BODY=""
DOC_FOUND=false

# Search for PR summary in various locations
SEARCH_PATHS=(
    "docs/PR-${PR_NUMBER}-SUMMARY.md"
    "docs/PR-${PR_NUMBER}-ACTION-PLAN.md"
    "docs/pr-${PR_NUMBER}-summary.md"
    ".github/PR-${PR_NUMBER}.md"
)

for DOC_PATH in "${SEARCH_PATHS[@]}"; do
    if [ -f "$DOC_PATH" ]; then
        echo -e "${GREEN}✓${NC} Found PR documentation: ${YELLOW}$DOC_PATH${NC}"
        DOC_FOUND=true
        
        # Extract relevant sections
        OVERVIEW=$(sed -n '/## Overview/,/^##/p' "$DOC_PATH" | grep -v '^##' | sed '/^$/d' | head -10)
        FEATURES=$(sed -n '/## Features/,/^##/p' "$DOC_PATH" | grep -v '^##' | sed '/^$/d' | head -15)
        CHECKLIST=$(sed -n '/## Checklist/,/^##/p' "$DOC_PATH" | grep -v '^##' | head -15)
        TESTING=$(sed -n '/## Testing/,/^##/p' "$DOC_PATH" | grep -v '^##' | sed '/^$/d' | head -10)
        
        # Build PR body
        PR_BODY="## Overview\n\n${OVERVIEW}\n\n"
        
        if [ -n "$FEATURES" ]; then
            PR_BODY="${PR_BODY}## Features\n\n${FEATURES}\n\n"
        fi
        
        if [ -n "$CHECKLIST" ]; then
            PR_BODY="${PR_BODY}## Checklist\n\n${CHECKLIST}\n\n"
        fi
        
        if [ -n "$TESTING" ]; then
            PR_BODY="${PR_BODY}## Testing\n\n${TESTING}\n\n"
        fi
        
        break
    fi
done

# If no doc found, generate from commits
if [ "$DOC_FOUND" = false ]; then
    echo -e "${YELLOW}⚠${NC} No PR documentation found, generating from commits..."
    
    COMMIT_LIST=$(git log $BASE_BRANCH..HEAD --pretty=format:"- %s" | head -10)
    
    PR_BODY="## Changes\n\n${COMMIT_LIST}\n\n"
    PR_BODY="${PR_BODY}## Commits\n\nThis PR contains $COMMITS_AHEAD commit(s).\n\n"
fi

PR_BODY="${PR_BODY}---\n\n📝 **Review Checklist:**\n"
PR_BODY="${PR_BODY}- [ ] Code follows project standards\n"
PR_BODY="${PR_BODY}- [ ] Tests pass locally\n"
PR_BODY="${PR_BODY}- [ ] No linter errors\n"
PR_BODY="${PR_BODY}- [ ] Preview URL tested\n\n"
PR_BODY="${PR_BODY}🚀 **Vercel Preview:** Check PR comments for deployment URL\n"

echo ""
echo -e "${BLUE}→${NC} Creating pull request..."
echo -e "  Title: ${GREEN}$PR_TITLE${NC}"
echo -e "  Base: ${YELLOW}$BASE_BRANCH${NC}"
echo ""

# Create the PR
PR_URL=$(gh pr create \
    --base "$BASE_BRANCH" \
    --title "$PR_TITLE" \
    --body "$(echo -e "$PR_BODY")" \
    2>&1 | grep -o 'https://github.com[^[:space:]]*' || echo "")

if [ -z "$PR_URL" ]; then
    # Try to get the PR URL for this branch
    PR_URL=$(gh pr view --json url --jq .url 2>/dev/null || echo "")
fi

if [ -n "$PR_URL" ]; then
    echo -e "${GREEN}✓${NC} Pull request created!"
    echo -e "  ${BLUE}$PR_URL${NC}"
    echo ""
    
    # Ask if user wants to open in browser
    echo -e "${YELLOW}Open PR in browser? [Y/n]${NC}"
    read -r RESPONSE
    
    if [ -z "$RESPONSE" ] || [ "$RESPONSE" = "y" ] || [ "$RESPONSE" = "Y" ]; then
        gh pr view --web
    fi
else
    echo -e "${RED}✗ Failed to create PR${NC}"
    echo -e "  Check GitHub CLI authentication and repository settings"
    exit 1
fi

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                              NEXT STEPS                                  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  1. ${GREEN}Wait for Vercel preview${NC} (~2 minutes)"
echo -e "  2. ${GREEN}Test on preview URL${NC} (Vercel will comment on PR)"
echo -e "  3. ${GREEN}Merge when ready:${NC} ${YELLOW}gh pr merge${NC}"
echo ""
echo -e "${GREEN}✨ Done!${NC}"
echo ""

