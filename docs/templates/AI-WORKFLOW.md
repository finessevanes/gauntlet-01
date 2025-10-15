# AI Agent Workflow for CollabCanvas Phase 2

**Purpose:** Fast, accurate builds with minimal context overload.

---

## 🚦 Workflow for Each PR

### **Step 1: Generate Action Plan**

**You say:**
```
Begin implementation on PR #N
```

**AI should:**
1. Read `docs/task.md` PR #N section
2. Read referenced PRD section in `docs/prd.md`
3. Create `docs/PR-N-ACTION-PLAN.md` using template:
   - Feature overview (from PRD)
   - Files to create/modify
   - Sub-tasks with test gates
   - Integration points
   - Success criteria
4. **WAIT** for your confirmation before coding

---

### **Step 2: You Review & Approve**

- Read the action plan
- Confirm approach makes sense
- Suggest adjustments if needed
- Check for conflicts with existing features

---

### **Step 3: AI Implements**

**You say:**
```
Plan looks good, proceed
```

**AI should:**
- Follow action plan sequentially
- Test each sub-task at test gates before proceeding
- Update action plan with any architecture decisions
- Flag blockers immediately

---

### **Step 4: You Test & Deploy**

- Test locally with multiple browsers
- Deploy: `npm run build && vercel --prod`
- Verify in production (multi-user test)
- Confirm no regressions
- Move to next PR

---

## 📋 Action Plan Template Location

Template: `docs/templates/PR-ACTION-PLAN-TEMPLATE.md`

Example structure:
```markdown
# PR #N: [Feature Name]

## Goal
[What this accomplishes]

## PRD Reference
[Link to prd.md section]

## Files to Create/Modify
[List with purposes]

## Sub-Tasks
1. [Task]
   - Test Gate: [Verify before proceeding]

## Integration Points
[What this connects to]

## Success Criteria
- [ ] [Testable outcomes]
```

---

## 🎯 Key Principles

1. **One action plan per PR** - No separate test plans, summaries, or status docs
2. **Test gates inline** - Verify each sub-task before moving to next
3. **Forward-looking** - Plan → implement, not post-implementation summaries
4. **Minimal context** - Only what's needed to build fast and accurately

---

## 📁 Project Structure

**Working directory:** `/collabcanvas` (all commands run from here)

**Key files:**
- `docs/task.md` - Complete task breakdown for all PRs
- `docs/prd.md` - Product requirements (Phase 2)
- `docs/architecture.md` - System architecture reference

**Archives:**
- `docs/archive/` - MVP examples for reference if needed

---

## ⚡ Speed Tips

- Reference existing code with `@filename` in prompts
- Check test gates before proceeding (saves debugging time)
- Deploy after each PR to verify in production
- Archives have working examples if you need patterns

---

Built for CollabCanvas Phase 2 (October 2025)  
Target: 17 PRs in 72 hours

