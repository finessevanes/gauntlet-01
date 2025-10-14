# AI Agent Prompts for Documentation

## About This File

These are copy-paste prompts optimized for **Cursor with Claude** (tested with Sonnet 4.5). They work with ChatGPT/Claude too, but may need slight adjustments.

**How to use:**
1. Copy the prompt
2. Paste into Cursor chat or composer
3. Replace `[placeholders]` with your specifics
4. Agent will generate docs following templates

---

## 🎯 Prompt 1: Generate Test Plan (BEFORE Implementation)

**When:** Start of any feature  
**Goal:** Define success criteria and edge cases upfront

```
You are planning a feature implementation for CollabCanvas.

Feature: [describe the feature in 2-3 sentences]

User stories:
- [what users need to do]
- [what users expect to see]

Create a test plan following: docs/templates/PR-TEST-PLAN-TEMPLATE.md

Include:
1. Setup instructions (what needs to be running)
2. Test scenarios with checkboxes [ ]:
   - Happy path (basic functionality works)
   - Edge cases (negative values, timeouts, disconnects)
   - Multi-user (2-3 browser windows, simultaneous actions)
   - Performance (FPS targets, latency targets)
   - Error handling (what happens when things fail)
3. Success criteria (what "done" looks like)

Make tests EXPLICIT. Example:
❌ "Test that locking works"
✅ "User A clicks shape → green border appears. User B sees red border + lock icon."

Reference format: docs/archive/PR-3-TEST-PLAN.md
Save as: PR-[N]-TEST-PLAN.md
```

**Cursor tip:** Use this in **Composer** mode for best results. It will create the file for you.

---

## 🛠️ Prompt 2: Implement Feature from Test Plan

**When:** After test plan is approved  
**Goal:** Let agent know what "done" means

```
Implement [feature name] according to PR-[N]-TEST-PLAN.md.

Architecture constraints:
- Use service layer pattern (see src/services/)
- Follow existing code style (see similar components)
- Use TypeScript strict mode
- Add proper cleanup in useEffect hooks

As you implement:
1. Update PR-[N]-IMPLEMENTATION-STATUS.md with progress
2. Note any architecture decisions you make
3. Flag any blockers or questions

When complete, ensure all test cases in PR-[N]-TEST-PLAN.md pass.
```

**Cursor tip:** Reference existing files with `@filename` to maintain consistency.

---

## 📝 Prompt 3: Generate PR Summary (AFTER Implementation)

**When:** Feature is complete and tested  
**Goal:** Document what was built and why

```
Create a PR summary documenting the completed [feature name].

Following: docs/templates/PR-SUMMARY-TEMPLATE.md

Files changed:
[paste git diff --name-only or list manually]

Key changes:
- [what was built]
- [any architecture decisions]
- [any gotchas encountered]

Include:
1. Implementation Overview (2-3 sentences)
2. Files Created/Modified (with purpose for each)
3. Architecture Decisions (with rationale - WHY not just WHAT)
4. Testing Instructions (step-by-step for multi-user testing)
5. Known Issues/Limitations (be honest)
6. Next Steps (what PR comes next)

Reference format: docs/archive/PR-3-SUMMARY.md
Save as: PR-[N]-SUMMARY.md
```

**Cursor tip:** Use `@codebase` to let agent analyze what actually changed.

---

## ⚡ Prompt 4: Generate Quick Start (AFTER Implementation)

**When:** Right after implementation  
**Goal:** 30-second validation guide

```
Create a quick-start guide for testing [feature name].

Following: docs/templates/PR-QUICK-START-TEMPLATE.md

Goal: Someone should be able to validate this feature in under 2 minutes.

Include:
1. Prerequisites (1 line - what must be running)
2. Setup (2-3 commands max)
3. Test Steps (3-5 actions - be explicit)
4. Expected Result (what success looks like)

KEEP IT UNDER 20 LINES TOTAL.

Example format:
```bash
# Terminal 1
firebase emulators:start

# Terminal 2
npm run dev

# Browser 1 (incognito)
1. Go to localhost:5173
2. Sign up as "Alice"
3. [do the thing]

# Browser 2 (normal)
1. Go to localhost:5173
2. Sign up as "Bob"
3. [verify the thing works]

Expected: [what you should see]
```

Reference: docs/archive/PR-3-QUICK-START.md
Save as: PR-[N]-QUICK-START.md
```

**Cursor tip:** Keep it laser-focused. Reviewers love quick validation.

---

## 🐛 Prompt 5: Document a Gotcha

**When:** Immediately after fixing ANY bug  
**Goal:** Save future developers hours

