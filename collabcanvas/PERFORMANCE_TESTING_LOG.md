# Performance Testing Log

## Test #0: BASELINE (BEFORE all changes)
**File**: `performance-922.png`
- **Scripting**: 8,502ms
- **INP**: 165ms
- **Status**: CRITICAL performance issues
- **Date**: Initial test

---

## Test #1: First Optimization Attempt (FAILED)
**File**: `performance-952.png`
- **Scripting**: 8,478ms (-24ms, ~0% improvement)
- **INP**: 332ms (+167ms, **101% WORSE**)
- **Status**: FAILED - Made performance worse
- **Changes Applied**:
  - CanvasShape memoization with complex comparison function
  - Cursor/CursorLayer memoization
  - useCursors debouncing (50ms)
  - Selection syncing throttling (250ms)
  - CURSOR_UPDATE_INTERVAL increased to 50ms

**Analysis**: Complex memo comparison functions too expensive

---

## Test #2: Memoization + Shape Metadata Caching
**File**: `performance-1003.png`
- **Scripting**: 16,142ms over 18s (~897ms/sec)
- **INP**: 259ms
- **Status**: SLIGHTLY WORSE than baseline
- **Changes Applied**:
  - Basic memo() on CanvasShape, Cursor, CursorLayer
  - useMemo for cursor filtering
  - useMemo for sortedShapesWithMetadata in Canvas

**Analysis**: Helped a bit but handlers still recreating, breaking memo

---

## Test #3: Custom Memo Comparisons (DISASTER)
**File**: `performance-1016.png`
- **Scripting**: 9,502ms over 19s (~500ms/sec)
- **INP**: 2518ms (**10X WORSE!** 💀)
- **Frame times**: 1,067ms
- **Status**: CATASTROPHIC FAILURE
- **Changes Applied**:
  - Custom arePropsEqual functions on CanvasShape
  - Custom arePropsEqual on Cursor
  - Custom arePropsEqual on CursorLayer

**Analysis**: Custom comparison functions added massive overhead! Comparing 20+ props on every render for 100s of shapes = disaster. Also partially broke by leaving userSelections in CanvasContext.

---

## Test #4: UserSelections Context Separation
**File**: `performance-1025.png` (same as 1016, incomplete refactor)
- **INP**: 2518ms (still terrible)
- **Status**: INCOMPLETE - Did not finish wiring up new context
- **Changes Attempted**:
  - Created UserSelectionsContext.tsx
  - Partially removed userSelections from CanvasContext
  - Did NOT wire up in App.tsx

**Analysis**: Left code in broken/incomplete state, which is why performance stayed terrible.

---

## Test #5: ATTEMPT 1 - Complete Refactor ✅
**File**: `performance-1040.png`
- **Scripting**: 13,739ms over 18s (~763ms/sec)
- **INP**: 611ms 
- **Status**: **SIGNIFICANT IMPROVEMENT** from disaster, but still 3X worse than baseline
- **Changes Applied**:
  - ✅ Removed ALL custom comparison functions (back to default memo)
  - ✅ Completed UserSelectionsContext separation
  - ✅ Wired up UserSelectionsProvider in App.tsx
  - ✅ userSelections no longer in CanvasContext dependency array
  - ✅ Kept useMemo for shape metadata caching
  - ✅ Kept useMemo for cursor filtering

**Results Comparison**:
- From baseline (197ms) → 611ms = **3X worse** ❌
- From disaster (2518ms) → 611ms = **4X better** ✅
- Yellow wall has gaps now (less continuous rendering)
- More balanced rendering vs scripting

**Analysis**: 
- **Good**: Separating UserSelectionsContext worked - stopped Context avalanche
- **Good**: Removing custom comparisons removed overhead
- **Bad**: Still 3X worse than baseline
- **Bad**: Still has continuous re-rendering sections
- **Root cause**: Context architecture still fundamentally wrong for collaborative real-time updates

---

## Key Learnings

1. ❌ **Custom memo comparisons are expensive** - Comparing 20+ props on 100s of shapes adds massive overhead
2. ✅ **Separating high-frequency updates works** - UserSelectionsContext isolation helped significantly
3. ⚠️ **React Context is not ideal for real-time collaboration** - Even with optimizations, Context re-renders are problematic
4. ✅ **Default memo() is better than custom** - React's shallow comparison is highly optimized
5. ✅ **useMemo for expensive computations works** - Shape metadata caching reduced work
6. 📊 **Test incrementally** - One change at a time reveals what actually helps

---

## Next Steps (Attempt 2 - If Needed)

**Option A: Accept Current State**
- 611ms INP is usable (< 1 second)
- App is functional, just not as fast as baseline
- Stop here

**Option B: Nuclear Option - Zustand Migration**
- Replace React Context with Zustand store
- Selective subscriptions prevent re-render cascades
- Should get back to < 200ms INP
- More invasive (~500 lines changed)

