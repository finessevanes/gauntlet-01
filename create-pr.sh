#!/bin/bash

# =============================================================================
# create-pr.sh - Intelligent PR Creation Script
# =============================================================================
# 
# This script automatically creates a pull request by:
# 1. Analyzing commits in the current branch vs main
# 2. Finding and reading PR documentation files
# 3. Generating a comprehensive PR description
# 4. Pushing the branch to remote
# 5. Creating the PR via GitHub CLI
#
# Usage:
#   ./create-pr.sh [base-branch]
#
# Examples:
#   ./create-pr.sh          # Creates PR against 'main'
#   ./create-pr.sh develop  # Creates PR against 'develop'
#
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BASE_BRANCH="${1:-main}"
WORK_DIR="collabcanvas"

# =============================================================================
# Helper Functions
# =============================================================================

print_header() {
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  ${BLUE}$1${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_step() {
    echo -e "${GREEN}▶${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# =============================================================================
# Pre-flight Checks
# =============================================================================

print_header "PR Creation Script - Pre-flight Checks"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    print_error "GitHub CLI (gh) is not installed"
    echo "Install it with: brew install gh"
    exit 1
fi
print_success "GitHub CLI found"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository"
    exit 1
fi
print_success "Git repository detected"

# Check if gh is authenticated
if ! gh auth status &> /dev/null; then
    print_error "GitHub CLI not authenticated"
    echo "Run: gh auth login"
    exit 1
fi
print_success "GitHub CLI authenticated"

# Navigate to work directory if it exists
if [ -d "$WORK_DIR" ]; then
    cd "$WORK_DIR"
    print_info "Working in: $WORK_DIR/"
fi

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
print_info "Current branch: ${CYAN}$CURRENT_BRANCH${NC}"
print_info "Base branch: ${CYAN}$BASE_BRANCH${NC}"

# Check if we're on main/master
if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
    print_error "Cannot create PR from main/master branch"
    echo "Please switch to a feature branch first"
    exit 1
fi
print_success "Feature branch verified"

# Check if base branch exists
if ! git rev-parse --verify "$BASE_BRANCH" &> /dev/null; then
    print_warning "Base branch '$BASE_BRANCH' not found locally, will use remote"
fi

echo ""

# =============================================================================
# Analyze Branch
# =============================================================================

print_header "Analyzing Branch: $CURRENT_BRANCH"

# Get commit count
COMMIT_COUNT=$(git log --oneline ${BASE_BRANCH}..${CURRENT_BRANCH} 2>/dev/null | wc -l | tr -d ' ')
if [ "$COMMIT_COUNT" = "0" ]; then
    print_error "No commits found in branch compared to $BASE_BRANCH"
    exit 1
fi
print_step "Found ${GREEN}$COMMIT_COUNT${NC} commit(s)"

# Get commits
print_step "Commit history:"
git log --oneline ${BASE_BRANCH}..${CURRENT_BRANCH} 2>/dev/null | sed 's/^/  /'

echo ""

# Get file stats
print_step "Files changed:"
git diff ${BASE_BRANCH}...${CURRENT_BRANCH} --stat 2>/dev/null | sed 's/^/  /'

echo ""

# =============================================================================
# Find Documentation Files
# =============================================================================

print_header "Looking for PR Documentation"

# Extract PR number from branch name (e.g., feature/pr-4-shapes -> PR-4)
PR_NUMBER=""
if [[ $CURRENT_BRANCH =~ pr-([0-9]+) ]] || [[ $CURRENT_BRANCH =~ PR-([0-9]+) ]]; then
    PR_NUMBER="${BASH_REMATCH[1]}"
    print_info "Detected PR number: ${GREEN}#$PR_NUMBER${NC}"
fi

# Find documentation files
DOC_FILES=()
if [ -n "$PR_NUMBER" ]; then
    # Look for PR-specific docs
    for pattern in "PR-$PR_NUMBER-SUMMARY.md" "PR-$PR_NUMBER-IMPLEMENTATION.md" "PR-$PR_NUMBER-DESCRIPTION.md"; do
        if [ -f "$pattern" ]; then
            DOC_FILES+=("$pattern")
            print_success "Found: $pattern"
        fi
    done
fi

# Fallback: Look for any recent PR docs
if [ ${#DOC_FILES[@]} -eq 0 ]; then
    print_warning "No PR-specific docs found, looking for recent docs..."
    while IFS= read -r -d '' file; do
        DOC_FILES+=("$file")
        print_info "Found: $(basename "$file")"
    done < <(find . -maxdepth 1 -name "PR-*-SUMMARY.md" -o -name "PR-*-DESCRIPTION.md" -print0 2>/dev/null | head -1)
fi

if [ ${#DOC_FILES[@]} -eq 0 ]; then
    print_warning "No documentation files found"
    print_info "Will create a basic PR description from commits"
fi

echo ""

# =============================================================================
# Generate PR Title
# =============================================================================

print_header "Generating PR Title"

PR_TITLE=""

# Try to extract title from first commit or doc file
if [ ${#DOC_FILES[@]} -gt 0 ]; then
    # Extract title from first heading in doc
    FIRST_DOC="${DOC_FILES[0]}"
    PR_TITLE=$(head -1 "$FIRST_DOC" | sed 's/^# //' | sed 's/^## //')
    print_step "From documentation: ${GREEN}$PR_TITLE${NC}"
elif [ -f "PR-$PR_NUMBER-SUMMARY.md" ]; then
    PR_TITLE=$(head -1 "PR-$PR_NUMBER-SUMMARY.md" | sed 's/^# //')
    print_step "From summary: ${GREEN}$PR_TITLE${NC}"
else
    # Use first commit message
    FIRST_COMMIT=$(git log --oneline ${BASE_BRANCH}..${CURRENT_BRANCH} 2>/dev/null | tail -1 | cut -d' ' -f2-)
    PR_TITLE="$FIRST_COMMIT"
    print_step "From commit: ${GREEN}$PR_TITLE${NC}"
fi

echo ""

# =============================================================================
# Generate PR Description
# =============================================================================

print_header "Generating PR Description"

# Create temporary file for PR body
PR_BODY_FILE=$(mktemp)

# Start building PR body
{
    echo "## 📋 Summary"
    echo ""
    
    # If we have doc files, extract key sections
    if [ ${#DOC_FILES[@]} -gt 0 ]; then
        print_step "Extracting content from documentation files..."
        
        # Read the summary file
        SUMMARY_FILE="${DOC_FILES[0]}"
        
        # Extract Overview section if it exists
        if grep -q "^## Overview" "$SUMMARY_FILE" 2>/dev/null; then
            sed -n '/^## Overview/,/^##[^#]/p' "$SUMMARY_FILE" | sed '$d'
            echo ""
        fi
        
        # Extract Features section
        if grep -q "^## Features Implemented" "$SUMMARY_FILE" 2>/dev/null; then
            sed -n '/^## Features Implemented/,/^##[^#]/p' "$SUMMARY_FILE" | sed '$d'
            echo ""
        elif grep -q "^## 🎯 Implementation Overview" "$SUMMARY_FILE" 2>/dev/null; then
            sed -n '/^## 🎯 Implementation Overview/,/^##[^#]/p' "$SUMMARY_FILE" | sed '$d'
            echo ""
        fi
        
        # Add checklist if it exists
        if grep -q "^## PR Checklist" "$SUMMARY_FILE" 2>/dev/null; then
            echo "## 🎯 PR Checklist"
            echo ""
            sed -n '/^## PR Checklist/,/^##[^#]/p' "$SUMMARY_FILE" | sed '$d' | tail -n +3
            echo ""
        fi
        
    else
        print_warning "No documentation files, using commit messages..."
        echo "This PR includes the following changes:"
        echo ""
        git log --oneline ${BASE_BRANCH}..${CURRENT_BRANCH} 2>/dev/null | sed 's/^/- /'
        echo ""
    fi
    
    # Add file changes summary
    echo "## 📁 Files Changed"
    echo ""
    echo "\`\`\`"
    git diff ${BASE_BRANCH}...${CURRENT_BRANCH} --stat 2>/dev/null | tail -1
    echo "\`\`\`"
    echo ""
    
    # Add commit history
    echo "## 📈 Commits"
    echo ""
    echo "\`\`\`"
    git log --oneline ${BASE_BRANCH}..${CURRENT_BRANCH} 2>/dev/null
    echo "\`\`\`"
    echo ""
    
    # Add testing instructions if they exist in docs
    if [ ${#DOC_FILES[@]} -gt 0 ]; then
        SUMMARY_FILE="${DOC_FILES[0]}"
        if grep -q "^## Testing Instructions" "$SUMMARY_FILE" 2>/dev/null; then
            echo "## 🧪 Testing Instructions"
            echo ""
            sed -n '/^## Testing Instructions/,/^##[^#]/p' "$SUMMARY_FILE" | sed '$d' | tail -n +3
            echo ""
        elif grep -q "^## 🚀 How to Test" "$SUMMARY_FILE" 2>/dev/null; then
            echo "## 🧪 How to Test"
            echo ""
            sed -n '/^## 🚀 How to Test/,/^##[^#]/p' "$SUMMARY_FILE" | sed '$d' | tail -n +3
            echo ""
        fi
    fi
    
    # Add footer
    echo "---"
    echo ""
    echo "**Generated by:** \`create-pr.sh\`"
    echo "**Branch:** \`$CURRENT_BRANCH\`"
    echo "**Base:** \`$BASE_BRANCH\`"
    
} > "$PR_BODY_FILE"

print_success "PR description generated ($(wc -l < "$PR_BODY_FILE") lines)"

# Show preview
print_info "Preview (first 20 lines):"
head -20 "$PR_BODY_FILE" | sed 's/^/  /'
echo ""

# =============================================================================
# Push Branch
# =============================================================================

print_header "Pushing Branch to Remote"

# Check if branch exists on remote
if git ls-remote --heads origin "$CURRENT_BRANCH" | grep -q "$CURRENT_BRANCH"; then
    print_info "Branch already exists on remote, pushing updates..."
    git push origin "$CURRENT_BRANCH"
else
    print_info "Creating new remote branch..."
    git push -u origin "$CURRENT_BRANCH"
fi

print_success "Branch pushed successfully"
echo ""

# =============================================================================
# Create Pull Request
# =============================================================================

print_header "Creating Pull Request"

print_step "Creating PR: ${GREEN}$PR_TITLE${NC}"
print_step "Target: ${CYAN}$BASE_BRANCH${NC}"

# Create the PR
PR_URL=$(gh pr create \
    --title "$PR_TITLE" \
    --body-file "$PR_BODY_FILE" \
    --base "$BASE_BRANCH" \
    2>&1 | grep -o 'https://github.com[^ ]*')

# Clean up temp file
rm "$PR_BODY_FILE"

if [ -n "$PR_URL" ]; then
    print_success "Pull request created successfully!"
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✨ PR URL: ${CYAN}$PR_URL${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Extract PR number from URL
    PR_NUM=$(echo "$PR_URL" | grep -o '[0-9]*$')
    
    print_info "Quick commands:"
    echo -e "  ${BLUE}View in browser:${NC}  gh pr view $PR_NUM --web"
    echo -e "  ${BLUE}View in terminal:${NC} gh pr view $PR_NUM"
    echo -e "  ${BLUE}Check status:${NC}     gh pr status"
    echo ""
    
    # Ask if user wants to open in browser
    read -p "$(echo -e ${CYAN}Open PR in browser now? [y/N]:${NC} )" -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        gh pr view "$PR_NUM" --web
    fi
    
else
    print_error "Failed to create pull request"
    exit 1
fi

# =============================================================================
# Success Summary
# =============================================================================

print_header "✅ Done!"

echo -e "${GREEN}Successfully created pull request!${NC}"
echo ""
echo "Next steps:"
echo "  1. Review the PR description"
echo "  2. Request reviewers if needed: gh pr edit $PR_NUM --add-reviewer username"
echo "  3. Add labels if needed: gh pr edit $PR_NUM --add-label bug"
echo "  4. Merge when ready: gh pr merge $PR_NUM"
echo ""

