# Gauntlet-01: CollabCanvas

A collaborative drawing application built with React, TypeScript, Firebase, and Konva.

## 🚀 Quick Start

See the [CollabCanvas README](./collabcanvas/README.md) for application setup and usage.

## ⚡ PR Automation

This repository includes an **intelligent PR creation tool** that automates the entire pull request workflow!

### Setup (30 seconds)

```bash
./docs/archive/scripts/setup-pr-alias.sh
```

### Usage

```bash
pr            # Create PR into main
pr develop    # Create PR into develop (Phase 2)
```

That's it! The script will:
- ✅ Analyze your commits
- ✅ Find your documentation (PR-X-SUMMARY.md files)
- ✅ Generate a comprehensive PR description
- ✅ Push your branch
- ✅ Create the PR
- ✅ Open it in your browser

**See:** [.pr-cheatsheet](.pr-cheatsheet) for quick reference.

### Benefits

**Before (Manual):** 5-10 minutes of copy-pasting and formatting  
**After (Automated):** 10 seconds, one command ✨

---

## 🎨 Phase 2 Development (In Progress)

Building Phase 2 features on the `develop` branch to keep production stable.

### Quick Start

```bash
# Start Phase 2 feature
git checkout develop
git checkout -b feature/resize-shapes

# Create PR into develop
pr develop
```

**See:** [PHASE-2-QUICK-START.md](PHASE-2-QUICK-START.md) for complete Phase 2 workflow.

### Deployment Strategy

| Branch | URL | Purpose |
|--------|-----|---------|
| `main` | `gauntlet-01.vercel.app` | Production (MVP) |
| `develop` | `gauntlet-01-git-develop-*.vercel.app` | Staging (Phase 2) |
| `feature/*` | `gauntlet-01-git-[branch]-*.vercel.app` | Testing |

Vercel automatically creates preview URLs for all branches. Production is never overwritten! ✅

## 📁 Repository Structure

```
gauntlet-01/
├── .github/
│   ├── workflows/
│   │   └── develop.md            # 📘 Phase 2 workflow guide
│   └── PULL_REQUEST_TEMPLATE.md  # PR template
│
├── collabcanvas/                 # Main application
│   ├── src/                      # Source code
│   ├── tests/                    # Test files
│   └── README.md                 # App docs
│
├── docs/
│   ├── architecture.md           # System design
│   └── archive/                  # Phase 1 docs & scripts
│       └── scripts/
│           ├── create-pr.sh      # PR automation
│           └── setup-pr-alias.sh # Setup script
│
├── PHASE-2-QUICK-START.md        # ⚡ Start here!
├── prd-postmvp.md                # Phase 2 requirements
├── .pr-cheatsheet                # PR commands
└── README.md                     # This file
```

## 🛠️ Available Scripts

### PR Creation

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

### Phase 2 (Current Development)
- [PHASE-2-QUICK-START.md](./PHASE-2-QUICK-START.md) - ⚡ Start here!
- [.github/workflows/develop.md](./.github/workflows/develop.md) - 📘 Complete workflow
- [.pr-cheatsheet](./.pr-cheatsheet) - 📋 PR commands
- [prd-postmvp.md](./prd-postmvp.md) - Phase 2 requirements

### Application
- [CollabCanvas README](./collabcanvas/README.md) - App setup & usage
- [Architecture](./docs/architecture.md) - System design

### Phase 1 (MVP - Completed)
- [docs/archive/](./docs/archive/) - Historical docs & PR summaries

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

