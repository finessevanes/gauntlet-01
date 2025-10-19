# Action Plan: Fixing Performance Issues

## Current Situation

**Branch**: `critical/performance-issues`  
**Status**: ❌ 12.8X WORSE than develop  
**Cause**: Architectural mismatch between React's rendering model and high-frequency drawing tools

---

## Immediate Actions (Today)

### Step 1: Revert to Develop Branch

```bash
# Save work in progress (if needed)
git stash

# Switch to develop
git checkout develop

# Verify performance
npm run dev
# Test in browser - should see 76ms INP
```

**Expected Result**: Performance returns to 76ms INP (excellent)

### Step 2: Document Lessons Learned

✅ Already completed:
- `PERFORMANCE_TESTING_LOG.md` - Full test history
- `PERFORMANCE_ANALYSIS.md` - Technical deep dive
- `PERFORMANCE_COMPARISON.md` - Side-by-side analysis
- `PERFORMANCE_EXECUTIVE_SUMMARY.md` - Quick reference
- `ACTION_PLAN.md` - This file

---

## Short-term Actions (This Week)

### Redesign Spray Tool

**Problem**: Current implementation creates 50-100 React components per spray

**Solution**: Use Canvas API for preview, commit as texture on release

#### Implementation Approach

```tsx
// 1. Preview phase - Direct canvas rendering (bypass React)
const sprayCanvasRef = useRef<HTMLCanvasElement>(null);

const handleSprayPreview = (x: number, y: number) => {
  const ctx = sprayCanvasRef.current?.getContext('2d');
  if (!ctx) return;
  
  // Draw particles directly on canvas - no React re-renders
  const particles = generateSprayParticles(x, y, radius, density, size);
  particles.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  });
};

// 2. Commit phase - Convert to texture
const handleSprayComplete = async () => {
  const canvas = sprayCanvasRef.current;
  if (!canvas) return;
  
  // Capture canvas as image data
  const imageData = canvas.toDataURL();
  
  // Save to Firestore as single image shape (not 50+ particles)
  await createImageShape({
    src: imageData,
    x, y, width, height,
    createdBy: user.uid
  });
  
  // Clear preview canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};
```

**Benefits**:
- ✅ Zero React re-renders during spray
- ✅ 50+ components → 1 Image component
- ✅ Instant visual feedback
- ✅ Much better performance

**Estimated Impact**: 250ms → 5ms per spray action

---

### Redesign Pencil Tool

**Problem**: Current implementation updates state 60-120 times/second

**Solution**: Throttle updates + simplify points in real-time

#### Implementation Approach

```tsx
// 1. Use ref for preview (bypass state updates)
const previewPathRef = useRef<number[]>([]);
const lastRenderTime = useRef(0);

const handlePathMouseMove = (e: MouseEvent) => {
  const { x, y } = getCanvasCoordinates(e);
  
  // Add to ref (no state update)
  previewPathRef.current.push(x, y);
  
  // Throttle rendering to 60fps max
  const now = Date.now();
  if (now - lastRenderTime.current < 16) return;
  
  // Draw directly on canvas
  drawPathPreview(previewPathRef.current);
  
  lastRenderTime.current = now;
};

// 2. Simplify on release
const handlePathComplete = async () => {
  const points = previewPathRef.current;
  
  // Apply Douglas-Peucker simplification
  const simplified = smoothPath(points, 2.0);
  
  // Save to Firestore
  await createPath({
    points: simplified,
    color,
    strokeWidth,
    createdBy: user.uid
  });
  
  // Reset
  previewPathRef.current = [];
};
```

**Benefits**:
- ✅ 120 state updates/sec → 0 state updates
- ✅ Smooth 60fps preview
- ✅ Simplified paths (50-70% fewer points)
- ✅ No React overhead

**Estimated Impact**: 720ms/sec → 10ms/sec during drawing

---

### Optional: Keep UserSelectionsContext

The UserSelectionsContext separation was actually a good idea - it's just overshadowed by the tool problems.

**Decision**: Keep it in develop branch (cherry-pick commit)

```bash
# From critical branch, find the commit hash
git log --oneline --grep="UserSelectionsContext"

# Cherry-pick just that commit
git checkout develop
git cherry-pick <commit-hash>

# Test to ensure no regression
npm run dev
```

---

## Medium-term Actions (Next Sprint)

### 1. Add Performance Monitoring

**Goal**: Catch regressions before they reach production

#### Implementation

