# PR-7 TODO — Performance Bug Fix

**Branch**: `critical/performance-issues`  
**Source PRD**: [pr-7-prd.md](../prds/pr-7-prd.md)  
**Owner (Agent)**: Delilah

---

## 0. Clarifying Questions & Assumptions

**Questions**: None — approach is clear from profiling evidence

**Assumptions**:
- React memoization will provide 80-90% reduction in renders
- useCursors hook throttling will decouple cursor updates from shape rendering
- Context API optimization will reduce cascading updates by 50%
- Konva layer separation will reduce redraws by 70%
- All targets achievable with React optimizations (no architecture change needed)

---

## 1. Setup & Baseline

- [x] Review profiler screenshot (`docs/images/performance-922.png`)
  - Test Gate: Understand current bottlenecks (8,502ms scripting, 165ms INP)
  
- [ ] Capture BEFORE metrics
  - Open Chrome DevTools → Performance tab
  - Load canvas with 500 shapes (create test script if needed)
  - Record 10 seconds of interaction (pan, zoom, select, drag)
  - Capture screenshot of Performance tab
  - Note down: Scripting time, Rendering time, Painting time, INP, FPS estimate
  - Save screenshot as `docs/images/performance-before.png`
  - Test Gate: Baseline metrics documented

---

## 2. Phase 1: Memoization (CRITICAL)

### 2.1 Memoize CanvasShape Component

- [ ] Wrap CanvasShape in React.memo
  - Create custom comparison function `areShapePropsEqual(prev, next)`
  - Compare: shape.id, shape data fields, isSelected, isLockedByMe, isLockedByOther
  - Skip comparison for function props (already stable with useCallback)
  - Test Gate: Component only re-renders when shape data actually changes

- [ ] Test CanvasShape memoization
  - Open React DevTools → Profiler
  - Record interaction with 50 shapes on canvas
  - Verify CanvasShape render count <2 per shape per interaction
  - Test Gate: 80-90% reduction in CanvasShape renders

### 2.2 Memoize CursorLayer and Cursor

- [ ] Wrap CursorLayer in React.memo
  - Create comparison function that checks if cursors object changed
  - Use shallow comparison for cursors map
  - Test Gate: CursorLayer only re-renders when cursors actually change

- [ ] Wrap Cursor component in React.memo
  - Compare: x, y, username, color
  - Test Gate: Individual cursors only re-render when their position changes

- [ ] Test cursor memoization
  - Move mouse rapidly on canvas
  - Verify shapes don't re-render during cursor movement
  - Test Gate: Cursor updates isolated from shape rendering

### 2.3 Split CanvasContext useMemo

- [ ] Analyze current useMemo dependencies
  - List all 70+ dependencies in CanvasContext.tsx line 449
  - Group by category: shapes, selection, colors, tools, operations
  - Identify frequently changing vs stable values
  - Test Gate: Dependencies categorized

- [ ] Create focused memos for stable values
  - Memoize shape operation functions separately (already useCallback)
  - Memoize color and tool state separately
  - Memoize loading states separately
  - Test Gate: Separate memos created, context still functional

- [ ] Optimize context value construction
  - Only include necessary values in context
  - Consider splitting into multiple contexts (Phase 3.2)
  - Test Gate: Context updates <5 times per second during normal use

### 2.4 Memoize Event Handlers in Canvas.tsx

- [ ] Wrap all event handlers in useCallback
  - `handleShapeMouseDown` — deps: [user, shapes, lockShape]
  - `handleDragStart` — deps: [shapes, selectedShapes]
  - `handleDragMove` — deps: [multiDragInitialPositions, updateShape]
  - `handleDragEnd` — deps: [unlockShape, batchUpdateShapes]
  - `handleResizeStart` — deps: [lockShape, shapes]
  - `handleResizeMove` — deps: [stageScale]
  - `handleResizeEnd` — deps: [resizeShape, resizeCircle, unlockShape]
  - Review ALL handlers in Canvas.tsx (2,500+ lines)
  - Test Gate: All handlers wrapped in useCallback

- [ ] Test handler stability
  - Use React DevTools Profiler
  - Verify handlers don't recreate on every render
  - Test Gate: Handler references stable across renders

### 2.5 Profile After Phase 1

- [ ] Run React DevTools Profiler
  - Record interaction with 500 shapes
  - Check CanvasShape render counts
  - Check Canvas render frequency during cursor movement
  - Test Gate: CanvasShape <2 renders per interaction

