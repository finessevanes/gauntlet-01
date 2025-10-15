# Phase 2 Development Workflow

## TL;DR

```bash
# Start feature
git checkout develop && git checkout -b feature/resize-shapes

# Create PR into develop (use your existing command!)
pr develop

# Merge when ready
gh pr merge [number]

# When Phase 2 complete
git checkout develop && pr  # Merges develop → main
```

---

## Answers to Your Questions

### Q: How do I create PRs into develop?
**A:** `pr develop` (your existing `pr` command already works!)

### Q: How do I deploy develop without overwriting production?
**A:** Vercel does this automatically - **zero config needed!**

| Branch | URL | Updates When |
|--------|-----|--------------|
| `main` | `gauntlet-01.vercel.app` | Merge to main only |
| `develop` | `gauntlet-01-git-develop-*.vercel.app` | Merge to develop |
| `feature/*` | `gauntlet-01-git-[branch]-*.vercel.app` | Push to branch |

**Production is NEVER overwritten unless you merge to `main`.** ✅

---

## Phase 2 Development Flow

```
main (production)           ← gauntlet-01.vercel.app
  └── develop (staging)     ← preview URL
       ├── feature/resize-shapes
       ├── feature/rotate-shapes
       ├── feature/text-layers
       └── ... (all Phase 2 features)
```

### 1. Start Feature
```bash
git checkout develop
git pull origin develop
git checkout -b feature/resize-shapes
```

### 2. Code & Commit
```bash
# Make changes in collabcanvas/
git add .
git commit -m "feat: add resize handles with 8 control points"
```

### 3. Create PR into Develop
```bash
pr develop
```

Your existing automation:
- ✅ Pushes branch
- ✅ Creates PR (base: develop)
- ✅ Generates description from your docs
- ✅ Opens in browser
- ✅ Vercel deploys preview (~2 min)

### 4. Test on Preview URL
- Vercel comments on PR with preview link
- Open 2+ browser tabs to test real-time sync
- Verify <100ms latency, 60 FPS maintained

### 5. Merge to Develop
```bash
gh pr merge [number]  # Or merge via GitHub UI
```

### 6. Repeat for All Features
Continue until all Phase 2 features are merged into `develop`

### 7. Final Release to Production
```bash
git checkout develop
git pull origin develop
pr  # Creates PR: develop → main
```

Merge this to deploy Phase 2 to production! 🚀

---

## Essential Commands

### Daily Use
```bash
pr develop              # Create PR into develop
pr                      # Create PR into main
gh pr status            # See your PRs
gh pr view --web        # Open current PR
gh pr list --base dev   # List PRs into develop
gh pr merge [num]       # Merge PR
```

### Branch Management
```bash
# Update feature with latest develop
git checkout feature/NAME
git merge develop
git push

# Switch branches
git checkout develop
git checkout main
```

---

## Finding Preview URLs

**Method 1: PR Comments (Easiest)**
Vercel automatically comments with preview link

**Method 2: Vercel Dashboard**
vercel.com/dashboard → gauntlet-01 → Deployments

**Method 3: URL Pattern**
`https://gauntlet-01-git-[branch-name]-[github-user].vercel.app/`

---

## Testing Strategy

**Tier 1: Local** → `npm run dev` in collabcanvas/  
**Tier 2: Feature Preview** → Test isolated feature  
**Tier 3: Develop Preview** → Test integrated features (staging)  
**Tier 4: Production** → Only after develop → main merge

---

## Branch Protection (Recommended)

GitHub Settings → Branches → Add rule for `develop`:
- ☑ Require pull request before merging
- ☐ Require reviews (optional for solo dev)

Prevents accidental direct pushes to develop.

---

## Troubleshooting

**Preview URL shows 404**
- Wait 2-3 minutes for Vercel build
- Hard refresh: Cmd+Shift+R
- Check Vercel dashboard for build errors

**Can't create PR into develop**
- Use `pr develop` not just `pr`
- Or: `gh pr create --base develop`

**Merge conflicts**
```bash
git checkout feature/NAME
git merge develop
# Resolve conflicts
git push
```

**Production got overwritten?**
- Impossible! Vercel only updates production on `main` merges
- All other branches get preview URLs

---

## Phase 2 Feature Checklist

Core (PR #8-12):
- [ ] Resize shapes (8 handles)
- [ ] Rotate shapes
- [ ] Text layers + formatting
- [ ] Delete & Duplicate
- [ ] Circles & Triangles

Advanced (PR #13-19):
- [ ] Multi-select (shift + marquee)
- [ ] Grouping/ungrouping
- [ ] Z-index (4 operations)
- [ ] Alignment (6 tools + distribute)
- [ ] Keyboard shortcuts (10+)
- [ ] Copy/paste
- [ ] Comments

AI (PR #20-22):
- [ ] AI service + 15 tools
- [ ] Chat interface
- [ ] Layout commands (CRITICAL!)
- [ ] Complex commands

---

## Example Session

```bash
# Day 1: Resize feature
git checkout develop
git checkout -b feature/resize-shapes
# ... code ...
git commit -am "feat: add resize handles"
pr develop
# Test on preview, merge when ready

# Day 2: Rotate feature  
git checkout develop
git pull origin develop
git checkout -b feature/rotate-shapes
# ... code ...
pr develop
# Test, merge

# Continue for all features...

# Final: Release to production
git checkout develop
pr  # develop → main
# Merge → Phase 2 live! 🎉
```

---

## See Also

- `PHASE-2-QUICK-START.md` - Quick start guide
- `.pr-cheatsheet` - PR command reference
- `prd-postmvp.md` - Phase 2 requirements
- `.github/PULL_REQUEST_TEMPLATE.md` - PR template

---

**You're all set!** Your existing tools already support everything. Just use `pr develop` and start building! 🚀

