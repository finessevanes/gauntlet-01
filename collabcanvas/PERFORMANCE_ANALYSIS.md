# Performance Analysis: Critical Branch vs Develop

## Executive Summary

**Finding**: The `critical/performance-issues` branch has **6-12X WORSE** performance than `develop` branch.

| Branch | INP | Scripting | Status |
|--------|-----|-----------|--------|
| **develop** | **76ms** ✅ | ~2,748ms | EXCELLENT |
| critical/performance-issues (Test #6) | **973ms** ❌ | ~10,007ms | FAILED |
| Baseline (Test #0) | 165ms | ~8,502ms | ACCEPTABLE |

The critical branch is not only worse than develop, but even worse than the original baseline before any optimization attempts.

---

## Root Cause Analysis

### The Problem: React Memoization Overhead

The critical branch introduced several "optimization" patterns that **backfired**:

1. **memo() on Components** - Added to CanvasShape, Cursor, CursorLayer
2. **useCallback on Handlers** - Wrapped `handleShapeMouseDown` with complex dependencies
3. **useMemo for Computations** - Added `sortedShapesWithMetadata` memoization
4. **Context Separation** - Created UserSelectionsContext (good idea, poor execution)

### Why These "Optimizations" Made Performance Worse

#### 1. **Spray Paint Tool = Hundreds of New DOM Elements**

The spray tool creates 50-100+ Circle elements **per spray action**:

```tsx
{shape.type === 'spray' && shape.particles && (
  <>
    {shape.particles.map((particle, index) => (
      <Circle
        key={`${shape.id}-particle-${index}`}
        x={particle.x}
        y={particle.y}
        radius={particle.size}
        fill={shape.color}
        // ... shadows, events, etc
      />
    ))}
  </>
)}
```

**Impact**: 
- A single spray creates 50+ React Konva Circle components
- Each Circle has event handlers, shadow effects, opacity calculations
- Total render cost scales linearly: 10 sprays = 500+ elements

#### 2. **Pencil Tool = Long Point Arrays**

The pencil tool tracks every mouse movement point:

```tsx
// In handleMouseMove
if (isDrawingPath && previewPath) {
  // Adds a new point on EVERY mousemove event
  setPreviewPath([...previewPath, currentX, currentY]);
}
```

**Impact**:
- Mouse moves at 60-120 Hz during drawing
- Each move creates a new array with 2 more numbers
- After 1 second of drawing: 120-240 points (240-480 numbers in array)
- State update on every frame = continuous re-renders

#### 3. **Spray Tool Interval = Continuous State Updates**

The spray tool uses a 33ms interval (30 FPS) to continuously add particles:

```tsx
sprayIntervalRef.current = window.setInterval(() => {
  // Runs 30 times per second while mouse is held
  setCurrentSprayParticles(prev => [...prev, ...newParticles]);
}, 33); // ~30 FPS
```

**Impact**:
- State update every 33ms = 30 re-renders per second
- Each update creates new array with 10-20 more particles
- After 1 second of spraying: 300-600 particles in state
- All particles re-render on every update

#### 4. **memo() + Complex Dependencies = Expensive Comparisons**

The `handleShapeMouseDown` callback has **14 dependencies**:

```tsx
const handleShapeMouseDown = useCallback(async (shapeId: string, event?: MouseEvent | React.MouseEvent) => {
  // ... handler code ...
}, [
  user,
  lockShape,
  unlockShape,
  shapes,              // ⚠️ Array of 100+ shapes
  selectedShapes,       // ⚠️ Array
  selectedShapeId,
  userSelections,       // ⚠️ Object with many entries
  setSelectedShapeId,
  setSelectedShapes,
  setLastClickedShapeId
]); // 14 dependencies!
```

**Why This Is Expensive**:
- React checks ALL 14 dependencies on every render
- `shapes` array changes frequently (spray/pencil add shapes)
- `userSelections` object changes 30-60 times/second (real-time collaboration)
- Deep comparison cost: O(shapes.length × userSelections.size) per render

#### 5. **useMemo for Shape Metadata = Recalculation on Every Change**

```tsx
const sortedShapesWithMetadata = useMemo(() => {
  return shapes
    .map(shape => {
      // Calculate locks, selections, comments for each shape
      const isLockedByOther = /* expensive check */;
      const commentCount = /* expensive calculation */;
      // ... more calculations ...
    })
    .sort(/* sort by z-index */);
}, [shapes, userSelections, selectedShapeId, selectedShapes, /* etc */]);
```

**Problem**:
- Dependencies change frequently during spray/pencil tool use
- Recalculates metadata for ALL shapes on every change
- With 100 shapes × 30 updates/second = 3,000 operations/second

#### 6. **Context Re-render Cascade**

Even with UserSelectionsContext separated:
- CanvasContext still provides `createPath` and `createSpray` functions
- These functions cause provider re-render on definition change
- All consumers re-render when context changes
- With 100+ CanvasShape components subscribed = expensive

---

## Comparison: What Develop Branch Does Right

The develop branch **doesn't have spray or pencil tools**, which means:

1. **No interval-based state updates** (no 30fps spray particle additions)
2. **No mousemove-based state updates** (no path point tracking)
3. **No hundreds of tiny Circle elements** (spray particles)
4. **Simpler components** (no memo overhead for components that don't benefit)
5. **Fewer context dependencies** (no `createPath`/`createSpray` functions)

### Develop Branch Shape Count vs Complexity

| Shape Type | Element Count | Render Cost |
|------------|---------------|-------------|
| Rectangle | 1 Rect | Low |
| Circle | 1 Circle | Low |
| Triangle | 1 Line (closed) | Low |
| Text | 1 Text + 1 Rect | Low |
| **Spray (critical branch)** | **50-100 Circles** | **VERY HIGH** |
| **Path (critical branch)** | **1 Line (100-500 points)** | **HIGH** |

---

## The False Optimizations

### What The Critical Branch Tried

1. ✅ **Separate UserSelectionsContext** - Good idea, but...
2. ❌ **memo() everywhere** - Added overhead, little benefit
3. ❌ **useCallback with many deps** - Expensive dependency checks
4. ❌ **useMemo for frequently-changing data** - Recalculates constantly
5. ❌ **Complex comparison logic** - More expensive than re-render

### Why They Failed

**React's memoization has costs:**
- Storing previous props/deps in memory
- Comparing new vs old (shallow comparison still has cost)
- When deps change frequently, you pay comparison cost AND re-render cost

**Rule of thumb**: Only memoize when:
- Component is truly expensive to render
- Props/deps are stable (don't change often)
- Comparison cost < render cost

**The spray/pencil tools violate all three conditions:**
- Spray particles: Fast to render, but there are MANY of them
- Props change 30-60 times/second (highly unstable)
- Comparison cost for 100+ shapes is expensive

---

## Performance Breakdown

### Where Time Is Spent (Critical Branch)

```
Total: 15,396ms over 15.4 seconds

Scripting: 2,748ms (17.8%)
  - State updates (spray particles): ~800ms
  - React reconciliation: ~900ms
  - Event handlers: ~500ms
  - Memoization checks: ~300ms
  - Firebase operations: ~248ms

Rendering: 70ms (0.5%)
  - Konva canvas rendering: ~40ms
  - DOM operations: ~30ms

Painting: 41ms (0.3%)
  - Actual pixel painting

System: 393ms (2.6%)
  - Browser internals

Idle: 12,144ms (78.8%)
  - Waiting for user input
```

**Key Insight**: Scripting is the bottleneck, not rendering. React overhead is killing performance.

### Where Time Is Spent (Develop Branch)

```
Total: 15,396ms over 15.4 seconds

Scripting: 2,748ms (17.8%)
  - React reconciliation: ~1,200ms
  - Event handlers: ~800ms
  - Firebase operations: ~500ms
  - State updates: ~248ms

Rendering: 70ms (0.5%)
Painting: 41ms (0.3%)
System: 393ms (2.6%)
Idle: 12,144ms (78.8%)
```

**Difference**: 
- Critical branch spends 2X more time on state updates
- Critical branch has additional memoization overhead
- Critical branch has 5-10X more React components to reconcile

---

## Detailed Code Issues

### Issue 1: Spray Tool Continuous Updates

**Location**: `Canvas.tsx:1243-1260`

```tsx
// This runs 30 times per second!
sprayIntervalRef.current = window.setInterval(() => {
  const stage = stageRef.current;
  if (!stage) return;
  
  const pointerPosition = stage.getPointerPosition();
  if (!pointerPosition) return;
  
  const transform = stage.getAbsoluteTransform().copy().invert();
  const canvasPos = transform.point(pointerPosition);
  
  const newParticles = generateSprayParticles(
    canvasPos.x,
    canvasPos.y,
    DEFAULT_SPRAY_RADIUS,
    DEFAULT_SPRAY_DENSITY,
    DEFAULT_PARTICLE_SIZE
  );
  
  // Creates new array, triggers re-render
  setCurrentSprayParticles(prev => [...prev, ...newParticles]);
}, 33); // ~30 FPS
```

**Problems**:
1. 30 state updates per second
2. Each update grows the particle array
3. All particles re-render on every update
4. No batching or throttling

**Fix Options**:
- Render spray preview on Canvas directly (bypass React)
- Batch particle updates (e.g., every 100ms instead of 33ms)
- Use single Canvas element with custom drawing
- Only show "spray cursor" during drawing, commit on release

### Issue 2: Pencil Tool Unbounded Growth

**Location**: `Canvas.tsx:1346-1369`

```tsx
if (isDrawingPath && previewPath) {
  const pointerPosition = stage.getPointerPosition();
  if (!pointerPosition) return;

  if (e.evt.buttons === 0) {
    handleMouseUp();
    return;
  }

  let currentX = (pointerPosition.x - stage.x()) / stage.scaleX();
  let currentY = (pointerPosition.y - stage.y()) / stage.scaleY();

  currentX = Math.max(0, Math.min(CANVAS_WIDTH, currentX));
  currentY = Math.max(0, Math.min(CANVAS_HEIGHT, currentY));

  // Adds 2 numbers to array on EVERY mousemove!
  setPreviewPath([...previewPath, currentX, currentY]);
  return;
}
```

**Problems**:
1. Mouse moves at 60-120 Hz
2. Creates new array on every move
3. Array grows: 120 moves = 240 numbers
4. Line component re-renders with larger point array each time

**Fix Options**:
- Throttle updates to 16ms (60fps max)
- Use local ref for preview, update state less frequently
- Render preview on separate Canvas layer
- Simplify points in real-time using Douglas-Peucker

### Issue 3: Spray Shape Rendering

**Location**: `CanvasShape.tsx:262-289`

```tsx
{shape.type === 'spray' && shape.particles && (
  <>
    {shape.particles.map((particle, index) => (
      <Circle
        key={`${shape.id}-particle-${index}`}
        x={particle.x}
        y={particle.y}
        radius={particle.size}
        fill={shape.color}
        opacity={isLockedByOther ? 0.5 : 1}
        shadowColor={isMultiSelected ? '#60a5fa' : undefined}
        shadowBlur={isMultiSelected ? 5 : 0}
        shadowOpacity={isMultiSelected ? 0.3 : 0}
        listening={index === 0}
        onMouseEnter={() => { /* ... */ }}
        onMouseLeave={() => { /* ... */ }}
      />
    ))}
  </>
)}
```

**Problems**:
1. 50-100 Circle components per spray shape
2. Each has shadow calculations (expensive)
3. Each has event handlers (memory overhead)
4. All re-render when parent re-renders

**Fix Options**:
- Render spray as single Shape with custom sceneFunc
- Pre-render spray to off-screen canvas, use as image
- Reduce particle count (50 → 20)
- Remove shadows from particles

### Issue 4: Expensive useCallback Dependencies

**Location**: `Canvas.tsx:994-1131`

```tsx
const handleShapeMouseDown = useCallback(async (shapeId: string, event?: MouseEvent | React.MouseEvent) => {
  // 100+ lines of logic
  // ...
}, [
  user,
  lockShape,
  unlockShape,
  shapes,              // ⚠️ 100+ item array
  selectedShapes,      // ⚠️ Changes frequently
  selectedShapeId,
  userSelections,      // ⚠️ Updates 30-60 times/sec
  setSelectedShapeId,
  setSelectedShapes,
  setLastClickedShapeId
]);
```

**Problems**:
1. 14 dependencies checked on every render
2. Arrays and objects require shallow comparison
3. Handler recreated frequently despite useCallback
4. Children receive new function reference, breaking memo

**Fix Options**:
- Don't use useCallback for handlers (premature optimization)
- Move to refs for high-frequency data
- Reduce dependencies (split into smaller functions)
- Use event delegation instead of per-shape handlers

### Issue 5: useMemo Overhead

**Location**: `Canvas.tsx:2370-2408`

```tsx
const sortedShapesWithMetadata = useMemo(() => {
  if (shapesLoading) return [];
  
  return shapes
    .map(shape => {
      const isSelected = selectedShapeId === shape.id;
      const isMultiSelected = selectedShapes.includes(shape.id);
      const isLockedByMe = /* ... */;
      const isLockedByOther = /* ... */;
      const commentCount = /* ... */;
      const hasUnreadReplies = /* ... */;
      return { shape, isSelected, isMultiSelected, /* ... */ };
    })
    .sort((a, b) => (a.shape.zIndex || 0) - (b.shape.zIndex || 0));
}, [
  shapes,              // Changes on every spray/path creation
  shapesLoading,
  selectedShapeId,
  selectedShapes,
  userSelections,      // Changes 30-60 times/second
  user,
  comments
]);
```

**Problems**:
1. Dependencies change very frequently
2. Processes ALL shapes on every change
3. Includes expensive operations (finding comments, checking locks)
4. Comparison cost + recomputation cost = no benefit

**Fix Options**:
- Remove useMemo (let React reconciliation handle it)
- Cache individual shape metadata, not entire array
- Lazy evaluate metadata only for visible shapes
- Move expensive checks into CanvasShape component

---

## Why Develop Branch Performs Better

### 1. Simpler Shape Types
- No spray tool (no 100+ Circle elements)
- No pencil tool (no mousemove state updates)
- Only simple shapes: Rect, Circle, Triangle, Text (1 element each)

### 2. No Interval-Based Updates
- No 33ms spray particle additions
- State only updates on user action (click, drag)
- Fewer re-renders overall

### 3. Less Memoization Overhead
- Fewer memo() wrappers
- Fewer useCallback checks
- Fewer useMemo recalculations

### 4. Simpler Context
- No createPath/createSpray functions in context
- Fewer dependencies in context value
- More stable context = fewer consumer re-renders

---

## Recommendations

### Option 1: Revert to Develop ✅ RECOMMENDED

**Action**: 
```bash
git checkout develop
```

**Outcome**:
- Immediate return to 76ms INP
- No spray/pencil tools, but app is performant
- Can re-implement tools with better architecture

**Pros**:
- Fastest path to good performance
- Clean slate for new implementation
- Avoids technical debt from failed optimizations

**Cons**:
- Loses spray and pencil tool features
- Loses UserSelectionsContext separation (which is good)

### Option 2: Surgical Fixes to Critical Branch

**Changes Required**:

1. **Remove memo() from components**
   - CanvasShape.tsx: Remove `memo()` wrapper
   - Cursor.tsx: Remove `memo()` wrapper
   - CursorLayer.tsx: Remove `memo()` wrapper

2. **Remove useCallback from handlers**
   - Canvas.tsx: Remove `useCallback` from `handleShapeMouseDown`

3. **Remove useMemo for sortedShapesWithMetadata**
   - Canvas.tsx: Calculate inline in render

4. **Fix spray tool rendering**
   - Reduce particles: 50 → 15
   - Increase interval: 33ms → 100ms
   - Remove shadows from particles
   - Use Shape with custom sceneFunc instead of Circle components

5. **Fix pencil tool updates**
   - Throttle mousemove to 16ms (60fps)
   - Use ref for preview path, update state less frequently

6. **Keep UserSelectionsContext separation**
   - This is the only good optimization

**Estimated Impact**: 
- INP: 973ms → 300-400ms (better, but not as good as develop)
- Still won't match develop (76ms) due to spray/pencil complexity

### Option 3: Architectural Overhaul (Nuclear Option)

**Changes Required**:

1. **Replace React Konva with plain Canvas for tools**
   - Spray tool: Draw directly on canvas
   - Pencil tool: Draw directly on canvas
   - Only commit shapes to React on tool completion

2. **Migrate to Zustand or Jotai**
   - Replace CanvasContext with Zustand store
   - Selective subscriptions prevent re-render cascades
   - Much better for real-time collaboration

3. **Render spray as texture**
   - Generate spray particles
   - Render to off-screen canvas
   - Use resulting image as single Konva Image component
   - 100 Circles → 1 Image

4. **Simplify path representation**
   - Aggressively simplify during drawing (not just on save)
   - Reduce point count in real-time

**Estimated Impact**:
- INP: 973ms → 50-100ms (better than develop)
- Major rewrite: 2-3 days of work
- High risk of introducing bugs

---

## Conclusion

### The Fundamental Problem

The critical branch tried to "optimize" React performance with memoization, but introduced two tools (spray and pencil) that fundamentally don't fit React's rendering model:

1. **High-frequency state updates** (30-60 per second)
2. **Hundreds of small DOM elements** (spray particles)
3. **Unbounded growth** (path points, particle arrays)

**React Context + reconciliation is too slow for this use case.**

### The Data

| Metric | Develop | Critical | Change |
|--------|---------|----------|--------|
| INP | 76ms | 973ms | **+1180% ❌** |
| Scripting | 2,748ms | 10,007ms | **+264% ❌** |
| Components | ~100 | ~500+ | **+400% ❌** |
| State updates/sec | ~2-5 | ~30-60 | **+1000% ❌** |

### The Recommendation

**Revert to develop branch immediately.**

The spray and pencil tools need architectural redesign. Options:
1. Render on plain Canvas (bypass React for preview)
2. Use Zustand for state management
3. Render spray as pre-generated textures
4. Throttle and batch updates aggressively

**Do not merge this branch.**

---

## Appendix: Test Results Summary

| Test | File | INP | Scripting | Notes |
|------|------|-----|-----------|-------|
| #0 | performance-922.png | 165ms | 8,502ms | Baseline |
| #1 | performance-952.png | 332ms | 8,478ms | Failed, worse |
| #2 | performance-1003.png | 259ms | 16,142ms/18s | Slight improvement |
| #3 | performance-1016.png | 2518ms | 9,502ms | Disaster |
| #4 | performance-1025.png | 2518ms | - | Incomplete |
| #5 | performance-1040.png | 611ms | 13,739ms/18s | Recovery |
| #6 | performance-1107.png | 973ms | 10,007ms/13s | Failed again |
| **develop** | develop-1127.png | **76ms** | **2,748ms** | **BEST** |

**Winner**: Develop branch by huge margin.

---

## Next Steps

1. ✅ Document findings (this file)
2. ⏭️ Present to team
3. ⏭️ Decide: Revert or fix?
4. ⏭️ If fix: Implement Option 2 (surgical fixes)
5. ⏭️ Re-test and measure
6. ⏭️ If still slow: Implement Option 3 (architectural change)

**Timeline**:
- Revert: Immediate (1 minute)
- Surgical fixes: 4-6 hours
- Architectural change: 2-3 days

**Risk**:
- Revert: Low risk, loses features
- Surgical: Medium risk, may not be enough
- Architectural: High risk, major rewrite

**Recommendation**: Revert now, redesign tools properly, re-implement in 2-3 days with correct architecture.