- [ ] Capture metrics
  - Record Chrome DevTools Performance profile
  - Note scripting time improvement
  - Document findings in progress notes
  - Test Gate: Measurable improvement documented

---

## 3. Phase 2: Fix useCursors Hook (CRITICAL)

### 3.1 Increase Throttle Interval

- [ ] Update CURSOR_UPDATE_INTERVAL in constants.ts
  - Current value: (need to check)
  - New value: 50ms (20 FPS max)
  - Consider 100ms (10 FPS) for even better performance
  - Test Gate: Cursor update frequency reduced

- [ ] Test cursor responsiveness
  - Verify cursors still feel smooth
  - Check if 50ms is acceptable
  - Adjust if needed
  - Test Gate: Cursor updates smooth at lower frequency

### 3.2 Debounce Cursor State Updates

- [ ] Debounce setCursors in useCursors.ts
  - Import lodash debounce
  - Wrap setCursors call with debounce(50ms)
  - Keep subscription immediate, debounce state update only
  - Test Gate: Cursor state updates debounced

- [ ] Use requestAnimationFrame for visual updates
  - Cancel pending RAF before scheduling new one
  - Update Konva cursor positions directly without state
  - Only update state every N frames
  - Test Gate: Visual updates at 60 FPS, state updates debounced

### 3.3 Isolate Cursor Rendering

- [ ] Prevent cursor updates from triggering Canvas re-renders
  - Verify CursorLayer memoization (from Phase 1.2)
  - Check if cursors object reference is stable
  - Consider moving cursor state outside CanvasContext
  - Test Gate: Canvas doesn't re-render on cursor movement

- [ ] Test cursor isolation
  - Add console.log to Canvas component render
  - Move mouse rapidly
  - Verify Canvas render log doesn't spam
  - Test Gate: Canvas render count independent of cursor movement

### 3.4 Profile After Phase 2

- [ ] Verify cursor updates don't trigger shape renders
  - React DevTools Profiler during cursor movement
  - Check Canvas and CanvasShape render counts
  - Test Gate: Zero shape renders during cursor-only movement

- [ ] Capture metrics
  - Chrome DevTools Performance profile
  - Measure cursor update frequency (should be 20 FPS or less)
  - Document scripting time improvement
  - Test Gate: Further improvement documented

---

## 4. Phase 3: Context API Optimization (HIGH PRIORITY)

### 4.1 Throttle Selection Syncing

- [ ] Throttle Firestore selection writes in CanvasContext.tsx
  - Lines 224-256: syncSelection function
  - Wrap with lodash throttle (200-300ms)
  - Use trailing edge to ensure final state synced
  - Test Gate: Selection writes reduced by 80%

- [ ] Test selection syncing
  - Click through multiple shapes rapidly
  - Check Firestore console for write frequency
  - Verify final selection state correct
  - Test Gate: Selection syncing doesn't cause lag spikes

### 4.2 Split Context Providers (OPTIONAL - SHOULD)

**Note**: This is marked SHOULD, not MUST. Only implement if needed after Phase 3.1.

- [ ] Create CursorContext (if needed)
  - Move cursors and presence state
  - Provide via separate CursorProvider
  - Update components to use new context
  - Test Gate: Cursor updates isolated

- [ ] Create SelectionContext (if needed)
  - Move selectedShapes, selectedShapeId, userSelections
  - Provide via separate SelectionProvider
  - Update components to use new context
  - Test Gate: Selection updates isolated

- [ ] Keep CanvasContext for shapes and operations
  - shapes, shapesLoading
  - All shape operation functions
  - Test Gate: Shape operations still functional

- [ ] Test context split
  - Verify all components still work
  - Check for performance improvement
  - Test Gate: Context split doesn't break existing code

### 4.3 Optimize useEffect Dependencies

- [ ] Review all useEffect hooks in CanvasContext.tsx
  - Lines 159-177: subscribeToShapes
  - Lines 180-198: subscribeToComments  
  - Lines 201-221: subscribeToCanvasSelections
  - Lines 224-256: syncSelection
  - Check dependencies arrays for unnecessary values
  - Test Gate: All effects reviewed

- [ ] Remove unnecessary dependencies
  - Extract stable values outside effects
  - Use refs for values that don't need to trigger re-runs
  - Add cleanup functions where missing
  - Test Gate: Effect re-runs minimized

- [ ] Test effect optimization
  - Add console.log to effect bodies
  - Verify effects only run when intended
  - Test Gate: Effects don't spam console

