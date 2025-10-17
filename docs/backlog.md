# Backlog

## UX Enhancements

### Apply Zoom Intelligence to User Cursors
**Estimated time:** 20 minutes
**Priority:** Nice-to-have polish

**Goal:**
Apply the same zoom-scaling logic used for resize handles to user cursors, so they maintain consistent screen size regardless of zoom level.

**Reference Implementation:**
See resize handle implementation in `collabcanvas/src/components/Canvas/Canvas.tsx` (lines 571-576):
```typescript
// Scale handles inversely with zoom so they appear constant size on screen
const baseSize = 16; // Base size in pixels
const hoverSize = 20; // Hover size in pixels
const scaledBaseSize = baseSize / stageScale;
const scaledHoverSize = hoverSize / stageScale;
const halfBase = scaledBaseSize / 2;
```

**Files to Modify:**
- `collabcanvas/src/components/Collaboration/Cursor.tsx` - Apply scale factor to cursor size
- `collabcanvas/src/components/Collaboration/CursorLayer.tsx` - Pass stageScale to Cursor components

**Implementation:**
```typescript
// In CursorLayer.tsx, pass stageScale prop from parent
<Cursor 
  cursor={cursor} 
  scale={1 / stageScale}  // Inverse scale for consistent screen size
/>

// In Cursor.tsx, apply scale to all elements
const cursorSize = 20 * scale;
const labelFontSize = 12 * scale;
const strokeWidth = 2 * scale;
```

**Test Gate:**
1. Open canvas with multiple users
2. Zoom in/out (scroll wheel)
3. Verify user cursors stay same screen size
4. Verify usernames stay readable at all zoom levels
5. Test with zoomed out (0.5x) and zoomed in (2x)

**Success Criteria:**
- Cursors maintain consistent visual size across zoom levels
- Usernames remain readable
- No performance impact
- Works for all active users simultaneously

---

## Bug Fixes / Polish

