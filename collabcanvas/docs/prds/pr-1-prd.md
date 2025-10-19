# PRD: Debouncing & Batching Firestore Operations — Performance Foundation

**Feature**: Debounce and Batch Firestore Writes

**Version**: 1.0

**Status**: Ready for Development

**Agent**: Delilah (Planning Agent)

**Target Release**: Phase 1 - Performance Optimizations

**PR Number**: #1

**Links**: 
- PR Brief: `collabcanvas/docs/pr-briefs.md` (Lines 23-32)
- TODO: `collabcanvas/docs/todos/pr-1-todo.md`
- Architecture: `collabcanvas/docs/architecture.md`

---

## 1. Summary

Implement debouncing and batching mechanisms for all Firestore write operations to reduce database writes and improve performance. Currently, every shape modification triggers an immediate Firestore write, causing performance degradation with multiple concurrent users. This PR introduces a 500ms debounce delay for shape updates and batches multiple changes into single transactions, establishing a critical performance foundation before adding AI chat functionality.

---

## 2. Problem & Goals

### Current State Analysis (Baseline Metrics)

**Before any optimization**, the system exhibits the following characteristics:

#### Write Frequency
- **Single shape drag (30 seconds)**: ~300-500 Firestore write operations
  - At 60 FPS, that's 1800 position updates locally → 1800 Firestore writes
  - Each frame of dragging triggers `updateShape()` → immediate Firestore write
- **Multi-shape drag (3 shapes, 10 seconds)**: ~600 Firestore writes (3 shapes × 200 frames)
- **Typical 5-minute editing session**: 1,000-2,000 Firestore write operations
- **Cost implication**: ~$0.18 per 100,000 writes → $1.80-$3.60 per 1M writes

#### Performance Characteristics
- **Local responsiveness**: 60 FPS during drag (acceptable)
- **Remote sync latency**: 50-150ms per update (good, but multiplied by hundreds of updates)
- **Network traffic**: Constant stream of small writes creates network congestion
- **Listener overhead**: Each write triggers onSnapshot for all connected users
- **Browser console**: Flooded with write confirmations during active editing

#### User Experience Issues
- **Multi-user lag**: With 3+ concurrent users, UI becomes noticeably laggy
- **Network sensitivity**: Poor connections cause significant delays
- **Battery drain**: Constant network activity drains mobile device batteries
- **Debugging difficulty**: Console logs flooded, hard to identify real issues

#### Measurement Method
To establish baseline, run this test BEFORE implementing changes:
```javascript
// In browser console
let writeCount = 0;
const originalUpdate = canvasService.updateShape;
canvasService.updateShape = function(...args) {
  writeCount++;
  return originalUpdate.apply(this, args);
};

// Drag a shape for 30 seconds
// After 30 seconds:
console.log('Total writes:', writeCount);
// Expected result: 300-500 writes
```

### Problem
- **Excessive Firestore Writes**: Every drag operation, resize, rotation, and color change immediately writes to Firestore, resulting in hundreds of writes per minute during active editing
- **Performance Degradation**: Multiple concurrent users compound the problem, causing UI lag and increased latency
- **Database Costs**: Unnecessary writes increase Firestore usage costs significantly
- **Real-time Sync Bottleneck**: Constant writes trigger onSnapshot listeners for all users, creating a cascading performance impact

### Why Now?
This is the **most critical performance fix** and must be completed before adding AI chat functionality (Phase 3) to prevent compounding performance issues under increased load. This is PR #1 with no dependencies, making it the logical starting point.

### Goals (with Baseline Comparison)
- [x] G1 — **Reduce Firestore write operations by 80-90%** during active editing sessions
  - Baseline: 300-500 writes per 30-second drag
  - Target: <60 writes per 30-second drag (90% reduction)
- [x] G2 — **Maintain <100ms perceived latency** for local user interactions through optimistic UI updates
  - Baseline: ~16ms (60 FPS) - already acceptable
  - Target: Maintain same 60 FPS with optimistic updates