### 4.4 Profile After Phase 3

- [ ] Measure context update frequency
  - Count CanvasContext value updates per second
  - Should be <5 during normal use
  - Test Gate: Context updates within target

- [ ] Measure Firestore write frequency
  - Check Firebase console for selection writes
  - Should see 80% reduction
  - Test Gate: Selection syncing optimized

- [ ] Capture metrics
  - Chrome DevTools Performance profile
  - Document scripting time improvement
  - Test Gate: Cumulative improvement tracked

---

## 5. Phase 4: Konva Rendering Optimization (SHOULD)

### 4.1 Separate Konva Layers

**Note**: This is marked SHOULD. Implement if needed after Phase 3.

- [ ] Create static layer (if needed)
  - Shapes that haven't changed
  - Layer listening={false} except on shapes
  - Test Gate: Static shapes don't redraw unnecessarily

- [ ] Create dynamic layer (if needed)
  - Selected shapes, dragging shapes
  - Active manipulation targets
  - Test Gate: Only dynamic shapes redraw during interactions

- [ ] Create UI layer (if needed)
  - Resize handles, rotation handles
  - Selection boxes, marquee
  - Test Gate: UI elements isolated

- [ ] Verify cursor layer isolation
  - Already separate CursorLayer exists
  - Ensure it's truly isolated
  - Test Gate: Cursor layer doesn't trigger other layer redraws

### 4.2 Disable Listening on Static Elements

- [ ] Set listening={false} on decorative elements
  - Resize handles when not selected
  - Selection box borders
  - Comment indicators (except for click handler)
  - Test Gate: Hit detection optimized

- [ ] Disable hit detection on shapes not in select mode
  - When activeTool is 'pan', disable shape listening
  - When drawing, disable shape listening
  - Re-enable when activeTool is 'select'
  - Test Gate: Faster event processing

### 4.3 Use Konva Caching

**Note**: This is marked SHOULD. Implement cautiously.

- [ ] Cache spray particles (if needed)
  - Call shape.cache() on spray shapes
  - Invalidate cache on color change
  - Test for visual artifacts
  - Test Gate: Spray rendering 30-40% faster

- [ ] Cache complex paths (if needed)
  - Cache paths with >100 points
  - Invalidate cache on updates
  - Test Gate: Path rendering faster

- [ ] Implement cache invalidation strategy
  - Clear cache on shape update
  - Document when to cache vs not cache
  - Test Gate: No visual artifacts

### 4.4 Profile After Phase 4

- [ ] Measure rendering time improvements
  - Chrome DevTools Performance → Rendering
  - Check paint time, composite time
  - Test Gate: Rendering time reduced

- [ ] Test with 500+ shapes
  - Verify 60 FPS maintained
  - Check for visual artifacts
  - Test Gate: 500 shapes at 60 FPS

---

## 6. Phase 5: Event Handler Throttling (SHOULD)

### 6.1 Throttle Mouse Move Handlers

- [ ] Throttle handleMouseMove in Canvas.tsx
  - Use requestAnimationFrame for throttling
  - Cancel pending RAF before scheduling new
  - Test Gate: Mouse events capped at 60 FPS

- [ ] Use RAF for preview updates
  - Drawing previews (rectangle, circle, path)
  - Marquee selection box
  - Test Gate: Previews update at 60 FPS

### 6.2 Debounce Resize Handlers

- [ ] Debounce window resize handlers (if any)
  - Check for window resize listeners
  - Debounce with 100-200ms
  - Test Gate: Resize handlers don't block

- [ ] Throttle zoom/pan updates (if needed)
  - Check zoom handler performance
  - Throttle if causing issues
  - Test Gate: Zoom/pan smooth

### 6.3 Profile After Phase 5

- [ ] Verify 60 FPS during all interactions
  - Pan, zoom, draw, drag, resize, rotate
  - Use Chrome DevTools FPS meter
  - Test Gate: 60 FPS maintained

- [ ] Capture final metrics
  - Chrome DevTools Performance profile
  - Document scripting time (should be <1,000ms)
  - Test Gate: Scripting time target met

---

## 7. Automated Performance Tests

### 7.1 Create Performance Test Infrastructure

- [ ] Create `tests/unit/performance/` directory
  - Setup Vitest configuration for benchmarks
  - Create helper utilities for measuring renders
  - Test Gate: Test infrastructure in place

