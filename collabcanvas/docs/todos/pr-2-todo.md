# PR-2 TODO — Spray Paint Tool

**Branch**: `feat/pr-2-spray-paint-tool`  
**Source PRD**: `collabcanvas/docs/prds/pr-2-prd.md`  
**Owner (Agent)**: Delilah

---

## 0. Clarifying Questions & Assumptions

**Questions:**
- None - all requirements clear from PRD and PR brief

**Assumptions:**
- Using existing Firestore infrastructure (no new collections needed)
- Sprays stored as standard shapes in `canvases/main/shapes` collection
- Particle generation at 5 particles per frame (30 FPS = ~150 particles/second)
- Default spray radius of 20px
- Default particle size of 2px
- Keyboard shortcut 'S' follows existing pattern
- Particles stored as array of objects with x, y, size properties
- Random scatter within circular area using uniform distribution

---

## 1. Repo Prep

- [ ] Create branch `feat/pr-2-spray-paint-tool`
- [ ] Confirm env, emulators, and test runner
- [ ] Read all context docs (PRD, architecture, PR #1 for reference)

---

## 2. Service Layer (deterministic contracts)

- [ ] Update ShapeData interface to include 'spray' type
  - Test Gate: TypeScript compilation passes
  
- [ ] Add `particles?: Array<{x: number, y: number, size: number}>` field to ShapeData
  - Test Gate: TypeScript compilation passes
  
- [ ] Add `sprayRadius?: number` field to ShapeData (default: 20)
  - Test Gate: TypeScript compilation passes
  
- [ ] Add `particleSize?: number` field to ShapeData (default: 2)
  - Test Gate: TypeScript compilation passes
  
- [ ] Implement `createSpray()` method in canvasService
  - Test Gate: Unit test passes for valid spray creation
  - Test Gate: Unit test passes for invalid input rejection
  - Test Gate: Spray saved to Firestore with correct structure
  - Test Gate: Bounding box correctly calculated from particle positions
  
- [ ] Implement `updateSpray()` stub for future use
  - Test Gate: Method exists and compiles

---

## 3. Data Model & Rules

- [ ] Spray shape includes all required fields
  - Test Gate: Firestore document has type, particles, sprayRadius, particleSize, color, x, y, width, height
  
- [ ] Bounding box calculated from particle positions
  - Test Gate: x, y, width, height correctly computed from min/max particle positions
  
- [ ] Existing Firestore rules work for spray shapes
  - Test Gate: Users can create/read/update/delete their sprays

---

## 4. UI Components

- [ ] Create spray particle generation utility (`src/utils/sprayHelpers.ts`)
  - Test Gate: `generateSprayParticles()` generates particles within circular area
  - Test Gate: Particles distributed randomly (uniform distribution)
  - Test Gate: Correct number of particles generated based on density
  - Test Gate: Particle positions relative to center point
  
- [ ] Add spray constants to `src/utils/constants.ts`
  - Test Gate: DEFAULT_SPRAY_RADIUS, MIN_SPRAY_RADIUS, MAX_SPRAY_RADIUS defined
  - Test Gate: DEFAULT_PARTICLE_SIZE, DEFAULT_SPRAY_DENSITY defined
  
- [ ] Add spray paint tool button to `src/components/Canvas/ToolPalette.tsx`
  - Test Gate: Button renders with spray can icon (💨)
  - Test Gate: Clicking button sets activeTool='spray'
  - Test Gate: Active state shows visual highlight
  
- [ ] Add spray rendering to `src/components/Canvas/CanvasShape.tsx`
  - Test Gate: Spray type renders as collection of Konva Circle components
  - Test Gate: Particles use correct color and size
  - Test Gate: Spray supports selection, lock indicators
  - Test Gate: Spray respects rotation (particles rotate around center)
  - Test Gate: Performance acceptable with 500+ particles per spray
  
- [ ] Add spraying handlers to `src/components/Canvas/Canvas.tsx`
  - Test Gate: Mouse down starts particle generation
  - Test Gate: Mouse move continues particle generation (spray trail)
  - Test Gate: Mouse up finalizes and saves spray
  - Test Gate: Preview renders in real-time during spraying
  - Test Gate: Spray radius cursor visible during tool use
  - Test Gate: Particles generated at correct density (5 per frame)
  
- [ ] Add keyboard shortcut (S key) to Canvas.tsx
  - Test Gate: Pressing 'S' activates spray tool
  
- [ ] Update CanvasContext to support spray tool
  - Test Gate: activeTool type includes 'spray'
  - Test Gate: createSpray() method available in context
  - Test Gate: sprayRadius state managed (default: 20)
  - Test Gate: sprayDensity state managed (default: 5)

---

## 5. Integration & Realtime

- [ ] Spray creation syncs to Firestore
  - Test Gate: Spray document created in `canvases/main/shapes/{id}`
  
- [ ] Spray updates sync to all users
  - Test Gate: 2-browser test shows <100ms sync
  
- [ ] Multiple users can spray simultaneously
  - Test Gate: No conflicts when 2 users spray at same time

---

## 6. Tests

### a) User Simulation ("does it click")

- [ ] Click spray tool button → tool activates
- [ ] Spray on canvas → spray created with particles
- [ ] Press 'S' key → tool activates
- [ ] Select spray → spray highlights
- [ ] Move spray → spray moves (all particles move together)
- [ ] Rotate spray → spray rotates around center
- [ ] Delete spray → spray removed

### b) Logic Tests

- [ ] Spray saves to Firestore with correct structure
- [ ] Spray syncs in <100ms
- [ ] Particle generation creates correct density
- [ ] Particles distributed within circular area (radius check)
- [ ] Bounding box calculated correctly from particles
- [ ] Invalid particles array rejected
- [ ] Very short spray (single click) handled gracefully
- [ ] Very long spray (1000+ particles) stored efficiently

### c) Visual Tests

- [ ] Spray renders with correct color
- [ ] Particles render at correct size
- [ ] Spray respects z-index ordering
- [ ] Spray can be selected and shows selection indicator
- [ ] Spray shows lock indicator when locked
- [ ] Spray radius cursor visible during spraying
- [ ] Particles appear natural (random scatter)

---

## 7. Performance

- [ ] 60 FPS during spraying with 0 shapes
- [ ] 60 FPS during spraying with 50+ shapes
- [ ] Particle generation completes efficiently (doesn't block UI)
- [ ] Firestore sync completes in <100ms (95th percentile)
- [ ] Rendering spray with 500+ particles at 60 FPS

---

## 8. Docs & PR

- [x] Create PRD (`collabcanvas/docs/prds/pr-2-prd.md`)
- [x] Create TODO (`collabcanvas/docs/todos/pr-2-todo.md`)
- [ ] Update TODO with test results
- [ ] Write PR description with:
  - Goal and scope
  - Files changed and rationale
  - Test steps (happy path, edge cases, multi-user, perf)
  - Known limitations and follow-ups
  - Links to PRD and TODO
  - Screenshots/GIFs of spray tool in action
- [ ] Open PR targeting agents/first-round branch

---

## Copyable Checklist (for PR description)

- [ ] Branch created (feat/pr-2-spray-paint-tool)
- [ ] Services implemented (createSpray, updateSpray stub)
- [ ] Service unit tests pass (100%)
- [ ] UI implemented (tool button, spraying, rendering)
- [ ] Spray particle generation utility implemented and tested
- [ ] Integration tests pass (user simulation + state inspection)
- [ ] Multi-user tests pass (2 users spraying simultaneously)
- [ ] Realtime verified (<100ms sync)
- [ ] Performance target met (60 FPS with 50+ shapes)
- [ ] Keyboard shortcut works (S key)
- [ ] All acceptance gates pass (25/25)
- [ ] No console errors
- [ ] Docs updated (PRD, TODO)

---

## Notes

### Particle Generation Algorithm
- Use polar coordinates for uniform distribution within circle
- Random angle: `θ = random() * 2π`
- Random radius: `r = sqrt(random()) * sprayRadius` (square root for uniform density)
- Convert to Cartesian: `x = r * cos(θ)`, `y = r * sin(θ)`
- Particles stored relative to spray's bounding box origin

### Storage Strategy
- Group all particles from one spray stroke into single Firestore document
- Particles array: `[{x: number, y: number, size: number}, ...]`
- Calculate bounding box: `minX, minY, maxX, maxY` from all particles
- Store particles with positions relative to (x, y) origin

### Rendering Strategy
- Map particles to Konva Circle components
- Consider using Konva Group for performance with many particles
- Apply color and rotation at spray level (transform entire group)
- Selection and lock indicators applied to bounding box

### Performance Considerations
- Throttle particle generation to 30 FPS (16ms intervals minimum)
- Limit particles per spray stroke (soft cap at ~1000 particles)
- Use efficient random number generation (Math.random() is fine)
- Batch Firestore writes (single document write per spray stroke)

---

## Technical Implementation Details

### Canvas.tsx Changes
```typescript
// Add state for spray tool
const [isSpraying, setIsSpraying] = useState(false);
const [currentSprayParticles, setCurrentSprayParticles] = useState<Array<{x, y, size}>>([]);
const lastSprayTimeRef = useRef(0);

// Mouse down handler
const handleSprayMouseDown = (e) => {
  if (activeTool !== 'spray') return;
  setIsSpraying(true);
  generateSprayParticles(e.evt.clientX, e.evt.clientY);
};

// Mouse move handler (throttled to 30 FPS)
const handleSprayMouseMove = (e) => {
  if (!isSpraying) return;
  const now = Date.now();
  if (now - lastSprayTimeRef.current < 33) return; // 30 FPS throttle
  lastSprayTimeRef.current = now;
  generateSprayParticles(e.evt.clientX, e.evt.clientY);
};

// Mouse up handler
const handleSprayMouseUp = async () => {
  if (!isSpraying) return;
  setIsSpraying(false);
  await createSpray(currentSprayParticles, selectedColor, sprayRadius, particleSize);
  setCurrentSprayParticles([]);
};
```

### sprayHelpers.ts Structure
```typescript
export function generateSprayParticles(
  centerX: number,
  centerY: number,
  radius: number,
  density: number,
  particleSize: number
): Array<{x: number, y: number, size: number}> {
  const particles = [];
  for (let i = 0; i < density; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const r = Math.sqrt(Math.random()) * radius;
    const x = centerX + r * Math.cos(angle);
    const y = centerY + r * Math.sin(angle);
    particles.push({ x, y, size: particleSize });
  }
  return particles;
}

export function calculateParticleBoundingBox(
  particles: Array<{x: number, y: number, size: number}>
): { x: number, y: number, width: number, height: number } {
  if (particles.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  
  const xs = particles.map(p => p.x);
  const ys = particles.map(p => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

export function makeParticlesRelative(
  particles: Array<{x: number, y: number, size: number}>,
  originX: number,
  originY: number
): Array<{x: number, y: number, size: number}> {
  return particles.map(p => ({
    x: p.x - originX,
    y: p.y - originY,
    size: p.size
  }));
}
```

---

## Dependencies

**Builds on:**
- PR #1 (Pencil Tool) - established pattern for custom drawing tools

**No blocking dependencies** - all infrastructure exists

---

## Estimated Complexity

**Medium** (~2-3 hours)

**Breakdown:**
- Service layer + data model: 30 min
- Spray particle generation utility: 30 min
- UI components (tool button, handlers): 45 min
- Rendering (particle circles): 30 min
- Testing (unit + integration): 45 min
- Documentation + PR: 30 min

---

## Success Criteria

**Spray tool is complete when:**
- ✅ Tool button in palette, activates with 'S' key
- ✅ Clicking/dragging generates particles in circular area
- ✅ Particles appear natural (random scatter)
- ✅ Spray saves to Firestore with correct structure
- ✅ Spray syncs to all users in <100ms
- ✅ Spray can be selected, moved, rotated, deleted
- ✅ Maintains 60 FPS with 50+ shapes
- ✅ All 25 acceptance gates pass
- ✅ No console errors or warnings

---

