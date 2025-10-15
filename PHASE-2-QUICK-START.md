# Phase 2 Quick Start

## Your Questions Answered

### ✅ How do I create PRs into develop?
```bash
pr develop
```

### ✅ How do I deploy develop without overwriting production?
Vercel does this automatically!

- `main` → `gauntlet-01.vercel.app` (production, stays safe)
- `develop` → `gauntlet-01-git-develop-*.vercel.app` (staging)
- `feature/*` → Each gets own preview URL

**Production is NEVER overwritten unless you merge to `main`.** 🔒

---

## Start Phase 2 Development

```bash
# 1. Create feature branch
git checkout develop
git checkout -b feature/resize-shapes

# 2. Code your feature
git commit -am "feat: add resize handles"

# 3. Create PR into develop
pr develop

# 4. Test on preview URL (Vercel comments with link)

# 5. Merge when ready
gh pr merge [number]

# 6. Repeat for all Phase 2 features

# 7. Final release to production
git checkout develop && pr  # develop → main
```

---

## That's It!

Your existing `pr` command and Vercel already support everything.

**For complete details:** See [`.github/workflows/develop.md`](.github/workflows/develop.md)

**For PR commands:** See [`.pr-cheatsheet`](.pr-cheatsheet)

**Start coding!** 🚀
