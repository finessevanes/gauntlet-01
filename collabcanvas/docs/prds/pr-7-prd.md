# PRD: Performance Bug Fix — Critical Optimization

**Feature**: Performance Optimization & Bug Fixes

**Version**: 1.0

**Status**: In Progress

**Agent**: Delilah

**Target Release**: CRITICAL - Blocks all performance requirements

**Links**: [TODO: pr-7-todo.md], [Profiler Screenshot: docs/images/performance-922.png], [Architecture: docs/architecture.md]

---

## 1. Summary

The application currently has CRITICAL performance issues that prevent it from meeting requirements. With scripting time at 8,502ms (85% of total time), INP at 165ms, and heavy React re-render cycles visible in profiling, the application cannot maintain 60 FPS or sync in under 100ms. This PRD addresses systematic optimization through React memoization, Context API restructuring, Konva rendering improvements, and event handler throttling to achieve all performance targets.

---

## 2. Problem & Goals

**Problem:**
The application has broken performance that blocks user requirements:
- Scripting time: 8,502ms (target: <1,000ms) — 88% reduction needed
- INP: 165ms (target: <100ms) — 39% improvement needed
- React re-render cycles causing massive overhead
- useCursors hook at 20-30 FPS triggering full Canvas re-renders
- CanvasShape components rendering 500+ times per interaction
- Context API cascading updates through entire component tree

**Why now?**
This is CRITICAL and blocks all performance requirements. The application cannot meet the documented targets in `architecture.md`:
- Cannot maintain 60 FPS during interactions
- Cannot sync shapes in <100ms
- Cannot support 500+ shapes without FPS drops
- Cannot support 5+ concurrent users without degradation

**Goals (ordered, measurable):**
- [ ] G1 — Reduce scripting time from 8,502ms to <1,000ms (88% reduction)
- [ ] G2 — Improve INP from 165ms to <100ms
- [ ] G3 — Maintain 60 FPS during all interactions (pan, zoom, manipulation)
- [ ] G4 — Sync object changes in <100ms, cursor positions in <50ms
- [ ] G5 — Support 500+ shapes without FPS drops
- [ ] G6 — Support 5+ concurrent users without degradation

---

## 3. Non-Goals / Out of Scope

- [ ] Not implementing alternative architecture (Phase 7 only if React optimizations insufficient)
- [ ] Not rewriting to vanilla JS, Solid.js, or other frameworks (yet)
- [ ] Not changing Firebase/Firestore data structure
- [ ] Not modifying Konva fundamentals (staying with react-konva)
- [ ] Not implementing Web Workers (unless architectural change needed)
- [ ] Not changing feature behavior (pure performance optimization)

---

## 4. Success Metrics

**User-visible:**
- Canvas interactions feel smooth and responsive at 60 FPS
- No lag during drawing, panning, zooming, or shape manipulation
- Multi-user cursors update smoothly without blocking interactions
- Shape changes appear instantly (<100ms) for all users

**System:**
- Scripting time: <1,000ms (measured in Chrome DevTools Performance tab)
- INP: <100ms (measured with web-vitals library)
- 60 FPS maintained during all interactions (FPS counter)
- Cursor sync latency: <50ms (timestamp logging)
- Shape sync latency: <100ms (timestamp logging)
- CanvasShape renders: <2 times per interaction (React DevTools Profiler)
- Canvas renders: <10 times per second during cursor movement
- Context updates: <5 times per second during normal use

**Quality:**
- All 15 acceptance gates pass
- No regressions in existing functionality
- No visual artifacts from caching
- Performance tests in CI passing

---

## 5. Users & Stories

- As a **canvas user**, I want **smooth 60 FPS interactions** so that I can **draw and manipulate shapes without lag**.

- As a **collaborator**, I want **to see other users' cursors and changes instantly** so that we can **work together seamlessly in real-time**.

- As a **power user**, I want **the canvas to handle 500+ shapes smoothly** so that I can **create complex designs without performance degradation**.

- As a **developer**, I want **performance optimizations documented** so that I can **maintain high performance in future code**.

---

## 6. Experience Specification (UX)

### Current (Broken) State
- Laggy interactions during drawing
- Cursor movement causes visible stuttering
- Shape manipulation drops below 30 FPS
- Multi-select operations freeze momentarily
- Syncing delays visible to users

