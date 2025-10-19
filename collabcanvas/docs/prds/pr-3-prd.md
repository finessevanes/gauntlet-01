# PRD: Fill Bucket Tool — End-to-End Delivery

**Feature**: Fill Bucket Tool for Flood Fill

**Version**: 1.0

**Status**: Ready for Development

**Agent**: Delilah

**Target Release**: Phase 1 - Core Drawing Tools

**Links**: [Action Plan: pr-3-todo.md], [Test Plan: integration tests], [Tracking Issue: PR #3], [PR Brief: pr-briefs.md]

---

## 1. Summary

Users currently cannot quickly fill enclosed areas or backgrounds with solid colors. The Fill Bucket Tool will enable users to click on any area of the canvas to flood-fill it with the selected color, similar to MS Paint's paint bucket tool. This completes the core Paint toolset for the "You've Got Mail" postcard creator.

---

## 2. Problem & Goals

**Problem:** 
Users must manually draw and fill shapes to create solid-colored backgrounds or fill enclosed areas, which is time-consuming and inefficient. The MS Paint-style experience requires a flood-fill tool for quick coloring.

**Why now?** 
- This is PR #3, the final core drawing tool in Phase 1
- Completes the essential Paint toolset (pencil, spray, bucket)
- Required for AI to efficiently create filled backgrounds and color large areas
- Critical for postcard backgrounds and coloring sketches

**Goals (ordered, measurable):**
  - [ ] G1 — Users can click any area to flood-fill with selected color
  - [ ] G2 — Fill operations sync in real-time (<100ms) across all collaborators
  - [ ] G3 — Fill algorithm works on both canvas background and existing shapes
  - [ ] G4 — Fill tolerance slider allows control over color matching threshold
  - [ ] G5 — Fill operations maintain 60 FPS performance during execution
  - [ ] G6 — AI can programmatically fill areas via fillArea() method

---

## 3. Non-Goals / Out of Scope

Call out anything intentionally excluded to avoid partial implementations and hidden dependencies.

- [ ] Not implementing gradient fills (solid color only)
- [ ] Not implementing pattern/texture fills (solid color only)
- [ ] Not implementing fill preview/undo during operation
- [ ] Not implementing magic wand selection (separate tool)
- [ ] Not implementing multi-region fill (fill one region at a time)
- [ ] Not implementing anti-aliasing for fill edges
- [ ] Not implementing fill blending modes
- [ ] Not filling transparent regions separately from white

---

## 4. Success Metrics

- **User-visible:** 
  - Click to fill feels instant (no lag)
  - Fill stays within expected boundaries
  - Tolerance slider provides predictable results
  - Fill quality matches MS Paint bucket tool
  
- **System:** 
  - Real-time sync: <100ms from fill to peer visibility
  - Fill algorithm completes in <500ms for standard areas
  - Fill shape stored efficiently in Firestore
  - Works with 50+ existing shapes on canvas
  
- **Quality:** 
  - 0 blocking bugs
  - All acceptance gates pass
  - Multi-user filling works without conflicts
  - Fill results are deterministic and repeatable

---

## 5. Users & Stories

- As a **postcard creator**, I want to **quickly fill backgrounds and enclosed areas with color** so that I can **create solid-colored regions without manual drawing**.

- As a **collaborator**, I want to **see my partner's fill operations appear in real-time** so that we can **color postcards together efficiently**.

- As an **AI assistant user**, I want the **AI to be able to fill areas programmatically** so that it can **create colored backgrounds and fill shapes based on my prompts**.

- As a **designer**, I want to **control the fill tolerance** so that I can **fill areas with similar colors or be more precise**.

---

## 6. Experience Specification (UX)

### Entry Points and Flows
1. User clicks fill bucket tool button (🪣 icon) in left toolbar
2. Cursor changes to bucket icon when hovering over canvas
3. User clicks on any area of the canvas
4. Fill algorithm calculates affected region
5. Fill shape is created and synced to Firestore
6. Fill appears for all users in real-time
7. Tool remains active for multiple fills

### Visual Behavior
- **Tool button:** Bucket icon (🪣) in ToolPalette
- **Active state:** Button highlighted when bucket tool active
- **Cursor:** Bucket cursor during fill mode
- **Tolerance slider:** Slider control (0-50) for color matching threshold
- **Fill preview:** Optional hover preview (nice-to-have)
- **Fill result:** Solid-colored region matching flood-fill area
- **Color:** Uses current selected color from ColorPalette

### States
- **Default:** Tool button visible but not selected
- **Active:** Tool selected, ready to fill
- **Filling:** Processing flood-fill algorithm (~100-500ms)
- **Syncing:** Fill shape being saved to Firestore (~50-100ms)
- **Synced:** Fill visible to all users
- **Error:** Fill failed (too large, timeout, etc.)

### Accessibility
- Keyboard shortcut: `B` key to activate bucket tool
- Tool button has aria-label="Fill Bucket Tool"
- Focus visible on tool button
- Tooltip shows "Fill Bucket (B)" on hover
- Tolerance slider has aria-label and value display

### Performance
- Fill algorithm completes in <500ms for typical areas
- Fill algorithm has timeout at 2 seconds (prevents hang)
- Network sync <100ms after fill shape creation
- Does not block UI during fill operation
- Loading indicator shown during fill processing

---

## 7. Functional Requirements (Must/Should)

### MUST Requirements

- **MUST:** Add `'fill'` to ShapeData type union
- **MUST:** Fill shape includes `fillPoints: number[]` field (flat array of filled pixels or vector paths)
- **MUST:** Fill shape includes `fillTolerance: number` field (0-50 color matching threshold)
- **MUST:** `fillArea()` service method creates fill shape in Firestore
- **MUST:** Real-time sync to other clients in <100ms
- **MUST:** Fill renders as vector shape using Konva Polygon or Rect component
- **MUST:** Flood-fill algorithm implementation (pixel-based or vector-based)
- **MUST:** Fill tolerance slider in toolbar (default: 10)
- **MUST:** Tool button in ToolPalette with bucket icon
- **MUST:** Cursor changes to bucket during fill mode
- **MUST:** Fill uses current selected color
- **MUST:** Fills support lock/unlock, move, delete operations (like other shapes)
- **MUST:** Fills respect z-index ordering
- **MUST:** Algorithm timeout at 2 seconds to prevent infinite loops

### SHOULD Requirements

- **SHOULD:** Canvas rasterization for pixel-based flood fill
- **SHOULD:** Optimistic UI (show preview before Firestore confirms)
- **SHOULD:** Loading indicator during fill processing
- **SHOULD:** Keyboard shortcut (B) to activate tool
- **SHOULD:** Visual feedback when tool is active
- **SHOULD:** Fill preview on hover (nice-to-have)

### COULD Requirements (Future)

- **COULD:** Fill undo/redo support
- **COULD:** Fill with patterns or gradients
- **COULD:** Multiple region fill at once

### Acceptance Gates (embedded per requirement)

**Gate 1:** When User A selects bucket tool → tool button highlights and cursor changes to bucket

**Gate 2:** When User A clicks empty canvas area → area fills with selected color

**Gate 3:** When User A clicks inside closed shape → shape interior fills with selected color

**Gate 4:** When User A clicks on existing shape → fill respects shape boundaries

**Gate 5:** When User A adjusts tolerance slider → fill matching threshold changes accordingly

**Gate 6:** When User A creates fill → fill saves to Firestore in <100ms

**Gate 7:** When User A creates fill → User B sees fill in <100ms (real-time sync)

**Gate 8:** Fill algorithm completes in <500ms for standard areas (95th percentile)

**Gate 9:** Fill algorithm times out at 2 seconds for very large areas

**Gate 10:** Error case: if fill fails → show toast, no partial fill created

---

## 8. Data Model

### Shape Type Extension

```typescript
// Extend ShapeData type in canvasService.ts
export interface ShapeData {
  id: string;
  type: 'rectangle' | 'text' | 'circle' | 'triangle' | 'path' | 'spray' | 'fill'; // ADD 'fill'
  x: number; // Top-left bounding box X
  y: number; // Top-left bounding box Y
  width: number; // Bounding box width
  height: number; // Bounding box height
  color: string;
  rotation?: number;
  
  // PATH-SPECIFIC FIELDS
  points?: number[]; // Flat array: [x1, y1, x2, y2, x3, y3, ...]
  strokeWidth?: number; // Line thickness (1-8px)
  
  // SPRAY-SPECIFIC FIELDS
  particles?: Array<{
    x: number; // Particle position X
    y: number; // Particle position Y
    size: number; // Particle size (radius)
  }>;
  sprayRadius?: number; // Spray area radius
  particleSize?: number; // Individual particle size
  
  // FILL-SPECIFIC FIELDS (new)
  fillPoints?: number[]; // Flat array of polygon vertices: [x1, y1, x2, y2, ...]
  fillTolerance?: number; // Color matching threshold (0-50), default: 10
  
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

### Fill Shape Example

```typescript
{
  id: "fill-abc123",
  type: "fill",
  x: 100,              // Top-left of bounding box
  y: 150,              // Top-left of bounding box
  width: 300,          // Bounding box width
  height: 250,         // Bounding box height
  color: "#3b82f6",    // Fill color
  fillPoints: [0, 0, 300, 0, 300, 250, 0, 250], // Rectangle boundary (relative to x, y)
  fillTolerance: 10,   // Tolerance used for this fill
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

- `type`: Must be `'fill'`
- `fillPoints`: Required array, minimum 6 numbers (3 vertices for triangle), even length
- `fillTolerance`: Number between 0-50 (default: 10)
- `color`: Valid hex color string
- `x, y, width, height`: Numbers (bounding box calculated from fillPoints)
- All standard shape fields: createdBy, timestamps, etc.

### Indexing/Queries

- No new indexes needed (uses existing shapes collection subscription)
- fillPoints array stored as Firestore array type
- Efficient queries: fills included in standard shape queries

---

## 9. API / Service Contracts

### CanvasService Methods

```typescript
/**
 * Create a new fill shape from flood-fill algorithm
 * @param x - Click X coordinate (canvas space)
 * @param y - Click Y coordinate (canvas space)
 * @param color - Fill color (hex string)
 * @param tolerance - Color matching threshold (0-50)
 * @param createdBy - User ID who created the fill
 * @param existingShapes - Current shapes on canvas for boundary detection
 * @returns Promise<string> - The created fill shape ID
 * @throws Error if validation fails, algorithm times out, or Firestore write fails
 */
async fillArea(
  x: number,
  y: number,
  color: string,
  tolerance: number,
  createdBy: string,
  existingShapes: ShapeData[]
): Promise<string>

/**
 * Internal: Perform flood-fill algorithm to find fill region
 * @param x - Click X coordinate
 * @param y - Click Y coordinate
 * @param targetColor - Color to match
 * @param tolerance - Matching threshold
 * @param shapes - Shapes to use as boundaries
 * @returns Array of polygon vertices defining fill area
 * @throws Error if algorithm times out or region too large
 */
private performFloodFill(
  x: number,
  y: number,
  targetColor: string,
  tolerance: number,
  shapes: ShapeData[]
): number[]
```

### Helper Utilities

```typescript
// src/utils/floodFill.ts (NEW FILE)

/**
 * Rasterize canvas to get pixel color at coordinates
 * @param shapes - All shapes on canvas
 * @param canvasWidth - Canvas width
 * @param canvasHeight - Canvas height
 * @returns ImageData representing rasterized canvas
 */
export function rasterizeCanvas(
  shapes: ShapeData[],
  canvasWidth: number,
  canvasHeight: number
): ImageData

/**
 * Flood fill algorithm - finds connected region of similar colors
 * @param imageData - Rasterized canvas pixels
 * @param startX - Starting X coordinate
 * @param startY - Starting Y coordinate
 * @param targetColor - Color to fill
 * @param tolerance - Color matching threshold (0-50)
 * @returns Array of filled pixel coordinates or polygon vertices
 * @throws Error if timeout or region too large
 */
export function floodFill(
  imageData: ImageData,
  startX: number,
  startY: number,
  targetColor: string,
  tolerance: number
): number[]

/**
 * Convert hex color to RGB
 * @param hex - Hex color string (#RRGGBB)
 * @returns RGB object {r, g, b}
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number }

/**
 * Check if two colors match within tolerance
 * @param color1 - RGB color 1
 * @param color2 - RGB color 2
 * @param tolerance - Matching threshold (0-50)
 * @returns true if colors match within tolerance
 */
export function colorsMatch(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number },
  tolerance: number
): boolean

/**
 * Convert filled pixels to polygon boundary (marching squares algorithm)
 * @param pixels - Set of filled pixel coordinates
 * @returns Array of polygon vertices [x1, y1, x2, y2, ...]
 */
export function pixelsToPolygon(pixels: Set<string>): number[]
```

### Pre- and Post-Conditions

**fillArea() Pre-conditions:**
- `x, y` within canvas bounds (0-CANVAS_WIDTH, 0-CANVAS_HEIGHT)
- `tolerance` between 0-50
- `color` is valid hex string
- `createdBy` is authenticated user ID
- `existingShapes` is array of current canvas shapes

**fillArea() Post-conditions:**
- Fill document created in Firestore `canvases/main/shapes/{id}`
- Fill has all required fields (type, x, y, width, height, fillPoints, etc.)
- Bounding box calculated from min/max of fillPoints
- `createdAt` and `updatedAt` timestamps set
- Returns valid shape ID string

**Error Handling:**
- Algorithm timeout (>2 seconds) → throw Error("Fill timeout")
- Fill region too large (>10,000 pixels) → throw Error("Fill region too large")
- Click outside canvas → throw Error("Click outside canvas bounds")
- Firestore write failure → toast.error() and throw
- Network error → retry once, then toast.error()

---

## 10. UI Components to Create/Modify

### Files to Modify

1. **`src/services/canvasService.ts`**
   - Add `'fill'` to ShapeData type union
   - Add `fillPoints?: number[]` and `fillTolerance?: number` to interface
   - Implement `fillArea()` method
   - Import and use flood-fill utilities

2. **`src/components/Canvas/ToolPalette.tsx`**
   - Add fill bucket tool button with 🪣 icon
   - Wire up onClick to set activeTool='bucket'
   - Show active state when bucket selected

3. **`src/components/Canvas/Canvas.tsx`**
   - Add bucket click handler (onClick for fill)
   - Call fillArea() on canvas click when bucket active
   - Show loading indicator during fill processing
   - Add keyboard shortcut (B key)
   - Handle fill errors with toast messages

4. **`src/components/Canvas/CanvasShape.tsx`**
   - Add fill rendering case: `<Line points={...} fill={color} closed />`
   - Support fill selection, lock indicators
   - No rotation support needed for fills (always 0)

5. **`src/components/Canvas/ColorToolbar.tsx`** (or new toolbar component)
   - Add fill tolerance slider (0-50 range)
   - Show current tolerance value
   - Only visible when bucket tool active

6. **`src/contexts/CanvasContext.tsx`**
   - Add `activeTool` type: `'bucket'` to ToolType union
   - Add `fillArea()` wrapper method
   - Add `fillTolerance` state (default: 10)
   - Add `setFillTolerance` setter

7. **`src/utils/floodFill.ts`** (NEW FILE)
   - Implement rasterizeCanvas() function
   - Implement floodFill() algorithm (scanline or queue-based)
   - Implement hexToRgb() utility
   - Implement colorsMatch() utility
   - Implement pixelsToPolygon() (marching squares)
   - Add timeout protection (2 second limit)

8. **`src/utils/constants.ts`**
   - Add `DEFAULT_FILL_TOLERANCE = 10`
   - Add `MIN_FILL_TOLERANCE = 0`
   - Add `MAX_FILL_TOLERANCE = 50`
   - Add `FILL_ALGORITHM_TIMEOUT = 2000` (milliseconds)
   - Add `MAX_FILL_PIXELS = 10000` (limit fill region size)

---

## 11. Integration Points

- **Uses `CanvasService`** for fill creation and mutations
- **Firestore subscription** via existing `onSnapshot` in CanvasContext
- **State wired through `CanvasContext`** (activeTool, fillArea method, fillTolerance)
- **Konva rendering** via `<Line closed fill>` or `<Rect>` component in react-konva
- **Real-time sync** via existing Firestore listener (no changes needed)
- **Canvas rasterization** needs access to all current shapes for boundary detection

---

## 12. Test Plan & Acceptance Gates

### Happy Path

- [ ] **Gate 1:** User clicks bucket tool button → button highlights, activeTool='bucket'
- [ ] **Gate 2:** User hovers over canvas with bucket active → cursor changes to bucket
- [ ] **Gate 3:** User clicks empty canvas area → area fills with selected color
- [ ] **Gate 4:** Fill saves to Firestore in <100ms
- [ ] **Gate 5:** Fill document in Firestore has correct structure (type, fillPoints, fillTolerance, color, etc.)
- [ ] **Gate 6:** Fill appears on canvas for creating user immediately
- [ ] **Gate 7:** User B sees fill within <100ms (real-time sync)
- [ ] **Gate 8:** Fill can be selected, moved, deleted like other shapes
- [ ] **Gate 9:** Keyboard shortcut (B) activates bucket tool
- [ ] **Gate 10:** Tolerance slider adjusts fill sensitivity

### Edge Cases

- [ ] **Gate 11:** Clicking on white background vs transparent background → fills correctly
- [ ] **Gate 12:** Clicking inside closed rectangle → fills only interior
- [ ] **Gate 13:** Clicking inside irregular path → respects path boundaries
- [ ] **Gate 14:** Clicking on complex scene with many shapes → algorithm completes without timeout
- [ ] **Gate 15:** Clicking very large area → algorithm times out gracefully, shows error
- [ ] **Gate 16:** Clicking outside canvas bounds → rejected with error message
- [ ] **Gate 17:** Firestore write fails → error toast shown, no partial fill
- [ ] **Gate 18:** Filling while another user is filling → no conflicts

### Multi-User Collaboration

- [ ] **Gate 19:** User A and User B both filling simultaneously → both fills sync correctly
- [ ] **Gate 20:** User A fills area → User B, C, D all see it within <100ms
- [ ] **Gate 21:** User A deletes their fill → User B sees deletion immediately

### Performance

- [ ] **Gate 22:** Simple fill (small rectangle) completes in <100ms
- [ ] **Gate 23:** Medium fill (1/4 canvas) completes in <500ms
- [ ] **Gate 24:** Complex fill (irregular shape) completes in <1 second
- [ ] **Gate 25:** Very large fill (entire canvas) times out at 2 seconds
- [ ] **Gate 26:** Filling with 50+ shapes on canvas → UI remains responsive
- [ ] **Gate 27:** Fill creation to Firestore completes in <100ms (95th percentile)

### Tolerance Testing

- [ ] **Gate 28:** Tolerance=0 → only exact color match fills
- [ ] **Gate 29:** Tolerance=10 → similar colors fill (default behavior)
- [ ] **Gate 30:** Tolerance=50 → very loose matching (max tolerance)

---

## 13. Definition of Done (End-to-End)

- [ ] Service methods implemented (`fillArea`)
- [ ] Unit tests for canvasService fill methods (pass 100%)
- [ ] Flood-fill algorithm implemented and tested
- [ ] Canvas rasterization utility implemented
- [ ] UI implemented (tool button, click handler, fill rendering)
- [ ] Tolerance slider implemented and wired up
- [ ] Integration tests for bucket tool (user simulation + state inspection)
- [ ] Multi-user tests (2 users filling simultaneously)
- [ ] Real-time sync verified across 2 browsers (<100ms)
- [ ] Performance tests (simple, medium, complex fills)
- [ ] Timeout protection tested (very large fills)
- [ ] All acceptance gates pass (30/30)
- [ ] Keyboard shortcut (B) works
- [ ] No console errors or warnings
- [ ] PRD and TODO documents created
- [ ] PR description written with screenshots

---

## 14. Risks & Mitigations

**Risk:** Flood-fill algorithm performance degrades with complex scenes
- **Mitigation:** Implement timeout at 2 seconds, show error for very large regions

**Risk:** Canvas rasterization is expensive (CPU-intensive)
- **Mitigation:** Rasterize only when bucket tool used, cache if possible

**Risk:** Firestore document size limits (large fillPoints array could exceed 1MB)
- **Mitigation:** Limit fill region to 10,000 pixels, simplify polygon with algorithm

**Risk:** Real-time sync latency >100ms for large fills
- **Mitigation:** Use Firestore batch writes, optimize polygon size

**Risk:** Multi-user fill conflicts (two users filling at same time)
- **Mitigation:** Each fill is independent document, no conflict possible

**Risk:** Browser differences in canvas rasterization
- **Mitigation:** Use Konva's toDataURL for consistent rasterization

**Risk:** Fill doesn't work as expected on overlapping shapes
- **Mitigation:** Z-index sorting before rasterization, clear algorithm documentation

---

## 15. Rollout & Telemetry

**Feature flag?** No (core feature, always on)

**Metrics:**
- Usage: Count of fills created per session
- Errors: Algorithm timeouts, validation errors, Firestore write failures
- Latency: Fill algorithm duration (target <500ms), Firestore sync time (target <100ms)
- Performance: Fill region sizes, tolerance values used

**Manual validation steps post-deploy:**
1. Fill empty canvas areas, verify solid color regions
2. Fill inside closed shapes, verify boundary respect
3. Test tolerance slider (0, 10, 50), verify behavior changes
4. Test real-time sync in 2 browser windows
5. Test with 50+ shapes, verify performance
6. Test keyboard shortcut (B key)
7. Test fill selection, move, delete
8. Test very large fill regions, verify timeout

---

## 16. Open Questions

**Q1:** Should fills be editable after creation (change color, tolerance)?
- **Answer:** No, fills are immutable like other shapes. User can delete and re-fill if needed.

**Q2:** Should we support transparent fills or only solid colors?
- **Answer:** Solid colors only for MVP. Transparency can be added in future PR.

**Q3:** What algorithm should we use - pixel-based or vector-based?
- **Answer:** Pixel-based flood-fill with marching squares for polygon conversion. Most reliable for complex scenes.

**Q4:** Should fills be shape outlines or filled regions?
- **Answer:** Filled regions (solid color interior) like MS Paint bucket tool.

**Q5:** How do we handle the canvas background (white vs transparent)?
- **Answer:** Treat white (#FFFFFF) as canvas background. Fills will fill white regions by default.

---

## 17. Appendix: Out-of-Scope Backlog

Items explicitly deferred for future work with brief rationale.

- [ ] **Gradient fills:** Complex to implement, not essential for MVP
- [ ] **Pattern fills:** Textures/patterns are advanced feature
- [ ] **Magic wand selection:** Separate selection tool, different use case
- [ ] **Fill preview:** Nice-to-have, requires hover detection and preview rendering
- [ ] **Undo/redo:** System-wide feature, not specific to bucket tool
- [ ] **Fill blending modes:** Advanced compositing feature
- [ ] **Anti-aliased fill edges:** Higher quality, but more complex
- [ ] **Fill path editing:** Modifying fill boundaries after creation
- [ ] **Multi-region fill:** Filling multiple disconnected areas at once

---

## Preflight Questionnaire (Completed)

1. **What is the smallest end-to-end user outcome we must deliver in this PR?**
   - User can click bucket tool, click any canvas area, and see solid-colored fill appear and sync to collaborators in <100ms

2. **Who is the primary user and what is their critical action?**
   - Postcard creator quickly filling backgrounds and coloring enclosed areas

3. **Must-have vs nice-to-have: what gets cut first if time tight?**
   - Must: Basic flood-fill, simple polygon fills, sync. Nice-to-have: Tolerance slider, fill preview, complex polygon optimization

4. **Real-time collaboration requirements (peers, <100ms sync)?**
   - Yes, <100ms sync required, tested with 2-4 simultaneous users

5. **Performance constraints (FPS, shape count, latency targets)?**
   - Fill algorithm <500ms for typical areas, works with 50+ shapes, <100ms sync latency

6. **Error/edge cases we must handle (validation, conflicts, offline)?**
   - Algorithm timeout, very large fills, clicks outside canvas, Firestore write failures, complex scenes

7. **Data model changes needed (new fields/collections)?**
   - Add 'fill' to type union, add fillPoints and fillTolerance fields

8. **Service APIs required (create/update/delete/subscribe)?**
   - fillArea() required, standard delete/move operations

9. **UI entry points and states (empty, loading, locked, error)?**
   - Tool button, loading indicator during fill processing, cursor changes, error toasts, tolerance slider

10. **Accessibility/keyboard expectations:**
    - B key shortcut, aria-labels, focus indicators, tolerance slider accessibility

11. **Security/permissions implications:**
    - Standard Firestore rules (users can create shapes)

12. **Dependencies or blocking integrations:**
    - Requires canvas rasterization capability (Konva toDataURL)

13. **Rollout strategy (flag, migration) and success metrics:**
    - No flag, direct rollout, measure usage, latency, and errors

14. **What is explicitly out of scope for this iteration?**
    - Gradients, patterns, magic wand, fill preview, undo/redo, blending modes, anti-aliasing

---

## Authoring Notes

- Flood-fill is algorithmically complex - requires careful implementation and testing
- Canvas rasterization is expensive - optimize for performance
- Test Plan written before coding - every sub-task has a pass/fail gate
- Vertical slice: complete bucket tool feature from UI to sync
- Service layer is deterministic and testable
- UI is a thin wrapper around services
- Performance is critical - algorithm must be fast and timeout-protected

---

