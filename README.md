# Gauntlet-01: CollabCanvas

A collaborative drawing application built with React, TypeScript, Firebase, and Konva.

## 🚀 Quick Start

See the [CollabCanvas README](./collabcanvas/README.md) for application setup and usage.

## ⚡ PR Automation

This repository includes an **intelligent PR creation tool** that automates the entire pull request workflow!

### Setup (30 seconds)

```bash
./setup-pr-alias.sh
```

### Usage

```bash
pr
```

That's it! The script will:
- ✅ Analyze your commits
- ✅ Find your documentation (PR-X-SUMMARY.md files)
- ✅ Generate a comprehensive PR description
- ✅ Push your branch
- ✅ Create the PR
- ✅ Open it in your browser

**See:** [QUICK-PR-GUIDE.md](QUICK-PR-GUIDE.md) for quick reference or [PR-AUTOMATION.md](PR-AUTOMATION.md) for complete documentation.

### Benefits

**Before (Manual):** 5-10 minutes of copy-pasting and formatting  
**After (Automated):** 10 seconds, one command ✨

## 📁 Repository Structure

```
gauntlet-01/
├── collabcanvas/          # Main application
│   ├── src/               # Source code
│   ├── PR-*-*.md         # PR documentation
│   └── README.md         # App documentation
│
├── docs/                  # Project documentation
│   ├── prd.md            # Product requirements
│   ├── task.md           # Development tasks
│   └── architecture.md   # Architecture docs
│
├── create-pr.sh          # 🌟 PR automation script
├── setup-pr-alias.sh     # Quick setup for 'pr' alias
├── QUICK-PR-GUIDE.md     # Quick reference
└── PR-AUTOMATION.md      # Full automation docs
```

## 🛠️ Available Scripts

### PR Creation (New! 🎉)

```bash
# Create PR for current branch
./create-pr.sh

# Create PR to specific base branch
./create-pr.sh develop

# After setup, just:
pr
```

### Development

```bash
cd collabcanvas

# Start Firebase emulators
firebase emulators:start

# Start dev server (in another terminal)
npm run dev
```

## 📖 Documentation

### Application Docs
- [CollabCanvas README](./collabcanvas/README.md) - App setup and usage
- [Product Requirements](./docs/prd.md) - Feature specifications
- [Architecture](./docs/architecture.md) - System design
- [Development Tasks](./docs/task.md) - Implementation roadmap

### PR Docs
- [Quick PR Guide](./QUICK-PR-GUIDE.md) - ⚡ TL;DR version
- [PR Automation Guide](./PR-AUTOMATION.md) - 📚 Complete documentation
- [Individual PR Summaries](./collabcanvas/) - PR-X-SUMMARY.md files

## 🎯 Project Status

Current features:
- ✅ Firebase Emulators setup
- ✅ User authentication (signup/login)
- ✅ Canvas with pan/zoom
- ✅ Real-time cursor tracking
- ✅ User presence awareness
- ✅ Shape creation (rectangles)
- ✅ Real-time shape sync

See [CollabCanvas README](./collabcanvas/README.md) for detailed feature list.

## 🤝 Contributing

### Creating a PR

We've made this super easy! Just:

1. Create your feature branch
2. Make your changes
3. Write a `PR-X-SUMMARY.md` file (optional but recommended)
4. Run: `pr`

The script handles the rest! See [QUICK-PR-GUIDE.md](QUICK-PR-GUIDE.md) for details.

### PR Documentation Template

If you want the script to generate beautiful PRs, create a `PR-X-SUMMARY.md` file with these sections:

```markdown
# PR #X: Your Feature Title

## Overview
Brief description...

## Features Implemented
- ✅ Feature 1
- ✅ Feature 2

## PR Checklist
- ✅ Tests passing
- ✅ Docs updated

## Testing Instructions
1. Step 1
2. Step 2
```

The script will automatically extract and format these sections!

## 🔧 Requirements

- Node.js 18+
- Firebase CLI
- GitHub CLI (`gh`) - for PR automation

### Install GitHub CLI

```bash
brew install gh
gh auth login
```

## 📝 License

MIT

## ✨ Key Features

### CollabCanvas App
- Real-time multiplayer drawing
- Firebase Emulator development (no cloud costs!)
- Beautiful modern UI
- Smooth 60 FPS canvas performance
- <100ms sync latency

### PR Automation Tool 🆕
- One-command PR creation
- Automatic documentation extraction
- Beautiful formatting
- Saves 5-10 minutes per PR
- Works with or without docs

---

**Ready to contribute?**

1. Clone the repo
2. Run `./setup-pr-alias.sh`
3. Start coding
4. Type `pr` to create your pull request

It's that simple! 🚀