- [x] G3 — **Ensure changes sync to remote users within 600ms** after user action completes
  - Baseline: 50-150ms per update (but 300-500 updates per session)
  - Target: Single update within 600ms after debounce (500ms + 100ms)
- [x] G4 — **Preserve data consistency** and prevent race conditions during concurrent editing
  - Baseline: Occasional race conditions on rapid operations
  - Target: Zero data loss, proper flush on all critical events

---

## 3. Non-Goals / Out of Scope

- [ ] **Not implementing undo/redo** - This requires operation history tracking (future feature)
- [ ] **Not optimizing onSnapshot listeners** - Throttling listeners is handled in PR #3
- [ ] **Not implementing Firestore transactions for locks** - Lock race condition fix is deferred
- [ ] **Not adding optimistic rollback** - Simple optimistic updates only; no rollback on failure
- [ ] **Not changing the data model** - All changes are implementation-level only
- [ ] **Not implementing smart batching strategies** - Using fixed 500ms debounce for simplicity

---

## 4. Success Metrics

### User-Visible Metrics
- **Drag responsiveness**: Shape follows cursor at 60 FPS with no perceived lag
  - ✅ Baseline: 60 FPS (already good)
  - ✅ Target: Maintain 60 FPS (no regression)
- **Remote sync latency**: Changes visible to other users within 600ms (500ms debounce + 100ms sync)
  - 📊 Baseline: 50-150ms per update × 300 updates = constant stream
  - 🎯 Target: Single batch update within 600ms after user stops action
- **UI blocking**: Zero UI freezes or stuttering during multi-shape operations
  - ⚠️ Baseline: Occasional stuttering with 3+ users
  - ✅ Target: Smooth performance with 5+ users

### System Metrics (Critical for Validation)
- **Write reduction**: 80-90% reduction in Firestore write operations during active sessions
  - 📊 Baseline: 300-500 writes per 30-second drag
  - 🎯 Target: <60 writes per 30-second drag
  - 📏 Measurement: Count actual Firestore writes during test scenarios
- **Batching efficiency**: Average 5-10 updates per batch during active editing
  - 📊 Baseline: N/A (no batching currently)
  - 🎯 Target: 5-10 updates per batch
  - 📏 Measurement: Log batch sizes during editing sessions
- **Performance under load**: System maintains targets with 5+ concurrent users
  - ⚠️ Baseline: Degradation with 3+ users
  - ✅ Target: Smooth with 5+ users

### Quality Metrics
- **Data consistency**: Zero data loss or corruption during debounced operations
  - 📊 Baseline: Occasional lost updates on rapid actions
  - ✅ Target: Zero data loss with proper flush mechanisms
- **Race condition handling**: Proper handling of rapid tool switches and selection changes
  - ⚠️ Baseline: Known issues with rapid selection changes
  - ✅ Target: All edge cases handled with immediate flush
- **Error recovery**: Graceful handling of network failures during batch commits
  - 📊 Baseline: Errors sometimes cause UI crashes
  - ✅ Target: Graceful error handling with user notification

### Before/After Comparison Table

| Metric | Before (Baseline) | After (Target) | Improvement |
|--------|------------------|----------------|-------------|
| Writes (30s drag) | 300-500 | <60 | 90%+ reduction |
| Writes (5min session) | 1,000-2,000 | 100-200 | 90% reduction |
| Local FPS | 60 FPS | 60 FPS | Maintained |
| Remote sync | 50-150ms × 300 | 600ms × 1 | Single batch |
| Multi-user (5 users) | Laggy | Smooth | Significant |
| Data loss incidents | Occasional | Zero | Critical fix |

---

## 5. Users & Stories

- As a **canvas editor**, I want smooth drag operations at 60 FPS so that drawing feels responsive and natural
- As a **collaborative user**, I want my changes to sync quickly to teammates so that we can work together efficiently
- As a **project owner**, I want reduced Firestore costs so that the application is sustainable at scale
- As a **mobile user**, I want efficient network usage so that the app performs well on slower connections
- As a **developer**, I want predictable write patterns so that I can debug and monitor system performance

