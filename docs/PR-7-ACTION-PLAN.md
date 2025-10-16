# PR #7: Object Grouping & Z-Index Management - Action Plan

## Overview
This PR implements object grouping functionality and z-index management for shape layering in the collaborative canvas application.

## Status: ✅ IMPLEMENTATION COMPLETE

All core features have been implemented. Ready for testing and verification.

---

## Implementation Summary

### 1. Database Schema Updates ✅

**Files Modified:**
- `collabcanvas/src/services/canvasService.ts`

**Changes:**
- Added `GroupData` interface for group documents:
  ```typescript
  interface GroupData {
    id: string;
    name: string;
    shapeIds: string[];
    createdBy: string;
    createdAt: Timestamp | null;
  }
  ```
- Updated `ShapeData` interface with:
  - `groupId: string | null` - References the group this shape belongs to
  - `zIndex: number` - Stacking order (default: 0)
- Updated `ShapeCreateInput` type to make `groupId` and `zIndex` optional (default values provided by service)
- All shape creation methods (`createShape`, `createText`, `createCircle`, `createTriangle`) now initialize `groupId: null` and `zIndex: 0`

**Firestore Collections:**
- `canvases/main/groups` - Stores group metadata
- `canvases/main/shapes` - Updated to include `groupId` and `zIndex` fields

---

### 2. Service Layer - Grouping ✅

**Files Modified:**
- `collabcanvas/src/services/canvasService.ts`

**Methods Added:**

#### `groupShapes(shapeIds: string[], userId: string, name?: string): Promise<string>`
- Creates a new group document in Firestore
- Updates all specified shapes with the group ID using batch write
- Returns the new group ID
- Validates at least 2 shapes are selected
- Generates default name if not provided: `"Group {id}"`

#### `ungroupShapes(groupId: string): Promise<void>`
- Retrieves group document
- Clears `groupId` from all member shapes using batch write
- Deletes the group document
- All operations are atomic

#### `getGroup(groupId: string): Promise<GroupData | null>`
- Retrieves group data by ID
- Returns null if group doesn't exist

---

### 3. Service Layer - Z-Index ✅

**Files Modified:**
- `collabcanvas/src/services/canvasService.ts`

**Methods Added:**

#### `bringToFront(shapeId: string): Promise<void>`
- Sets shape's zIndex to `max(all zIndexes) + 1`
- Brings shape to the topmost layer

#### `sendToBack(shapeId: string): Promise<void>`
- Sets shape's zIndex to `min(all zIndexes) - 1`
- Sends shape to the bottommost layer

#### `bringForward(shapeId: string): Promise<void>`
- Increments shape's zIndex by 1
- Moves shape one layer up

#### `sendBackward(shapeId: string): Promise<void>`
- Decrements shape's zIndex by 1
- Moves shape one layer down

---

### 4. Context Layer Integration ✅

**Files Modified:**
- `collabcanvas/src/contexts/CanvasContext.tsx`

**Changes:**
- Added grouping methods to `CanvasContextType` interface
- Added z-index methods to `CanvasContextType` interface
- Implemented wrapper functions that delegate to `canvasService`
- Exposed all new methods to consuming components

**New Context Methods:**
- `groupShapes(shapeIds, userId, name?)`
- `ungroupShapes(groupId)`
- `bringToFront(shapeId)`
- `sendToBack(shapeId)`
- `bringForward(shapeId)`
- `sendBackward(shapeId)`

---

### 5. Canvas Rendering - Z-Index Support ✅

**Files Modified:**
- `collabcanvas/src/components/Canvas/Canvas.tsx`

**Changes:**
- Shapes are now sorted by zIndex before rendering:
  ```typescript
  shapes
    .slice()
    .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
    .map((shape) => ...)
  ```
- Lower zIndex shapes render first (appear behind)
- Higher zIndex shapes render last (appear in front)
- Default zIndex of 0 ensures backward compatibility

---

### 6. Group Selection Behavior ✅

**Files Modified:**
- `collabcanvas/src/components/Canvas/Canvas.tsx`

**Changes:**
- Updated `handleShapeMouseDown` function
- When clicking a shape that belongs to a group:
  1. Finds all shapes with the same `groupId`
  2. Selects entire group automatically
  3. Displays toast: "Selected group (N shapes)"
  4. All group members can be moved together
- Shift+click on grouped shape allows individual selection (multi-select mode)
- Group selection is synchronized across users via existing selection service

**User Experience:**
- Click one grouped shape → entire group selected
- Drag one grouped shape → entire group moves together
- Delete with group selected → all members deleted
- Duplicate with group selected → all members duplicated

---

### 7. UI Controls - Grouping ✅

**Files Modified:**
- `collabcanvas/src/components/Canvas/ToolPalette.tsx`
- `collabcanvas/src/components/Layout/AppShell.tsx`

**New UI Elements:**

#### Group Button (🔗)
- **Visibility:** Shows when 2+ shapes are selected
- **Action:** Creates a group from selected shapes
- **Tooltip:** "Group N shapes"

