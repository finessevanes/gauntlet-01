# Documentation Strategy Guide

## Why This Approach Works

During CollabCanvas MVP development (October 2025), we used a structured documentation pattern that enabled **24-hour feature delivery** with high quality. This guide teaches you how to replicate that velocity.

## The Core Discovery

Traditional "update docs at the end" doesn't work with AI agents. Instead, we discovered:

1. **Write test plans BEFORE code** → Defines "done" upfront, catches edge cases
2. **Document gotchas IMMEDIATELY** → Save hours of debugging later
3. **Create per-PR docs** → Clear context for AI agents across sessions
4. **Make everything copy-pasteable** → Reduce friction to zero

**Result:** 7 major features (Auth, Canvas, Cursors, Shapes, Locking, Tests, Deploy) in ~24 hours with zero stuck locks, smooth 60 FPS, and <50ms latency.

---

## The Pattern: 5 Doc Types Per Feature

### 1. `PR-N-SUMMARY.md` - Implementation Record
**When:** After completing the feature  
**Purpose:** Architecture decisions, file changes, key learnings  
**AI Benefit:** Context for debugging, future features building on this  

**Sections:**
- Implementation Overview
- Files Created/Modified (with purpose)
- Architecture Decisions (with rationale)
- Testing Instructions (explicit, multi-user)
- Known Issues/Limitations
- Next Steps

### 2. `PR-N-TEST-PLAN.md` - Success Criteria
**When:** BEFORE starting implementation ⚡  
**Purpose:** Define "done", enumerate edge cases  
**AI Benefit:** Agent knows exactly what to build/test  

**Critical:** Use checkboxes `[ ]` for every test case.

**Sections:**
- Setup Instructions
- Test Scenarios:
  - Happy path (basic functionality)
  - Edge cases (negative drags, timeouts, disconnects)
  - Multi-user (2-3 browsers)
  - Performance (FPS, latency)
  - Error handling
- Success Criteria

### 3. `PR-N-QUICK-START.md` - 30-Second Validation
**When:** Right after implementation  
**Purpose:** Fast validation for you/reviewers  
**AI Benefit:** Quick feedback loop  

**Keep under 20 lines:**
- Prerequisites (1 line)
- Setup (2-3 commands)
- Test Steps (3-5 actions)
- Expected Result (what success looks like)

### 4. `PR-N-IMPLEMENTATION-STATUS.md` - Living Context
**When:** During implementation (updated as you go)  
**Purpose:** Track decisions, blockers, open questions  
**AI Benefit:** Resume context after interruptions  

**Sections:**
- Completed
- In Progress
- Blocked/Questions
- Decisions Made

### 5. `TROUBLESHOOTING.md` Updates - Bug Database
**When:** Immediately after fixing any bug  
**Purpose:** Document symptoms + solutions  
**AI Benefit:** Agents can search here first before trying fixes  

**Format:**
```markdown
### [Error Name]
**Symptoms:** What you see
**Solutions:** Copy-pasteable fix commands
**Check:** How to verify it's fixed
```

---

## Gotcha: When to Consolidate

✅ **Keep detailed per-PR docs during active development** (PRs 0-7)  
⏰ **Consolidate after MVP completion**:
- Move PR docs to `docs/archive/`
- Extract gotchas into `GOTCHAS.md`
- Extract test patterns into `SETUP.md`
- Keep templates + guide for future features

---

## Real Example: How This Accelerated CollabCanvas

### PR #3: Cursor Sync (2-3 hours)

**Test Plan Written First:**
- Revealed canvas bounds issue (cursors showing in gray area)
- Caught coordinate transformation edge case
- Defined 20-30 FPS target before implementation

**Result:** Zero bugs in production, passed all 15 test cases first try.

### PR #5: Shape Locking (2 hours)

**Quick-Start Doc:**
- 2 browsers, 5 steps, see lock in <2 minutes
- Enabled rapid iteration on lock timeout logic
- Made reviewer validation instant

