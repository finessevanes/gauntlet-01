# PRD: Pencil Tool — End-to-End Delivery

**Feature**: Pencil Tool for Free-form Drawing

**Version**: 1.0

**Status**: Ready for Development

**Agent**: Rhonda

**Target Release**: Phase 1 - Core Drawing Tools

**Links**: [Action Plan: pr-1-todo.md], [Test Plan: integration tests], [Tracking Issue: PR #1]

---

## 1. Summary

Users currently cannot draw free-form lines or signatures on the canvas. The Pencil Tool will enable users to click and drag to create custom paths, enabling signatures, sketches, and artistic drawings on postcards. This is the foundational drawing tool for the "You've Got Mail" postcard creator.

---

## 2. Problem & Goals

**Problem:** 
Users can only create geometric shapes (rectangles, circles, triangles) but cannot draw free-form content like signatures, sketches, or custom doodles on their postcards.

**Why now?** 
- This is PR #1 in the core feature set for the school project demo
- Required foundation for AI drawing features (PR #5)
- Essential for postcard personalization

**Goals (ordered, measurable):**
  - [x] G1 — Users can draw smooth, continuous paths on the canvas
  - [x] G2 — Paths sync in real-time (<100ms) across all collaborators
  - [x] G3 — Paths support configurable stroke width (1px-8px)
  - [x] G4 — Drawing maintains 60 FPS performance with 50+ shapes on canvas
  - [x] G5 — AI can programmatically create paths via createPath() method

---

## 3. Non-Goals / Out of Scope

Call out anything intentionally excluded to avoid partial implementations and hidden dependencies.

- [ ] Not implementing pressure-sensitive drawing (no Wacom/Apple Pencil support)
- [ ] Not implementing eraser tool (separate PR if needed)
- [ ] Not implementing path editing after creation (no node manipulation)
- [ ] Not implementing variable stroke width within a single path
- [ ] Not implementing fill color for paths (stroke only)
- [ ] Not implementing brush patterns/textures (solid stroke only)
- [ ] Not implementing path smoothing beyond basic line reduction

---

## 4. Success Metrics

- **User-visible:** 
  - Drawing feels smooth and responsive (no lag)
  - Paths appear exactly where user drags cursor
  - Line quality matches MS Paint pencil tool
  
- **System:** 
  - Real-time sync: <100ms from draw to peer visibility
  - 60 FPS maintained during drawing with 50+ shapes
  - Path data efficiently stored (points reduced via smoothing)
  
- **Quality:** 
  - 0 blocking bugs
  - All acceptance gates pass
  - Multi-user drawing works without conflicts

---

## 5. Users & Stories

- As a **postcard creator**, I want to **draw free-form lines and signatures** so that I can **personalize my postcards with custom artwork**.

- As a **collaborator**, I want to **see my partner's drawings appear in real-time** so that we can **draw together simultaneously**.

- As an **AI assistant user**, I want the **AI to be able to draw paths programmatically** so that it can **create sketches and signatures based on my prompts**.

---

## 6. Experience Specification (UX)

### Entry Points and Flows
1. User clicks pencil tool button (✏️ icon) in left toolbar
2. Cursor changes to crosshair when hovering over canvas
3. User clicks and drags to draw
4. Path appears in real-time as user moves mouse
5. On mouse release, path is finalized and synced to Firestore
6. Path remains selected briefly, then deselects

### Visual Behavior
- **Tool button:** Pencil icon (✏️) in ToolPalette
- **Active state:** Button highlighted when pencil tool active
- **Cursor:** Crosshair cursor during drawing
- **Preview:** Path renders in real-time during drag (optimistic UI)
- **Final path:** Smooth line with configurable stroke width
- **Color:** Inherits current selected color from ColorPalette

### States
- **Default:** Tool button visible but not selected
- **Active:** Tool selected, ready to draw
- **Drawing:** Mouse down, path being drawn (preview visible)
- **Syncing:** Path being saved to Firestore (~50-100ms)
- **Synced:** Path visible to all users

### Accessibility
- Keyboard shortcut: `P` key to activate pencil tool
- Tool button has aria-label="Pencil Tool"
- Focus visible on tool button
- Tooltip shows "Pencil Tool (P)" on hover

### Performance
- 60 FPS during drawing (no dropped frames)
- Mouse tracking at 30-60 Hz (smooth line capture)
- Network sync <100ms after mouse release
- Line smoothing reduces points by ~50-70% without visual loss

---

## 7. Functional Requirements (Must/Should)

### MUST Requirements

- **MUST:** Add `'path'` to ShapeData type union
- **MUST:** Path shape includes `points: number[]` field (flat array: [x1,y1,x2,y2,...])
- **MUST:** Path shape includes `strokeWidth: number` field (1-8px)
- **MUST:** `createPath()` service method saves path to Firestore
- **MUST:** Real-time sync to other clients in <100ms
- **MUST:** Path renders as SVG line using Konva Line component
- **MUST:** Drawing maintains 60 FPS with 50+ shapes
- **MUST:** Points array smoothed to reduce size (line simplification algorithm)
- **MUST:** Tool button in ToolPalette with pencil icon
- **MUST:** Cursor changes to crosshair during drawing
- **MUST:** Path uses current selected color
- **MUST:** Paths support lock/unlock, move, delete, rotate operations (like other shapes)
- **MUST:** Paths respect z-index ordering

### SHOULD Requirements

- **SHOULD:** Line smoothing algorithm (Douglas-Peucker or similar)
- **SHOULD:** Optimistic UI (show preview before Firestore confirms)
- **SHOULD:** Keyboard shortcut (P) to activate tool
- **SHOULD:** Visual feedback when tool is active

### Acceptance Gates (embedded per requirement)

**Gate 1:** When User A selects pencil tool → tool button highlights and cursor changes to crosshair

**Gate 2:** When User A draws a path → path appears in real-time during drag

**Gate 3:** When User A releases mouse → path saves to Firestore in <100ms

**Gate 4:** When User A creates path → User B sees path in <100ms (real-time sync)

**Gate 5:** When drawing with 50+ shapes on canvas → maintains 60 FPS

**Gate 6:** Path data includes: type='path', points array, strokeWidth, color, createdBy, timestamps

**Gate 7:** Line smoothing reduces points by ~50-70% without visible quality loss

**Gate 8:** Error case: if Firestore save fails → show toast, remove preview path

---

## 8. Data Model

### Shape Type Extension

```typescript
// Extend ShapeData type in canvasService.ts
export interface ShapeData {
  id: string;
  type: 'rectangle' | 'text' | 'circle' | 'triangle' | 'path'; // ADD 'path'
  x: number; // Top-left bounding box X
  y: number; // Top-left bounding box Y
  width: number; // Bounding box width
  height: number; // Bounding box height
  color: string;
  rotation?: number;
  
  // PATH-SPECIFIC FIELDS (new)
  points?: number[]; // Flat array: [x1, y1, x2, y2, x3, y3, ...]
  strokeWidth?: number; // Line thickness (1-8px), default: 2
  
  // Circle-specific fields
  radius?: number;
  
  // Text-specific fields
  text?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  
  // Grouping and layering fields
  groupId: string | null;
  zIndex: number;
  createdBy: string;
  createdAt: Timestamp | null;
  lockedBy: string | null;
  lockedAt: Timestamp | null;
  updatedAt: Timestamp | null;
}
```

### Path Shape Example

```typescript
{
  id: "path-abc123",
  type: "path",
  x: 100,              // Top-left of bounding box
  y: 150,              // Top-left of bounding box
  width: 250,          // Bounding box width
  height: 180,         // Bounding box height
  color: "#3b82f6",    // Stroke color
  strokeWidth: 3,      // Line thickness
  points: [0, 0, 10, 5, 25, 12, ...], // Relative to (x, y)
  rotation: 0,
  groupId: null,
  zIndex: 5,
  createdBy: "user-123",
  createdAt: Timestamp,
  lockedBy: null,
  lockedAt: null,
  updatedAt: Timestamp
}
```

### Validation Rules

- `type`: Must be `'path'`
- `points`: Required array, minimum 4 numbers (2 points), even length
- `strokeWidth`: Number between 1-8 (default: 2)
- `color`: Valid hex color string
- `x, y, width, height`: Numbers (bounding box calculated from points)
- All standard shape fields: createdBy, timestamps, etc.

### Indexing/Queries

- No new indexes needed (uses existing shapes collection subscription)
- Points array stored as Firestore array type
- Efficient queries: paths included in standard shape queries

---

## 9. API / Service Contracts

### CanvasService Methods

```typescript
/**
 * Create a new path shape from drawing points
 * @param points - Flat array of x,y coordinates [x1,y1,x2,y2,...]
 * @param color - Stroke color (hex string)
 * @param strokeWidth - Line thickness (1-8px)
 * @param createdBy - User ID who created the path
 * @returns Promise<string> - The created path shape ID
 * @throws Error if validation fails or Firestore write fails
 */
async createPath(
  points: number[],
  color: string,
  strokeWidth: number,
  createdBy: string
): Promise<string>

/**
 * Update path points (for future path editing, not in this PR)
 * @param pathId - Path shape ID
 * @param points - Updated points array
 * @returns Promise<void>
 */
async updatePath(
  pathId: string,
  points: number[]
): Promise<void>
```

### Pre- and Post-Conditions

**createPath() Pre-conditions:**
- `points.length >= 4` (at least 2 coordinate pairs)
- `points.length % 2 === 0` (even number of values)
- `strokeWidth` between 1-8
- `color` is valid hex string
- `createdBy` is authenticated user ID

**createPath() Post-conditions:**
- Path document created in Firestore `canvases/main/shapes/{id}`
- Path has all required fields (type, x, y, width, height, points, etc.)
- Bounding box calculated from min/max of points
- `createdAt` and `updatedAt` timestamps set
- Returns valid shape ID string

**Error Handling:**
- Invalid points array → throw Error("Invalid points array")
- Firestore write failure → toast.error() and throw
- Network error → retry once, then toast.error()

---

## 10. UI Components to Create/Modify

### Files to Modify

1. **`src/services/canvasService.ts`**
   - Add `'path'` to ShapeData type union
   - Add `points?: number[]` and `strokeWidth?: number` to interface
   - Implement `createPath()` method
   - Implement `updatePath()` method (stub for future)

2. **`src/components/Canvas/ToolPalette.tsx`**
   - Add pencil tool button with ✏️ icon
   - Wire up onClick to set activeTool='pencil'
   - Show active state when pencil selected

3. **`src/components/Canvas/Canvas.tsx`**
   - Add pencil drawing handlers (onMouseDown, onMouseMove, onMouseUp)
   - Track drawing state (isDrawingPath, pathPoints array)
   - Real-time preview during drawing
   - Call createPath() on mouse up
   - Add keyboard shortcut (P key)

4. **`src/components/Canvas/CanvasShape.tsx`**
   - Add path rendering case: `<Line points={...} stroke={color} strokeWidth={...} />`
   - Support path selection, lock indicators, rotation

5. **`src/contexts/CanvasContext.tsx`**
   - Add `activeTool` type: `'pan' | 'rectangle' | 'circle' | 'triangle' | 'pencil' | 'bomb'`
   - Add `createPath()` wrapper method
   - Add `strokeWidth` state (default: 2)

6. **`src/utils/lineSmoothing.ts`** (NEW FILE)
   - Implement Douglas-Peucker or Ramer-Douglas-Peucker algorithm
   - Function: `smoothPath(points: number[], tolerance: number): number[]`
   - Reduces point count while preserving shape

7. **`src/utils/constants.ts`**
   - Add `DEFAULT_STROKE_WIDTH = 2`
   - Add `MIN_STROKE_WIDTH = 1`
   - Add `MAX_STROKE_WIDTH = 8`

---

## 11. Integration Points

- **Uses `CanvasService`** for path creation and mutations
- **Firestore subscription** via existing `onSnapshot` in CanvasContext
- **State wired through `CanvasContext`** (activeTool, createPath method)
- **Konva rendering** via `<Line>` component in react-konva
- **Real-time sync** via existing Firestore listener (no changes needed)

---

## 12. Test Plan & Acceptance Gates

### Happy Path

- [x] **Gate 1:** User clicks pencil tool button → button highlights, activeTool='pencil'
- [x] **Gate 2:** User hovers over canvas with pencil active → cursor changes to crosshair
- [x] **Gate 3:** User clicks and drags → path preview appears in real-time
- [x] **Gate 4:** User releases mouse → path saves to Firestore
- [x] **Gate 5:** Path document in Firestore has correct structure (type, points, strokeWidth, color, etc.)
- [x] **Gate 6:** Path appears on canvas for creating user immediately
- [x] **Gate 7:** User B sees path within <100ms (real-time sync)
- [x] **Gate 8:** Path can be selected, moved, rotated, deleted like other shapes
- [x] **Gate 9:** Keyboard shortcut (P) activates pencil tool

### Edge Cases

- [x] **Gate 10:** Drawing very short path (<2 pixels) → still creates valid path or rejects gracefully
- [x] **Gate 11:** Drawing very long path (1000+ points) → smoothing reduces to reasonable size
- [x] **Gate 12:** Rapid mouse movement → captures enough points for smooth line
- [x] **Gate 13:** Drawing outside canvas bounds → points clamped or path clipped
- [x] **Gate 14:** Firestore write fails → error toast shown, preview removed
- [x] **Gate 15:** Drawing while another user is drawing → no conflicts

### Multi-User Collaboration

- [x] **Gate 16:** User A and User B both drawing paths simultaneously → both paths sync correctly
- [x] **Gate 17:** User A draws path → User B, C, D all see it within <100ms
- [x] **Gate 18:** User A deletes their path → User B sees deletion immediately

### Performance

- [x] **Gate 19:** Drawing with 0 shapes on canvas → 60 FPS maintained
- [x] **Gate 20:** Drawing with 50+ shapes on canvas → 60 FPS maintained
- [x] **Gate 21:** Drawing with 100+ shapes on canvas → still usable (may drop to 30 FPS, acceptable)
- [x] **Gate 22:** Line smoothing runs in <10ms (doesn't block UI)
- [x] **Gate 23:** Path creation to Firestore completes in <100ms (95th percentile)

---

## 13. Definition of Done (End-to-End)

- [x] Service methods implemented (`createPath`, `updatePath` stub)
- [x] Unit tests for canvasService path methods (pass 100%)
- [x] UI implemented (tool button, drawing handlers, path rendering)
- [x] Line smoothing utility implemented and tested
- [x] Integration tests for pencil tool (user simulation + state inspection)
- [x] Multi-user tests (2 users drawing simultaneously)
- [x] Real-time sync verified across 2 browsers (<100ms)
- [x] Performance test (60 FPS with 50+ shapes)
- [x] All acceptance gates pass (23/23)
- [x] Keyboard shortcut (P) works
- [x] No console errors or warnings
- [x] PRD and TODO documents created
- [x] PR description written with screenshots

---

## 14. Risks & Mitigations

**Risk:** Drawing performance degrades with many points
- **Mitigation:** Implement line smoothing algorithm to reduce point count by 50-70%

**Risk:** Firestore document size limits (path with 10,000 points could exceed 1MB)
- **Mitigation:** Line smoothing keeps point count under ~500 points per path

**Risk:** Real-time sync latency >100ms
- **Mitigation:** Use Firestore batch writes, optimize network calls

**Risk:** Path rendering performance with complex paths
- **Mitigation:** Konva Line component is optimized; test with 100+ paths

**Risk:** Multi-user path conflicts (two users drawing at same time)
- **Mitigation:** Each path is independent document, no conflict possible

---

## 15. Rollout & Telemetry

**Feature flag?** No (core feature, always on)

**Metrics:**
- Usage: Count of paths created per session
- Errors: Firestore write failures, validation errors
- Latency: Time from mouse up to path visible (target <100ms)
- Performance: FPS during drawing (target 60 FPS)

**Manual validation steps post-deploy:**
1. Draw several paths, verify smooth rendering
2. Test real-time sync in 2 browser windows
3. Test with 50+ shapes, verify 60 FPS
4. Test keyboard shortcut (P key)
5. Test path selection, move, rotate, delete

---

## 16. Open Questions

**Q1:** Should paths support fill color in addition to stroke?
- **Answer:** No, stroke only for MVP. Fill can be added in future PR.

**Q2:** Should we support variable stroke width within a single path (pressure sensitivity)?
- **Answer:** No, uniform stroke width for MVP. Pressure support is out of scope.

**Q3:** What smoothing tolerance should we use?
- **Answer:** Start with tolerance=2.0, tune based on testing. Should reduce points by 50-70%.

---

## 17. Appendix: Out-of-Scope Backlog

Items explicitly deferred for future work with brief rationale.

- [ ] **Eraser tool:** Separate feature, requires path intersection logic
- [ ] **Path editing:** Node manipulation requires complex UI, defer to future PR
- [ ] **Pressure sensitivity:** Requires hardware support, niche use case
- [ ] **Brush patterns:** Textures/patterns are nice-to-have, not core feature
- [ ] **Path fill:** Closed path filling is separate feature
- [ ] **Path boolean operations:** Union/intersect/subtract for advanced users only

---

## Preflight Questionnaire (Completed)

1. **What is the smallest end-to-end user outcome we must deliver in this PR?**
   - User can click pencil tool, draw a smooth line, and see it sync to collaborators in <100ms

2. **Who is the primary user and what is their critical action?**
   - Postcard creator drawing free-form signatures and sketches

3. **Must-have vs nice-to-have: what gets cut first if time tight?**
   - Must: Basic drawing, sync, rendering. Nice-to-have: Advanced smoothing, keyboard shortcuts

4. **Real-time collaboration requirements (peers, <100ms sync)?**
   - Yes, <100ms sync required, tested with 2-4 simultaneous users

5. **Performance constraints (FPS, shape count, latency targets)?**
   - 60 FPS during drawing, works with 50+ shapes, <100ms sync latency

6. **Error/edge cases we must handle (validation, conflicts, offline)?**
   - Firestore write failures, very short/long paths, rapid drawing

7. **Data model changes needed (new fields/collections)?**
   - Add 'path' to type union, add points and strokeWidth fields

8. **Service APIs required (create/update/delete/subscribe)?**
   - createPath() required, updatePath() stub for future

9. **UI entry points and states (empty, loading, locked, error)?**
   - Tool button, drawing preview, cursor changes, error toasts

10. **Accessibility/keyboard expectations:**
    - P key shortcut, aria-labels, focus indicators

11. **Security/permissions implications:**
    - Standard Firestore rules (users can create shapes)

12. **Dependencies or blocking integrations:**
    - None, all infrastructure exists

13. **Rollout strategy (flag, migration) and success metrics:**
    - No flag, direct rollout, measure usage and latency

14. **What is explicitly out of scope for this iteration?**
    - Eraser, path editing, pressure sensitivity, fills, patterns

---

## Authoring Notes

- Test Plan written before coding
- Every sub-task has a pass/fail gate
- Vertical slice: complete pencil drawing feature
- Service layer is deterministic and testable
- UI is a thin wrapper around services

---