```
Document the bug/gotcha we just fixed in GOTCHAS.md.

Issue: [what went wrong]
Symptoms: [what you saw - error messages, unexpected behavior]
Root cause: [why it happened - technical explanation]
Solution: [what fixed it - be specific]

Add under appropriate section in GOTCHAS.md:
- Canvas/Rendering Issues
- Firebase/Sync Issues  
- Performance Issues
- Build/Dependency Issues
- Testing Issues

Format:
### [Short Descriptive Title]

**Issue:** [1-2 sentence description]

**Symptoms:**
- [what you see]
- [error messages if any]

**Root Cause:**
[Technical explanation of WHY this happens]

**Solution:**
```bash
# Specific commands or code changes
```

**Prevention:**
[How to avoid this in the future]

Be SPECIFIC - include file paths, line numbers, config values, command output.
```

**Cursor tip:** Do this IMMEDIATELY. Waiting even 10 minutes and you'll forget critical details.

---

## 🔧 Prompt 6: Update Troubleshooting Guide

**When:** After encountering and fixing any error  
**Goal:** Searchable error database

```
Add troubleshooting entry for: [error name or symptom]

Error message: [exact error text from console]
Context: [what you were doing when it happened]
Solution: [what fixed it]

Add to collabcanvas/TROUBLESHOOTING.md following format:

### [Error Title - make it searchable]

**Symptoms:** 
[What you see - be specific]

**Solutions:**
```bash
# Step-by-step fix with exact commands
cd collabcanvas
[command 1]
[command 2]
```

**Check:**
[How to verify it's fixed]

Make solutions COPY-PASTEABLE. Future developers should be able to:
1. Search for error message
2. Find your entry
3. Copy-paste fix commands
4. Be unblocked in <5 minutes
```

**Cursor tip:** Include the full error message for searchability.

---

## 📊 Prompt 7: Create Implementation Status (During Work)

**When:** Starting a medium/large feature  
**Goal:** Context for resuming after breaks

```
Create an implementation status tracker for [feature name].

Following: docs/templates/PR-IMPLEMENTATION-STATUS-TEMPLATE.md

Current state:
- [what's done so far]
- [what's in progress]
- [what's blocked]

Format with sections:
## ✅ Completed
- [x] [specific task with details]

## 🚧 In Progress  
- [ ] [current task]
  - Details: [any notes]

## ❓ Blocked / Questions
- [any blockers]
- [any open questions]

## 💡 Decisions Made
- [any architecture decisions]
- [any trade-offs chosen]

Update this file as work progresses. It helps with:
- Resuming after interruptions
- Context for AI agents across sessions
- Memory for post-implementation summary

Save as: PR-[N]-IMPLEMENTATION-STATUS.md
```

**Cursor tip:** Keep this file open and update it every 30-60 minutes during implementation.

---

## 🏗️ Prompt 8: Consolidate After MVP

**When:** After completing all MVP features  
**Goal:** Archive detailed docs, create clean core docs

```
We've completed the MVP and need to consolidate documentation.

Tasks:
1. Move all PR-*-*.md files from collabcanvas/ to docs/archive/
2. Extract all gotchas from PR summaries into GOTCHAS.md
3. Extract all setup issues from PR docs into SETUP.md
4. Update README.md with final status
5. Create docs/archive/README.md explaining what's there

Keep in main directory:
- README.md
- DOCS-GUIDE.md
- SETUP.md
- ARCHITECTURE.md
- GOTCHAS.md

Preserve in archive:
- All PR-*-*.md files (as examples)
- Any one-off investigation docs

Create GOTCHAS.md sections:
- Canvas/Rendering Issues
- Firebase/Sync Issues
- Performance Issues
- Build/Dependency Issues
- Testing Issues

Each gotcha entry should have: Issue, Symptoms, Root Cause, Solution, Prevention.
```

---

## 🎓 Prompt 9: Explain Architecture Decision

**When:** Making any non-obvious technical choice  
**Goal:** Document the "why" for future reference

```
Document an architecture decision in ARCHITECTURE.md.

Decision: [what you chose]
Alternatives considered: [what else you looked at]
Context: [what problem this solves]

Add to ARCHITECTURE.md under "Architecture Decisions":

### [Decision Title]

**Decision:** [what we chose - be specific]

**Context:** 
[What problem are we solving? What constraints do we have?]

**Alternatives Considered:**
1. [Option A] - [pros/cons]
2. [Option B] - [pros/cons]

**Rationale:**
[Why we chose this approach]

**Trade-offs:**
- ✅ [benefits]
- ⚠️ [costs/limitations]

**Result:**
[How did it work out? Would you make the same choice again?]

Examples from CollabCanvas:
- Why hybrid database (RTDB + Firestore)?
- Why service layer pattern?
- Why individual shape documents vs array?
```

---

## 💡 Pro Tips for Using These Prompts