**Result:** Lock mechanism worked perfectly with 5 concurrent users.

### Semver Bug (saved 3 hours)

**Documented in TROUBLESHOOTING.md:**
- Next time it happened, just searched "semver"
- Copy-pasted fix commands
- 30 seconds vs 1 hour of debugging

### Lock Race Condition

**Documented as "known limitation":**
- Stopped us from over-engineering
- Saved 4+ hours on premature optimization
- Clear path to upgrade post-MVP (Firestore transactions)

---

## How to Use With AI Agents (Cursor/Claude)

### Step 1: Start with Test Plan
```
Before writing any code, prompt agent:

"Create a test plan for [feature] following docs/templates/PR-TEST-PLAN-TEMPLATE.md.
Include happy path, edge cases, multi-user scenarios, and performance targets.
Reference: docs/archive/PR-3-TEST-PLAN.md for format."
```

### Step 2: Implement Feature
```
"Implement [feature] according to PR-N-TEST-PLAN.md.
Update PR-N-IMPLEMENTATION-STATUS.md as you go.
Document any architecture decisions."
```

### Step 3: Create Summary
```
"Create a PR summary following docs/templates/PR-SUMMARY-TEMPLATE.md.
Include all files changed, architecture decisions, and testing instructions."
```

### Step 4: Document Gotchas
```
"Add any bugs we encountered to GOTCHAS.md with:
- Issue description
- Symptoms
- Solution
- Root cause explanation"
```

### Step 5: Quick Start
```
"Create a 30-second test guide following docs/templates/PR-QUICK-START-TEMPLATE.md.
Keep it under 20 lines, optimize for speed."
```

**Pro Tip:** Give agents file paths to templates - they'll match the format exactly.

---

## Templates Available

All templates in `docs/templates/`:

1. **PR-SUMMARY-TEMPLATE.md** - Three versions:
   - Blank (just headers)
   - Annotated (with guidance comments)
   - Example-filled (placeholder content)

2. **PR-TEST-PLAN-TEMPLATE.md** - Three versions

3. **PR-QUICK-START-TEMPLATE.md** - Three versions

4. **TROUBLESHOOTING-TEMPLATE.md** - Entry format

5. **AI-PROMPTS.md** - Copy-paste prompts for Cursor/Claude/GPT

---

## Worked Example: PR #3 in Archive

See `docs/archive/PR-3-example/` for complete documentation set:
- `PR-3-SUMMARY.md` - Full implementation record
- `PR-3-TEST-PLAN.md` - Test cases with results
- `PR-3-QUICK-START.md` - 2-minute validation
- Annotations explaining why each section exists

**Use this as reference when creating docs for your features.**

---

## Core Documentation Structure

After consolidation, maintain these 5 core docs:

### 1. `README.md`
- Project overview
- Quick start (5 minutes to running app)
- Tech stack
- Link to other docs

### 2. `SETUP.md`
- Firebase emulator setup
- Troubleshooting common issues
- Development environment
- Multi-browser testing

### 3. `ARCHITECTURE.md`
- Data models (schemas)
- Security rules
- Technical decisions (why hybrid DB, service layer, etc.)
- Performance targets

### 4. `GOTCHAS.md`
- Lessons learned
- Edge cases
- Known limitations
- Bug solutions

### 5. `DOCS-GUIDE.md` (this file)
- Documentation pattern
- How to use templates
- AI agent prompts

---

## Anti-Patterns (Don't Do This)

❌ **"I'll document it later"** → Never happens, context lost  
✅ **Document gotchas immediately after fixing**

❌ **Generic test plan: "Test that it works"** → Useless  
✅ **Explicit: "Open 2 browsers, User A clicks shape, User B should see red border"**

❌ **Code examples in docs** → Gets stale instantly  
✅ **Schemas, decisions, gotchas only - code is source of truth**