---

## 6. Experience Specification (UX)

### Entry Points and Flows
- **Transparent to users**: No UI changes required; performance improvements are invisible
- **All shape operations**: Dragging, resizing, rotating, color changes, text editing
- **Multi-shape operations**: Group moves, batch updates, alignment operations

### Visual Behavior
- **Optimistic UI**: Local updates render immediately (no perceived delay)
- **Remote updates**: Other users see changes within 600ms after user stops editing
- **Loading states**: No additional loading indicators needed (existing states preserved)
- **Error states**: Toast notifications for batch write failures (existing pattern)

### Performance Targets
- **Local interaction**: 60 FPS during drag/resize/rotate operations
- **Feedback latency**: <16ms for optimistic UI updates (matches frame rate)
- **Network sync**: <100ms after debounce period (500ms + 100ms = 600ms total)
- **Batch commit time**: <200ms for typical batches (5-10 operations)

### Edge Cases
- **Rapid tool switching**: Cancel pending debounces when tool changes
- **Selection changes**: Flush debounced updates when selection changes
- **Page unload**: Flush all pending writes before user navigates away
- **Network failures**: Retry failed batches with exponential backoff

---

## 7. Functional Requirements (Must/Should)

### MUST Requirements

#### M1: Debounce Shape Position Updates
- MUST delay Firestore writes for shape position changes by 500ms
- MUST update local UI immediately (optimistic update)
- MUST cancel pending debounce when user stops dragging
- [Gate] When User A drags a shape → shape follows cursor at 60 FPS locally, syncs to User B within 600ms after drag ends

#### M2: Batch Multiple Shape Updates
- MUST collect multiple shape updates during debounce period into single batch
- MUST use Firestore `writeBatch()` for atomic commits
- MUST include updatedAt timestamp on all batched writes
- [Gate] When User A moves 3 grouped shapes → all 3 shapes update atomically in single Firestore transaction

#### M3: Debounce Shape Property Changes
- MUST debounce width, height, rotation, and color updates
- MUST preserve existing resize/rotate validation logic
- MUST handle rapid consecutive property changes
- [Gate] When User A resizes shape 5 times in 2 seconds → only 1 Firestore write occurs 500ms after final resize

#### M4: Flush on Critical Events
- MUST flush pending writes when selection changes
- MUST flush pending writes when tool switches (pan, rectangle, circle, etc.)
- MUST flush pending writes on page unload (beforeunload event)
- [Gate] When User A drags shape then clicks different shape → first shape updates immediately sync before second selection

#### M5: Preserve Lock Mechanism
- MUST maintain existing lock/unlock behavior
- MUST NOT debounce lock acquisition or release
- MUST flush pending updates before unlocking shapes
- [Gate] When User A finishes editing locked shape → shape unlocks only after all pending updates commit

#### M6: Error Handling
- MUST show toast notification on batch write failures
- MUST log detailed error information for debugging
- MUST NOT corrupt local state on write failures
- [Gate] Error case: Batch write fails → user sees error toast, local state remains consistent, retry option available

### SHOULD Requirements

#### S1: Debounce Text Content Updates
- SHOULD debounce text content changes during typing (300ms)
- SHOULD flush immediately on blur or Enter key
- SHOULD handle rapid formatting changes (bold, italic, etc.)

#### S2: Smart Batching for Multi-Select
- SHOULD batch all multi-select move operations into single write
- SHOULD preserve relative positioning during batch moves
- SHOULD maintain z-index relationships

#### S3: Performance Monitoring
- SHOULD log batch sizes and write frequencies
- SHOULD track debounce cancellation rates
- SHOULD measure actual write reduction percentages

---

## 8. Data Model

### No Schema Changes Required
All changes are implementation-level. Existing Firestore schema remains unchanged:

