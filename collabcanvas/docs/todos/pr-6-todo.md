# PR-6 TODO — Canvas Size & Aspect Ratio

**Branch**: `feature/pr-6-canvas-size-aspect-ratio`  
**Source PRD**: `collabcanvas/docs/prds/pr-6-prd.md`  
**Owner (Agent)**: Building Agent (to be assigned)

---

## 0. Clarifying Questions & Assumptions

### Questions:
- None - requirements are clear and straightforward

### Assumptions:
- Existing test/development shapes may be outside new canvas bounds (acceptable)
- No data migration needed (early development phase)
- Default zoom will be calculated based on typical 1920×1080 viewport
- Postcard will always be portrait orientation (4×6, not 6×4)

---

## 1. Repo Prep

- [ ] Create branch `feature/pr-6-canvas-size-aspect-ratio`
  - Test Gate: Branch created and checked out successfully
- [ ] Read PRD thoroughly (`collabcanvas/docs/prds/pr-6-prd.md`)
  - Test Gate: All requirements understood
- [ ] Confirm dev environment running (emulators + Vite)
  - Test Gate: `npm run dev` and `npm run emulators` both working

---

## 2. Update Canvas Constants

- [ ] **Task 2.1:** Update `CANVAS_WIDTH` in `src/utils/constants.ts`
  - Change from `5000` to `1200`
  - Add comment: `// 4 inches × 300 DPI (postcard width)`
  - Test Gate: File saved, no syntax errors

- [ ] **Task 2.2:** Update `CANVAS_HEIGHT` in `src/utils/constants.ts`
  - Change from `5000` to `1800`
  - Add comment: `// 6 inches × 300 DPI (postcard height)`
  - Test Gate: File saved, no syntax errors

- [ ] **Task 2.3:** Verify constants export correctly
  - Test Gate: No import errors when constants are used

---

## 3. Visual Testing (Initial)

- [ ] **Task 3.1:** Load canvas in browser
  - Open `http://localhost:5173` (or Vite dev URL)
  - Test Gate: Canvas loads without errors

- [ ] **Task 3.2:** Verify canvas dimensions
  - Open browser DevTools → Elements/Inspector
  - Check Stage/Canvas element dimensions
  - Test Gate: Canvas is 1200×1800 pixels (not 5000×5000)

- [ ] **Task 3.3:** Check visual appearance
  - Test Gate: Canvas appears in portrait orientation (taller than wide)
  - Test Gate: Aspect ratio looks like 2:3 (postcard proportions)

---

## 4. Adjust Default Zoom/Pan (If Needed)