❌ **100-line setup guide** → Nobody reads it  
✅ **Quick-start in 20 lines, detailed guide separate**

❌ **Keeping all PR docs forever** → Overwhelming  
✅ **Archive after MVP, keep templates + 1 example**

---

## Metrics: Why This Works

### Without This Pattern:
- Feature implementation: 4-6 hours
- Debugging mystery bugs: 2-3 hours
- Context switching cost: 1-2 hours
- **Total per feature: 7-11 hours**

### With This Pattern:
- Test plan (20 min) + Implementation (2-3 hours) + Docs (20 min): 3-4 hours
- Bugs caught early by test plan: Save 2 hours
- Context preserved across sessions: Save 1-2 hours
- **Total per feature: 3-4 hours**

**Speedup: 2-3x faster** 🚀

---

## Adapting This Pattern

### For Different Projects:

**Backend APIs:**
- Add API contract doc (request/response examples)
- Add integration test scenarios
- Keep architecture decisions

**Mobile Apps:**
- Add device testing matrix
- Add screenshot comparisons
- Keep UX flow documentation

**Data Pipelines:**
- Add data schema changes
- Add backfill procedures
- Keep performance benchmarks

**Core principle stays the same:** Define success criteria first, document gotchas immediately, provide templates for consistency.

---

## Getting Started

### First Feature With This Pattern:

1. **Copy template:** `cp docs/templates/PR-TEST-PLAN-TEMPLATE.md PR-8-TEST-PLAN.md`
2. **Fill in test cases** (before coding!)
3. **Give to AI agent:** "Implement according to PR-8-TEST-PLAN.md"
4. **Update as you go:** Check off test cases, note issues
5. **Create summary:** `cp docs/templates/PR-SUMMARY-TEMPLATE.md PR-8-SUMMARY.md`
6. **Extract gotchas:** Add to `GOTCHAS.md`

**Time investment:** +30 minutes per feature  
**Time saved:** 2-4 hours per feature  
**ROI:** 4-8x return

---

## Questions & Iteration

This pattern emerged from building CollabCanvas MVP in 24 hours. It's **opinionated** but **flexible**.

**Adapt it to your workflow:**
- Too many docs? Drop Implementation Status
- Need more detail? Add Architecture Decision Records (ADRs)
- Different domain? Adjust templates

**Core principles to keep:**
1. Test plans before code
2. Gotchas documented immediately
3. Templates for consistency
4. AI agents get explicit instructions

---

## Resources

- **Templates:** `docs/templates/`
- **AI Prompts:** `docs/templates/AI-PROMPTS.md`
- **Worked Example:** `docs/archive/PR-3-example/`
- **Full Archive:** `docs/archive/` (all 7 PRs)

---

## Meta: This Guide Is Living Documentation

As you use this pattern:
- Update templates based on what works
- Add new prompt examples
- Document new gotchas in the pattern itself

**This guide should evolve with your workflow.**

---

Built with ⚡ during CollabCanvas MVP (October 2025)  
Pattern discovered through 7 PRs, 43 docs, and lots of iteration.

---

## Quick Reference Card

```
BEFORE CODING:
[ ] Create PR-N-TEST-PLAN.md (use template)
[ ] Give test plan to AI agent

DURING CODING:
[ ] Update PR-N-IMPLEMENTATION-STATUS.md
[ ] Document bugs in TROUBLESHOOTING.md immediately

AFTER CODING:
[ ] Create PR-N-SUMMARY.md (use template)
[ ] Create PR-N-QUICK-START.md (under 20 lines)
[ ] Extract gotchas to GOTCHAS.md
[ ] Run through test plan checklist

AFTER MVP:
[ ] Move PR docs to docs/archive/
[ ] Update core docs (README, SETUP, ARCHITECTURE, GOTCHAS)
[ ] Keep templates + guide for next phase
```