```typescript
// Existing shape document structure (unchanged)
{
  id: string,
  type: 'rectangle' | 'text' | 'circle' | 'triangle',
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  rotation: number,
  groupId: string | null,
  zIndex: number,
  createdBy: string,
  createdAt: Timestamp,
  lockedBy: string | null,
  lockedAt: Timestamp | null,
  updatedAt: Timestamp, // ← This will update less frequently
}
```

### Validation Rules (Unchanged)
- All existing validation rules preserved
- No new fields or collections
- Security rules remain the same

---

## 9. API / Service Contracts

### New Service Method: Debounced Updates

```typescript
/**
 * Update shape with debouncing
 * Collects updates and commits to Firestore after delay
 */
debouncedUpdateShape(
  shapeId: string, 
  updates: ShapeUpdateInput, 
  options?: {
    debounceMs?: number,  // Default: 500ms
    flush?: boolean        // Force immediate write
  }
): void

/**
 * Batch update multiple shapes with debouncing
 * Collects updates and commits as single transaction
 */
debouncedBatchUpdateShapes(
  updates: Array<{ shapeId: string; updates: ShapeUpdateInput }>,
  options?: {
    debounceMs?: number,  // Default: 500ms
    flush?: boolean        // Force immediate write
  }
): void

/**
 * Flush all pending debounced writes immediately
 * Called on selection change, tool switch, page unload
 */
flushPendingUpdates(): Promise<void>
```

### Modified Hook Methods

```typescript
// In useCanvas hook
const {
  // Existing immediate methods (unchanged for critical operations)
  lockShape: (shapeId: string) => Promise<LockResult>,
  unlockShape: (shapeId: string) => Promise<void>,
  deleteShape: (shapeId: string) => Promise<void>,
  
  // New debounced methods (replace immediate versions)
  updateShape: (shapeId: string, updates: ShapeUpdateInput) => void,
  batchUpdateShapes: (updates: BatchUpdateInput[]) => void,
  
  // New utility method
  flushPendingUpdates: () => Promise<void>,
}
```

### Pre- and Post-Conditions

**debouncedUpdateShape:**
- Pre: shapeId exists in shapes collection
- Pre: updates object contains valid shape properties
- Post: Local state updated immediately
- Post: Firestore write occurs 500ms after last update (or on flush)
- Error: Network failure → toast notification, local state preserved

**flushPendingUpdates:**
- Pre: Any pending debounced writes exist
- Post: All pending writes committed to Firestore
- Post: Debounce timers cleared
- Error: Batch write fails → error logged, user notified

---

## 10. UI Components to Create/Modify

### Service Layer
- `src/services/canvasService.ts` — Add debouncing logic, flush methods, batch management

### Hooks Layer
- `src/hooks/useCanvas.ts` — Integrate debounced service methods, add flush on selection change

### Context Layer
- `src/contexts/CanvasContext.tsx` — Wire up debounced methods, handle beforeunload event

### Canvas Component
- `src/components/Canvas/Canvas.tsx` — Add flushPendingUpdates calls on tool switch, selection change

### No UI Component Changes Required
- All changes are in service/hook/context layers
- UI components continue calling same method names
- Transparent performance improvement

---

## 11. Integration Points

### Uses CanvasService for Mutations
- All shape updates route through `canvasService.debouncedUpdateShape()`
- Batch operations use `canvasService.debouncedBatchUpdateShapes()`
- Critical operations (lock, unlock, delete) remain immediate

### Listeners via Firestore Subscriptions
- Existing `onSnapshot` listeners unchanged
- Remote users receive batched updates via existing subscriptions
- No changes to `subscribeToShapes()` method

### State Wired Through CanvasContext
- CanvasContext provides debounced methods to components
- Context handles beforeunload event for flush
- Context manages selection change triggers

---

## 12. Test Plan & Acceptance Gates

### Happy Path Tests

