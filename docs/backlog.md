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

**Root Cause:**
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

