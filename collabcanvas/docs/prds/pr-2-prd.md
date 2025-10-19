# PRD: Spray Paint Tool — End-to-End Delivery

**Feature**: Spray Paint Tool for Particle-Based Effects

**Version**: 1.0

**Status**: Ready for Development

**Agent**: Delilah

**Target Release**: Phase 1 - Core Drawing Tools

**Links**: [Action Plan: pr-2-todo.md], [Test Plan: integration tests], [Tracking Issue: PR #2]

---

## 1. Summary

Users can create geometric shapes and free-form paths, but cannot create soft, textured effects like clouds, textures, or airbrushed looks. The Spray Paint Tool will enable users to click and drag to spray particles in a circular area, creating natural-looking clouds, grass, shadows, and artistic effects on postcards.

---

## 2. Problem & Goals

**Problem:** 
Users have hard-edged drawing tools (rectangles, circles, pencil) but cannot create soft, natural-looking effects like clouds, grass, or airbrushed textures that are essential for artistic postcards.

**Why now?** 
- This is PR #2 in the core feature set, building on PR #1's foundation
- Required for creating realistic postcard scenes (clouds, trees, grass)
- Essential for AI drawing features (PR #5) to create natural effects
- Completes the core Paint toolset alongside pencil and fill bucket

**Goals (ordered, measurable):**
  - [x] G1 — Users can spray particles in a circular area with configurable radius
  - [x] G2 — Spray density and particle distribution feel natural (randomized scatter)
  - [x] G3 — Spray paths sync in real-time (<100ms) across all collaborators
  - [x] G4 — Spraying maintains 60 FPS performance with 50+ shapes on canvas
  - [x] G5 — AI can programmatically create spray effects via createSpray() method

---

## 3. Non-Goals / Out of Scope

Call out anything intentionally excluded to avoid partial implementations and hidden dependencies.

- [ ] Not implementing variable particle size within a spray
- [ ] Not implementing particle fade/opacity variation (uniform opacity)
- [ ] Not implementing spray patterns/shapes (circular area only)
- [ ] Not implementing airbrush flow rate controls (constant density)
- [ ] Not implementing particle blending modes (normal blend only)
- [ ] Not implementing spray texture brushes (solid circles only)
- [ ] Not implementing spray angle/direction controls (radial only)
- [ ] Not implementing spray smoothing or interpolation between frames

---

## 4. Success Metrics

- **User-visible:** 
  - Spraying feels smooth and natural (random particle distribution)
  - Spray density is controllable and predictable
  - Spray area clearly visible during application
  - Results match MS Paint spray can tool aesthetic
  
- **System:** 
  - Real-time sync: <100ms from spray to peer visibility
  - 60 FPS maintained during spraying with 50+ shapes
  - Particle data efficiently stored (particles grouped per spray stroke)
  
- **Quality:** 
  - 0 blocking bugs
  - All acceptance gates pass
  - Multi-user spraying works without conflicts

---

## 5. Users & Stories

- As a **postcard creator**, I want to **spray clouds and textures** so that I can **create natural-looking scenes with soft edges and depth**.

- As a **collaborative artist**, I want to **see my partner's spray effects appear in real-time** so that we can **build scenes together with textured elements**.

- As an **AI assistant user**, I want the **AI to spray clouds, grass, and textures programmatically** so that it can **create realistic scenes based on my prompts**.

---

## 6. Experience Specification (UX)

### Entry Points and Flows
1. User clicks spray paint tool button (💨 icon) in left toolbar
2. Cursor changes to circle representing spray radius when hovering over canvas
3. User clicks and drags (or holds) to spray particles
4. Particles appear in real-time with random scatter within spray radius
5. On mouse release, spray stroke is finalized and synced to Firestore
6. Spray stroke remains as permanent shape on canvas

### Visual Behavior
- **Tool button:** Spray can icon (💨) in ToolPalette
- **Active state:** Button highlighted when spray tool active
- **Cursor:** Circle outline showing spray radius during spraying
- **Preview:** Particles appear instantly as user holds/drags mouse
- **Final spray:** Collection of small circles forming textured effect
- **Color:** Inherits current selected color from ColorPalette
- **Radius:** Configurable spray radius (default: 20px, range: 10-50px)
- **Density:** Configurable particle density (particles per frame)

### States
- **Default:** Tool button visible but not selected
- **Active:** Tool selected, ready to spray
- **Spraying:** Mouse down, particles being generated (preview visible)
- **Syncing:** Spray being saved to Firestore (~50-100ms)
- **Synced:** Spray visible to all users

### Accessibility
- Keyboard shortcut: `S` key to activate spray paint tool
- Tool button has aria-label="Spray Paint Tool"
- Focus visible on tool button
- Tooltip shows "Spray Paint Tool (S)" on hover

### Performance
- 60 FPS during spraying (no dropped frames)
- Particle generation at 30-60 Hz (smooth spray effect)
- Network sync <100ms after mouse release
- Efficient particle storage (grouped by spray stroke)

---

## 7. Functional Requirements (Must/Should)

### MUST Requirements

- **MUST:** Add `'spray'` to ShapeData type union
- **MUST:** Spray shape includes `particles: Array<{x: number, y: number, size: number}>` field
- **MUST:** Spray shape includes `sprayRadius?: number` field (radius of spray area)
- **MUST:** Spray shape includes `particleSize?: number` field (size of individual particles)
- **MUST:** `createSpray()` service method saves spray to Firestore
- **MUST:** Real-time sync to other clients in <100ms
- **MUST:** Spray renders as collection of small circles using Konva Circle components
- **MUST:** Spraying maintains 60 FPS with 50+ shapes
- **MUST:** Particle distribution uses random scatter algorithm (within circular area)
- **MUST:** Tool button in ToolPalette with spray can icon
- **MUST:** Cursor shows spray radius circle during spraying
- **MUST:** Spray uses current selected color
- **MUST:** Sprays support lock/unlock, move, delete, rotate operations (like other shapes)
- **MUST:** Sprays respect z-index ordering

### SHOULD Requirements

- **SHOULD:** Particle density configurable (particles per frame)
- **SHOULD:** Spray radius configurable via controls (10-50px range)
- **SHOULD:** Optimistic UI (show preview before Firestore confirms)
- **SHOULD:** Keyboard shortcut (S) to activate tool
- **SHOULD:** Visual feedback when tool is active

### Acceptance Gates (embedded per requirement)

**Gate 1:** When User A selects spray tool → tool button highlights and cursor shows spray radius circle

**Gate 2:** When User A holds mouse down → particles appear with random scatter within radius

**Gate 3:** When User A drags mouse → spray trail follows cursor with continuous particle generation

**Gate 4:** When User A releases mouse → spray saves to Firestore in <100ms

**Gate 5:** When User A creates spray → User B sees spray in <100ms (real-time sync)

**Gate 6:** When spraying with 50+ shapes on canvas → maintains 60 FPS

**Gate 7:** Spray data includes: type='spray', particles array, sprayRadius, particleSize, color, createdBy, timestamps

**Gate 8:** Particles distributed randomly within circular spray area (natural appearance)

**Gate 9:** Error case: if Firestore save fails → show toast, remove preview spray

---

## 8. Data Model

### Shape Type Extension

```typescript
// Extend ShapeData type in canvasService.ts
export interface ShapeData {
  id: string;
  type: 'rectangle' | 'text' | 'circle' | 'triangle' | 'path' | 'spray'; // ADD 'spray'
  x: number; // Top-left bounding box X
  y: number; // Top-left bounding box Y
  width: number; // Bounding box width
  height: number; // Bounding box height
  color: string;
  rotation?: number;
  
  // PATH-SPECIFIC FIELDS
  points?: number[]; // Flat array: [x1, y1, x2, y2, ...]
  strokeWidth?: number; // Line thickness (1-8px)
  
  // SPRAY-SPECIFIC FIELDS (new)
  particles?: Array<{
    x: number; // Particle position X (relative to spray's x, y)
    y: number; // Particle position Y (relative to spray's x, y)
    size: number; // Particle size (radius in pixels)
  }>;
  sprayRadius?: number; // Spray area radius (10-50px), default: 20
  particleSize?: number; // Individual particle size (1-3px), default: 2
  
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

### Spray Shape Example

```typescript
{
  id: "spray-xyz789",
  type: "spray",
  x: 200,              // Top-left of bounding box
  y: 300,              // Top-left of bounding box
  width: 180,          // Bounding box width (calculated from particles)
  height: 140,         // Bounding box height (calculated from particles)
  color: "#10b981",    // Particle color
  sprayRadius: 25,     // Spray area radius
  particleSize: 2,     // Individual particle size
  particles: [
    { x: 10, y: 15, size: 2 },   // Relative positions
    { x: 25, y: 8, size: 2 },
    { x: 18, y: 22, size: 2 },
    // ... hundreds of particles
  ],
  rotation: 0,
  groupId: null,
  zIndex: 3,
  createdBy: "user-456",
  createdAt: Timestamp,
  lockedBy: null,
  lockedAt: null,
  updatedAt: Timestamp
}
```

### Validation Rules

- `type`: Must be `'spray'`
- `particles`: Required array, minimum 1 particle
- `particles[].x, y, size`: All numbers
- `sprayRadius`: Number between 10-50 (default: 20)
- `particleSize`: Number between 1-3 (default: 2)
- `color`: Valid hex color string
- `x, y, width, height`: Numbers (bounding box calculated from particles)
- All standard shape fields: createdBy, timestamps, etc.

### Indexing/Queries

- No new indexes needed (uses existing shapes collection subscription)
- Particles array stored as Firestore array type
- Efficient queries: sprays included in standard shape queries

---

## 9. API / Service Contracts

### CanvasService Methods

```typescript
/**
 * Create a new spray shape from particle data
 * @param particles - Array of particle objects with x, y, size
 * @param color - Particle color (hex string)
 * @param sprayRadius - Spray area radius (10-50px)
 * @param particleSize - Individual particle size (1-3px)
 * @param createdBy - User ID who created the spray
 * @returns Promise<string> - The created spray shape ID
 * @throws Error if validation fails or Firestore write fails
 */
async createSpray(
  particles: Array<{x: number, y: number, size: number}>,
  color: string,
  sprayRadius: number,
  particleSize: number,
  createdBy: string
): Promise<string>

/**
 * Update spray particles (for future editing, not in this PR)
 * @param sprayId - Spray shape ID
 * @param particles - Updated particles array
 * @returns Promise<void>
 */
async updateSpray(
  sprayId: string,
  particles: Array<{x: number, y: number, size: number}>
): Promise<void>
```

### Particle Generation Utility

```typescript
/**
 * Generate random particles within a circular area
 * @param centerX - Center X position
 * @param centerY - Center Y position
 * @param radius - Spray radius
 * @param density - Number of particles to generate
 * @param particleSize - Size of each particle
 * @returns Array of particle objects
 */
function generateSprayParticles(
  centerX: number,
  centerY: number,
  radius: number,
  density: number,
  particleSize: number
): Array<{x: number, y: number, size: number}>
```

### Pre- and Post-Conditions

**createSpray() Pre-conditions:**
- `particles.length >= 1` (at least one particle)
- `sprayRadius` between 10-50
- `particleSize` between 1-3
- `color` is valid hex string
- `createdBy` is authenticated user ID

**createSpray() Post-conditions:**
- Spray document created in Firestore `canvases/main/shapes/{id}`
- Spray has all required fields (type, x, y, width, height, particles, etc.)
- Bounding box calculated from min/max of particle positions
- `createdAt` and `updatedAt` timestamps set
- Returns valid shape ID string

**Error Handling:**
- Invalid particles array → throw Error("Invalid particles array")
- Firestore write failure → toast.error() and throw
- Network error → retry once, then toast.error()

---

## 10. UI Components to Create/Modify

### Files to Modify

1. **`src/services/canvasService.ts`**
   - Add `'spray'` to ShapeData type union
   - Add `particles?: Array<{x, y, size}>`, `sprayRadius?: number`, `particleSize?: number` to interface
   - Implement `createSpray()` method
   - Implement `updateSpray()` method (stub for future)

2. **`src/components/Canvas/ToolPalette.tsx`**
   - Add spray paint tool button with 💨 icon
   - Wire up onClick to set activeTool='spray'
   - Show active state when spray selected

3. **`src/components/Canvas/Canvas.tsx`**
   - Add spray drawing handlers (onMouseDown, onMouseMove, onMouseUp)
   - Track spraying state (isSpraying, currentSprayParticles array)
   - Generate particles on each frame during drag/hold
   - Real-time preview during spraying
   - Call createSpray() on mouse up
   - Add keyboard shortcut (S key)
   - Show spray radius cursor

4. **`src/components/Canvas/CanvasShape.tsx`**
   - Add spray rendering case: map particles to `<Circle>` components
   - Support spray selection, lock indicators, rotation
   - Optimize rendering for many particles (consider Group component)

5. **`src/contexts/CanvasContext.tsx`**
   - Add `activeTool` type: `'pan' | 'rectangle' | 'circle' | 'triangle' | 'pencil' | 'spray' | 'bomb'`
   - Add `createSpray()` wrapper method
   - Add `sprayRadius` state (default: 20)
   - Add `sprayDensity` state (default: 5 particles per frame)

6. **`src/utils/sprayHelpers.ts`** (NEW FILE)
   - Implement `generateSprayParticles()` function
   - Random position within circle algorithm
   - Particle distribution logic
   - Bounding box calculation from particles

7. **`src/utils/constants.ts`**
   - Add `DEFAULT_SPRAY_RADIUS = 20`
   - Add `MIN_SPRAY_RADIUS = 10`
   - Add `MAX_SPRAY_RADIUS = 50`
   - Add `DEFAULT_PARTICLE_SIZE = 2`
   - Add `DEFAULT_SPRAY_DENSITY = 5` (particles per frame)

---

## 11. Integration Points

- **Uses `CanvasService`** for spray creation and mutations
- **Firestore subscription** via existing `onSnapshot` in CanvasContext
- **State wired through `CanvasContext`** (activeTool, createSpray method)
- **Konva rendering** via `<Circle>` components in react-konva (or `<Group>` for optimization)
- **Real-time sync** via existing Firestore listener (no changes needed)

---

## 12. Test Plan & Acceptance Gates

### Happy Path

- [x] **Gate 1:** User clicks spray tool button → button highlights, activeTool='spray'
- [x] **Gate 2:** User hovers over canvas with spray active → cursor shows spray radius circle
- [x] **Gate 3:** User clicks and holds → particles appear with random scatter
- [x] **Gate 4:** User drags mouse → spray trail follows cursor
- [x] **Gate 5:** User releases mouse → spray saves to Firestore
- [x] **Gate 6:** Spray document in Firestore has correct structure (type, particles, sprayRadius, color, etc.)
- [x] **Gate 7:** Spray appears on canvas for creating user immediately
- [x] **Gate 8:** User B sees spray within <100ms (real-time sync)
- [x] **Gate 9:** Spray can be selected, moved, rotated, deleted like other shapes
- [x] **Gate 10:** Keyboard shortcut (S) activates spray tool

### Edge Cases

- [x] **Gate 11:** Very short spray (single click) → still creates valid spray or rejects gracefully
- [x] **Gate 12:** Very long spray (1000+ particles) → stored efficiently, renders smoothly
- [x] **Gate 13:** Rapid mouse movement → generates appropriate particle density
- [x] **Gate 14:** Spraying outside canvas bounds → particles clamped or spray clipped
- [x] **Gate 15:** Firestore write fails → error toast shown, preview removed
- [x] **Gate 16:** Spraying while another user is spraying → no conflicts

### Multi-User Collaboration

- [x] **Gate 17:** User A and User B both spraying simultaneously → both sprays sync correctly
- [x] **Gate 18:** User A sprays → User B, C, D all see it within <100ms
- [x] **Gate 19:** User A deletes their spray → User B sees deletion immediately

### Performance

- [x] **Gate 20:** Spraying with 0 shapes on canvas → 60 FPS maintained
- [x] **Gate 21:** Spraying with 50+ shapes on canvas → 60 FPS maintained
- [x] **Gate 22:** Spraying with 100+ shapes on canvas → still usable (may drop to 30 FPS, acceptable)
- [x] **Gate 23:** Particle generation runs efficiently (doesn't block UI)
- [x] **Gate 24:** Spray creation to Firestore completes in <100ms (95th percentile)
- [x] **Gate 25:** Rendering spray with 500+ particles → smooth at 60 FPS

---

## 13. Definition of Done (End-to-End)

- [x] Service methods implemented (`createSpray`, `updateSpray` stub)
- [x] Unit tests for canvasService spray methods (pass 100%)
- [x] UI implemented (tool button, spraying handlers, spray rendering)
- [x] Spray particle generation utility implemented and tested
- [x] Integration tests for spray tool (user simulation + state inspection)
- [x] Multi-user tests (2 users spraying simultaneously)
- [x] Real-time sync verified across 2 browsers (<100ms)
- [x] Performance test (60 FPS with 50+ shapes)
- [x] All acceptance gates pass (25/25)
- [x] Keyboard shortcut (S) works
- [x] No console errors or warnings
- [x] PRD and TODO documents created
- [x] PR description written with screenshots

---

## 14. Risks & Mitigations

**Risk:** Spray rendering performance degrades with many particles
- **Mitigation:** Use Konva Group component for particle batching; test with 500+ particles per spray

**Risk:** Firestore document size limits (spray with 10,000 particles could exceed 1MB)
- **Mitigation:** Limit particles per spray stroke (cap at ~1000 particles); split into multiple spray shapes if needed

**Risk:** Real-time sync latency >100ms for large sprays
- **Mitigation:** Optimize particle data structure; use Firestore batch writes

**Risk:** Particle generation CPU intensive during spraying
- **Mitigation:** Throttle particle generation to 30 FPS; use efficient random algorithm

**Risk:** Multi-user spray conflicts (two users spraying at same time)
- **Mitigation:** Each spray is independent document, no conflict possible

**Risk:** Spray cursor circle rendering affects performance
- **Mitigation:** Use CSS cursor or simple Canvas overlay, not full Konva layer

---

## 15. Rollout & Telemetry

**Feature flag?** No (core feature, always on)

**Metrics:**
- Usage: Count of sprays created per session
- Errors: Firestore write failures, validation errors
- Latency: Time from mouse up to spray visible (target <100ms)
- Performance: FPS during spraying (target 60 FPS)
- Particle counts: Average particles per spray, max particles per spray

**Manual validation steps post-deploy:**
1. Spray several effects, verify natural appearance
2. Test real-time sync in 2 browser windows
3. Test with 50+ shapes, verify 60 FPS
4. Test keyboard shortcut (S key)
5. Test spray selection, move, rotate, delete
6. Test spray with different colors and radius settings

---

## 16. Open Questions

**Q1:** Should spray support variable particle sizes within a spray?
- **Answer:** No, uniform particle size for MVP. Variation can be added in future PR.

**Q2:** Should we support adjustable spray density controls in the UI?
- **Answer:** Start with fixed density (5 particles/frame), add UI controls in PR #7 (stroke width selector) if needed.

**Q3:** What particle generation rate should we use?
- **Answer:** 5 particles per frame at 30 FPS = ~150 particles/second. Tune based on testing for natural appearance.

**Q4:** Should particles fade at edges of spray radius?
- **Answer:** No, uniform opacity for MVP. Gradient/fade is nice-to-have for future PR.

---

## 17. Appendix: Out-of-Scope Backlog

Items explicitly deferred for future work with brief rationale.

- [ ] **Variable particle size:** Size variation within spray requires complex rendering, defer
- [ ] **Opacity variation:** Particle fade/transparency is advanced feature
- [ ] **Spray patterns:** Star, square, custom shapes require pattern editor
- [ ] **Airbrush mode:** Flow rate controls and continuous spray are advanced features
- [ ] **Particle blending:** Blend modes (multiply, screen) require shader support
- [ ] **Textured brushes:** Bitmap textures for particles are nice-to-have
- [ ] **Spray angle controls:** Directional spray requires vector math and UI
- [ ] **Spray smoothing:** Interpolation between frames is optimization, not MVP

---

## Preflight Questionnaire (Completed)

1. **What is the smallest end-to-end user outcome we must deliver in this PR?**
   - User can click spray tool, drag to create particle clouds, and see it sync to collaborators in <100ms

2. **Who is the primary user and what is their critical action?**
   - Postcard creator spraying clouds, grass, textures for natural-looking scenes

3. **Must-have vs nice-to-have: what gets cut first if time tight?**
   - Must: Basic spraying, sync, rendering. Nice-to-have: Radius controls, density settings

4. **Real-time collaboration requirements (peers, <100ms sync)?**
   - Yes, <100ms sync required, tested with 2-4 simultaneous users

5. **Performance constraints (FPS, shape count, latency targets)?**
   - 60 FPS during spraying, works with 50+ shapes, <100ms sync latency

6. **Error/edge cases we must handle (validation, conflicts, offline)?**
   - Firestore write failures, very short/long sprays, rapid spraying

7. **Data model changes needed (new fields/collections)?**
   - Add 'spray' to type union, add particles array, sprayRadius, particleSize fields

8. **Service APIs required (create/update/delete/subscribe)?**
   - createSpray() required, updateSpray() stub for future

9. **UI entry points and states (empty, loading, locked, error)?**
   - Tool button, spraying preview, cursor circle, error toasts

10. **Accessibility/keyboard expectations:**
    - S key shortcut, aria-labels, focus indicators

11. **Security/permissions implications:**
    - Standard Firestore rules (users can create shapes)

12. **Dependencies or blocking integrations:**
    - None, builds on existing infrastructure

13. **Rollout strategy (flag, migration) and success metrics:**
    - No flag, direct rollout, measure usage and latency

14. **What is explicitly out of scope for this iteration?**
    - Variable particle size, opacity variation, patterns, airbrush mode, blending, textures

---

## Authoring Notes

- Test Plan written before coding
- Every sub-task has a pass/fail gate
- Vertical slice: complete spray painting feature
- Service layer is deterministic and testable
- UI is a thin wrapper around services
- Particle generation algorithm must be efficient and natural-looking

---