#### Single Shape Operations
- [ ] **Drag shape continuously**: Drag shape for 3 seconds in circle pattern
  - Gate: Shape follows cursor at 60 FPS locally
  - Gate: Remote user sees final position within 600ms after drag stops
  - Gate: Only 1 Firestore write occurs (after 500ms debounce)

- [ ] **Resize shape multiple times**: Grab resize handle and change size 5 times rapidly
  - Gate: Resize handles respond at 60 FPS
  - Gate: Only 1 Firestore write occurs 500ms after final resize
  - Gate: Remote user sees final size within 600ms

- [ ] **Rotate shape**: Rotate shape through 360 degrees continuously
  - Gate: Rotation handle responds smoothly at 60 FPS
  - Gate: Single batch write after rotation completes
  - Gate: Final rotation syncs to remote users accurately

#### Multi-Shape Operations
- [ ] **Move grouped shapes**: Select 3 shapes, drag them together
  - Gate: All 3 shapes move in sync locally
  - Gate: Single batch write updates all 3 shapes atomically
  - Gate: Remote user sees all 3 shapes move together (no staggered updates)

- [ ] **Multi-select resize**: Select 5 shapes, resize all simultaneously
  - Gate: All shapes resize proportionally
  - Gate: Single batch write after debounce period
  - Gate: No race conditions or partial updates

#### Text Editing
- [ ] **Type text content**: Create text shape, type "Hello World" with pauses
  - Gate: Text appears locally as typed with no lag
  - Gate: Firestore writes occur 300ms after typing pauses
  - Gate: Final text syncs to remote users correctly

- [ ] **Rapid formatting changes**: Toggle bold, italic, underline rapidly
  - Gate: Format changes apply immediately locally
  - Gate: Single batch write after changes complete
  - Gate: All formatting syncs correctly to remote users

### Edge Cases

#### Rapid Tool Switching
- [ ] **Switch tools during drag**: Start dragging shape, switch to pan tool mid-drag
  - Gate: Pending updates flush immediately when tool switches
  - Gate: Shape position commits before tool change
  - Gate: No orphaned debounce timers

- [ ] **Rapid shape creation**: Create 5 shapes in quick succession (one per second)
  - Gate: All shapes persist to Firestore
  - Gate: No race conditions on z-index assignment
  - Gate: All shapes visible to remote users

#### Selection Changes
- [ ] **Switch selection rapidly**: Click shape A, then shape B within 200ms
  - Gate: Shape A updates flush before shape B selection
  - Gate: Lock on shape A releases properly
  - Gate: No state corruption or lost updates

#### Page Unload
- [ ] **Close browser during edit**: Drag shape, close browser tab immediately after
  - Gate: beforeunload handler fires
  - Gate: Pending updates commit before page closes
  - Gate: No data loss (shape position persists)

- [ ] **Navigate away during edit**: Drag shape, click browser back button
  - Gate: Pending updates commit before navigation
  - Gate: User sees brief "saving" period if updates pending

#### Network Failures
- [ ] **Offline during debounce period**: Drag shape, disconnect network, wait 1 second
  - Gate: Local state remains consistent
  - Gate: Error toast appears when batch write fails
  - Gate: Reconnect → updates retry and succeed

- [ ] **Intermittent connection**: Drag 10 shapes with network dropping every 2 seconds
  - Gate: All successful writes persist correctly
  - Gate: Failed writes log errors but don't crash app
  - Gate: User sees clear indication of sync status

### Multi-User Tests

#### Concurrent Editing
- [ ] **Both users drag different shapes**: User A drags shape 1, User B drags shape 2
  - Gate: Both shapes update independently
  - Gate: No lock conflicts (different shapes)
  - Gate: Both users see each other's changes within 600ms

- [ ] **Sequential editing same shape**: User A drags shape, releases, User B immediately drags same shape
  - Gate: User A's updates commit before User B acquires lock
  - Gate: No race condition on lock acquisition
  - Gate: Both updates persist correctly

