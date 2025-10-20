# PRD: Pencil Tool (Free-form Drawing) — End-to-End Delivery

**Feature**: Pencil Tool

**Version**: 1.0

**Status**: Ready for Development

**Agent**: Delilah

**Target Release**: Phase 4

**Links**: [Action Plan], [Test Plan], [Designs], [Tracking Issue], [Agent TODOs] (`docs/todos/pr-16-todo.md`)

---

## 1. Summary

Add a pencil/brush tool for free-form drawing on the canvas, complementing the existing geometric shapes. Users can click the pencil icon, draw smooth lines with mouse/touch tracking, and paths are saved as vector data syncing in real-time across all collaborators.

---

## 2. Problem & Goals

- **User Problem**: Users need free-form drawing capabilities for sketching, annotations, and artistic expression beyond geometric shapes
- **Why Now**: Phase 4 polish feature to enhance the collaborative canvas experience with natural drawing tools
- **Goals** (ordered, measurable):
  - [ ] G1 — Users can draw smooth, responsive free-form paths on the canvas
  - [ ] G2 — Pencil drawings sync in real-time across all collaborators (<100ms)
  - [ ] G3 — Drawing maintains 60 FPS performance with existing shapes

---

## 3. Non-Goals / Out of Scope

- [ ] Not doing pressure sensitivity (tablet support) - focus on mouse/touch basics
- [ ] Not doing advanced brush effects (textures, opacity) - simple solid stroke
- [ ] Not doing path editing (modify existing paths) - create-only for now
- [ ] Not doing eraser tool - separate feature for future
- [ ] Not doing stroke smoothing algorithms - basic point-to-point lines

---

## 4. Success Metrics

- **User-visible**: Users can create smooth pencil strokes in <2 seconds from tool selection
- **System**: <100ms sync peer-to-peer, 60 FPS during drawing interactions
- **Quality**: 0 blocking bugs, all acceptance gates pass, works with 50+ existing shapes

---

## 5. Users & Stories

- As a **designer**, I want to sketch free-form ideas so that I can brainstorm visually beyond geometric shapes
- As a **collaborator**, I want to see other users' pencil drawings in real-time so that we can build on each other's sketches
- As a **annotator**, I want to add handwritten notes to shapes so that I can provide contextual feedback
- As a **artist**, I want smooth, responsive drawing so that the tool feels natural and professional

---

## 6. Experience Specification (UX)

- **Entry points and flows**: Pencil tool button in ToolPalette, click to activate, cursor changes to crosshair
- **Visual behavior**: Real-time preview line follows mouse during drawing, final path renders with selected color and stroke width
- **Loading/disabled/locked states**: Tool disabled during shape locks, loading state during Firestore sync
- **Accessibility**: Keyboard shortcut (P key), screen reader announces "Pencil tool selected"
- **Performance**: 60 FPS during drag/resize; feedback <50ms; network sync <100ms

---

## 7. Functional Requirements (Must/Should)

- **MUST**: Pencil tool button in ToolPalette with active state styling
- **MUST**: Mouse/touch drawing captures smooth path points (throttled to 60 FPS)
- **MUST**: Path data stored in Firestore with proper schema
- **MUST**: Real-time sync to other clients in <100ms
- **MUST**: Path rendering with Konva Line component
- **SHOULD**: Color selection applies to pencil strokes
- **SHOULD**: Stroke width selection (1-10px range)

**Acceptance gates embedded per requirement:**

- [Gate] When User A draws a path → User B sees the path appear in real-time within 100ms with matching color and stroke width
- [Gate] Error case: Drawing outside canvas bounds clips path to canvas edges; no partial writes to Firestore
- [Gate] Performance: Drawing maintains 60 FPS with 50+ existing shapes on canvas

---

## 8. Data Model

New path shape type added to existing shapes collection:

```typescript
{
  id: string,
  type: "path",
  points: [{x: number, y: number}], // Array of path points
  strokeWidth: number, // 1-10px range
  color: string, // Hex color string
  createdBy: string,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  zIndex: number, // For layering
  lockedBy?: string, // For collaboration locks
  lockedAt?: Timestamp
}
```

- **Validation rules**: points array minimum 2 points, strokeWidth 1-10, color valid hex
- **Indexing/queries**: Standard shape queries with type="path" filter

---

## 9. API / Service Contracts

New service methods for path operations:

```typescript
// CanvasService additions
createPath(data: CreatePathInput): Promise<string>
updatePath(id: string, changes: Partial<Path>): Promise<void>
subscribeToPaths(cb: (paths: Path[]) => void): Unsubscribe

// Input types
interface CreatePathInput {
  points: {x: number, y: number}[],
  strokeWidth: number,
  color: string
}

interface Path {
  id: string,
  type: "path",
  points: {x: number, y: number}[],
  strokeWidth: number,
  color: string,
  createdBy: string,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  zIndex: number,
  lockedBy?: string,
  lockedAt?: Timestamp
}
```

- **Pre-conditions**: User authenticated, valid canvas context
- **Post-conditions**: Path created in Firestore, real-time sync triggered
- **Error handling**: Invalid points array shows toast, network errors retry once

---

## 10. UI Components to Create/Modify

- `src/components/Canvas/ToolPalette.tsx` — Add pencil tool button with icon
- `src/components/Canvas/Canvas.tsx` — Add pencil drawing handlers (mousedown, mousemove, mouseup)
- `src/components/Canvas/CanvasShape.tsx` — Add path rendering case with Konva Line
- `src/services/canvasService.ts` — Add createPath, updatePath methods
- `src/hooks/useDrawing.ts` — Add pencil mode state and drawing logic
- `src/services/types/canvasTypes.ts` — Add Path interface and CreatePathInput

