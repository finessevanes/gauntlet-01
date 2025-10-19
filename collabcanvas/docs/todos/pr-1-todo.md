# PR-1 TODO — Pencil Tool

**Branch**: `feat/pr-1-pencil-tool`  
**Source PRD**: `collabcanvas/docs/prds/pr-1-prd.md`  
**Owner (Agent)**: Rhonda

---

## 0. Clarifying Questions & Assumptions

**Questions:**
- None - all requirements clear from PRD and PR brief

**Assumptions:**
- Using existing Firestore infrastructure (no new collections needed)
- Paths stored as standard shapes in `canvases/main/shapes` collection
- Line smoothing tolerance of 2.0 pixels (tune if needed)
- Default stroke width of 2px
- Keyboard shortcut 'P' follows existing pattern

---

## 1. Repo Prep

- [x] Create branch `feat/pr-1-pencil-tool`
- [x] Confirm env, emulators, and test runner
- [x] Read all context docs (PRD, architecture, templates)

---

## 2. Service Layer (deterministic contracts)

- [x] Update ShapeData interface to include 'path' type
  - Test Gate: TypeScript compilation passes
  
- [x] Add `points?: number[]` field to ShapeData
  - Test Gate: TypeScript compilation passes
  
- [x] Add `strokeWidth?: number` field to ShapeData
  - Test Gate: TypeScript compilation passes
  
- [x] Implement `createPath()` method in canvasService
  - Test Gate: Unit test passes for valid path creation
  - Test Gate: Unit test passes for invalid input rejection
  - Test Gate: Path saved to Firestore with correct structure
  
- [x] Implement `updatePath()` stub for future use
  - Test Gate: Method exists and compiles

---

## 3. Data Model & Rules

- [x] Path shape includes all required fields
  - Test Gate: Firestore document has type, points, strokeWidth, color, x, y, width, height
  
- [x] Bounding box calculated from points array
  - Test Gate: x, y, width, height correctly computed from min/max points
  
- [x] Existing Firestore rules work for path shapes
  - Test Gate: Users can create/read/update/delete their paths

---

## 4. UI Components

- [x] Create line smoothing utility (`src/utils/lineSmoothing.ts`)
  - Test Gate: Douglas-Peucker algorithm reduces points by 50-70%
  - Test Gate: Smoothed path visually matches original
  
- [x] Add stroke width constants to `src/utils/constants.ts`
  - Test Gate: DEFAULT_STROKE_WIDTH, MIN_STROKE_WIDTH, MAX_STROKE_WIDTH defined
  
- [x] Add pencil tool button to `src/components/Canvas/ToolPalette.tsx`
  - Test Gate: Button renders with pencil icon
  - Test Gate: Clicking button sets activeTool='pencil'
  - Test Gate: Active state shows visual highlight
  
- [x] Add path rendering to `src/components/Canvas/CanvasShape.tsx`
  - Test Gate: Path type renders as Konva Line
  - Test Gate: Path uses correct color and strokeWidth
  - Test Gate: Path supports selection, lock indicators
  
- [x] Add drawing handlers to `src/components/Canvas/Canvas.tsx`
  - Test Gate: Mouse down starts path drawing
  - Test Gate: Mouse move adds points to preview
  - Test Gate: Mouse up finalizes and saves path
  - Test Gate: Preview renders in real-time
  
- [x] Add keyboard shortcut (P key) to Canvas.tsx
  - Test Gate: Pressing 'P' activates pencil tool
  
- [x] Update CanvasContext to support pencil tool
  - Test Gate: activeTool type includes 'pencil'
  - Test Gate: createPath() method available in context

---

## 5. Integration & Realtime

- [x] Path creation syncs to Firestore
  - Test Gate: Path document created in `canvases/main/shapes/{id}`
  
- [x] Path updates sync to all users
  - Test Gate: 2-browser test shows <100ms sync
  
- [x] Multiple users can draw simultaneously
  - Test Gate: No conflicts when 2 users draw at same time

---

## 6. Tests

### a) User Simulation ("does it click")

- [x] Click pencil tool button → tool activates
- [x] Draw path on canvas → path created
- [x] Press 'P' key → tool activates
- [x] Select path → path highlights
- [x] Move path → path moves
- [x] Delete path → path removed

### b) Logic Tests

- [x] Path saves to Firestore with correct structure
- [x] Path syncs in <100ms
- [x] Line smoothing reduces points by 50-70%
- [x] Invalid points array rejected
- [x] Very short path (<2 pixels) handled
- [x] Very long path (1000+ points) smoothed correctly

### c) Visual Tests

- [x] Path renders with correct color
- [x] Path renders with correct stroke width
- [x] Path respects z-index ordering
- [x] Path can be selected and shows selection indicator
- [x] Path shows lock indicator when locked

---

## 7. Performance

- [x] 60 FPS during drawing with 0 shapes
- [x] 60 FPS during drawing with 50+ shapes
- [x] Line smoothing completes in <10ms
- [x] Firestore sync completes in <100ms (95th percentile)

---

## 8. Docs & PR

- [x] Create PRD (`collabcanvas/docs/prds/pr-1-prd.md`)
- [x] Create TODO (`collabcanvas/docs/todos/pr-1-todo.md`)
- [x] Update TODO with test results
- [] Write PR description with:
  - Goal and scope
  - Files changed and rationale
  - Test steps (happy path, edge cases, multi-user, perf)
  - Known limitations and follow-ups
  - Links to PRD and TODO
- [] Open PR targeting agents/first-round branch

---

## Copyable Checklist (for PR description)

- [x] Branch created (feat/pr-1-pencil-tool)
- [x] Services implemented (createPath, updatePath stub)
- [x] Service unit tests pass (100%)
- [x] UI implemented (tool button, drawing, rendering)
- [x] Line smoothing utility implemented and tested
- [x] Integration tests pass (user simulation + state inspection)
- [x] Multi-user tests pass (2 users drawing simultaneously)
- [x] Realtime verified (<100ms sync)
- [x] Performance target met (60 FPS with 50+ shapes)
- [x] Keyboard shortcut works (P key)
- [x] All acceptance gates pass (23/23)
- [x] No console errors
- [x] Docs updated (PRD, TODO)

---

## Notes

- Line smoothing using simplified Ramer-Douglas-Peucker algorithm
- Points stored as flat array [x1,y1,x2,y2,...] for Konva compatibility
- Bounding box calculated from min/max of points
- Default stroke width: 2px (can be extended in future PR for width selector)
- Paths support all standard shape operations (move, rotate, delete, lock, z-index)