### Target State
- Buttery smooth 60 FPS at all times
- Cursor movement has no impact on performance
- Shape manipulation maintains 60 FPS
- Multi-select operations feel instant
- Syncing appears instantaneous (<100ms)

### Performance Targets
- **60 FPS** during pan, zoom, draw, drag, resize, rotate
- **<100ms** for shape create/update/delete sync
- **<50ms** for cursor position sync
- **500+ shapes** without FPS drops
- **5+ concurrent users** without degradation

### No Visual Changes
This is a pure performance optimization. All existing UX remains identical. Users should notice:
- Smoother interactions
- Faster response times
- No lag or stuttering
- Instant sync feedback

---

## 7. Functional Requirements (Must/Should)

### Phase 1: Memoization (MUST)
- MUST: Wrap CanvasShape in React.memo with custom comparison
- MUST: Memoize CursorLayer and Cursor components
- MUST: Split giant CanvasContext useMemo into smaller focused memos
- MUST: Wrap all event handlers in useCallback

**Acceptance Gates:**
- [Gate] CanvasShape renders <2 times per interaction (from 500+)
- [Gate] Cursor updates don't trigger shape re-renders
- [Gate] Context value updates <5 times per second (from constant)

### Phase 2: Fix useCursors Hook (MUST)
- MUST: Increase throttle interval to 50-100ms
- MUST: Debounce setCursors state updates
- MUST: Prevent cursor updates from triggering Canvas re-renders

**Acceptance Gates:**
- [Gate] Cursor update frequency <20 FPS (from 30 FPS)
- [Gate] Cursor state updates debounced properly
- [Gate] Canvas render count independent of cursor movement

### Phase 3: Context API Optimization (MUST)
- MUST: Throttle Firestore selection writes (200-300ms delay)
- SHOULD: Create separate CursorContext and SelectionContext
- MUST: Review and optimize all useEffect dependencies

**Acceptance Gates:**
- [Gate] Selection syncing reduced by 80% (fewer Firestore writes)
- [Gate] Context providers isolated (if split implemented)
- [Gate] useEffect re-runs minimized

### Phase 4: Konva Rendering Optimization (SHOULD)
- SHOULD: Create static, dynamic, UI, and cursor layers
- MUST: Set listening=false on decorative elements
- SHOULD: Cache complex shapes (spray, paths) with invalidation

**Acceptance Gates:**
- [Gate] Konva redraws reduced by 70% (if layers implemented)
- [Gate] Hit detection optimized (listening=false working)
- [Gate] Complex shapes render 30-40% faster (if caching implemented)

### Phase 5: Event Handler Throttling (SHOULD)
- MUST: Throttle handleMouseMove with requestAnimationFrame
- SHOULD: Debounce window resize handlers
- SHOULD: Throttle zoom/pan updates

**Acceptance Gates:**
- [Gate] Mouse events capped at 60 FPS
- [Gate] Resize handlers don't block interactions
- [Gate] Zoom/pan updates smooth and throttled

---

## 8. Data Model

No data model changes. This is pure optimization.

---

## 9. API / Service Contracts

No API changes. Existing service methods remain unchanged:
- `canvasService.createShape()`
- `canvasService.updateShape()`
- `canvasService.subscribeToShapes()`
- `cursorService.updateCursorPosition()`
- `cursorService.subscribeToCursors()`

Performance characteristics improved but interfaces identical.

---

## 10. UI Components to Create/Modify

### High Priority (MUST FIX)
- `src/components/Canvas/Canvas.tsx` — Add memoization, optimize handlers (2,500+ lines)
- `src/components/Canvas/CanvasShape.tsx` — Wrap in React.memo with comparison function
- `src/contexts/CanvasContext.tsx` — Split useMemo, optimize effects
- `src/hooks/useCursors.ts` — Throttle, debounce, isolate updates
- `src/components/Collaboration/CursorLayer.tsx` — Memoize layer
- `src/components/Collaboration/Cursor.tsx` — Memoize individual cursors

### Medium Priority (SHOULD FIX)
- `src/utils/constants.ts` — Adjust CURSOR_UPDATE_INTERVAL
- `src/services/cursorService.ts` — Optimize cursor subscription
- `src/hooks/useShapeResize.ts` — Optimize event handlers

