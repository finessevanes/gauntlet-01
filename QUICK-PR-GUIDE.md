# ⚡ Quick PR Creation Guide

## TL;DR

```bash
# One-time setup (30 seconds)
./setup-pr-alias.sh

# Then forever after, just:
pr
```

That's it! 🎉

---

## The Problem This Solves

Creating PRs manually is tedious:
1. Push branch
2. Open GitHub
3. Click buttons
4. Copy-paste documentation
5. Format everything
6. Submit

**Time: 5-10 minutes** 😫

## The Solution

```bash
pr
```

**Time: 10 seconds** ✨

---

## Setup (Only Once)

### Option 1: Quick Setup (Recommended)

```bash
cd /Users/finessevanes/Desktop/gauntlet-01
./setup-pr-alias.sh
```

This creates a global `pr` command. Done!

### Option 2: Manual Setup

```bash
# Add to ~/.zshrc (or ~/.bashrc)
echo 'alias pr="~/Desktop/gauntlet-01/create-pr.sh"' >> ~/.zshrc
source ~/.zshrc
```

---

## Usage

### Basic - Create PR to main

```bash
pr
```

### Advanced - Create PR to different branch

```bash
pr develop
```

That's literally it. The script does everything:
- ✅ Analyzes your commits
- ✅ Finds your documentation (PR-X-SUMMARY.md)
- ✅ Generates beautiful description
- ✅ Pushes branch
- ✅ Creates PR
- ✅ Opens in browser

---

## What It Looks Like

```
╔════════════════════════════════════════════════════════════════════╗
║  PR Creation Script - Pre-flight Checks
╚════════════════════════════════════════════════════════════════════╝

✓ GitHub CLI found
✓ Git repository detected
✓ Feature branch verified

╔════════════════════════════════════════════════════════════════════╗
║  Analyzing Branch: feature/awesome-feature
╚════════════════════════════════════════════════════════════════════╝

▶ Found 5 commit(s)
✓ Found: PR-4-SUMMARY.md

╔════════════════════════════════════════════════════════════════════╗
║  Creating Pull Request
╚════════════════════════════════════════════════════════════════════╝

✓ Pull request created successfully!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ PR URL: https://github.com/finessevanes/gauntlet-01/pull/6
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Open PR in browser now? [y/N]:
```

---

## Pro Tips

### 1. Keep Documentation Updated

The script automatically uses your `PR-X-SUMMARY.md` files. Keep them updated as you work!

### 2. Branch Naming

Name branches with PR numbers for automatic detection:
- `feature/pr-4-shapes` → Finds `PR-4-SUMMARY.md` ✅
- `feature/shapes` → Uses commit messages (still works!) ✅

### 3. Quick View Commands

After creating a PR:
```bash
gh pr view 5 --web    # Open in browser
gh pr view 5          # View in terminal
gh pr status          # Check all your PRs
```

### 4. Chain Commands

```bash
# Create PR and immediately view
pr && gh pr view --web
```

---

## Requirements

- GitHub CLI (`gh`)
- Git repository
- Feature branch with commits

### Install GitHub CLI

```bash
brew install gh
gh auth login
```

---

## Examples

### Example 1: Feature with Docs

```bash
# You're on: feature/pr-5-locking
# You have: PR-5-SUMMARY.md

$ pr

# Result: Beautiful PR with all your docs! ✨
```

### Example 2: Quick Fix

```bash
# You're on: bugfix/cursor-issue
# No docs (that's fine!)

$ pr

# Result: Clean PR with commit messages! ✨
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `gh: command not found` | `brew install gh` |
| Not authenticated | `gh auth login` |
| No commits found | Make sure you have commits: `git log main..HEAD` |
| Wrong directory | `cd` to repository root |

---

## Why This Is Awesome

### Before
```
git push origin feature/my-branch
# Open browser
# Go to GitHub
# Click "New Pull Request"
# Click branch dropdown
# Select branch
# Copy from PR-4-SUMMARY.md
# Paste in description
# Format markdown
# Add sections
# Click "Create Pull Request"
# Wait for page to load
```
⏱️ **5-10 minutes**

### After
```
pr
```
⏱️ **10 seconds**

---

## Full Documentation

For complete details, see:
- [`PR-AUTOMATION.md`](PR-AUTOMATION.md) - Full documentation
- [`create-pr.sh`](create-pr.sh) - The script itself

---

## One-Liner Quick Reference

```bash
# Setup
./setup-pr-alias.sh

# Use
pr                    # Create PR to main
pr develop           # Create PR to develop
gh pr view 5 --web  # View PR in browser
```

---

**Happy PR-ing!** 🚀

*Made with ❤️ for efficient developers*