```tsx
// src/utils/performanceMonitor.ts
export function measureINP() {
  if (!('PerformanceObserver' in window)) return;
  
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.log('INP:', entry.processingStart - entry.startTime);
      
      // Alert if > 200ms
      if (entry.processingStart - entry.startTime > 200) {
        console.warn('⚠️ Slow interaction detected!');
      }
    }
  });
  
  observer.observe({ entryTypes: ['event'] });
}

// In App.tsx
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    measureINP();
  }
}, []);
```

---

### 2. Add Performance Budgets to CI

**Goal**: Block PRs that degrade performance

#### Add to `.github/workflows/performance.yml`

```yaml
name: Performance Check

on: [pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            http://localhost:5173
          budgetPath: ./lighthouse-budget.json
          
      - name: Check Performance Budget
        run: |
          if [ $LIGHTHOUSE_SCORE -lt 90 ]; then
            echo "❌ Performance score below 90"
            exit 1
          fi
```

#### Add `lighthouse-budget.json`

```json
{
  "budget": [
    {
      "resourceType": "script",
      "budget": 300
    },
    {
      "metric": "interactive",
      "budget": 3000
    },
    {
      "metric": "first-contentful-paint",
      "budget": 1000
    }
  ]
}
```

---

### 3. Consider Zustand for State Management

**When**: If React Context still shows performance issues

**Why**: Zustand has selective subscriptions - components only re-render when their specific data changes

#### Migration Example

```tsx
// store/canvasStore.ts
import { create } from 'zustand';

interface CanvasStore {
  shapes: ShapeData[];
  selectedShapeId: string | null;
  activeTool: ToolType;
  
  // Actions
  addShape: (shape: ShapeData) => void;
  selectShape: (id: string) => void;
  setActiveTool: (tool: ToolType) => void;
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  shapes: [],
  selectedShapeId: null,
  activeTool: 'select',
  
  addShape: (shape) => set((state) => ({ 
    shapes: [...state.shapes, shape] 
  })),
  
  selectShape: (id) => set({ selectedShapeId: id }),
  
  setActiveTool: (tool) => set({ activeTool: tool }),
}));

// In components - selective subscription
function CanvasShape({ shapeId }) {
  // Only re-renders when THIS shape's data changes
  const shape = useCanvasStore((state) => 
    state.shapes.find(s => s.id === shapeId)
  );
  
  return <Rect {...shape} />;
}
```

**Benefits**:
- ✅ No Context re-render cascades
- ✅ Selective subscriptions
- ✅ Better for real-time collaboration
- ✅ Less boilerplate than Context

**Migration Time**: 1-2 days

---

## Long-term Actions (Next Quarter)

### 1. Investigate Canvas-based Rendering

**Goal**: Replace React Konva with plain Canvas for shapes

**Why**: 
- 10X faster rendering
- No React reconciliation overhead
- Better for large canvases (1000+ shapes)

**Approach**:
- Keep React for UI (toolbar, modals, etc.)
- Render shapes directly on `<canvas>`
- Use React for state management only

**Tradeoffs**:
- More manual work (event handling, hit detection)
- Lose React Konva convenience
- But gain massive performance

**Decision Point**: Only if we expect 500+ shapes per canvas

---

### 2. Consider WebGL/PixiJS

**Goal**: GPU-accelerated rendering for very large canvases

**When**: If users need 1000+ shapes with good performance

**Libraries**:
- PixiJS - 2D WebGL renderer
- Konva supports WebGL backend
- Three.js for 3D

**Migration Time**: 1-2 weeks

---

## Rules for Future Development

### Before Adding "Optimizations"

1. ✅ **Profile first** - Measure actual performance issue
2. ✅ **Identify bottleneck** - Don't guess
3. ✅ **Test impact** - Measure before/after
4. ✅ **Start simple** - Remove code before adding

### Before Using Memoization

1. ✅ **Verify re-render problem** - Use React DevTools Profiler
2. ✅ **Check dependency stability** - Are deps changing frequently?
3. ✅ **Measure cost** - Is render actually expensive?
4. ✅ **Test impact** - Does memo actually help?

**Remember**: Premature optimization is the root of all evil

### Architecture Guidelines

| Use Case | Solution | Don't Use |
|----------|----------|-----------|
| High-frequency updates (>30/sec) | Canvas API, refs | React state, Context |
| Many small elements (>100) | Textures, sprites | Individual components |
| Real-time collaboration | Zustand, Jotai | React Context |
| Static UI | React | N/A |
| Preview/feedback | Canvas, CSS | React components |

