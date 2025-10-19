# PR-3 TODO — Fill Bucket Tool

**Branch**: `feat/pr-3-fill-bucket`  
**Source PRD**: `collabcanvas/docs/prds/pr-3-prd.md`  
**Owner (Agent)**: Delilah

---

## 0. Clarifying Questions & Assumptions

**Questions:**
- None - all requirements clear from PRD and PR brief

**Assumptions:**
- Using pixel-based flood-fill algorithm with marching squares for polygon conversion
- Canvas rasterization via Konva's toDataURL or similar
- Fill tolerance of 10 (default), adjustable 0-50
- Fills stored as standard shapes in `canvases/main/shapes` collection
- Algorithm timeout at 2 seconds to prevent browser hang
- Maximum fill region size of 10,000 pixels
- Keyboard shortcut 'B' follows existing pattern
- White (#FFFFFF) treated as canvas background color

---

## 1. Repo Prep

- [ ] Create branch `feat/pr-3-fill-bucket`
- [ ] Confirm env, emulators, and test runner
- [ ] Read all context docs (PRD, architecture, templates)
- [ ] Review existing Canvas.tsx and CanvasService.ts patterns

---

## 2. Service Layer (deterministic contracts)

### 2.1 Data Model Updates

- [ ] Update ShapeData interface to include 'fill' type
  - Test Gate: TypeScript compilation passes
  - Location: `src/services/canvasService.ts`
  
- [ ] Add `fillPoints?: number[]` field to ShapeData
  - Test Gate: TypeScript compilation passes
  - Purpose: Store polygon vertices defining fill area
  
- [ ] Add `fillTolerance?: number` field to ShapeData
  - Test Gate: TypeScript compilation passes
  - Purpose: Store tolerance used for this fill (0-50)

### 2.2 Service Methods

- [ ] Implement `fillArea()` method in canvasService
  - Parameters: x, y, color, tolerance, createdBy, existingShapes
  - Test Gate: Unit test passes for valid fill creation
  - Test Gate: Unit test passes for invalid input rejection (out of bounds)
  - Test Gate: Unit test passes for timeout handling (>2 seconds)
  - Test Gate: Fill saved to Firestore with correct structure
  - Acceptance: Creates fill shape document in Firestore
  
- [ ] Implement internal `performFloodFill()` helper
  - Test Gate: Returns polygon vertices for simple rectangle
  - Test Gate: Returns polygon vertices for complex irregular shape
  - Test Gate: Times out after 2 seconds for very large regions
  - Test Gate: Respects existing shape boundaries

---

## 3. Flood-Fill Algorithm & Utilities

### 3.1 Create Flood-Fill Utility File

- [ ] Create `src/utils/floodFill.ts` file
  - Test Gate: File exists and exports required functions
  
### 3.2 Implement Core Algorithm

- [ ] Implement `rasterizeCanvas()` function
  - Test Gate: Returns ImageData representing canvas with all shapes
  - Test Gate: Correctly renders shapes in z-index order
  - Test Gate: Handles 50+ shapes without performance issues
  - Acceptance: Canvas converted to pixel array for color matching
  
- [ ] Implement `floodFill()` algorithm (scanline or queue-based)
  - Test Gate: Fills simple rectangular region correctly
  - Test Gate: Fills irregular closed region correctly
  - Test Gate: Stops at shape boundaries (doesn't leak)
  - Test Gate: Respects tolerance parameter (0, 10, 50)
  - Test Gate: Times out after 2 seconds for infinite regions
  - Test Gate: Handles max pixel limit (10,000 pixels)
  - Acceptance: Returns set of filled pixel coordinates
  
- [ ] Implement `pixelsToPolygon()` function (marching squares)
  - Test Gate: Converts filled pixels to polygon vertices
  - Test Gate: Simplifies polygon to reduce vertex count
  - Test Gate: Produces closed polygon (first point = last point)
  - Acceptance: Returns simplified polygon boundary
  
### 3.3 Color Utilities

- [ ] Implement `hexToRgb()` utility
  - Test Gate: Converts hex colors to RGB correctly
  - Test Gate: Handles both #RGB and #RRGGBB formats
  - Test Gate: Returns {r, g, b} object with 0-255 values
  
- [ ] Implement `colorsMatch()` utility
  - Test Gate: Returns true for exact color match (tolerance=0)
  - Test Gate: Returns true for similar colors (tolerance=10)
  - Test Gate: Returns false for different colors
  - Test Gate: Tolerance calculation uses Euclidean distance
  - Acceptance: Accurate color matching within tolerance

---

## 4. Data Model & Rules

- [ ] Fill shape includes all required fields
  - Test Gate: Firestore document has type='fill', fillPoints, fillTolerance, color, x, y, width, height
  
- [ ] Bounding box calculated from fillPoints array
  - Test Gate: x, y, width, height correctly computed from min/max of fillPoints
  
- [ ] Existing Firestore rules work for fill shapes
  - Test Gate: Users can create/read/update/delete their fills
  - Test Gate: Other users can read but not modify fills

---

## 5. UI Components

### 5.1 Tool Button

- [ ] Add fill bucket tool button to `src/components/Canvas/ToolPalette.tsx`
  - Test Gate: Button renders with bucket icon (🪣)
  - Test Gate: Clicking button sets activeTool='bucket'
  - Test Gate: Active state shows visual highlight
  - Test Gate: Tooltip shows "Fill Bucket (B)"
  
### 5.2 Fill Rendering

- [ ] Add fill rendering to `src/components/Canvas/CanvasShape.tsx`
  - Test Gate: Fill type renders as Konva Line with closed=true and fill=color
  - Test Gate: Fill uses correct color
  - Test Gate: Fill supports selection, lock indicators
  - Test Gate: Fill respects z-index ordering
  - Acceptance: Fill appears as solid-colored polygon
  
### 5.3 Fill Handlers

- [ ] Add fill click handler to `src/components/Canvas/Canvas.tsx`
  - Test Gate: Canvas click when bucket active triggers fillArea()
  - Test Gate: Loading indicator shows during fill processing
  - Test Gate: Success toast on fill completion
  - Test Gate: Error toast on fill failure (timeout, too large, etc.)
  - Test Gate: Bucket tool remains active after fill for multiple fills
  - Acceptance: User can click and fill multiple areas
  
- [ ] Add keyboard shortcut (B key) to Canvas.tsx
  - Test Gate: Pressing 'B' activates bucket tool
  - Test Gate: Keyboard shortcut works when canvas focused
  
### 5.4 Tolerance Slider

- [ ] Add tolerance slider to `src/components/Canvas/ColorToolbar.tsx` or create new component
  - Test Gate: Slider renders with range 0-50
  - Test Gate: Default value is 10
  - Test Gate: Slider updates fillTolerance state
  - Test Gate: Current tolerance value displayed
  - Test Gate: Only visible when bucket tool active
  - Test Gate: Slider has aria-label for accessibility
  - Acceptance: User can adjust fill sensitivity
  
### 5.5 Context Updates

- [ ] Update CanvasContext to support bucket tool
  - Test Gate: activeTool type includes 'bucket' in ToolType union
  - Test Gate: fillArea() method available in context
  - Test Gate: fillTolerance state and setFillTolerance setter available
  - Location: `src/contexts/CanvasContext.tsx`

---

## 6. Constants

- [ ] Add fill constants to `src/utils/constants.ts`
  - Test Gate: DEFAULT_FILL_TOLERANCE = 10
  - Test Gate: MIN_FILL_TOLERANCE = 0
  - Test Gate: MAX_FILL_TOLERANCE = 50
  - Test Gate: FILL_ALGORITHM_TIMEOUT = 2000 (ms)
  - Test Gate: MAX_FILL_PIXELS = 10000

---

## 7. Integration & Realtime

### 7.1 Fill Creation Flow

- [ ] Fill creation syncs to Firestore
  - Test Gate: Fill document created in `canvases/main/shapes/{id}`
  - Test Gate: Document has all required fields
  
- [ ] Fill updates sync to all users
  - Test Gate: 2-browser test shows <100ms sync
  - Test Gate: Fill appears identically for all users
  
- [ ] Multiple users can fill simultaneously
  - Test Gate: No conflicts when 2 users fill at same time
  - Test Gate: Both fills appear correctly

---

## 8. Tests

### a) User Simulation ("does it click")

- [ ] Click bucket tool button → tool activates
- [ ] Click empty canvas area → area fills
- [ ] Press 'B' key → tool activates
- [ ] Adjust tolerance slider → value updates
- [ ] Select fill → fill highlights
- [ ] Move fill → fill moves
- [ ] Delete fill → fill removed

### b) Logic Tests

- [ ] Fill saves to Firestore with correct structure
- [ ] Fill syncs in <100ms
- [ ] Flood-fill algorithm respects shape boundaries
- [ ] Invalid click (outside canvas) rejected
- [ ] Very large fill times out gracefully
- [ ] Tolerance=0 fills only exact colors
- [ ] Tolerance=10 fills similar colors
- [ ] Tolerance=50 fills very loosely

### c) Visual Tests

- [ ] Fill renders with correct color
- [ ] Fill respects z-index ordering (below/above other shapes)
- [ ] Fill can be selected and shows selection indicator
- [ ] Fill shows lock indicator when locked
- [ ] Fill polygon is closed (no gaps)

### d) Algorithm Tests

- [ ] Simple fill (rectangle) completes in <100ms
- [ ] Medium fill (1/4 canvas) completes in <500ms
- [ ] Complex fill (irregular shape) completes in <1 second
- [ ] Very large fill (entire canvas) times out at 2 seconds
- [ ] Fill with 50+ shapes on canvas completes successfully
- [ ] Canvas rasterization accurate (shapes in correct order)
- [ ] Marching squares produces valid polygon

---

## 9. Performance

- [ ] Simple fill (small area) completes in <100ms
- [ ] Medium fill (1000 pixels) completes in <500ms
- [ ] Canvas rasterization with 50+ shapes completes in <200ms
- [ ] Firestore sync completes in <100ms (95th percentile)
- [ ] UI remains responsive during fill processing
- [ ] No browser hang with very large fills (timeout works)

---

## 10. Edge Cases & Error Handling

- [ ] Click outside canvas bounds → error toast, no fill created
- [ ] Click on already-filled area → fills correctly (can re-fill)
- [ ] Fill inside closed path → respects path boundaries
- [ ] Fill inside closed spray pattern → handles correctly
- [ ] Algorithm timeout → error toast "Fill region too large"
- [ ] Firestore write failure → error toast, no partial fill
- [ ] Network disconnection during fill → handles gracefully
- [ ] Very complex scene (100+ shapes) → rasterization completes

---

## 11. Accessibility

- [ ] Bucket tool button has aria-label="Fill Bucket Tool"
- [ ] Keyboard shortcut (B) works
- [ ] Tolerance slider has aria-label and value display
- [ ] Focus visible on tool button
- [ ] Screen reader announces tool activation

---

## 12. Documentation & Comments

- [ ] Add inline comments to flood-fill algorithm
- [ ] Document tolerance parameter behavior
- [ ] Document algorithm timeout and max pixel limit
- [ ] Add JSDoc comments to fillArea() method
- [ ] Update README if needed (new tool documentation)

---

## 13. Docs & PR

- [x] Create PRD (`collabcanvas/docs/prds/pr-3-prd.md`)
- [x] Create TODO (`collabcanvas/docs/todos/pr-3-todo.md`)
- [ ] Update TODO with test results as tasks complete
- [ ] Write PR description with:
  - Goal and scope (complete Paint toolset)
  - Files changed and rationale
  - Algorithm explanation (flood-fill + marching squares)
  - Test steps (happy path, edge cases, multi-user, perf)
  - Screenshots/GIFs of bucket tool in action
  - Known limitations and follow-ups
  - Links to PRD and TODO
- [ ] Open PR targeting agents/first-round branch

---

## Copyable Checklist (for PR description)

- [ ] Branch created (feat/pr-3-fill-bucket)
- [ ] Services implemented (fillArea)
- [ ] Service unit tests pass (100%)
- [ ] Flood-fill algorithm implemented and tested
- [ ] Canvas rasterization implemented
- [ ] Marching squares algorithm implemented
- [ ] UI implemented (tool button, click handler, fill rendering)
- [ ] Tolerance slider implemented and wired up
- [ ] Integration tests pass (user simulation + state inspection)
- [ ] Multi-user tests pass (2 users filling simultaneously)
- [ ] Realtime verified (<100ms sync)
- [ ] Performance targets met (simple <100ms, medium <500ms)
- [ ] Timeout protection works (2 second limit)
- [ ] Keyboard shortcut works (B key)
- [ ] All acceptance gates pass (30/30 from PRD)
- [ ] No console errors
- [ ] Docs updated (PRD, TODO)

---

## Notes & Implementation Strategy

### Algorithm Choice: Pixel-based Flood Fill
- Use scanline or queue-based flood-fill for reliability
- Rasterize canvas to ImageData for pixel color access
- Convert filled pixels to polygon using marching squares
- Simplify polygon to reduce vertex count

### Performance Optimizations
1. **Timeout Protection:** Stop algorithm after 2 seconds to prevent hang
2. **Max Pixel Limit:** Reject fills larger than 10,000 pixels
3. **Efficient Data Structures:** Use Set for pixel tracking, optimize loops
4. **Canvas Caching:** Consider caching rasterization if multiple fills in quick succession
5. **Polygon Simplification:** Use Douglas-Peucker or similar to reduce fillPoints size

### Key Technical Challenges
1. **Canvas Rasterization:** Need accurate pixel representation of all shapes
2. **Boundary Detection:** Fill must stop at shape edges, not leak through
3. **Tolerance Matching:** Color matching must be consistent and predictable
4. **Polygon Conversion:** Marching squares can produce complex polygons - need simplification
5. **Performance:** Large fills can be slow - need timeout and feedback

### Testing Strategy
- Unit test flood-fill algorithm in isolation with mock ImageData
- Integration test with real canvas rasterization
- Performance test with various fill sizes and complexities
- Multi-user test with concurrent fills
- Edge case test with complex scenes and boundaries

### Firestore Considerations
- Fill shapes use same collection as other shapes
- fillPoints array might be large - monitor document sizes
- Consider polygon simplification to keep under 1MB limit
- Standard shape operations (move, delete) work automatically

### UI/UX Considerations
- Loading indicator during fill processing (can take 100-500ms)
- Error messages for timeout, too large, outside bounds
- Tolerance slider with visual feedback (current value display)
- Bucket cursor provides clear feedback of active tool
- Tool remains active for multiple fills (no need to re-select)

---

## Implementation Order (Recommended)

### Phase 1: Algorithm Foundation (Core Logic)
1. Create floodFill.ts utility file
2. Implement hexToRgb() and colorsMatch() utilities
3. Implement basic flood-fill algorithm (scanline method)
4. Add timeout protection and pixel limit
5. Unit test algorithm with mock data

### Phase 2: Canvas Integration (Rasterization)
6. Implement rasterizeCanvas() function
7. Test rasterization with various shape types
8. Verify z-index ordering in rasterization

### Phase 3: Polygon Conversion (Vector Output)
9. Implement marching squares algorithm
10. Implement polygon simplification
11. Test polygon conversion with various fill regions

### Phase 4: Service Layer (Data Persistence)
12. Update ShapeData type with fill fields
13. Implement fillArea() method in canvasService
14. Add Firestore write logic
15. Unit test fillArea() method

### Phase 5: UI Components (User Interface)
16. Add bucket tool button to ToolPalette
17. Add fill click handler to Canvas.tsx
18. Add fill rendering to CanvasShape.tsx
19. Add keyboard shortcut (B key)
20. Add loading indicator during fill

### Phase 6: Tolerance Control (Advanced Feature)
21. Add fillTolerance state to CanvasContext
22. Create tolerance slider component
23. Wire up slider to fillArea() calls
24. Test tolerance values (0, 10, 50)

### Phase 7: Testing & Polish (Quality Assurance)
25. Integration tests (user simulation)
26. Multi-user tests (2 browsers)
27. Performance tests (various fill sizes)
28. Edge case tests (timeout, boundaries, errors)
29. Accessibility tests (keyboard, aria-labels)
30. Final polish and documentation

---

## Debugging Tips

### If fills are leaking through boundaries:
- Check z-index sorting in rasterizeCanvas()
- Verify shape rendering accuracy in rasterization
- Ensure tolerance isn't too high (try tolerance=0)

### If fills are too slow:
- Profile flood-fill algorithm
- Check for infinite loops (timeout should catch)
- Reduce MAX_FILL_PIXELS limit
- Consider async processing with web worker

### If fills don't sync:
- Check Firestore write success
- Verify fillPoints array is valid
- Check for bounding box calculation errors
- Test with Firestore emulator first

### If polygon rendering is wrong:
- Check marching squares implementation
- Verify polygon is closed (first point = last point)
- Check for self-intersecting polygons
- Simplify polygon if too many vertices

---