### 1. Reference Existing Files
```
Following: docs/templates/PR-SUMMARY-TEMPLATE.md
Reference format: docs/archive/PR-3-SUMMARY.md
```
This makes Cursor use the right format automatically.

### 2. Be Specific with File Operations
```
Save as: PR-[N]-SUMMARY.md in collabcanvas/
```
Tell agent exactly where to put the file.

### 3. Use @mentions in Cursor
- `@filename` - reference specific files
- `@codebase` - let agent analyze all files
- `@docs/archive/PR-3-SUMMARY.md` - show exact example

### 4. Combine Prompts
```
"Create test plan (Prompt 1) and implementation status (Prompt 7) for [feature]"
```

### 5. Iterate on Prompts
If agent's output isn't quite right:
```
"Follow the format in @docs/archive/PR-3-SUMMARY.md more closely.
Specifically, add a 'Performance Metrics' section like they did."
```

---

## 🚀 Workflow Example

Here's how a full feature looks with these prompts:

### Monday 9 AM: Start New Feature
```
[Use Prompt 1: Generate Test Plan]
[Use Prompt 7: Create Implementation Status]
```

### Monday 10 AM - 2 PM: Implement
```
[Use Prompt 2: Implement Feature]
[Update implementation status every hour]
```

### Monday 11 AM: Hit a Bug
```
[Fix bug]
[Use Prompt 5: Document Gotcha - immediately!]
```

### Monday 2 PM: Feature Complete
```
[Use Prompt 3: Generate PR Summary]
[Use Prompt 4: Generate Quick Start]
```

### Monday 2:30 PM: Test with Quick Start
```
[Run through quick start]
[If issues found, fix and update docs]
```

### Monday 3 PM: Move to Next Feature
```
[Previous feature fully documented]
[Context preserved for future]
[Ready to move fast on next feature]
```

**Total doc time:** ~45 minutes  
**Time saved from clear requirements:** 2-3 hours  
**Net gain:** 1.5-2 hours per feature

---

## 📱 Cursor-Specific Tips

### Use Composer for Doc Creation
Composer mode (`Cmd+I` or `Ctrl+I`) is better for creating full documents. Chat is better for quick questions.

### Use Agent's Codebase Understanding
```
"Analyze the codebase and create a test plan that matches our existing patterns"
```
Agent will maintain consistency automatically.

### Chain Multiple Docs
```
"Create PR-5-TEST-PLAN.md (Prompt 1), then implement (Prompt 2), 
then create summary (Prompt 3) and quick-start (Prompt 4)"
```

### Reference Multiple Examples
```
"Format like @docs/archive/PR-3-SUMMARY.md but 
include performance metrics like @docs/archive/PR-5-SUMMARY.md"
```

---

## 🔄 Adapting These Prompts

### For Your Project
Replace CollabCanvas-specific details:
- `src/services/` → your service layer path
- `firebase emulators:start` → your setup commands
- Multi-browser testing → your testing approach

### For Your AI Tool
- **Claude Desktop:** Works with minor tweaks (can't use @mentions)
- **ChatGPT:** Add more context in prompts (can't access files directly)
- **GitHub Copilot:** Better for inline code, less good for full docs

### For Your Domain
- **Backend APIs:** Add "API contract" and "integration test" sections
- **Mobile Apps:** Add "device testing matrix" and "screenshot comparison"
- **Data Pipelines:** Add "schema changes" and "backfill procedures"

---

## 📖 Examples in Archive

See `docs/archive/` for real outputs from these prompts:
- PR-3-SUMMARY.md (generated with Prompt 3)
- PR-3-TEST-PLAN.md (generated with Prompt 1)
- PR-5-SUMMARY.md (shows iteration on the format)

Study these to understand what good output looks like.

---

## ❓ Troubleshooting Prompts

### "Agent's output is too generic"
Add: `"Be specific with file paths, function names, and technical details"`

### "Agent's skipping sections"
Add: `"Include ALL sections from the template, even if some are brief"`

### "Agent's format doesn't match"
Add: `"Match the exact format in @docs/archive/PR-3-SUMMARY.md"`

### "Agent's making up information"
Add: `"Only document what actually exists in the codebase. Flag any uncertainties."`

---

## 🎯 Success Metrics

You'll know these prompts are working when:
- [ ] Test plans catch bugs BEFORE implementation
- [ ] Gotchas are searchable (you find fixes in <5 minutes)
- [ ] New contributors can validate features via quick-starts
- [ ] AI agents resume work with full context
- [ ] You're moving 2-3x faster than without docs

---

Built for CollabCanvas MVP (October 2025)  
Tested with Cursor + Claude Sonnet 4.5  
43 documents created, 7 features shipped in 24 hours 🚀