#### Ungroup Button (⛓️‍💥)
- **Visibility:** Shows when selected shapes belong to a group
- **Action:** Dissolves the group, shapes become independent
- **Tooltip:** "Ungroup shapes"

**Handler Functions (AppShell.tsx):**
- `handleGroup()` - Calls `groupShapes()` with selected shape IDs
- `handleUngroup()` - Finds groupId from selection and calls `ungroupShapes()`
- Both display success/error toasts

---

### 8. UI Controls - Z-Index ✅

**Files Modified:**
- `collabcanvas/src/components/Canvas/ToolPalette.tsx`
- `collabcanvas/src/components/Layout/AppShell.tsx`

**New UI Elements:**

Z-Index controls appear in a 2x2 grid when shape(s) are selected:

**Row 1:**
- **Bring to Front (⬆️🔝)** - Sets zIndex to max+1
- **Send to Back (⬇️⬇️)** - Sets zIndex to min-1

**Row 2:**
- **Bring Forward (⬆️)** - Increments zIndex by 1
- **Send Backward (⬇️)** - Decrements zIndex by 1

**Handler Functions (AppShell.tsx):**
- `handleBringToFront()` - Brings selected shape to front
- `handleSendToBack()` - Sends selected shape to back
- `handleBringForward()` - Moves selected shape forward one layer
- `handleSendBackward()` - Moves selected shape backward one layer
- All display success/error toasts

**Styling:**
- Compact button design (`zIndexButton` style)
- Fits within ToolPalette vertical layout
- Consistent with existing Paint-style UI

---

## Technical Details

### Batch Operations
- Group creation uses `writeBatch()` for atomic updates
- All shapes in a group are updated simultaneously
- Prevents partial group states

### Type Safety
- `ShapeCreateInput` type updated with optional `groupId` and `zIndex`
- `GroupData` interface fully typed
- All service methods have proper return types

### Backward Compatibility
- Existing shapes default to `zIndex: 0` and `groupId: null`
- No migration needed - defaults applied at creation
- Existing code continues to work without changes

---

## Testing Checklist

Based on the PR requirements from `docs/task.md`:

### Grouping Features
- [ ] Can group 2+ selected shapes
- [ ] Group button appears when 2+ shapes selected
- [ ] Ungroup button appears when grouped shapes selected
- [ ] Click one group member → selects entire group
- [ ] Grouped shapes show shared dashed border (visual distinction exists via multi-select)
- [ ] Move group → all members move together
- [ ] Delete group → all members deleted
- [ ] Duplicate group → all members duplicated
- [ ] User A groups shapes → User B sees grouped behavior

### Z-Index Features
- [ ] Shapes render in correct z-index order
- [ ] Bring to Front button works
- [ ] Send to Back button works
- [ ] Bring Forward button works
- [ ] Send Backward button works
- [ ] User A changes z-index → User B sees layer change
- [ ] Overlapping shapes render in correct order

### General
- [ ] No console errors
- [ ] Deployed and tested in production

---

## Files Changed

### Core Service Layer
- `collabcanvas/src/services/canvasService.ts` - Added grouping and z-index methods

### Context Layer
- `collabcanvas/src/contexts/CanvasContext.tsx` - Exposed new methods to components

### UI Components
- `collabcanvas/src/components/Canvas/Canvas.tsx` - Group selection logic, z-index sorting
- `collabcanvas/src/components/Canvas/ToolPalette.tsx` - UI controls for grouping and z-index
- `collabcanvas/src/components/Layout/AppShell.tsx` - Handler functions for new operations

---

## Next Steps

### 1. Local Testing
```bash
cd collabcanvas
npm run dev
```

**Test Scenarios:**
1. Create 3 shapes → Select all → Click Group button → Verify all selected
2. Click one grouped shape → Verify entire group selected
3. Drag one grouped shape → Verify all move together
4. Click Ungroup → Verify shapes become independent
5. Create overlapping shapes → Test all z-index buttons
6. Open in 2 browsers → Verify grouping syncs across users
7. Open in 2 browsers → Verify z-index changes sync across users

### 2. Manual Verification
- Check Firestore console for `groups` collection structure
- Verify `groupId` and `zIndex` fields in shape documents
- Confirm batch operations are atomic (no partial states)

### 3. Multi-User Testing
- Open app in 2+ browsers with different users
- Test grouping behavior syncs correctly
- Test z-index changes sync correctly
- Verify selection locking still works with groups

### 4. Deployment
```bash
# From collabcanvas directory
npm run build
firebase deploy
```

### 5. Production Verification
- Test all checklist items in production environment
- Monitor Firestore for any errors
- Check browser console for errors

---

## Z-Index Implementation Deep Dive

### The Problem We Solved

**Old Behavior (Buggy):**
- All new shapes started at `zIndex: 0`
- `bringForward` blindly incremented by 1
- `sendBackward` blindly decremented by 1