#### Heavy Load
- [ ] **5 users editing simultaneously**: 5 users each drag 3 shapes concurrently
  - Gate: All users maintain 60 FPS locally
  - Gate: All updates sync within 1 second (acceptable under load)
  - Gate: No lost updates or corrupted state
  - Gate: Firestore write count remains reasonable (not N*users*shapes)

### Performance Tests

#### Write Reduction
- [ ] **Measure write frequency**: User drags shape continuously for 30 seconds
  - Gate: <10 Firestore writes total (vs 300+ without debouncing)
  - Gate: 90%+ reduction in write operations
  - Gate: Console logs show batch sizes averaging 5-10 updates

#### Latency Targets
- [ ] **Local responsiveness**: Drag shape across canvas
  - Gate: 60 FPS maintained throughout
  - Gate: <16ms frame time (Chrome DevTools Performance tab)
  - Gate: No dropped frames or stuttering

- [ ] **Remote sync latency**: User A drags shape, User B observes
  - Gate: User B sees update within 600ms of User A stopping drag
  - Gate: Average latency <100ms after debounce period
  - Gate: No perceptible lag for User B

#### Batching Efficiency
- [ ] **Batch size analysis**: Monitor batch sizes during typical editing session
  - Gate: Average batch size 5-10 updates during active editing
  - Gate: Single-update batches rare (indicates good batching)
  - Gate: Maximum batch size <50 updates (indicates no runaway batching)

---

## 13. Definition of Done (End-to-End)

- [ ] Service methods implemented with debouncing logic (500ms default)
- [ ] Batch management system handles pending updates queue
- [ ] Flush methods implemented for critical events (selection, tool switch, unload)
- [ ] Unit tests for debounce logic and batch management
- [ ] Integration tests for multi-user concurrent editing
- [ ] Performance tests verify 80%+ write reduction
- [ ] All acceptance gates pass in test scenarios
- [ ] Real-time sync verified across 2 browsers (<600ms total latency)
- [ ] Error handling tested for network failures
- [ ] Performance monitoring logs added (batch sizes, write frequency)
- [ ] No regressions in existing functionality
- [ ] Documentation updated with debouncing behavior notes

---

## 14. Risks & Mitigations

### Risk: Data Loss on Page Unload
**Likelihood**: Medium  
**Impact**: High  
**Mitigation**: 
- Implement robust beforeunload handler that flushes pending writes
- Use synchronous flush if possible (limited browser support)
- Show brief "saving" indicator if writes pending
- Test extensively across browsers (Chrome, Firefox, Safari)

### Risk: Race Conditions on Rapid Selection Changes
**Likelihood**: Medium  
**Impact**: Medium  
**Mitigation**:
- Flush pending updates immediately when selection changes
- Clear all debounce timers on selection change
- Add integration tests for rapid selection switching
- Log selection changes for debugging if issues arise

### Risk: Increased Perceived Latency for Remote Users
**Likelihood**: Low  
**Impact**: Medium  
**Mitigation**:
- Keep debounce period short (500ms is acceptable)
- Monitor user feedback on sync latency
- Add optional "fast sync" mode if users complain
- Educate users that 600ms latency is normal for performance gains

### Risk: Complexity in Flush Logic
**Likelihood**: Medium  
**Impact**: Low  
**Mitigation**:
- Keep flush logic simple and centralized
- Document all flush triggers clearly
- Add comprehensive unit tests for flush scenarios
- Use TypeScript for type safety

### Risk: Firestore Batch Size Limits
**Likelihood**: Low  
**Impact**: Medium  
**Mitigation**:
- Firestore batch limit is 500 operations (very high)
- Split batches if size exceeds 100 operations (safety margin)
- Log warning if approaching batch limits
- Unlikely to hit limits in normal usage

### Risk: Debugging Difficulty
**Likelihood**: Low  
**Impact**: Low  
**Mitigation**:
- Add comprehensive console logging for debounce/batch operations
- Include batch IDs and timestamps in logs
- Add performance monitoring hooks
- Document debounce behavior in code comments

---

## 15. Rollout & Telemetry