### Testing (NEW FILES)
- `tests/unit/performance/` — Component render benchmarks
- `tests/integration/performance.test.ts` — E2E performance tests
- `vitest.config.ts` — Performance test configuration

### Documentation (NEW/UPDATED)
- `docs/architecture.md` — Update with performance optimizations
- `docs/performance-guide.md` — Best practices document

---

## 11. Integration Points

- **React DevTools Profiler** — Measure render counts and timing
- **Chrome DevTools Performance** — Measure scripting, rendering, painting
- **web-vitals library** — Measure INP automatically
- **Vitest** — Automated performance benchmarks
- **React.memo** — Prevent unnecessary re-renders
- **useCallback/useMemo** — Stabilize references
- **requestAnimationFrame** — Throttle visual updates to 60 FPS
- **lodash throttle/debounce** — Rate-limit expensive operations

---

## 12. Test Plan & Acceptance Gates

### Performance Metrics (Automated)
- [ ] **Gate 1**: Scripting time reduced from 8,502ms to <1,000ms
- [ ] **Gate 2**: INP improved from 165ms to <100ms
- [ ] **Gate 3**: 60 FPS maintained during pan/zoom with 500+ shapes
- [ ] **Gate 4**: Cursor sync latency <50ms
- [ ] **Gate 5**: Shape sync latency <100ms

### Component Render Counts (Automated)
- [ ] **Gate 6**: CanvasShape renders <2 times per interaction
- [ ] **Gate 7**: Canvas component renders <10 times per second during cursor movement
- [ ] **Gate 8**: CanvasContext value updates <5 times per second during normal use

### Multi-User Performance (Manual)
- [ ] **Gate 9**: 5 concurrent users, all maintain 60 FPS
- [ ] **Gate 10**: Cursor updates don't block shape interactions
- [ ] **Gate 11**: Selection syncing doesn't cause lag spikes

### Stress Testing (Manual)
- [ ] **Gate 12**: 500 simple shapes (rectangles) at 60 FPS
- [ ] **Gate 13**: 100 complex shapes (spray, paths) at 60 FPS
- [ ] **Gate 14**: Multi-select 50 shapes, drag smoothly
- [ ] **Gate 15**: Rapid add/delete operations stay responsive

### Before/After Comparison

**BEFORE (Current Broken State):**
- Scripting: 8,502ms
- INP: 165ms
- FPS: ~20-30 FPS during interactions
- Cursor updates: 20-30 FPS, trigger full re-renders
- CanvasShape renders: 500+ per interaction
- User experience: Laggy, unresponsive

**AFTER (Target State):**
- Scripting: <1,000ms (88% improvement)
- INP: <100ms (39% improvement)
- FPS: 60 FPS maintained
- Cursor updates: Isolated, no shape re-renders
- CanvasShape renders: <2 per interaction
- User experience: Smooth, instant response

---

## 13. Definition of Done (End-to-End)

- [ ] All 15 acceptance gates pass
- [ ] BEFORE/AFTER profiler screenshots documented
- [ ] Automated performance tests added to test suite
- [ ] Performance monitoring added (FPS counter, metrics logging)
- [ ] All phases 1-5 implemented and tested
- [ ] Architecture decision documented (Phase 7, if needed)
- [ ] Code reviewed for performance anti-patterns
- [ ] Documentation updated with performance best practices
- [ ] No regressions in existing functionality
- [ ] All interactions feel smooth at 60 FPS
- [ ] Multi-user collaboration works without lag

---

## 14. Risks & Mitigations

### Risk 1: Memoization complexity introduces bugs
**Impact**: High — Could break existing interactions
**Mitigation**:
- Add React DevTools Profiler checks to CI
- Test all interaction flows after memoization changes
- Use strict comparison functions in React.memo
- Keep git history clean for easy rollback

### Risk 2: Context splitting breaks existing code
**Impact**: High — Breaking change across codebase
**Mitigation**:
- Implement context split incrementally
- Maintain backward compatibility during migration
- Add integration tests for context providers
- Phase 3.2 marked as SHOULD (optional)