**The Bug:**
If you had 3 shapes all at `zIndex: 0`:
1. Click "bring forward" on Shape A → goes to `zIndex: 1` (now on top) ✅
2. Click "bring forward" on Shape A again → goes to `zIndex: 2` (no visual change!) ❌
3. Click "bring forward" on Shape B → goes to `zIndex: 1` (behind A, not on top) ⚠️

This caused a "double-click" issue where users had to click multiple times to see any change.

### The Solution: Auto-Incrementing + Swapping

#### 1. Shape Creation Auto-Increment
Each new shape gets `zIndex = max(all zIndexes) + 1`:
```typescript
const shapes = await this.getShapes();
const maxZIndex = shapes.length > 0 ? Math.max(...shapes.map(s => s.zIndex || 0)) : -1;
const zIndex = maxZIndex + 1;
```

**Result:**
- First shape: `zIndex: 0`
- Second shape: `zIndex: 1`
- Third shape: `zIndex: 2`
- Each shape has a unique layer position

#### 2. Bring Forward (Swap Algorithm)
Finds the shape immediately above and swaps z-indices:
```typescript
const shapesAbove = shapes
  .filter(s => (s.zIndex || 0) > currentZIndex)
  .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

if (shapesAbove.length > 0) {
  // Swap z-indices with the shape immediately above
  // Uses writeBatch for atomic update
}
```

**Result:** Each click moves the shape exactly one visible layer up.

#### 3. Send Backward (Swap Algorithm)
Finds the shape immediately below and swaps z-indices:
```typescript
const shapesBelow = shapes
  .filter(s => (s.zIndex || 0) < currentZIndex)
  .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));

if (shapesBelow.length > 0) {
  // Swap z-indices with the shape immediately below
  // Uses writeBatch for atomic update
}
```

**Result:** Each click moves the shape exactly one visible layer down.

### Benefits
✅ **Predictable:** Every click produces a visible change (or clear "already at top/bottom" message)  
✅ **Atomic:** Batch operations prevent race conditions in multi-user environment  
✅ **Simple:** Unique z-indices for each shape, easy to debug  
✅ **Performant:** No normalization needed unless z-indices grow extremely large  

### Performance Note
Each shape creation calls `getShapes()` to find max z-index. For typical canvases (< 1000 shapes), this is negligible. Future optimization could cache max z-index if needed.

---

## Known Considerations

### Group Duplication
- When duplicating grouped shapes, the duplicates are NOT grouped
- This is intentional - duplicates are independent by default
- Users can manually group duplicates if desired

### Z-Index Range
- Z-index can grow unbounded (positive and negative)
- This is acceptable for canvas use cases
- The swap algorithm ensures predictable behavior regardless of range

### Group Deletion
- Deleting a group document doesn't automatically delete shapes
- Shapes just lose their `groupId` reference
- This is safe - orphaned shapes remain on canvas

### Selection Synchronization
- Group selection uses existing `selectedShapes` array
- Synced across users via `selectionService`
- Works seamlessly with existing multi-select infrastructure

### Duplicate Shape Z-Index
- Duplicated shapes automatically get the highest z-index (appear on top)
- No explicit zIndex passed to `createShape` - it auto-increments
- This matches expected user behavior

---

## Visual Reference

### ToolPalette Layout (Top to Bottom)
1. Tools (Select, Pan, Rectangle, etc.)
2. Color Display
3. **Shape Actions** (Duplicate, Delete)
4. **Group Button** (when 2+ shapes selected)
5. **Ungroup Button** (when grouped shapes selected)
6. **Z-Index Controls** (2x2 grid, when shape(s) selected)
7. Text Formatting (Bold, Italic, Underline, Font Size)

### Z-Index Controls Layout
```
┌─────────────────┐
│ ⬆️🔝   ⬇️⬇️      │  Row 1: To Front | To Back
│ ⬆️     ⬇️       │  Row 2: Forward  | Backward
└─────────────────┘
```

---

## Success Metrics

✅ All TODO items completed  
✅ Zero linter errors  
✅ Type-safe implementation  
✅ Backward compatible  
✅ Multi-user ready  
⏳ Testing in progress  

---

## Questions or Issues?

If you encounter any issues during testing:

1. Check browser console for errors
2. Check Firestore console for data structure
3. Verify all shapes have `groupId` and `zIndex` fields
4. Test with Firebase emulator first if available
5. Review `canvasService.ts` logs for operation status

---

## Conclusion

PR #7 implementation is **complete** and ready for testing. All core features for object grouping and z-index management have been implemented following the specifications in `docs/task.md` sections 7 & 8.

The implementation:
- ✅ Maintains backward compatibility
- ✅ Uses atomic batch operations for consistency
- ✅ Integrates with existing multi-user infrastructure
- ✅ Follows established code patterns
- ✅ Includes proper error handling and user feedback
- ✅ Has zero linter errors

Ready to proceed with testing and deployment! 🚀

