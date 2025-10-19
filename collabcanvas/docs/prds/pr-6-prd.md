# PRD: Canvas Size & Aspect Ratio — End-to-End Delivery

**Feature**: Canvas Size & Aspect Ratio (4×6 Postcard Dimensions)

**Version**: 1.0

**Status**: Ready for Development

**Agent**: Delilah

**Target Release**: Phase 3 - Canvas Management

**Links**: [Action Plan: pr-6-todo.md], [Test Plan: integration tests], [Tracking Issue: PR #6]

---

## 1. Summary

The canvas is currently sized at 5000×5000 pixels, which is suitable for general drawing but not optimized for the postcard format. This PR will resize the canvas to 1200×1800 pixels (4×6 inches at 300 DPI) to match standard postcard dimensions, ensuring all artwork is properly formatted for physical printing and mailing.

---

## 2. Problem & Goals

**Problem:** 
The current 5000×5000 pixel canvas is generic and doesn't reflect the postcard use case. Users don't have visual guidance about the printable area, and exported artwork won't have the correct aspect ratio for 4×6 postcards.

**Why now?** 
- This should be done early as it affects all drawing features
- Required before PNG export (PR #12) and physical postcard fulfillment
- Ensures all created artwork is compatible with postcard printing specs
- Prevents users from creating work that can't be printed correctly

**Goals (ordered, measurable):**
  - [x] G1 — Canvas dimensions updated to 1200×1800 (4×6 at 300 DPI)
  - [x] G2 — Default viewport zoom/pan fits postcard in visible area
  - [x] G3 — Visual postcard border or guides help users understand printable area
  - [x] G4 — Existing shapes (if any) are preserved and remain visible
  - [x] G5 — Performance maintained (60 FPS) with smaller canvas
  - [x] G6 — All existing tools work correctly with new dimensions

---

## 3. Non-Goals / Out of Scope

Call out anything intentionally excluded to avoid partial implementations and hidden dependencies.

- [ ] Not implementing canvas resize UI (users can't change canvas size)
- [ ] Not implementing multiple canvas sizes or templates
- [ ] Not implementing canvas export to PNG (separate PR #12)
- [ ] Not migrating existing production canvases (dev environment only)
- [ ] Not implementing print bleed area or crop marks (simple border only)
- [ ] Not implementing aspect ratio lock for shapes (only canvas dimensions)
- [ ] Not implementing safe zone guides (may add in future if needed)
- [ ] Not implementing canvas rotation (portrait orientation only)

---

## 4. Success Metrics

- **User-visible:** 
  - Canvas appears in correct postcard proportions (2:3 aspect ratio)
  - Viewport shows entire postcard on initial load (no excessive panning needed)
  - Border clearly indicates canvas boundaries
  - Drawing experience feels natural and responsive
  
- **System:** 
  - Canvas renders at 60 FPS (performance improved due to smaller area)
  - Zoom/pan calculations work correctly with new dimensions
  - Grid or background reflects new size
  
- **Quality:** 
  - 0 blocking bugs
  - All acceptance gates pass
  - Existing tools work without modification
  - Real-time sync unaffected

---

## 5. Users & Stories

- As a **postcard creator**, I want to **draw on a canvas that matches postcard dimensions** so that I can **see exactly what the final printed postcard will look like**.

- As a **collaborator**, I want to **understand the canvas boundaries** so that I **don't draw content that will be cropped or cut off**.

- As a **user preparing to order postcards**, I want to **be confident my artwork fits the printable area** so that I **don't waste money on incorrectly formatted designs**.

---

## 6. Experience Specification (UX)

### Entry Points and Flows
1. User signs in and loads canvas
2. Canvas appears centered in viewport at appropriate zoom level
3. Postcard border/outline visible showing 1200×1800 dimensions
4. User can zoom and pan as normal
5. Drawing tools work within postcard boundaries

### Visual Behavior
- **Canvas size:** 1200×1800 pixels (portrait orientation)
- **Aspect ratio:** 2:3 (standard postcard proportions)
- **Border:** Subtle border/outline around canvas edges
- **Background:** Grid or solid color fills canvas area
- **Initial view:** Canvas fits comfortably in viewport (not too zoomed in/out)
- **Pan limits:** Stage position constraints updated for new dimensions

### States
- **Initial load:** Canvas centered, zoomed to fit viewport
- **Zoomed in:** Canvas can fill viewport, pan to see all areas
- **Zoomed out:** Canvas with border visible, white/gray space around edges
- **Drawing:** All tools work normally within canvas bounds

### Accessibility
- Canvas boundaries clearly visible (not just implied)
- Border has sufficient contrast with background
- Zoom controls work as before

### Performance
- 60 FPS maintained (improved due to smaller render area)
- Smaller canvas means faster rendering
- Initial load time potentially faster
- Pan/zoom calculations adjust for new dimensions

---

## 7. Functional Requirements (Must/Should)

### MUST Requirements

- **MUST:** Update `CANVAS_WIDTH = 1200` in constants.ts
- **MUST:** Update `CANVAS_HEIGHT = 1800` in constants.ts
- **MUST:** Adjust default zoom to fit 1200×1800 canvas in typical viewport
- **MUST:** Update pan constraints to prevent excessive panning beyond canvas
- **MUST:** Verify background grid/color scales correctly to new dimensions
- **MUST:** Test all shape creation tools work with new dimensions
- **MUST:** Verify zoom in/out works correctly with new dimensions
- **MUST:** Ensure real-time sync continues to work
- **MUST:** Verify shape selection and manipulation unaffected
- **MUST:** Test multi-user collaboration still syncs correctly

### SHOULD Requirements

- **SHOULD:** Add visible border or outline around canvas edges
- **SHOULD:** Update stage initial position to center postcard
- **SHOULD:** Consider viewport-responsive zoom (different screen sizes)
- **SHOULD:** Test on various screen resolutions (laptop, desktop, wide monitors)

### Acceptance Gates (embedded per requirement)

**Gate 1:** When constants updated → CANVAS_WIDTH = 1200 and CANVAS_HEIGHT = 1800

**Gate 2:** When canvas loads → visible dimensions are 1200×1800

**Gate 3:** When user opens canvas → entire postcard visible in viewport (reasonable zoom)

**Gate 4:** When user draws with any tool → shapes stay within canvas bounds

**Gate 5:** When user zooms in/out → canvas dimensions remain 1200×1800

**Gate 6:** When user pans → cannot pan excessively beyond canvas edges

**Gate 7:** When background renders → fills 1200×1800 area correctly

**Gate 8:** When shapes exist from before → they remain visible and functional

**Gate 9:** When multiple users collaborate → sync works with new dimensions

**Gate 10:** Performance test → 60 FPS maintained with 50+ shapes

---

## 8. Data Model

### No Data Model Changes Required

This PR only affects frontend rendering and constants. No Firestore schema changes needed.

**Existing shape documents remain unchanged:**
```typescript
{
  id: string,
  type: "rectangle | text | circle | triangle | path | spray",
  x: number,  // Position coordinates remain same
  y: number,
  width: number,
  height: number,
  color: string,
  // ... other fields unchanged
}
```

### Notes on Existing Shapes
- Shapes with coordinates outside 1200×1800 will still exist in database
- They may be off-canvas and require panning to find
- No migration script needed (this is early development, production has minimal data)
- Future consideration: add bounds checking to shape creation tools

---

## 9. API / Service Contracts

### No Service Changes Required

All existing service methods continue to work:
- `createShape()` - works as before
- `createPath()` - works as before  
- `createSpray()` - works as before
- `updateShape()` - works as before
- All other methods unchanged

### Helper Functions (Optional)

```typescript
/**
 * Check if coordinates are within canvas bounds
 * @param x - X coordinate
 * @param y - Y coordinate
 * @returns boolean - true if within bounds
 */
export function isWithinCanvasBounds(x: number, y: number): boolean {
  return x >= 0 && x <= CANVAS_WIDTH && y >= 0 && y <= CANVAS_HEIGHT;
}

/**
 * Clamp coordinates to canvas bounds
 * @param x - X coordinate
 * @param y - Y coordinate  
 * @returns {x, y} - Clamped coordinates
 */
export function clampToCanvas(x: number, y: number): {x: number, y: number} {
  return {
    x: Math.max(0, Math.min(x, CANVAS_WIDTH)),
    y: Math.max(0, Math.min(y, CANVAS_HEIGHT))
  };
}
```

---

## 10. UI Components to Create/Modify

### Files to Modify

1. **`src/utils/constants.ts`** ← PRIMARY CHANGE
   - Update `CANVAS_WIDTH = 1200` (was 5000)
   - Update `CANVAS_HEIGHT = 1800` (was 5000)
   - Add comment explaining postcard dimensions: "4×6 inches at 300 DPI"

2. **`src/components/Canvas/Canvas.tsx`** (Minor adjustments)
   - Review initial zoom/scale calculation (may need adjustment)
   - Review stage position initialization (center postcard in viewport)
   - Verify pan constraints work with new dimensions
   - No structural changes required

3. **`src/utils/helpers.ts`** (Optional additions)
   - Add `isWithinCanvasBounds()` helper function
   - Add `clampToCanvas()` helper function
   - Use these in drawing tools if needed

4. **Visual Border (Optional, but recommended):**
   - Add border rect to Canvas.tsx Stage/Layer
   - Or add CSS border to canvas container
   - Ensure border doesn't interfere with interactions

### Example: Adding Canvas Border

```typescript
// In Canvas.tsx, add to Layer:
<Rect
  x={0}
  y={0}
  width={CANVAS_WIDTH}
  height={CANVAS_HEIGHT}
  stroke="#cccccc"
  strokeWidth={2}
  listening={false} // Don't intercept clicks
  perfectDrawEnabled={false}
/>
```

---

## 11. Integration Points

- **Canvas rendering:** Uses Konva Stage with updated dimensions
- **Shape tools:** Work within new canvas bounds
- **Zoom/pan:** Calculations adjust automatically
- **Real-time sync:** Unaffected by dimension changes
- **Background grid:** May need visual adjustment for smaller canvas

---

## 12. Test Plan & Acceptance Gates

### Happy Path

- [ ] **Gate 1:** Update constants.ts → CANVAS_WIDTH=1200, CANVAS_HEIGHT=1800
- [ ] **Gate 2:** Load canvas → dimensions are 1200×1800 (verify via browser DevTools)
- [ ] **Gate 3:** Canvas appears centered in viewport at reasonable zoom
- [ ] **Gate 4:** Draw rectangle from top-left to bottom-right → fits on canvas
- [ ] **Gate 5:** Draw circle in center → renders correctly
- [ ] **Gate 6:** Draw path (pencil tool) → works within bounds
- [ ] **Gate 7:** Add text shape → positions correctly
- [ ] **Gate 8:** Spray paint tool → works within canvas area
- [ ] **Gate 9:** Create triangle → renders at correct scale

### Edge Cases

- [ ] **Gate 10:** Try to pan beyond canvas edges → constrained appropriately
- [ ] **Gate 11:** Zoom out to minimum → canvas still visible with border
- [ ] **Gate 12:** Zoom in to maximum → canvas fills viewport
- [ ] **Gate 13:** Shapes created near edges → fully visible and selectable
- [ ] **Gate 14:** Draw shape starting outside canvas → handled gracefully (clipped or prevented)

### Visual Verification

- [ ] **Gate 15:** Canvas aspect ratio visually appears as 2:3 (portrait postcard)
- [ ] **Gate 16:** Background grid or color fills entire 1200×1800 area
- [ ] **Gate 17:** Border (if added) clearly visible around edges
- [ ] **Gate 18:** Canvas doesn't appear stretched or distorted

### Multi-User Collaboration

- [ ] **Gate 19:** User A creates shape → User B sees it correctly positioned
- [ ] **Gate 20:** User A and User B both draw → both see same canvas dimensions
- [ ] **Gate 21:** Cursor positions sync correctly with new dimensions

### Performance

- [ ] **Gate 22:** Canvas renders at 60 FPS (should be better with smaller area)
- [ ] **Gate 23:** Drawing with 50+ shapes → maintains 60 FPS
- [ ] **Gate 24:** Zoom/pan performance is smooth and responsive
- [ ] **Gate 25:** Initial canvas load time is fast (<1 second)

### Regression Testing (All Existing Features)

- [ ] **Gate 26:** Shape selection works (click to select)
- [ ] **Gate 27:** Shape movement works (drag)
- [ ] **Gate 28:** Shape resizing works (drag corners)
- [ ] **Gate 29:** Shape rotation works
- [ ] **Gate 30:** Shape deletion works
- [ ] **Gate 31:** Multi-select works (Shift+click)
- [ ] **Gate 32:** Color palette works
- [ ] **Gate 33:** All drawing tools work (rectangle, circle, triangle, pencil, spray, text)
- [ ] **Gate 34:** Real-time sync works (<100ms)
- [ ] **Gate 35:** Cursors sync correctly
- [ ] **Gate 36:** Lock/unlock works

### Browser Compatibility

- [ ] **Gate 37:** Test in Chrome (primary browser)
- [ ] **Gate 38:** Test in Firefox (verify rendering)
- [ ] **Gate 39:** Test in Safari (verify rendering)

### Screen Size Testing

- [ ] **Gate 40:** Test on laptop (13-15" screen) - canvas fits well
- [ ] **Gate 41:** Test on desktop (24-27" monitor) - canvas appears appropriately
- [ ] **Gate 42:** Test on large monitor (32"+) - canvas doesn't look tiny

---

## 13. Definition of Done (End-to-End)

- [ ] Constants updated (CANVAS_WIDTH, CANVAS_HEIGHT)
- [ ] Canvas renders at 1200×1800 dimensions
- [ ] Default zoom/pan positions canvas appropriately in viewport
- [ ] Optional: Visual border added around canvas
- [ ] All drawing tools tested and working
- [ ] Real-time sync verified (<100ms)
- [ ] Multi-user testing completed (2 users minimum)
- [ ] Performance test passed (60 FPS with 50+ shapes)
- [ ] Regression testing passed (all 36 existing features work)
- [ ] Browser compatibility verified (Chrome, Firefox, Safari)
- [ ] Screen size testing completed (laptop, desktop, large monitor)
- [ ] All 42 acceptance gates pass
- [ ] No console errors or warnings
- [ ] PR description written with screenshots showing new canvas size

---

## 14. Risks & Mitigations

**Risk:** Existing shapes in development database may be positioned outside new canvas bounds
- **Mitigation:** This is early development with minimal data. Accept that some test shapes may be off-canvas. No migration needed.

**Risk:** Default zoom level may not fit canvas well on all screen sizes
- **Mitigation:** Test on multiple screen sizes (laptop, desktop, large monitor). Adjust initial zoom/scale if needed.

**Risk:** Pan constraints may feel restrictive with smaller canvas
- **Mitigation:** Allow some padding/buffer around canvas edges for comfortable panning.

**Risk:** Users may not notice canvas boundaries without clear visual indication
- **Mitigation:** Add subtle border or outline around canvas edges.

**Risk:** Smaller canvas may expose performance issues (if any exist)
- **Mitigation:** Unlikely - smaller canvas should improve performance. Test thoroughly.

**Risk:** Background grid may look odd with different proportions
- **Mitigation:** Test grid appearance, adjust spacing or style if needed.

---

## 15. Rollout & Telemetry

**Feature flag?** No (fundamental dimension change, always on)

**Metrics:**
- Performance: FPS during interactions (should improve)
- Errors: Any rendering issues, coordinate calculation errors
- User feedback: Canvas feels appropriately sized
- Initial load time: Should be faster with smaller canvas

**Manual validation steps post-deploy:**
1. Load canvas, verify 1200×1800 dimensions (DevTools)
2. Draw shapes with all tools, verify correct positioning
3. Test zoom in/out, verify canvas scales correctly
4. Test pan, verify constraints feel natural
5. Test real-time sync in 2 browser windows
6. Verify performance with 50+ shapes (60 FPS)
7. Check visual appearance on laptop and desktop screens

---

## 16. Open Questions

**Q1:** Should we add print guidelines or safe zones?
- **Answer:** Not for MVP. Simple border is sufficient. Can add guides in future if users request.

**Q2:** Should we support landscape orientation (1800×1200)?
- **Answer:** No, portrait only (4×6 is standard postcard orientation). Landscape can be future feature.

**Q3:** Should we migrate existing shapes to fit new bounds?
- **Answer:** No, this is early development. Production has minimal data. Shapes outside bounds remain in database but may be off-screen.

**Q4:** Should we prevent drawing outside canvas bounds?
- **Answer:** Not strictly enforced for MVP. Users can draw anywhere, but canvas export (PR #12) will only capture 1200×1800 area.

**Q5:** What should default zoom level be?
- **Answer:** Calculate to fit canvas comfortably in viewport. For 1920×1080 screen, scale ~0.5-0.6 works well. Test and adjust.

---

## 17. Appendix: Out-of-Scope Backlog

Items explicitly deferred for future work with brief rationale.

- [ ] **Canvas resize UI:** Let users choose canvas size (not needed for postcard-only app)
- [ ] **Multiple canvas templates:** Different sizes/formats (keep it simple for MVP)
- [ ] **Landscape orientation:** 1800×1200 for horizontal postcards (low demand)
- [ ] **Print bleed area:** Extra margin for professional printing (not needed for Staples prints)
- [ ] **Safe zone guides:** Inner margins for text safety (users can eyeball it)
- [ ] **Crop marks:** Professional printing guides (overkill for postcard app)
- [ ] **Ruler/measurement tools:** Pixel measurements (not needed)
- [ ] **Grid snap-to-grid:** Alignment helpers (future feature)
- [ ] **Canvas rotation:** Rotate entire canvas (unnecessary complexity)
- [ ] **Custom DPI settings:** Always 300 DPI (standard for print)

---

## 18. Technical Specifications

### Postcard Dimensions Calculation

**Standard postcard:** 4 × 6 inches
**Print quality:** 300 DPI (dots per inch)

**Calculation:**
- Width: 4 inches × 300 DPI = 1200 pixels
- Height: 6 inches × 300 DPI = 1800 pixels

**Aspect ratio:** 1200:1800 = 2:3 (portrait)

### Why 300 DPI?

- Industry standard for quality photo printing
- Sufficient detail for physical postcards
- Not excessive (600 DPI would be overkill and large file sizes)
- Authentic 2000s aesthetic (not ultra-high-res modern printing)
- Works well with Staples/drugstore photo printing services

### File Size Estimate

**Canvas export (future PR #12):**
- 1200 × 1800 pixels
- PNG format with transparency
- Estimated: 100-500 KB per postcard (depends on complexity)
- Well within Firestore Storage limits

---

## Preflight Questionnaire (Completed)

1. **What is the smallest end-to-end user outcome we must deliver in this PR?**
   - Canvas resized to 1200×1800 with all existing features working correctly

2. **Who is the primary user and what is their critical action?**
   - Postcard creator drawing artwork that will fit standard postcard dimensions

3. **Must-have vs nice-to-have: what gets cut first if time tight?**
   - Must: Dimension changes, basic testing. Nice-to-have: Visual border, extensive screen size testing

4. **Real-time collaboration requirements (peers, <100ms sync)?**
   - Yes, must maintain existing real-time sync functionality

5. **Performance constraints (FPS, shape count, latency targets)?**
   - 60 FPS maintained (should improve with smaller canvas)

6. **Error/edge cases we must handle (validation, conflicts, offline)?**
   - Shapes outside new bounds, pan constraints, zoom calculations

7. **Data model changes needed (new fields/collections)?**
   - None, only frontend constants changed

8. **Service APIs required (create/update/delete/subscribe)?**
   - None, all existing services continue to work

9. **UI entry points and states (empty, loading, locked, error)?**
   - Canvas render with new dimensions, border visibility

10. **Accessibility/keyboard expectations:**
    - No changes, existing accessibility maintained

11. **Security/permissions implications:**
    - None, no security changes

12. **Dependencies or blocking integrations:**
    - None, standalone change

13. **Rollout strategy (flag, migration) and success metrics:**
    - Direct deployment, no flag, no migration needed

14. **What is explicitly out of scope for this iteration?**
    - Canvas resize UI, multiple sizes, landscape orientation, print guides, safe zones

---

## Authoring Notes

- Very straightforward PR, primarily constant changes
- Main testing focus: verify all existing features still work
- Visual testing important: ensure canvas looks correct on various screens
- Performance should improve with smaller canvas
- Sets foundation for future PNG export and printing features

---