### Risk 3: React optimization insufficient to meet targets
**Impact**: Critical — Would require architecture change
**Mitigation**:
- Have architecture alternatives researched (Phase 7)
- Set checkpoint after Phase 5 to evaluate progress
- Be prepared to recommend architecture change if needed
- Document findings clearly for decision-making

### Risk 4: Konva caching causes visual artifacts
**Impact**: Medium — Visual bugs in complex shapes
**Mitigation**:
- Cache invalidation strategy clearly documented
- Visual regression testing for cached shapes
- Provide cache.clear() escape hatch
- Make caching opt-in per shape type

### Risk 5: Performance tests flaky in CI
**Impact**: Low — Annoying but not blocking
**Mitigation**:
- Use percentile-based thresholds (p95, p99)
- Run performance tests in isolation
- Provide local profiling scripts for developers
- Allow manual override with justification

### Risk 6: Breaking changes in production
**Impact**: Critical — Users experience bugs
**Mitigation**:
- Deploy to staging first
- Run full manual test suite before production
- Have rollback plan ready
- Monitor error rates after deployment

---

## 15. Rollout & Telemetry

**Rollout Strategy:**
1. Implement and test locally with profiling
2. Deploy to staging environment
3. Run full test suite (automated + manual)
4. Verify all 15 acceptance gates
5. Deploy to production with monitoring
6. Watch for error spikes or performance regressions

**Telemetry:**
- Log FPS metrics to console (development)
- Track INP with web-vitals (production)
- Monitor React render counts in development
- Track Firestore read/write volume
- Log cursor update frequency
- Alert on performance regression (scripting time >2,000ms)

**Manual Validation Post-Deploy:**
- Test with 500+ shapes on production
- Test multi-user collaboration with 5 users
- Verify FPS counter shows 60 FPS
- Check Chrome DevTools for scripting time
- Verify no console errors or warnings

---

## 16. Open Questions

None — Approach is clear:
1. Fix known culprits (memoization, throttling)
2. Measure improvements at each phase
3. Iterate until targets met
4. Document architecture decision if React insufficient

---

## 17. Appendix: Out-of-Scope Backlog

Items explicitly deferred:

- [ ] **Architecture Migration**: Only if React optimization insufficient (Phase 7)
- [ ] **Web Workers**: Offload state management to background thread
- [ ] **Canvas Virtualization**: Render only visible area for 10,000+ shapes
- [ ] **WebGL Rendering**: Replace Konva with custom WebGL renderer
- [ ] **Optimistic UI**: Show local changes before Firestore confirms
- [ ] **Request Batching**: Batch multiple Firestore operations
- [ ] **IndexedDB Caching**: Local cache for shape data
- [ ] **Service Worker**: Offline support and background sync

---

## Preflight Questionnaire

1. **Smallest end-to-end outcome**: Application meets all 6 performance targets
2. **Primary user**: All canvas users (critical bug affects everyone)
3. **Must-have**: Phases 1-3 (memoization, cursor fix, context optimization)
4. **Nice-to-have**: Phases 4-5 (Konva optimization, event throttling)
5. **Real-time collaboration**: Must maintain <100ms sync, <50ms cursors
6. **Performance constraints**: 60 FPS, <1,000ms scripting, <100ms INP
7. **Error/edge cases**: No regressions, visual artifacts, or breaking changes
8. **Data model changes**: None
9. **Service APIs**: None (optimization only)
10. **UI states**: No visual changes (pure performance fix)
11. **Accessibility**: No impact
12. **Security**: No changes
13. **Dependencies**: React DevTools, Chrome DevTools, web-vitals, Vitest
14. **Rollout**: Deploy to staging first, monitor closely
15. **Success metrics**: All 15 acceptance gates pass
16. **Out of scope**: Architecture changes unless React optimization insufficient

---

## Authoring Notes

- This is a CRITICAL bug fix, not a feature
- Performance targets are NON-NEGOTIABLE per `architecture.md`
- Fix implementation bugs first, architecture decisions second
- Measure at each phase to track progress
- Document all findings for future performance work
- Keep changes backward-compatible where possible
- Test thoroughly before deploying to production

---

**Status**: Ready for implementation
**Priority**: CRITICAL — Blocks all performance requirements
**Estimated Effort**: 2-3 days (Phases 1-5), +1 day if architecture change needed (Phase 7)