- [ ] **Task 4.1:** Test canvas visibility on laptop screen (13-15")
  - Test Gate: Canvas fits comfortably in viewport (not too zoomed in/out)
  
- [ ] **Task 4.2:** Test canvas visibility on desktop screen (24-27")
  - Test Gate: Canvas appears at reasonable scale

- [ ] **Task 4.3:** Adjust initial zoom if needed
  - Location: `src/components/Canvas/Canvas.tsx`
  - Look for: `stageScale` initialization or zoom calculation
  - Adjust: May need to change default scale value
  - Test Gate: Canvas appears centered and appropriately sized

- [ ] **Task 4.4:** Adjust initial stage position if needed
  - Location: `src/components/Canvas/Canvas.tsx`
  - Look for: `stagePosition` initialization
  - Adjust: Center canvas in viewport
  - Test Gate: Canvas appears centered horizontally and vertically

---

## 5. Add Visual Border (Optional but Recommended)

- [ ] **Task 5.1:** Add border rectangle to canvas
  - Location: `src/components/Canvas/Canvas.tsx`
  - Add Konva `<Rect>` with:
    - x={0}, y={0}
    - width={CANVAS_WIDTH}, height={CANVAS_HEIGHT}
    - stroke="#cccccc" or similar
    - strokeWidth={2}
    - listening={false}
  - Test Gate: Border visible around canvas edges

- [ ] **Task 5.2:** Ensure border doesn't interfere with interactions
  - Test Gate: Can still click and draw on canvas
  - Test Gate: Border doesn't capture mouse events

---

## 6. Test All Drawing Tools

### Rectangle Tool
- [ ] **Task 6.1:** Create rectangle from top-left to bottom-right
  - Test Gate: Rectangle created successfully
  - Test Gate: Rectangle fits within 1200×1800 bounds

### Circle Tool
- [ ] **Task 6.2:** Create circle in center of canvas
  - Test Gate: Circle created successfully
  - Test Gate: Circle renders at correct scale

### Triangle Tool
- [ ] **Task 6.3:** Create triangle in various positions
  - Test Gate: Triangle created successfully
  - Test Gate: Triangle proportions look correct

### Pencil Tool (Path)
- [ ] **Task 6.4:** Draw free-form path
  - Test Gate: Path created successfully
  - Test Gate: Path smoothing works correctly

### Spray Paint Tool
- [ ] **Task 6.5:** Use spray paint tool
  - Test Gate: Spray particles appear correctly
  - Test Gate: Spray area proportional to canvas

### Text Tool
- [ ] **Task 6.6:** Add text shape
  - Test Gate: Text created successfully
  - Test Gate: Text sizing appropriate for canvas

---

## 7. Test Shape Manipulation

- [ ] **Task 7.1:** Select shape (click)
  - Test Gate: Shape selects correctly

- [ ] **Task 7.2:** Move shape (drag)
  - Test Gate: Shape moves smoothly

- [ ] **Task 7.3:** Resize shape (drag corner handles)
  - Test Gate: Shape resizes correctly

- [ ] **Task 7.4:** Rotate shape
  - Test Gate: Shape rotates around center

- [ ] **Task 7.5:** Delete shape
  - Test Gate: Shape deletes successfully

- [ ] **Task 7.6:** Multi-select shapes (Shift+click)
  - Test Gate: Multiple shapes select correctly

---

## 8. Test Zoom and Pan

- [ ] **Task 8.1:** Zoom in (scroll wheel or zoom buttons)
  - Test Gate: Canvas zooms in smoothly
  - Test Gate: Canvas dimensions remain 1200×1800

- [ ] **Task 8.2:** Zoom out (scroll wheel or zoom buttons)
  - Test Gate: Canvas zooms out smoothly
  - Test Gate: Can see entire canvas with border

- [ ] **Task 8.3:** Pan canvas (drag with pan tool or spacebar+drag)
  - Test Gate: Canvas pans smoothly
  - Test Gate: Pan constraints feel natural (not overly restrictive)

- [ ] **Task 8.4:** Test zoom limits
  - Test Gate: MIN_ZOOM works correctly
  - Test Gate: MAX_ZOOM works correctly

---

## 9. Test Real-Time Sync (Multi-User)

- [ ] **Task 9.1:** Open canvas in two browser windows
  - Window 1: User A (main session)
  - Window 2: User B (incognito/different account)
  - Test Gate: Both users see canvas

- [ ] **Task 9.2:** User A creates shape
  - Test Gate: User B sees shape appear in <100ms
  - Test Gate: Shape position matches across users

- [ ] **Task 9.3:** User B creates shape
  - Test Gate: User A sees shape appear in <100ms
  - Test Gate: Shape position matches across users

- [ ] **Task 9.4:** Test cursor sync
  - Test Gate: User A's cursor visible to User B
  - Test Gate: Cursor positions accurate with new canvas dimensions

---

## 10. Performance Testing

- [ ] **Task 10.1:** Test with 0 shapes
  - Open browser DevTools → Performance tab
  - Draw a few shapes while recording
  - Test Gate: Maintains 60 FPS during drawing

- [ ] **Task 10.2:** Test with 50+ shapes
  - Create 50+ shapes on canvas (use script or manual)
  - Draw new shapes
  - Test Gate: Maintains 60 FPS during interaction

- [ ] **Task 10.3:** Test canvas render performance
  - Test Gate: Initial load time <1 second
  - Test Gate: No lag or stuttering during pan/zoom

---

## 11. Edge Case Testing

- [ ] **Task 11.1:** Draw shape near canvas edges
  - Create shapes at top, bottom, left, right edges
  - Test Gate: Shapes fully visible and selectable

- [ ] **Task 11.2:** Draw shape partially outside bounds (if possible)
  - Try to draw beyond canvas edges
  - Test Gate: Handled gracefully (clipped or prevented)

- [ ] **Task 11.3:** Test with existing shapes outside new bounds
  - If any test shapes exist outside 1200×1800 area
  - Test Gate: App doesn't crash
  - Test Gate: Shapes can be panned to and selected

---

## 12. Regression Testing (Existing Features)

- [ ] **Task 12.1:** Test color palette
  - Select different colors
  - Create shapes with selected color
  - Test Gate: Color selection works correctly

- [ ] **Task 12.2:** Test shape locking
  - Lock a shape
  - Try to edit locked shape
  - Test Gate: Lock mechanism works

- [ ] **Task 12.3:** Test shape duplication
  - Duplicate a shape (Cmd+D or context menu)
  - Test Gate: Duplicate appears at offset position

- [ ] **Task 12.4:** Test grouping
  - Select multiple shapes
  - Group them
  - Test Gate: Group created successfully

- [ ] **Task 12.5:** Test z-index ordering
  - Create overlapping shapes
  - Bring to front / send to back
  - Test Gate: Layer ordering works correctly

- [ ] **Task 12.6:** Test comments (if feature exists)
  - Add comment to shape
  - Test Gate: Comment system works

---

## 13. Browser Compatibility Testing

- [ ] **Task 13.1:** Test in Chrome
  - Test Gate: Canvas renders correctly
  - Test Gate: All tools work

- [ ] **Task 13.2:** Test in Firefox
  - Test Gate: Canvas renders correctly
  - Test Gate: All tools work

- [ ] **Task 13.3:** Test in Safari (if available on Mac)
  - Test Gate: Canvas renders correctly
  - Test Gate: All tools work

---

## 14. Screen Size Testing

- [ ] **Task 14.1:** Test on laptop (13-15" screen)
  - Adjust browser window to ~1366×768 or 1440×900
  - Test Gate: Canvas fits well in viewport
  - Test Gate: Not too zoomed in or out

- [ ] **Task 14.2:** Test on desktop (24-27" monitor)
  - Adjust browser window to ~1920×1080 or 2560×1440
  - Test Gate: Canvas appears at good scale
  - Test Gate: Not too small

- [ ] **Task 14.3:** Test on large monitor (32"+) if available
  - Adjust browser window to ~3840×2160
  - Test Gate: Canvas doesn't look tiny
  - Test Gate: Zoom controls help user adjust view

---

## 15. Visual Polish & Verification

- [ ] **Task 15.1:** Verify aspect ratio visually
  - Compare canvas to reference 4×6 postcard image
  - Test Gate: Proportions match 2:3 ratio

- [ ] **Task 15.2:** Check background appearance
  - Test Gate: Background grid or color fills 1200×1800 area
  - Test Gate: No visual artifacts or gaps

- [ ] **Task 15.3:** Verify border clarity (if added)
  - Test Gate: Border has sufficient contrast
  - Test Gate: Border doesn't overwhelm canvas

---

## 16. Console Error Check

- [ ] **Task 16.1:** Open browser DevTools → Console
  - Perform various actions (draw, zoom, pan, sync)
  - Test Gate: No console errors
  - Test Gate: No console warnings (or only expected warnings)

---

## 17. Documentation & Screenshots

- [ ] **Task 17.1:** Take screenshots
  - Screenshot 1: Canvas at default zoom (show dimensions)
  - Screenshot 2: Canvas with several shapes
  - Screenshot 3: DevTools showing 1200×1800 dimensions
  - Screenshot 4: Before/after comparison (5000×5000 vs 1200×1800)

- [ ] **Task 17.2:** Update any relevant comments in code
  - Add/update comments explaining postcard dimensions
  - Document any zoom/pan adjustments made

---

## 18. PR Preparation

- [ ] **Task 18.1:** Review all changed files
  - List of expected changes:
    - `src/utils/constants.ts` (CANVAS_WIDTH, CANVAS_HEIGHT)
    - `src/components/Canvas/Canvas.tsx` (border, zoom/pan adjustments)
    - Any other files modified
  - Test Gate: Only necessary files changed

- [ ] **Task 18.2:** Write PR description
  - Title: "PR #6: Canvas Size & Aspect Ratio (1200×1800 Postcard)"
  - Description sections:
    - **Goal:** Update canvas to 4×6 postcard dimensions
    - **Changes:** List files modified and what changed
    - **Testing:** Describe test scenarios completed
    - **Screenshots:** Include before/after screenshots
    - **Performance:** Note FPS improvements
    - **Known Issues:** Any limitations or notes
  - Link to PRD: `collabcanvas/docs/prds/pr-6-prd.md`
  - Link to TODO: `collabcanvas/docs/todos/pr-6-todo.md`

- [ ] **Task 18.3:** Self-review checklist
  - [ ] All 42 acceptance gates from PRD passed
  - [ ] All TODO tasks completed
  - [ ] No console errors
  - [ ] Performance maintained (60 FPS)
  - [ ] Multi-user sync works
  - [ ] All existing features work
  - [ ] Screenshots captured
  - [ ] PR description complete

---

## 19. Final Verification Checklist (Before PR Submission)

### Constants Updated
- [ ] CANVAS_WIDTH = 1200 ✓
- [ ] CANVAS_HEIGHT = 1800 ✓

### Visual Verification
- [ ] Canvas appears as 1200×1800 (DevTools check) ✓
- [ ] Aspect ratio is 2:3 (portrait postcard) ✓
- [ ] Border visible around canvas (if implemented) ✓

### All Tools Working
- [ ] Rectangle tool ✓
- [ ] Circle tool ✓
- [ ] Triangle tool ✓
- [ ] Pencil/Path tool ✓
- [ ] Spray paint tool ✓
- [ ] Text tool ✓

### Shape Manipulation
- [ ] Select ✓
- [ ] Move ✓
- [ ] Resize ✓
- [ ] Rotate ✓
- [ ] Delete ✓
- [ ] Multi-select ✓

### Zoom & Pan
- [ ] Zoom in ✓
- [ ] Zoom out ✓
- [ ] Pan ✓
- [ ] Pan constraints feel natural ✓

### Real-Time Sync
- [ ] Shape creation syncs (<100ms) ✓
- [ ] Shape updates sync ✓
- [ ] Cursor positions sync ✓

### Performance
- [ ] 60 FPS with 0 shapes ✓
- [ ] 60 FPS with 50+ shapes ✓
- [ ] Initial load fast (<1s) ✓

### Browser Testing
- [ ] Chrome ✓
- [ ] Firefox ✓
- [ ] Safari ✓

### Screen Sizes
- [ ] Laptop (13-15") ✓
- [ ] Desktop (24-27") ✓

### Quality Checks
- [ ] No console errors ✓
- [ ] No console warnings (or only expected) ✓
- [ ] All existing features work ✓

### Documentation
- [ ] Screenshots captured ✓
- [ ] PR description written ✓
- [ ] Code comments updated ✓

---

## 20. Acceptance Gates Summary (From PRD)

Tracking all 42 gates from PRD:

### Core Functionality (Gates 1-10)
- [ ] Gate 1: Constants updated to 1200 and 1800
- [ ] Gate 2: Visible dimensions are 1200×1800
- [ ] Gate 3: Canvas visible in viewport at reasonable zoom
- [ ] Gate 4: All tools work within canvas bounds
- [ ] Gate 5: Zoom maintains 1200×1800 dimensions
- [ ] Gate 6: Pan constraints appropriate
- [ ] Gate 7: Background fills 1200×1800 correctly
- [ ] Gate 8: Existing shapes remain functional
- [ ] Gate 9: Multi-user sync works
- [ ] Gate 10: 60 FPS with 50+ shapes

### Drawing Tools (Gates 11-19, covered in Task 6)
- [ ] Gates 11-19: All drawing tools tested and working

### Visual & UX (Gates 20-25)
- [ ] Gate 20: Visual aspect ratio appears as 2:3
- [ ] Gate 21: Background fills entire canvas area
- [ ] Gate 22: Border clearly visible (if added)
- [ ] Gate 23: Canvas doesn't appear stretched or distorted
- [ ] Gate 24: Zoom/pan performance smooth
- [ ] Gate 25: Initial load time <1 second

### Regression Testing (Gates 26-36)
- [ ] Gates 26-36: All existing features work (selection, movement, resize, rotate, delete, multi-select, color palette, tools, sync, cursors, lock/unlock)

### Browser & Screen Testing (Gates 37-42)
- [ ] Gates 37-39: Chrome, Firefox, Safari
- [ ] Gates 40-42: Laptop, desktop, large monitor

---

## Notes for Building Agent

### Estimated Time
- Total: ~1 hour
  - Constants update: 5 minutes
  - Visual testing: 10 minutes
  - Zoom/pan adjustment: 10 minutes (if needed)
  - Border addition: 10 minutes (optional)
  - Tool testing: 15 minutes
  - Multi-user testing: 10 minutes
  - Performance testing: 5 minutes
  - Browser testing: 10 minutes
  - Documentation: 10 minutes

### Key Focus Areas
1. **Primary change:** Update two constants (very simple)
2. **Main testing:** Verify all existing features still work
3. **Visual polish:** Add border for clarity (optional but recommended)
4. **Performance:** Should improve with smaller canvas

### Common Pitfalls to Avoid
- Don't forget to test zoom/pan after dimension change
- Don't assume all tools will work - test each one
- Don't skip multi-user testing - sync must still work
- Don't skip performance testing - verify 60 FPS maintained

### Success Criteria
✅ Canvas is 1200×1800 pixels
✅ All 42 acceptance gates pass
✅ No regressions in existing features
✅ Performance maintained (60 FPS)
✅ Multi-user sync works (<100ms)

---

**Ready to start!** This is a straightforward PR that sets the foundation for postcard printing features.