### Feature Flag
**No** - This is a core infrastructure change that should apply to all users immediately

### Metrics to Monitor
- **Write frequency**: Firestore writes per minute per user
- **Batch sizes**: Average number of updates per batch
- **Debounce cancellations**: How often debounces are cancelled by flushes
- **Error rates**: Batch write failures, network errors
- **Latency percentiles**: P50, P95, P99 for remote sync latency

### Manual Validation Steps Post-Deploy
1. Open 2 browser windows side-by-side as different users
2. User A drags shape continuously for 5 seconds
3. Verify User B sees update within 600ms after drag stops
4. Check browser console for batch write logs
5. Verify write reduction: <10 writes for 5 second drag (vs 100+ without debouncing)
6. Test page unload: drag shape, close tab, reopen → verify position persisted
7. Test network failure: disconnect network, drag shape, reconnect → verify error handling

---

## 16. Open Questions

**Q1**: Should we add a visual indicator for "syncing" state during debounce period?  
**Decision**: No - 500ms is short enough that users won't notice. If user feedback indicates confusion, add in future iteration.

**Q2**: Should we implement optimistic rollback on batch write failures?  
**Decision**: No for MVP - show error toast and log error. Rollback adds complexity and is rarely needed.

**Q3**: Should text content debounce be different from shape property debounce?  
**Decision**: Yes - use 300ms for text (shorter) vs 500ms for shape properties (standard).

**Q4**: Should we debounce lock/unlock operations?  
**Decision**: No - locks are critical for concurrency control and must be immediate.

---

## 17. Appendix: Out-of-Scope Backlog

Items explicitly deferred for future work with brief rationale:

- [ ] **Optimistic rollback on failures** - Adds significant complexity, rarely needed
- [ ] **Firestore transaction-based locks** - Requires schema changes, separate PR
- [ ] **Smart batching strategies** - Adaptive debounce times based on user behavior
- [ ] **Conflict resolution UI** - Handling merge conflicts when remote updates arrive
- [ ] **Offline mode support** - Requires IndexedDB cache and sync queue
- [ ] **Real-time sync latency monitoring UI** - User-facing sync status indicators
- [ ] **Throttling onSnapshot listeners** - Handled in PR #3

---

## Preflight Questionnaire

1. **Smallest end-to-end outcome**: Reduce Firestore writes by 80%+ while maintaining <600ms sync latency
2. **Primary user**: All canvas editors (single and collaborative)
3. **Must-have vs nice-to-have**: Must: debouncing + batching. Nice: text-specific debounce, smart batching
4. **Real-time collaboration**: All users, <600ms sync (500ms debounce + 100ms Firestore)
5. **Performance constraints**: 60 FPS local, 80% write reduction, <600ms remote sync
6. **Error/edge cases**: Network failures, page unload, rapid selection changes, tool switching
7. **Data model changes**: None required
8. **Service APIs**: debouncedUpdateShape(), debouncedBatchUpdateShapes(), flushPendingUpdates()
9. **UI entry points**: Transparent to users, all existing shape manipulation flows
10. **Accessibility**: No impact (transparent change)
11. **Security**: No changes to security rules or permissions
12. **Dependencies**: None (PR #1)
13. **Rollout strategy**: Deploy to all users, monitor write frequency and error rates
14. **Out of scope**: Optimistic rollback, conflict resolution UI, offline mode

---

## Authoring Notes

- This PRD defines a critical foundation for performance before Phase 3 (AI features)
- Test plan emphasizes data consistency and multi-user scenarios
- Implementation must preserve existing service contract signatures where possible
- Focus on simplicity: fixed 500ms debounce, straightforward batch management
- Comprehensive error handling is critical due to async nature of debouncing

---

**Document Status**: ✅ Ready for Implementation  
**Estimated Complexity**: Complex (2-3 hours)  
**Blocking PRs**: None  
**Blocks**: PR #2 (Shape Rendering Optimization), PR #3 (Connection Status)