- [ ] Add React Profiler API wrapper
  - Wrap components in React.Profiler
  - Count renders and timing
  - Export metrics for assertions
  - Test Gate: Profiler wrapper working

### 7.2 Component Render Benchmarks

- [ ] Test CanvasShape render count
  - Render 50 CanvasShape components
  - Update one shape's position
  - Assert: <2 CanvasShapes re-render
  - Test Gate: CanvasShape memoization test passing

- [ ] Test Canvas render count during cursor movement
  - Simulate cursor position updates
  - Count Canvas renders
  - Assert: <10 renders per second
  - Test Gate: Canvas cursor isolation test passing

- [ ] Test CanvasContext update frequency
  - Simulate normal user interactions
  - Count context value updates
  - Assert: <5 updates per second
  - Test Gate: Context optimization test passing

### 7.3 Integration Performance Tests

- [ ] Create `tests/integration/performance.test.ts`
  - Test 500 shapes loading time
  - Test multi-select 50 shapes performance
  - Test cursor update frequency
  - Test Gate: Integration tests created

- [ ] Add performance thresholds to CI
  - Configure Vitest with performance mode
  - Set thresholds: scripting time, render counts
  - Fail build if performance regresses
  - Test Gate: CI performance checks in place

---

## 8. Manual Testing & Validation

### 8.1 Manual Test Scenarios

- [ ] **Scenario 1**: 500 shapes on canvas, pan/zoom
  - Create 500 rectangles programmatically
  - Pan around canvas for 30 seconds
  - Zoom in and out
  - Test Gate: Maintains 60 FPS throughout

- [ ] **Scenario 2**: 5 concurrent users with cursors
  - Open 5 browser windows/tabs
  - Move cursors simultaneously
  - Check FPS in each window
  - Test Gate: All windows maintain 60 FPS

- [ ] **Scenario 3**: Multi-select 50 shapes and drag
  - Marquee select 50 shapes
  - Drag them around canvas
  - Test Gate: Smooth dragging at 60 FPS

- [ ] **Scenario 4**: Rapid add/delete operations
  - Rapidly create and delete shapes
  - Check for lag or freezing
  - Test Gate: INP stays <100ms

- [ ] **Scenario 5**: Complex shapes (spray, paths)
  - Create 100 spray shapes
  - Create 100 paths with many points
  - Pan and zoom
  - Test Gate: Maintains 60 FPS

### 8.2 Acceptance Gates Validation

- [ ] **Gate 1**: Scripting time <1,000ms
  - Chrome DevTools Performance tab
  - Record profile with 500 shapes
  - Check scripting time in summary
  - Test Gate: PASS if <1,000ms

- [ ] **Gate 2**: INP <100ms
  - Install web-vitals library (if not present)
  - Log INP metric during interactions
  - Test Gate: PASS if <100ms

- [ ] **Gate 3**: 60 FPS during interactions
  - Chrome DevTools FPS meter
  - Test all interaction types
  - Test Gate: PASS if 60 FPS maintained

- [ ] **Gate 4**: Cursor sync latency <50ms
  - Add timestamp logging to cursor updates
  - Measure time from update to render
  - Test Gate: PASS if <50ms

- [ ] **Gate 5**: Shape sync latency <100ms
  - Add timestamp logging to shape updates
  - Measure time from Firestore write to render
  - Test Gate: PASS if <100ms

- [ ] **Gates 6-8**: Component render counts
  - React DevTools Profiler
  - Verify CanvasShape, Canvas, Context update frequencies
  - Test Gate: All within targets

- [ ] **Gates 9-11**: Multi-user performance
  - Test with 5 concurrent users
  - Verify smooth experience for all
  - Test Gate: No lag or blocking

- [ ] **Gates 12-15**: Stress testing
  - Test with 500 simple shapes
  - Test with 100 complex shapes
  - Test multi-select 50 shapes
  - Test rapid operations
  - Test Gate: All scenarios smooth

### 8.3 Capture AFTER Metrics

- [ ] Take AFTER profiler screenshot
  - Same test scenario as BEFORE
  - Chrome DevTools Performance tab
  - Save as `docs/images/performance-after.png`
  - Test Gate: AFTER screenshot captured

- [ ] Document improvements
  - Create comparison table: BEFORE vs AFTER
  - Scripting time: 8,502ms → [measured]
  - INP: 165ms → [measured]
  - FPS: [unknown] → [measured]
  - Test Gate: Improvements documented

---

## 9. Architecture Decision (Phase 7 - IF NEEDED)