---

## 11. Integration Points

- Uses `CanvasService` for path mutations
- Listeners via Firestore onSnapshot for real-time sync
- State wired through `CanvasContext` for active tool tracking
- Integrates with existing color palette and stroke width controls

---

## 12. Test Plan & Acceptance Gates

Define BEFORE implementation. Use checkboxes; each sub-task must have a gate.

- **Happy Path**
  - [ ] Click pencil tool → cursor changes to crosshair
  - [ ] Draw on canvas → path appears with real-time preview
  - [ ] Gate: Path saves to Firestore in <100ms
  - [ ] Gate: Other users see path appear in real-time

- **Edge Cases**
  - [ ] Draw outside canvas bounds → path clipped to canvas edges
  - [ ] Empty path (single click) → no path created
  - [ ] Rapid drawing → smooth path without gaps

- **Multi-User**
  - [ ] User A draws → User B sees in <100ms
  - [ ] Both users draw simultaneously → no conflicts, both paths appear
  - [ ] User A draws while User B has shape locked → no interference

- **Performance**
  - [ ] Drawing maintains 60 FPS with 50+ existing shapes
  - [ ] Path rendering doesn't block other interactions
  - [ ] Large path (100+ points) renders smoothly

---

## 13. Definition of Done (End-to-End)

- [ ] Service methods implemented and unit-tested
- [ ] UI implemented with all states (active, drawing, syncing)
- [ ] Real-time sync verified across 2 browsers (<100ms)
- [ ] Keyboard/Accessibility checks pass (P key shortcut)
- [ ] Test Plan checkboxes all pass
- [ ] Performance targets met (60 FPS, <100ms sync)
- [ ] Integration with existing color and stroke width controls

---

## 14. Risks & Mitigations

- **Risk**: Path smoothing algorithms → **Mitigation**: Start with simple point-to-point lines, add smoothing in future iteration
- **Risk**: Performance with large paths → **Mitigation**: Throttle point capture to 60 FPS, limit path complexity
- **Risk**: Real-time sync conflicts → **Mitigation**: Use existing shape locking mechanism for path editing
- **Risk**: Touch device compatibility → **Mitigation**: Test on mobile devices, ensure touch events work properly

---

## 15. Rollout & Telemetry

- **Feature flag**: No (direct release)
- **Metrics**: Pencil tool usage, path creation frequency, sync latency
- **Manual validation steps post-deploy**: Test drawing on multiple devices, verify real-time sync

---

## 16. Open Questions

- Q1: Should paths support the same grouping operations as other shapes?
- Q2: What's the maximum number of points per path for performance?

---

## 17. Appendix: Out-of-Scope Backlog

Items explicitly deferred for future work with brief rationale.

- [ ] Path editing (modify existing paths) - requires complex UI for point selection
- [ ] Pressure sensitivity - requires tablet hardware support
- [ ] Advanced brush effects - adds complexity beyond core drawing need
- [ ] Eraser tool - separate feature with different interaction model
- [ ] Path smoothing algorithms - can be added as enhancement after basic functionality

---

## Preflight Questionnaire (Complete Before Generating This PRD)

Answer succinctly; these drive the vertical slice and acceptance gates.

1. **What is the smallest end-to-end user outcome we must deliver in this PR?**
   - User can select pencil tool, draw a smooth path, and see it sync to other users

2. **Who is the primary user and what is their critical action?**
   - Designer/artist who needs to sketch free-form ideas beyond geometric shapes

3. **Must-have vs nice-to-have: what gets cut first if time tight?**
   - Must-have: Basic drawing, real-time sync, color selection
   - Nice-to-have: Stroke width selection, advanced smoothing

4. **Real-time collaboration requirements (peers, <100ms sync)?**
   - Yes, paths must sync to all collaborators in <100ms

5. **Performance constraints (FPS, shape count, latency targets)?**
   - 60 FPS during drawing, works with 50+ existing shapes, <100ms sync

6. **Error/edge cases we must handle (validation, conflicts, offline)?**
   - Drawing outside bounds, empty paths, network failures, concurrent drawing

7. **Data model changes needed (new fields/collections)?**
   - New "path" shape type with points array, strokeWidth, color fields

8. **Service APIs required (create/update/delete/subscribe)?**
   - createPath(), updatePath(), subscribeToPaths() methods

9. **UI entry points and states (empty, loading, locked, error):**
   - ToolPalette button, drawing preview, sync states, error toasts

10. **Accessibility/keyboard expectations:**
    - P key shortcut, screen reader support, focus management

11. **Security/permissions implications:**
    - Same as existing shapes - users can create, lock for editing

12. **Dependencies or blocking integrations:**
    - Depends on existing CanvasService, ToolPalette, Canvas components

13. **Rollout strategy (flag, migration) and success metrics:**
    - Direct release, monitor usage and sync performance

14. **What is explicitly out of scope for this iteration?**
    - Path editing, pressure sensitivity, advanced brush effects, eraser tool

---

## Authoring Notes

- Write the Test Plan before coding; every sub-task needs a pass/fail gate.
- Favor a vertical slice that ships standalone; avoid partial features depending on later PRs.
- Keep contracts deterministic in the service layer; UI is a thin wrapper.
- Focus on smooth, responsive drawing experience that feels natural to users.

---