### Fix Resize Ghosting on Rotated Shapes
**Estimated time:** 1-2 hours
**Priority:** Polish (cosmetic issue, doesn't affect functionality)

**Issue:**
When resizing a rotated shape and releasing the mouse, there's a brief visual artifact where a "ghost" preview appears at another location on the canvas momentarily. The shape always ends up at the correct final position, but the transition isn't smooth.

**Important Note:**
- ✅ This issue **does NOT occur in production** (Vercel deployment)
- ⚠️ Only manifests on localhost during development
- Likely caused by local dev server behavior, HMR, or development-only timing quirks
- **No production fix needed** - this is a localhost-only development artifact

**Root Cause (Localhost-specific):**
Timing gap between:
1. Clearing resize preview state (immediate)
2. Firestore write completing (async)
3. Real-time listener receiving update and re-rendering (async)

This creates a few frames where the shape reverts to its old dimensions before updating to the new ones.

**Potential Solutions:**

**Option 1: Optimistic Local Cache**
- Implement local state cache that updates immediately on resize end
- Keep cache updated until Firestore confirms the change
- Use cached values for rendering during the gap
- Pros: Seamless UX, no visual artifacts
- Cons: More complex state management, need cache invalidation logic

**Option 2: Transition Animation**
- Add CSS/Konva animation between old and new dimensions
- Smooth out the visual jump with 100-200ms transition
- Pros: Simple to implement, masks the issue elegantly
- Cons: Slight delay in visual feedback

**Option 3: Extended Preview Hold**
- Keep preview visible for 50-100ms after mouse release
- Only clear preview after Firestore confirms or timeout
- Pros: Minimal code change, bridges the gap naturally
- Cons: May feel slightly laggy, doesn't fully solve the issue

**Option 4: Firestore Pending State**
- Use Firestore's pending/committed state tracking
- Show preview until write is confirmed committed
- Pros: Leverages built-in Firebase features
- Cons: Requires understanding Firestore's pending state API

**Recommended Approach:**
Start with Option 3 (extended preview hold) as a quick fix, then consider Option 1 (optimistic cache) if polish is needed for production.

**Files to Modify:**
- `collabcanvas/src/components/Canvas/Canvas.tsx` - handleResizeEnd function

**Test Gate:**
1. Create and rotate a shape to 45°
2. Resize it using any handle
3. Release mouse
4. Verify no visual artifacts or "ghost" previews appear
5. Verify shape ends up at correct final size/position
6. Test with various network conditions (throttled, slow 3G)

---

### Fix Grouped Shapes Splitting During Z-Index Operations (Keyboard Shortcuts)
**Estimated time:** 2-3 hours
**Priority:** Medium (functional issue affecting grouped shapes)
**Status:** Partial fix implemented, needs further testing/refinement

**Issue:**
When using keyboard shortcuts (Cmd/Ctrl+] for Bring Forward, Cmd/Ctrl+[ for Send Backward) on grouped shapes, the shapes split up and end up on different z-layers. The toolbar buttons work correctly, but keyboard shortcuts don't maintain the group's layer cohesion.

**Example Scenario:**
1. Create shapes 1, 2, 3, 4 on canvas
2. Group shapes 1 and 4 together
3. Place grouped shapes on top of shapes 2, 3, 4
4. Use keyboard shortcuts to move up/down (Cmd/Ctrl+] or Cmd/Ctrl+[)
5. **Bug**: Grouped shapes split apart and end up on different z-layers
6. **Expected**: Grouped shapes should stay together as a unit (like toolbar buttons do)

**Root Cause:**
When shapes are grouped, they may have non-consecutive z-indices (e.g., shape 1 at z:3, shape 4 at z:0). The `batchBringForward` and `batchSendBackward` methods process overlapping shapes, but grouped shapes with large z-index gaps aren't truly "together" in the z-order stack, causing them to split during operations.

**Attempted Solution (Needs Testing):**
Modified `groupShapes()` to automatically reassign grouped shapes to consecutive z-indices:
- Get max z-index in canvas
- Assign grouped shapes consecutive z-indices starting from max + 1
- Preserves relative order within group
- Creates a new "layer" where group lives together

Also rewrote `batchBringForward()` and `batchSendBackward()` to:
- Move all selected shapes by the same z-index offset
- Find closest overlapping shape and swap with only ONE target
- Added `shapesOverlap()` helper for 2D overlap detection
- Added debug logging for troubleshooting

**Files Modified:**
- `collabcanvas/src/services/canvasService.ts`
  - `groupShapes()` - assigns consecutive z-indices when grouping
  - `batchBringForward()` - moves shapes together as unit
  - `batchSendBackward()` - moves shapes together as unit
  - `shapesOverlap()` - helper for overlap detection

**Files That Call These Methods:**
- `collabcanvas/src/components/Canvas/Canvas.tsx` - keyboard shortcuts handler
- `collabcanvas/src/components/Layout/AppShell.tsx` - toolbar button handlers

**Testing Needed:**
1. Create 4 shapes on canvas with various overlaps
2. Group non-adjacent shapes (e.g., 1 and 4)
3. Verify they jump to new layer with consecutive z-indices (check console logs)
4. Place group on top of other shapes
5. Use Cmd/Ctrl+] repeatedly - verify group stays together
6. Use Cmd/Ctrl+[ repeatedly - verify group stays together
7. Compare behavior with toolbar buttons - should match
8. Test with multiple overlapping shapes
9. Test with shapes that don't overlap (edge case)
10. Test ungrouping and re-grouping

**Known Issues:**
- Solution may cause visual jump when grouping (shapes move to top layer)
- May need refinement for complex overlap scenarios
- Debug logging should be removed before production

**Alternative Approaches to Consider:**
1. Keep current z-indices but force grouped shapes to share same relative z-offset
2. Track "group z-index" separately from individual shape z-indices
3. Implement z-index normalization after each operation
4. Use fractional z-indices to maintain sub-layer ordering

**Success Criteria:**
- Grouped shapes maintain layer cohesion during keyboard z-index operations
- Behavior matches toolbar button behavior exactly
- No visual artifacts or unexpected jumps (beyond initial grouping)
- Works with nested groups (if supported)
- Real-time sync works correctly across users

---