**Recommendation**: If performance must match baseline, proceed with Zustand. If 611ms is acceptable, stop here.

---

## Test #6: ATTEMPT 2 - Phase 1 Refactoring (FAILED)
**File**: `performance-1107.png`
- **Scripting**: 10,007ms over 13s (~770ms/sec)
- **INP**: 973ms (**59% WORSE than Attempt 1!** ❌)
- **Status**: FAILED - Refactoring made performance worse
- **Changes Applied**:
  - ✅ Created `useCanvasSelection.ts` hook (140 lines)
  - ✅ Extracted handleShapeMouseDown with useCallback
  - ✅ Extracted handleDeselectShape with useCallback
  - ✅ Removed 142 lines from Canvas.tsx (2,659 → 2,517 lines)
  - ✅ All selection handlers wrapped in useCallback with proper dependencies

**Results Comparison**:
- From Attempt 1 (611ms) → 973ms = **59% WORSE** ❌
- From baseline (165ms) → 973ms = **6X WORSE** ❌❌
- Yellow wall still dense, no improvement in rendering

**Analysis**: 
- ❌ **Hook overhead**: Adding another custom hook layer added overhead instead of removing it
- ❌ **useCallback cost**: The memoization checks add runtime cost that outweighs benefits
- ❌ **Extra function calls**: More layers = more call stack = slower
- ❌ **More React tracking**: Each hook call adds React internal management cost
- 💡 **Root issue confirmed**: React Context + hooks is fundamentally the wrong architecture for high-frequency collaborative updates

**Critical Insight**: 
The problem is NOT "handlers not memoized". The problem is **React's reconciliation and Context propagation are too expensive** for 30-60 updates/second with 100+ shapes. No amount of React optimization will fix this.

---

## Key Learnings (Updated)

1. ❌ **Custom memo comparisons are expensive** - Comparing 20+ props on 100s of shapes adds massive overhead
2. ✅ **Separating high-frequency updates works** - UserSelectionsContext isolation helped significantly
3. ⚠️ **React Context is not ideal for real-time collaboration** - Even with optimizations, Context re-renders are problematic
4. ✅ **Default memo() is better than custom** - React's shallow comparison is highly optimized
5. ✅ **useMemo for expensive computations works** - Shape metadata caching reduced work
6. 📊 **Test incrementally** - One change at a time reveals what actually helps
7. ❌ **More hooks ≠ better performance** - Hook overhead can outweigh benefits
8. ❌ **useCallback has cost** - Dependency checking adds runtime overhead
9. 💡 **Architecture matters most** - No React optimization will fix fundamental architecture mismatch

---

## Final Assessment

**Performance Progression:**
```
Baseline: 165ms INP
    ↓
Test #1: 332ms (2X worse)
    ↓
Test #2: 259ms (1.6X worse)
    ↓
Test #3: 2518ms (15X worse - disaster)
    ↓
Test #4: 2518ms (still broken)
    ↓
Test #5: 611ms (3.7X worse, but recovered from disaster)
    ↓
Test #6: 973ms (6X worse, 1.6X worse than Test #5)
```

**Conclusion**: Every "optimization" made performance worse. The issue is **architectural**, not tactical.

**Viable Solutions:**
1. **Zustand/Jotai** - Replace Context entirely with selective subscriptions
2. **Direct DOM updates** - Bypass React for high-frequency updates (cursors)
3. **Canvas API** - Render shapes on <canvas> instead of React components
4. **WebGL** - Use GPU acceleration for rendering
5. **Accept 611ms** - Revert to Test #5 and stop optimizing

**Status**: Two attempts used, both failed to improve performance. Architecture change required.

---

## Timeline

- **Test #0-1**: Initial attempts, failed
- **Test #2**: Added memoization, slight improvement
- **Test #3**: Custom comparisons, catastrophic
- **Test #4**: Incomplete refactor, stayed broken
- **Test #5**: Complete refactor, significant recovery (611ms)
- **Test #6**: Phase 1 refactoring attempt, made it worse (973ms)
- **Status**: Architectural change needed or accept Test #5 results

---

## Next Steps (Revised)

**Option A: Accept Test #5 State (RECOMMENDED)**
- Revert Test #6 changes
- Keep UserSelectionsContext separation
- 611ms INP is usable
- Stop optimizing React architecture

**Option B: Architectural Change - Zustand**
- Replace React Context completely
- Selective subscriptions
- Expected: < 200ms INP
- High risk after 2 failed attempts

**Option C: Hybrid Approach**
- Keep React for static UI
- Use Canvas API for shapes
- Direct DOM for cursors
- Expected: < 100ms INP
- Requires major rewrite

**Option D: Accept Current State**
- 973ms is still < 1 second
- App is functional
- Stop here

**Recommendation**: Revert to Test #5 (611ms) and accept it, or proceed with Zustand migration as last resort.
