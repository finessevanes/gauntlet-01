# Development Log - CollabCanvas MVP

**Project:** Real-time collaborative canvas (bootcamp MVP assignment)  
**Timeline:** MVP completed in ~24 hours  
**Tech Stack:** React + TypeScript + Firebase (Auth, Firestore, RTDB) + Konva.js  
**Live URL:** [https://gauntlet-01.vercel.app/]  
**Repository:** gauntlet-01/collabcanvas/

---

## Why

MVP assignment for coding bootcamp. Requirements: multi-user real-time canvas with shapes, cursors, presence, and locking. Wanted to try Firebase instead of my usual Supabase stack.

---

## Key Technical Decisions

### 1. React Context over Zustand
**Choice:** AuthContext and CanvasContext instead of Zustand  
**Reason:** More familiar with Context API, cleaner integration with Firebase listeners, sufficient for MVP scope  
**Trade-off:** More boilerplate than Zustand, but better for this use case

### 2. Hybrid Database (RTDB + Firestore)
**Choice:** Firebase Realtime Database for cursors/presence, Firestore for shapes  
**Reason:** RTDB <50ms latency for high-frequency cursor updates (20-30 FPS), Firestore for persistent structured data  
**Impact:** Perfect performance split - smooth cursors + reliable shape sync

### 3. Optimistic Selection for Shape Locking
**Choice:** Immediate local selection + background lock check (Figma-style)  
**Reason:** Can't gate synchronous drag events on async lock operations (~200-500ms in production)  
**Result:** Instant drag response regardless of network latency

---

## Gotchas/Dragons

### 1. Dependencies in Wrong Directory ⚠️
**Issue:** Installed npm packages in project root instead of `collabcanvas/` folder  
**Symptoms:** Commands like `npm run dev` failed, "command does not exist" errors  
**Root Cause:** Project structure has root at `gauntlet-01/` but app lives in `collabcanvas/` subdirectory  
**Solution:** Always `cd collabcanvas` before running any npm/firebase commands  
**Prevention:** Document working directory clearly in all guides

### 2. Firebase CLI Command Confusion
**Issue:** Cursor AI kept suggesting `npm firebase` when command was `npx firebase`  
**Impact:** Wasted time on invalid commands  
**Solution:** Use `npx firebase` for all Firebase CLI operations, or install globally with `npm i -g firebase-tools`

### 3. Brave Browser Blocks Real-Time Sync 🔥
**Issue:** Real-time sync worked in Chrome but not in Brave  
**Symptoms:** Cursors don't update, shapes don't sync, presence list frozen  
**Root Cause:** Brave's Shield feature blocks WebSocket connections (Firebase RTDB uses WebSockets)  
**Solution:** Disable Shields for localhost and production domain  
**Impact:** Critical - app appears broken without disabling Shields  
**Note:** Document prominently for testers using Brave

### 4. Firestore Security Rules Breaking Sync
**Issue:** Shapes weren't syncing between users at one point  
**Symptoms:** Could create shapes but other users couldn't see them  
**Root Cause:** Firestore rules were too restrictive (incorrect read/write permissions)  
**Solution:** Fixed rules in `firestore.rules` to allow authenticated reads/writes on shapes collection  
**Prevention:** Test security rules in emulator before deploying

### 5. Shape Drag-Drop Bug (Production Only)
**Issue:** Shapes were randomly not draggable in production, but worked fine locally  
**Symptoms:** Click and drag → shape doesn't move, inconsistent behavior  
**Root Cause:** Pessimistic locking architecture. Async lock request took 200-500ms in production vs 10-50ms locally. By the time lock completed, drag gesture had already started and been blocked.  
**Real Problem:** Used "lock = permission to drag" instead of "lock = conflict indicator metadata"  
**Solution:** Switched to optimistic selection (set selected immediately, lock in background). Changed `draggable={isLockedByMe}` to `draggable={!isLockedByOther}`  
**Result:** Instant drag response, conflicts handled gracefully with toast + revert  
**Reference:** `BUG-DRAG-DROP-INVESTIGATION.md` for full technical breakdown

---

## Cursor AI Workflow (Game Changer)

### What Worked
1. **Prompt Pattern:** "This is the plan [task.md], I'm working on Phase X, build it"
2. **Auto-Generated Docs:** Cursor would generate:
   - Implementation doc (all technical details)
   - Testing doc (edge cases I wouldn't have thought of)
   - Quick-start guide (2-minute validation)
3. **Result:** Found bugs early, no context loss between sessions, 2-3x faster velocity

### PR Automation Script
**Problem:** Creating PR summaries was repetitive  
**Solution:** Created script that:
- Grabs recent commits
- Generates summary from commit messages + implementation docs
- Creates PR with summary
**Impact:** Saved 10-15 minutes per PR, more consistent documentation

**Reference:** See `DOCS-GUIDE.md` for full workflow, `docs/templates/` for all templates

---

## How to Use It

### Local Setup (5 minutes)
```bash
# 1. Clone and navigate
git clone [repo-url]
cd gauntlet-01/collabcanvas

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env
# Edit .env with your Firebase config

# 4. Start Firebase emulators (Terminal 1)
firebase emulators:start

# 5. Start dev server (Terminal 2)
npm run dev

# Open http://localhost:5173
# Emulator UI: http://localhost:4000
```

### Testing Multi-User (Required)
- **User A:** Incognito window
- **User B:** Normal window
- **User C:** Different browser (Firefox/Safari)
- **Brave users:** Disable Shields or tests will fail

### What Works
- 2+ users simultaneously create rectangles
- Real-time cursor tracking (<50ms latency)
- Presence awareness (who's online)
- Shape locking (green = mine, red = locked by other)
- Drag to move shapes
- 60 FPS interactions, 500+ shapes supported

---

## What's Left

### MVP Complete ✅
All requirements from PRD met and deployed.

### Known Issues
1. **Brave Browser:** Shields must be disabled for real-time sync to work
2. **Lock Race Condition:** If 2 users click shape within ~50ms, one may get locked out (acceptable for MVP, <1% occurrence)

### Future Enhancements (Not MVP)
- Delete shapes
- Resize/rotate handles  
- Multi-select
- Color picker (currently 4 preset colors)
- Undo/redo
- Shape history/versions

---

## What Actually Mattered

1. **Test plans before code** - Caught 60-80% of bugs before implementation
2. **Document immediately** - Gotchas documented right after fixing saved 3-4 hours total
3. **Multi-browser testing from day 1** - Caught sync issues early
4. **Service layer architecture** - Made testing with emulators painless, AI-ready for Phase 2
5. **Optimistic UI patterns** - Only way to make real-time collaboration feel instant

---

## Metrics

- **Time to MVP:** ~24 hours (initial 7 PRs) + enhancements (19+ PRs total)
- **Lines of Code:** ~3,500 (excluding docs)
- **Documentation:** 5 core docs + 51 archived PR docs + templates
- **Test Coverage:** Unit + integration tests for all services
- **Performance:** 60 FPS with 500+ shapes, 5+ concurrent users
- **Bugs in Production:** 1 major (drag-drop, fixed with optimistic selection)

---

**For testers:** Clone repo, disable Brave Shields if using Brave, run `npm run emulators` then `npm run dev`, open 2+ incognito windows to test multi-user features.

**For developers:** Read `DOCS-GUIDE.md` for documentation workflow, `GOTCHAS.md` for debugging, `ARCHITECTURE.md` for technical decisions.

**Last Updated:** October 14, 2025  
**Status:** MVP complete, deployed, tested with 5+ users

