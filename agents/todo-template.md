# PR-N TODO — [Feature Name]

**Branch**: `feature/pr-n-[slug]`  
**Source PRD**: [link to PRD]  
**Owner (Agent)**: [name]

---

## 0. Clarifying Questions & Assumptions

- Questions: [unanswered items from PRD preflight]
- Assumptions (unblock coding now; confirm in PR):
  - [assumption 1]
  - [assumption 2]

---

## 1. Repo Prep

- [ ] Create branch `feature/pr-n-[slug]`
- [ ] Confirm env, emulators, and test runner

---

## 2. Service Layer (deterministic contracts)

- [ ] Implement [service method]
  - Test Gate: unit test passes for valid/invalid cases
- [ ] Implement [service method]
  - Test Gate: unit test passes

---

## 3. Data Model & Rules

- [ ] Update schema/docs
  - Test Gate: reads/writes succeed with rules

---

## 4. UI Components

- [ ] Create/modify [component]
  - Test Gate: Story/preview renders; zero console errors
- [ ] Wiring to context/hooks
  - Test Gate: Interaction updates state

---

## 5. Integration & Realtime

- [ ] Subscribe/update flows
  - Test Gate: 2-browser test shows <100ms sync

---

## 6. Tests

- a) Interactions (“does it click”)
  - [ ] Click/keyboard paths succeed
- b) Logic
  - [ ] Edge cases validated; errors surfaced
- c) Visuals
  - [ ] States: empty, loading, locked, error

---

## 7. Performance

- [ ] 60 FPS during interaction with N items

---

## 8. Docs & PR

- [ ] Update `PR-N-todo.md` with gates results
- [ ] Write PR description summary (use this structure):
  - Goal and scope (from PRD)
  - Files changed and rationale
  - Test steps (happy path, edge cases, multi-user, perf)
  - Known limitations and follow-ups
  - Links: PRD, TODO, designs
- [ ] Keep PR description updated after each failed test until all gates pass
- [ ] Open PR with checklist copied here

---

## Copyable Checklist (for PR description)

- [ ] Branch created
- [ ] Services implemented + unit tests
- [ ] UI implemented
- [ ] Realtime verified (<100ms)
- [ ] Tests: clicks, logic, visuals
- [ ] Perf target met
- [ ] Docs updated