**Note**: Only proceed if targets NOT met after Phases 1-5.

### 9.1 Evaluate Results

- [ ] Check if all 15 acceptance gates pass
  - If YES: Skip Phase 7, mark as "React optimization sufficient"
  - If NO: Proceed with Phase 7
  - Test Gate: Decision made

### 9.2 Document Findings (if targets not met)

- [ ] Identify remaining bottlenecks
  - Which targets are still not met?
  - What is the gap?
  - What specific operations are still slow?
  - Test Gate: Remaining issues documented

- [ ] Measure improvement achieved
  - Calculate % improvement in each metric
  - Identify what worked well
  - Identify what didn't help
  - Test Gate: Analysis complete

### 9.3 Research Alternatives (if needed)

- [ ] Research Solid.js migration
  - Fine-grained reactivity
  - No virtual DOM overhead
  - Estimate migration effort
  - Test Gate: Solid.js option documented

- [ ] Research vanilla JS + Konva
  - Remove React entirely
  - Direct Konva manipulation
  - Estimate rewrite effort
  - Test Gate: Vanilla JS option documented

- [ ] Research canvas-only rendering
  - No DOM for UI elements
  - Pure canvas rendering
  - Estimate feasibility
  - Test Gate: Canvas-only option documented

- [ ] Research Web Workers
  - Offload state management
  - Keep React for UI
  - Estimate implementation effort
  - Test Gate: Web Workers option documented

### 9.4 Propose Migration Path (if needed)

- [ ] Create architecture recommendation document
  - Recommended approach with rationale
  - Cost/benefit analysis
  - Migration strategy (incremental vs rewrite)
  - Timeline estimate
  - Resource requirements
  - Test Gate: Recommendation document complete

- [ ] Present options to stakeholder
  - OPTION A: Accept current performance (if close to targets)
  - OPTION B: Implement recommended architecture change
  - OPTION C: Further optimization in current architecture
  - Test Gate: Options presented

---

## 10. Documentation & Cleanup

### 10.1 Update Architecture Documentation

- [ ] Update `docs/architecture.md`
  - Document performance optimizations implemented
  - Add section on memoization strategy
  - Add section on context optimization
  - Add section on Konva layer strategy (if implemented)
  - Test Gate: Architecture doc updated

### 10.2 Create Performance Guide

- [ ] Create `docs/performance-guide.md`
  - Best practices for maintaining performance
  - When to use React.memo
  - When to split contexts
  - How to profile performance
  - How to run performance tests
  - Test Gate: Performance guide created

### 10.3 Update This TODO

- [ ] Mark all completed tasks with [x]
  - Review entire TODO
  - Check off completed items
  - Note any skipped items with reason
  - Test Gate: TODO updated

### 10.4 Create PR Description

- [ ] Write comprehensive PR description
  - Link to PRD (pr-7-prd.md)
  - Link to TODO (pr-7-todo.md)
  - BEFORE/AFTER metrics with screenshots
  - Summary of changes by phase
  - All 15 acceptance gates status
  - Manual test results
  - Automated test results
  - Architecture decision (if Phase 7 executed)
  - Breaking changes (if any)
  - Test Gate: PR description complete

---

## Copyable Checklist (for PR description)

- [ ] All 15 acceptance gates pass
- [ ] Phase 1: Memoization implemented and tested
- [ ] Phase 2: useCursors hook optimized
- [ ] Phase 3: Context API optimized
- [ ] Phase 4: Konva rendering optimized (if implemented)
- [ ] Phase 5: Event handlers throttled (if implemented)
- [ ] Automated performance tests added
- [ ] Manual testing scenarios completed
- [ ] BEFORE/AFTER metrics documented with screenshots
- [ ] Architecture decision documented (if Phase 7 executed)
- [ ] Documentation updated
- [ ] No regressions in functionality
- [ ] Code reviewed for performance anti-patterns

---

## Success Criteria

**This PR is complete when:**

1. ✅ All 15 acceptance gates pass
2. ✅ Scripting time <1,000ms (from 8,502ms)
3. ✅ INP <100ms (from 165ms)
4. ✅ 60 FPS maintained during all interactions
5. ✅ No regressions in existing functionality
6. ✅ Performance tests in CI passing
7. ✅ Documentation updated
8. ✅ Architecture decision documented

**Current Status**: Phase 1 starting — Memoization implementation

---

**Estimated Completion**: 2-3 days (Phases 1-5), +1 day if Phase 7 needed

