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