---

## Success Metrics

### Performance Targets

| Metric | Target | Current (Develop) | Status |
|--------|--------|-------------------|--------|
| INP | < 200ms | 76ms | ✅ Excellent |
| FCP | < 1.8s | - | ⏭️ Measure |
| LCP | < 2.5s | - | ⏭️ Measure |
| CLS | < 0.1 | - | ⏭️ Measure |
| TTI | < 3.8s | - | ⏭️ Measure |

### Component Targets

| Metric | Target | Current (Critical) | Target Met? |
|--------|--------|--------------------|-------------|
| Total components | < 200 | ~500+ | ❌ |
| State updates/sec | < 10 | 30-60 | ❌ |
| Render time | < 16ms | ~25ms | ❌ |
| Bundle size | < 500KB | - | ⏭️ Measure |

---

## Testing Checklist

### Before Merging PRs

- [ ] Run performance profiler
- [ ] Check INP < 200ms
- [ ] Verify no continuous rendering
- [ ] Test with 100+ shapes
- [ ] Test with multiple users (5+)
- [ ] Check bundle size increase < 10%
- [ ] Run Lighthouse
- [ ] Review Chrome Performance tab

### Specific Tool Testing

#### Spray Tool
- [ ] No lag during spraying
- [ ] Preview renders at 60fps
- [ ] Committed shape is single image
- [ ] Works with 10+ sprays on canvas
- [ ] INP < 100ms after spray action

#### Pencil Tool
- [ ] Smooth 60fps drawing
- [ ] No stuttering during fast movement
- [ ] Path simplification works
- [ ] Points reduced by 50-70%
- [ ] INP < 100ms after path completion

---

## Communication Plan

### Stakeholders to Inform

1. **Product Team**: Features delayed but performance critical
2. **Design Team**: May need to adjust tool behavior
3. **QA Team**: New test scenarios for performance
4. **Engineering Team**: Architectural decisions and lessons learned

### Message

```
Subject: Performance Issue Resolution - critical/performance-issues branch

Team,

We've identified and analyzed a critical performance regression in the 
critical/performance-issues branch:

Key Findings:
- Branch is 12.8X SLOWER than develop (973ms vs 76ms INP)
- Root cause: Architectural mismatch between React and high-frequency tools
- All optimization attempts made performance worse

Actions:
✅ Reverting to develop branch immediately
⏭️ Redesigning spray/pencil tools with Canvas API
⏭️ Adding performance monitoring to prevent future regressions

Timeline:
- Revert: Complete (1 minute)
- Tool redesign: 3-5 days
- Performance monitoring: 1-2 days

See full analysis in:
- PERFORMANCE_EXECUTIVE_SUMMARY.md (quick read)
- PERFORMANCE_ANALYSIS.md (technical details)

Questions? Reach out to [your name]
```

---

## Risk Mitigation

### Potential Issues

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Users expect spray/pencil tools | Medium | High | Communicate timeline for proper implementation |
| Other branches depend on critical branch | Low | Medium | Check for dependencies before reverting |
| UserSelectionsContext needed | Medium | Low | Cherry-pick that commit to develop |
| Performance still slow after fixes | Low | High | Have Zustand migration ready as backup |

---

## Resources

### Documentation
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Canvas API Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)
- [Web Performance Best Practices](https://web.dev/performance/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

### Tools
- Chrome DevTools Performance Tab
- React DevTools Profiler
- Lighthouse CI
- Web Vitals Extension

---

## Conclusion

### What We Learned

1. ✅ Profile before optimizing
2. ✅ Test every change
3. ✅ Architecture > tactics
4. ✅ Memoization isn't free
5. ✅ React Context isn't for high-frequency updates

### Next Steps

1. ✅ Revert to develop (done)
2. ⏭️ Redesign tools with Canvas API
3. ⏭️ Add performance monitoring
4. ⏭️ Set up performance budgets
5. ⏭️ Consider Zustand if needed

**Status**: Ready to proceed with action plan

**Timeline**: 
- Immediate: Revert complete
- Week 1: Tool redesign
- Week 2: Monitoring + budgets
- Week 3: Zustand (if needed)

**Owner**: Engineering team  
**Reviewers**: Tech lead, Product manager

---

**Created**: After comprehensive performance analysis  
**Last Updated**: After Test #7 (develop branch)  
**Status**: Ready for execution

