# PRD: [Feature Name] — End-to-End Delivery

**Feature**: [short name]

**Version**: 1.0

**Status**: Draft | Ready for Development | In Progress | Shipped

**Agent**: [Phillip/Rhonda]

**Target Release**: [date or sprint]

**Links**: [Action Plan], [Test Plan], [Designs], [Tracking Issue], [Agent TODOs] (`docs/todo-template.md`)

---

## 1. Summary

One or two sentences that state the problem and the outcome. Focus on the minimum vertical slice that delivers user value independently.

---

## 2. Problem & Goals

- What user problem are we solving?
- Why now? (tie to rubric/OKR if relevant)
- Goals (ordered, measurable):
  - [ ] G1 — [clear goal]
  - [ ] G2 — [clear goal]

---

## 3. Non-Goals / Out of Scope

Call out anything intentionally excluded to avoid partial implementations and hidden dependencies.

- [ ] Not doing X (explain why)
- [ ] Not doing Y (explain why)

---

## 4. Success Metrics

- User-visible: [time to complete task, number of clicks, etc.]
- System: [<100ms sync peer-to-peer, 60 FPS during interactions]
- Quality: [0 blocking bugs, all acceptance gates pass]

---

## 5. Users & Stories

- As a [role], I want [action] so that [outcome].
- As a [collaborator], I want [real-time effect] so that [coordination].

---

## 6. Experience Specification (UX)

- Entry points and flows: [where in UI, how it’s triggered]
- Visual behavior: [controls, tooltips, empty states]
- Loading/disabled/locked states: [what user sees/feels]
- Accessibility: [keyboard, screen reader text, focus order]
- Performance: 60 FPS during drag/resize; feedback <50ms; network sync <100ms.

If designs exist, link them; otherwise provide small ASCII sketches or bullet specs.

---

## 7. Functional Requirements (Must/Should)

- MUST: [deterministic service-layer method exists for each user action]
- MUST: [real-time sync to other clients in <100ms]
- SHOULD: [optimistic UI where safe]

Acceptance gates embedded per requirement:

- [Gate] When User A does X → User B sees Y in <100ms.
- [Gate] Error case: invalid input shows toast; no partial writes.

---

## 8. Data Model

Describe new/changed documents, schemas, and invariants.

```typescript
// Example
{
  id: string,
  type: "rectangle | text | circle | triangle",
  // fields…
  createdBy: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

- Validation rules: [ranges, enums]
- Indexing/queries: [subscriptions, listeners]

---

## 9. API / Service Contracts

Specify the concrete methods at the service layer. Include parameters, validation, return values, and error conditions.

```typescript
// Example signatures
createX(payload: CreateXInput): Promise<string>
updateX(id: string, changes: Partial<X>): Promise<void>
subscribeToX(cb: (items: X[]) => void): Unsubscribe
```

- Pre- and post-conditions for each method
- Error handling strategy (surface via toasts, retries, etc.)

---

## 10. UI Components to Create/Modify

List paths to be added/edited with a one-line purpose each.

- `src/components/.../ToolButton.tsx` — trigger action
- `src/components/.../ControlsPanel.tsx` — primary controls

---

## 11. Integration Points

- Uses `CanvasService` for mutations
- Listeners via Firestore/RTDB subscriptions
- State wired through `CanvasContext`

---

## 12. Test Plan & Acceptance Gates

Define BEFORE implementation. Use checkboxes; each sub-task must have a gate.

- Happy Path
  - [ ] Action A creates record; appears on canvas
  - [ ] Gate: User B sees in <100ms
- Edge Cases
  - [ ] Invalid inputs rejected with clear message
  - [ ] Lock conflict handled predictably
- Multi-User
  - [ ] Concurrent actions do not corrupt state
- Performance
  - [ ] 60 FPS during drag/resize with 50+ shapes

---

## 13. Definition of Done (End-to-End)

- [ ] Service methods implemented and unit-tested
- [ ] UI implemented with loading/empty/error states
- [ ] Real-time sync verified across 2 browsers (<100ms)
- [ ] Keyboard/Accessibility checks pass
- [ ] Test Plan checkboxes all pass
- [ ] Docs created: Action Plan, Quick Start, Summary

---

## 14. Risks & Mitigations

- Risk: [area] → Mitigation: [approach]
- Risk: [performance/consistency] → Mitigation: [throttle, batch writes]

---

## 15. Rollout & Telemetry

- Feature flag? [yes/no]
- Metrics: [usage, errors, latency]
- Manual validation steps post-deploy

---

## 16. Open Questions

- Q1: [decision needed]
- Q2: [dependency/owner]

---

## 17. Appendix: Out-of-Scope Backlog

Items explicitly deferred for future work with brief rationale.

- [ ] Future X
- [ ] Future Y

---

## Preflight Questionnaire (Complete Before Generating This PRD)

Answer succinctly; these drive the vertical slice and acceptance gates.

1. What is the smallest end-to-end user outcome we must deliver in this PR?
2. Who is the primary user and what is their critical action?
3. Must-have vs nice-to-have: what gets cut first if time tight?
4. Real-time collaboration requirements (peers, <100ms sync)?
5. Performance constraints (FPS, shape count, latency targets)?
6. Error/edge cases we must handle (validation, conflicts, offline)?
7. Data model changes needed (new fields/collections)?
8. Service APIs required (create/update/delete/subscribe)?
9. UI entry points and states (empty, loading, locked, error):
10. Accessibility/keyboard expectations:
11. Security/permissions implications:
12. Dependencies or blocking integrations:
13. Rollout strategy (flag, migration) and success metrics:
14. What is explicitly out of scope for this iteration?

---

## Authoring Notes

- Write the Test Plan before coding; every sub-task needs a pass/fail gate.
- Favor a vertical slice that ships standalone; avoid partial features depending on later PRs.
- Keep contracts deterministic in the service layer; UI is a thin wrapper.

---