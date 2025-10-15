# CollabCanvas Phase 2 – Development Task List

---

## How to Use This Task List

### Workflow for Each PR:

**Step 1: Generate Action Plan**
```
You: "Begin implementation on PR #1"

AI should:
1. Create `docs/PR-N-ACTION-PLAN.md` with:
   - Feature overview (from PRD reference)
   - Files to create/modify
   - Sub-tasks with test gates
   - Integration points with existing code
   - Success criteria
2. Wait for your confirmation before coding
```

**Step 2: You Review & Approve**
- Read the action plan
- Confirm approach makes sense
- Suggest adjustments if needed
- Check for conflicts with existing features

**Step 3: AI Implements**
```
You: "Plan looks good, proceed"

AI implements according to plan, checking off sub-tasks as they complete
```

**Step 4: You Test & Deploy**
- Follow test gates in the action plan
- Test locally with multiple browsers
- Deploy to Vercel: `npm run build && vercel --prod`
- Verify all features work in production
- Confirm no regressions in existing features
- Move to next PR

### Action Plan Template Structure

Each `PR-N-ACTION-PLAN.md` should include:

```markdown
# PR #N: [Feature Name]

## Goal
[One-sentence description of what this accomplishes]

## PRD Reference
[Link to specific section in prd.md]

## Files to Create
- path/to/new/file.tsx - [purpose]

## Files to Modify
- path/to/existing/file.tsx - [what changes]

## Sub-Tasks
1. [Task description]
   - Test Gate: [How to verify this works before proceeding]
2. [Next task]
   - Test Gate: [Verification step]

## Integration Points
- [Existing feature this connects to]
- [Service methods this uses]

## Success Criteria
- [ ] [Specific testable outcome]
- [ ] [Multi-user sync verified]
- [ ] [Performance maintained]
```

---

## Project Context

**Note:** This app lives in `/collabcanvas` subdirectory within the `gauntlet-01` root project. All commands below should be run from the `collabcanvas/` directory unless otherwise specified.

**Prerequisites:** MVP (PRs #0-7) fully working with:
- ✅ Authentication (email/password, username, color)
- ✅ Real-time cursors + presence (RTDB)
- ✅ 5000×5000 canvas with pan/zoom
- ✅ Rectangle creation (click-and-drag)
- ✅ Shape sync (Firestore)
- ✅ Simple locking (first-click wins, 5s timeout)
- ✅ Drag move shapes
- ✅ Deployed to Vercel

**Architecture Reference:**
- **[docs/architecture.md](docs/architecture.md)**: Complete Phase 2 system architecture
  - Full Mermaid diagram with all new components (AI, Controls, Comments)
  - Updated service layer (15 AI tools, grouping, comments)
  - New Firestore collections (groups, comments)
  - Data flow examples (manual ops, AI execution, collaborative comments)
  - Refer to this when designing new components or understanding data flows

**Phase 2 Goal:** Transform MVP into production-ready collaborative design tool with AI assistance. Target score: 96-100 points on rubric.

**Timeline:** 72 hours across 17 PRs in 4 parts.

---

## Part 1: Core Manual Features (PRs #1-5, ~20 hours)

These features establish the foundation for advanced capabilities and AI integration.

---

## PR #1: Resize Shapes

**Branch:** `feature/pr-1-resize-shapes`  
**Goal:** Add 8-handle resize UI with corner (proportional) and edge (single-dimension) controls; real-time sync

> 🚦 **Before starting:** Ask AI to create `docs/PR-1-ACTION-PLAN.md` and wait for your approval

### PRD Reference
See `docs/prd.md` Section 1: "Resize Shapes (P0 - Critical)"

### Tasks

#### 1.1: CanvasService resize method

Add to `src/services/canvasService.ts`:

```typescript
async resizeShape(shapeId: string, width: number, height: number): Promise<void>
```

**Requirements:**
- Validate minimum dimensions (10×10)
- Update Firestore with new width/height
- Add `updatedAt` timestamp
- Throw error if dimensions invalid

**Test Gate:** Call method from console, verify Firestore update

#### 1.2: Resize handles rendering

Create resize handles component logic in `src/components/Canvas/Canvas.tsx`:

**Sub-tasks:**
1. Show 8 handles when shape is locked by current user
   - Test Gate: Lock shape, verify 8 small squares appear at TL, T, TR, L, R, BL, B, BR
2. Style handles: 8×8px white squares, 1px gray border
   - Test Gate: Visual inspection matches design
3. Add hover state: scale to 10×10px, change to blue
   - Test Gate: Hover over handles, confirm visual feedback

#### 1.3: Corner handle resize logic

Implement proportional resize for 4 corner handles:

**Sub-tasks:**
1. Calculate aspect ratio on mousedown
   - Test Gate: Console.log aspect ratio, verify correct
2. During drag, maintain aspect ratio
   - Test Gate: Drag corner, verify width/height change proportionally
3. Handle all 4 corners (TL, TR, BL, BR)
   - Test Gate: Test each corner independently
4. Enforce minimum 10×10
   - Test Gate: Try to make shape tiny, stops at 10×10

#### 1.4: Edge handle resize logic

Implement single-dimension resize for 4 edge handles:

**Sub-tasks:**
1. Top/Bottom handles: resize height only
   - Test Gate: Drag top, width unchanged
2. Left/Right handles: resize width only
   - Test Gate: Drag left, height unchanged
3. Update x/y position when resizing from top/left
   - Test Gate: Shape doesn't jump, opposite edge stays anchored

#### 1.5: Dimension tooltip

Show real-time dimensions during resize:

**Sub-tasks:**
1. Display "200 × 150" tooltip above shape during drag
   - Test Gate: Drag handle, see dimensions update live
2. Hide tooltip on mouseup
   - Test Gate: Release, tooltip disappears

#### 1.6: Persist resize to Firestore

On mouseup, save final dimensions:

**Sub-tasks:**
1. Call `canvasService.resizeShape(shapeId, finalWidth, finalHeight)`
   - Test Gate: Check Firestore, verify new dimensions
2. Other users see resize in <100ms
   - Test Gate: Open 2 browsers, User A resizes, User B sees change

### PR Checklist

- [ ] 8 resize handles appear when shape locked
- [ ] Corner handles resize proportionally (aspect ratio maintained)
- [ ] Edge handles resize single dimension only
- [ ] Minimum 10×10 enforced (toast shown if violated)
- [ ] Dimension tooltip shows during drag
- [ ] User A resizes → User B sees in <100ms
- [ ] No console errors
- [ ] 60 FPS maintained during resize
- [ ] Deployed and tested in production

---

## PR #2: Rotate Shapes

**Branch:** `feature/pr-2-rotate-shapes`  
**Goal:** Add rotation handle with visual feedback; sync rotation across users

> 🚦 **Before starting:** Ask AI to create `docs/PR-2-ACTION-PLAN.md` and wait for your approval

### PRD Reference
See `docs/prd.md` Section 2: "Rotate Shapes (P0 - Critical)"

### Tasks

#### 2.1: Add rotation field to data model

Update shape type in `src/utils/constants.ts` or type definitions:

```typescript
{
  // ... existing fields
  rotation: number;  // Degrees (0-360), default 0
}
```

**Test Gate:** Create new shape, verify `rotation: 0` in Firestore

#### 2.2: CanvasService rotate method

Add to `src/services/canvasService.ts`:

```typescript
async rotateShape(shapeId: string, rotation: number): Promise<void>
```

**Requirements:**
- Normalize rotation to 0-360 range
- Update Firestore
- Add `updatedAt` timestamp

**Test Gate:** Call from console with 405° → verify stored as 45°

#### 2.3: Rotation handle rendering

Add rotation handle UI:

**Sub-tasks:**
1. Show circular handle 30px above shape center when locked
   - Test Gate: Lock shape, see rotation handle appear
2. Style: 12px diameter circle with "↻" icon, connected to shape with thin gray line
   - Test Gate: Visual inspection matches design
3. Cursor changes to rotation cursor on hover
   - Test Gate: Hover over handle, cursor changes

#### 2.4: Rotation calculation logic

Implement rotation drag behavior:

**Sub-tasks:**
1. On mousedown, store initial angle from shape center to cursor
   - Test Gate: Console.log initial angle, verify correct
2. On mousemove, calculate new angle and rotation delta
   - Test Gate: Drag handle, log rotation in degrees
3. Apply rotation to shape in real-time (preview)
   - Test Gate: Shape rotates smoothly during drag
4. Show angle tooltip: "45°"
   - Test Gate: Tooltip displays and updates during drag

#### 2.5: Konva rotation implementation

Update shape rendering to support rotation:

**Requirements:**
- Set `rotation` prop on Konva shape
- Set `offsetX` and `offsetY` to shape width/2, height/2 (rotate around center)
- Adjust `x` and `y` to compensate for offset

**Test Gate:** Shape rotates around its center, not top-left corner

#### 2.6: Persist rotation to Firestore

On mouseup, save final rotation:

**Sub-tasks:**
1. Call `canvasService.rotateShape(shapeId, finalRotation)`
   - Test Gate: Check Firestore, verify rotation value
2. Other users see rotation in <100ms
   - Test Gate: User A rotates 45°, User B sees rotated shape

### PR Checklist

- [ ] Rotation handle appears 30px above locked shape
- [ ] Handle shows "↻" icon with connecting line
- [ ] Dragging handle rotates shape smoothly
- [ ] Angle tooltip shows during drag (e.g., "45°")
- [ ] Shape rotates around center (not corner)
- [ ] Rotation normalized to 0-360 range
- [ ] User A rotates → User B sees in <100ms
- [ ] Rotated shapes can still be moved/resized
- [ ] No console errors
- [ ] Deployed and tested in production

---

## PR #3: Text Layers

**Branch:** `feature/pr-3-text-layers`  
**Goal:** Add text creation tool with click-to-place, double-click edit, font size control, and bold/italic/underline formatting

> 🚦 **Before starting:** Ask AI to create `docs/PR-3-ACTION-PLAN.md` and wait for your approval

### PRD Reference
See `docs/prd.md` Section 3: "Text Layers (P0 - Critical)"

### Tasks

#### 3.1: Text data model

Update shape documents in Firestore to support text type:

```typescript
{
  id: "shape_456",
  type: "text",
  text: "Hello World",
  x: 500,
  y: 300,
  fontSize: 16,       // px (12-48 range)
  color: "#000000",   // Text color
  fontWeight: "normal" | "bold",
  fontStyle: "normal" | "italic",
  textDecoration: "none" | "underline",
  rotation: 0,
  // ... standard fields
}
```

**Test Gate:** Verify type definitions updated, no TypeScript errors

#### 3.2: CanvasService text methods

Add to `src/services/canvasService.ts`:

**Methods:**
1. `createText(textData)` - Create text shape
   - Test Gate: Call from console, verify Firestore document created
2. `updateText(shapeId, text)` - Update text content
   - Test Gate: Edit text, verify update in Firestore
3. `updateTextFontSize(shapeId, fontSize)` - Change font size
   - Test Gate: Change size, verify in Firestore
4. `updateTextFormatting(shapeId, formatting)` - Update bold/italic/underline
   - Test Gate: Toggle formatting, verify in Firestore

#### 3.3: Text tool button

Add text tool to toolbar:

**Sub-tasks:**
1. Add "Text" button next to shape buttons in toolbar
   - Layout: `[Rectangle] [Circle] [Triangle] [Text] | [Red] [Blue] [Green] [Yellow]`
   - Test Gate: Button visible, styled consistently
2. Click activates text placement mode
   - Test Gate: Click button, cursor changes, ready to place text
3. Store active tool in CanvasContext
   - Test Gate: Console.log active tool, verify "text" when selected

#### 3.4: Text creation flow

Implement click-to-place text:

**Sub-tasks:**
1. User clicks canvas → text input appears at click position
   - Test Gate: Click canvas in text mode, input appears
2. Input styled with border, focused automatically
   - Test Gate: Can immediately start typing
3. Enter key creates text shape, Escape cancels
   - Test Gate: Type "Hello", press Enter → text appears on canvas
4. Input disappears after creation
   - Test Gate: Input removed from DOM
5. Default: 16px font, black color, normal weight/style
   - Test Gate: Created text has correct defaults

#### 3.5: Text editing (double-click)

Implement edit mode for existing text:

**Sub-tasks:**
1. Double-click text shape → shows input overlay with current text
   - Test Gate: Double-click, input pre-filled with existing text
2. Input positioned exactly over text shape
   - Test Gate: Input overlays text perfectly
3. Enter saves, Escape cancels
   - Test Gate: Edit text, press Enter → Firestore updated
4. Other users see edit in <100ms
   - Test Gate: User A edits, User B sees update

#### 3.6: Font size control

Add font size dropdown to controls panel:

**Sub-tasks:**
1. Show dropdown when text shape is locked
   - Options: 12, 14, 16, 18, 20, 24, 32, 48 px
   - Test Gate: Lock text, see dropdown appear
2. Changing size updates Firestore
   - Test Gate: Select 24px, verify in Firestore
3. Text re-renders at new size immediately
   - Test Gate: Size change visible instantly

#### 3.7: Text formatting controls (Bold, Italic, Underline)

Add formatting buttons to controls panel:

**Sub-tasks:**
1. Show [B] [I] [U̲] buttons when text shape locked
   - Test Gate: Lock text, see 3 formatting buttons
2. Implement toggle handlers for each format
   - Test Gate: Click [B], text becomes bold
3. Active state: Blue background (#3b82f6)
   - Test Gate: Bold text shows blue [B] button
4. Multiple formats can be active (e.g., bold + italic)
   - Test Gate: Apply bold and italic together
5. Sync formatting changes in <100ms
   - Test Gate: User A makes text bold, User B sees bold text

#### 3.8: Konva Text rendering

Implement text rendering with all properties:

**Requirements:**
- Render with Konva `<Text>` component
- Apply fontSize, fill (color), fontStyle, textDecoration
- Support rotation
- Make draggable when locked

**Test Gate:** Text renders correctly with all formatting combinations

### PR Checklist

- [ ] "Text" button in toolbar activates text mode
- [ ] Click canvas in text mode → input appears
- [ ] Enter creates text, Escape cancels
- [ ] Double-click existing text opens edit mode
- [ ] Font size dropdown works (12-48px options)
- [ ] Bold button toggles fontWeight
- [ ] Italic button toggles fontStyle
- [ ] Underline button toggles textDecoration
- [ ] Multiple formats work together (bold + italic + underline)
- [ ] Active formatting buttons show blue background
- [ ] User A creates/edits text → User B sees in <100ms
- [ ] User A changes formatting → User B sees in <100ms
- [ ] Text can be moved/rotated like rectangles
- [ ] No console errors
- [ ] Deployed and tested in production

---

## PR #4: Delete & Duplicate

**Branch:** `feature/pr-4-delete-duplicate`  
**Goal:** Add delete and duplicate buttons to controls panel; sync operations across users

> 🚦 **Before starting:** Ask AI to create `docs/PR-4-ACTION-PLAN.md` and wait for your approval

### PRD Reference
See `docs/prd.md` Section 4: "Delete & Duplicate (P0 - Critical)"

### Tasks

#### 4.1: CanvasService delete method

Add to `src/services/canvasService.ts`:

```typescript
async deleteShape(shapeId: string): Promise<void>
```

**Requirements:**
- Delete document from Firestore
- Clean up any locks if shape was locked

**Test Gate:** Call from console, verify shape disappears and Firestore document deleted

#### 4.2: CanvasService duplicate method

Add to `src/services/canvasService.ts`:

```typescript
async duplicateShape(shapeId: string, userId: string): Promise<string>
```

**Requirements:**
- Fetch original shape data
- Create new document with same properties
- Offset position by +20px x and y (wrap if > 4980)
- Return new shape ID
- Reset lock fields (lockedBy: null, lockedAt: null)
- Set createdBy to current userId

**Test Gate:** Duplicate shape, verify new shape appears offset by 20px

#### 4.3: Controls panel UI

Create controls panel component:

**Sub-tasks:**
1. Panel appears when shape is locked by current user
   - Test Gate: Lock shape, see controls panel
2. Show [🗑️ Delete] and [📋 Duplicate] buttons
   - Test Gate: Buttons visible with icons
3. Position: Floating near shape or fixed corner
   - Test Gate: Panel doesn't block canvas
4. For text shapes, also show font size dropdown
   - Test Gate: Lock text, see additional controls

#### 4.4: Delete button handler

Implement delete functionality:

**Sub-tasks:**
1. Click Delete → confirm dialog (optional)
   - Test Gate: Click delete, shape removed
2. Call `canvasService.deleteShape(shapeId)`
   - Test Gate: Firestore document deleted
3. Clear selection state
   - Test Gate: No shape selected after delete
4. Other users see deletion in <100ms
   - Test Gate: User A deletes, User B sees shape disappear

#### 4.5: Duplicate button handler

Implement duplicate functionality:

**Sub-tasks:**
1. Click Duplicate → creates copy with offset
   - Test Gate: Click duplicate, new shape appears
2. New shape auto-selected (optional)
   - Test Gate: Duplicated shape selected/highlighted
3. Toast notification: "Duplicated shape"
   - Test Gate: Brief toast appears
4. Other users see duplicate in <100ms
   - Test Gate: User A duplicates, User B sees new shape

### PR Checklist

- [ ] Controls panel appears when shape locked
- [ ] Delete button removes shape
- [ ] Duplicate button creates copy with 20px offset
- [ ] Delete clears selection state
- [ ] Duplicate works for all shape types (rectangle, text)
- [ ] User A deletes → User B sees removal in <100ms
- [ ] User A duplicates → User B sees new shape in <100ms
- [ ] Toast notifications show for actions
- [ ] No console errors
- [ ] Deployed and tested in production

---

## PR #5: Additional Shape Types (Circles & Triangles)

**Branch:** `feature/pr-5-circle-triangle-shapes`  
**Goal:** Add circle and triangle creation tools with drag-to-create UI; support resize/rotate/move

> 🚦 **Before starting:** Ask AI to create `docs/PR-5-ACTION-PLAN.md` and wait for your approval

### PRD Reference
See `docs/prd.md` Section 5: "Additional Shape Types - Circles & Triangles (P0 - Critical for Rubric)"

### Tasks

#### 5.1: Circle data model

Add circle type to shape documents:

```typescript
{
  id: "shape_123",
  type: "circle",
  x: 500,          // Center X
  y: 300,          // Center Y
  radius: 75,      // Radius in pixels
  color: "#3b82f6",
  rotation: 0,
  // ... standard fields
}
```

**Test Gate:** TypeScript types updated, no errors

#### 5.2: Triangle data model

Add triangle type to shape documents:

```typescript
{
  id: "shape_456",
  type: "triangle",
  x: 1000,         // Top vertex X
  y: 500,          // Top vertex Y
  width: 150,      // Base width
  height: 130,     // Height from top to base
  color: "#ef4444",
  rotation: 0,
  // ... standard fields
}
```

**Test Gate:** TypeScript types updated, no errors

#### 5.3: CanvasService circle methods

Add to `src/services/canvasService.ts`:

**Methods:**
1. `createCircle(circleData)` - Create circle shape
   - Test Gate: Call from console, verify circle in Firestore
2. `resizeCircle(shapeId, radius)` - Change radius (min 5px)
   - Test Gate: Call with radius 100, verify update

#### 5.4: CanvasService triangle methods

Add to `src/services/canvasService.ts`:

**Methods:**
1. `createTriangle(triangleData)` - Create triangle shape
   - Test Gate: Call from console, verify triangle in Firestore
2. Triangle uses standard `resizeShape(width, height)` method
   - Test Gate: Resize triangle, verify width/height update

#### 5.5: Circle and Triangle toolbar buttons

Update toolbar:

**Sub-tasks:**
1. Add "Circle" button between Rectangle and Text
   - Test Gate: Button visible, styled consistently
2. Add "Triangle" button
   - Layout: `[Rectangle] [Circle] [Triangle] [Text] | [Red] [Blue] [Green] [Yellow]`
   - Test Gate: All buttons aligned properly
3. Track active tool in CanvasContext
   - Test Gate: Console.log active tool when clicked

#### 5.6: Circle creation flow

Implement drag-to-create circle:

**Sub-tasks:**
1. User clicks in circle mode → records center position
   - Test Gate: Mousedown captures center point
2. User drags → calculates radius as distance from center
   - Formula: `Math.sqrt((x2-x1)² + (y2-y1)²)`
   - Test Gate: Console.log radius during drag
3. Show preview circle with dashed border
   - Test Gate: Circle preview visible during drag
4. Mouseup → create if radius ≥ 5px
   - Test Gate: Tiny circles rejected, toast shown
5. Other users see circle in <100ms
   - Test Gate: Multi-browser test

#### 5.7: Triangle creation flow

Implement drag-to-create triangle:

**Sub-tasks:**
1. User drags like rectangle (defines bounding box)
   - Test Gate: Drag motion captures width/height
2. Show preview triangle during drag
   - Test Gate: Triangle preview with dashed border
3. Mouseup → create if width ≥ 10 and height ≥ 10
   - Test Gate: Tiny triangles rejected
4. Triangle points calculated from bounding box:
   - Top: (x + width/2, y)
   - Bottom-left: (x, y + height)
   - Bottom-right: (x + width, y + height)
   - Test Gate: Triangle shape looks correct

#### 5.8: Konva rendering for circles

Render circles with Konva:

**Requirements:**
- Use Konva `<Circle>` component
- Set x, y (center), radius, fill, rotation
- Make draggable when locked

**Test Gate:** Circle renders correctly, can be moved

#### 5.9: Konva rendering for triangles

Render triangles with Konva:

**Requirements:**
- Use Konva `<Line>` component with closed path
- Calculate 3 points from bounding box
- Set fill, rotation, offset for center rotation
- Make draggable when locked

**Test Gate:** Triangle renders correctly, can be moved

#### 5.10: Resize handles for circles

Add resize handles for circles:

**Sub-tasks:**
1. Show 4 handles (top, bottom, left, right) when locked
   - Test Gate: Lock circle, see 4 handles
2. All handles change radius proportionally
   - Test Gate: Drag any handle, circle resizes uniformly
3. Show radius tooltip: "Radius: 75px"
   - Test Gate: Tooltip displays during resize

#### 5.11: Resize handles for triangles

Use standard 8-handle resize for triangles:

**Sub-tasks:**
1. Corner handles resize proportionally
   - Test Gate: Drag corner, triangle scales uniformly
2. Edge handles resize single dimension
   - Test Gate: Drag top edge, only height changes
3. Triangle recalculates points based on new bounding box
   - Test Gate: Resized triangle maintains shape

### PR Checklist

- [ ] Circle button in toolbar activates circle mode
- [ ] Triangle button in toolbar activates triangle mode
- [ ] Drag-to-create circle works (radius = distance from center)
- [ ] Drag-to-create triangle works (bounding box)
- [ ] Preview shown during drag for both shapes
- [ ] Minimum size enforced (5px radius, 10×10 triangle)
- [ ] Circles render correctly with Konva
- [ ] Triangles render correctly with Konva
- [ ] Circles can be resized with 4 handles (all change radius)
- [ ] Triangles can be resized with 8 handles
- [ ] Both shapes can be rotated
- [ ] Both shapes can be moved
- [ ] Both shapes can be deleted/duplicated
- [ ] User A creates circle → User B sees in <100ms
- [ ] User A creates triangle → User B sees in <100ms
- [ ] No console errors
- [ ] Deployed and tested in production

---

## Part 2: Advanced Features (PRs #6-10, ~25 hours)

These features are strategically selected to maximize rubric scoring.

---

## PR #6: Multi-Select

**Branch:** `feature/pr-6-multi-select`  
**Goal:** Add shift-click and marquee selection; enable multi-shape operations

> 🚦 **Before starting:** Ask AI to create `docs/PR-6-ACTION-PLAN.md` and wait for your approval

### PRD Reference
See `docs/prd.md` Section 6: "Multi-Select (P0 - Critical for Rubric)"

### Tasks

#### 6.1: Selection state management

Add to CanvasContext:

```typescript
const [selectedShapes, setSelectedShapes] = useState<string[]>([]);
```

**Test Gate:** Console.log selectedShapes on any click, verify array updates

#### 6.2: Shift-click selection

Implement add-to-selection:

**Sub-tasks:**
1. Detect shift key in shape click handler
   - Test Gate: Console.log event.shiftKey on click
2. If Shift held, add/remove shape from selection
   - Test Gate: Shift+click 3 shapes, all in selectedShapes array
3. If Shift not held, replace selection (single select)
   - Test Gate: Click without Shift, only one shape selected
4. Visual: All selected shapes show blue 3px border
   - Test Gate: 3 selected shapes all have blue border

#### 6.3: Marquee selection state

Add marquee state for drag-selection:

**Sub-tasks:**
1. Track marquee bounds during drag on empty canvas
   - Test Gate: Console.log marquee rect during drag
2. Render marquee rectangle: dashed blue border, 20% opacity fill
   - Test Gate: Visual inspection, marquee visible during drag
3. On mouseup, detect which shapes intersect marquee
   - Test Gate: Console.log intersected shape IDs
4. Update selectedShapes with intersected shapes
   - Test Gate: Drag over 3 shapes, all selected after release

#### 6.4: Marquee selection logic

Implement bounding box intersection:

**Sub-tasks:**
1. Calculate marquee bounds (handle negative drags)
   - Test Gate: Drag right-to-left works
2. For each shape, check if bounding boxes overlap
   - Test Gate: Algorithm correctly identifies overlaps
3. If Shift held during marquee, add to selection
   - Test Gate: Marquee + Shift adds without clearing
4. If Shift not held, replace selection
   - Test Gate: Marquee without Shift clears previous selection

#### 6.5: Multi-shape move

Enable moving all selected shapes together:

**Sub-tasks:**
1. Drag any selected shape → calculate delta (dx, dy)
   - Test Gate: Console.log drag delta
2. Apply same delta to all selected shapes
   - Test Gate: All shapes move together, maintaining relative positions
3. Update Firestore for all shapes in batch
   - Test Gate: Check Firestore, all positions updated
4. Other users see coordinated movement
   - Test Gate: User B sees all shapes moving in sync

#### 6.6: Clear selection

Implement deselect:

**Sub-tasks:**
1. Click empty canvas → clear selectedShapes
   - Test Gate: Click background, selection cleared
2. Escape key clears selection
   - Test Gate: Press Escape, no shapes selected
3. Blue borders removed when cleared
   - Test Gate: Visual confirmation

### PR Checklist

- [ ] Shift+click adds shape to selection
- [ ] Shift+click again removes from selection
- [ ] Click without Shift selects single shape
- [ ] All selected shapes show blue 3px border
- [ ] Drag on empty canvas shows marquee rectangle
- [ ] Marquee selects all intersecting shapes on release
- [ ] Shift+marquee adds to selection
- [ ] Drag any selected shape moves all together
- [ ] Relative positions maintained during multi-move
- [ ] Click background clears selection
- [ ] Escape key clears selection
- [ ] User A multi-selects & moves → User B sees all movements
- [ ] No console errors
- [ ] 60 FPS maintained with 10+ shapes selected
- [ ] Deployed and tested in production

---

## PR #7: Object Grouping & Z-Index Management

**Branch:** `feature/pr-7-grouping-zindex`  
**Goal:** Add grouping for multi-shape operations; add z-index controls for layering

> 🚦 **Before starting:** Ask AI to create `docs/PR-7-ACTION-PLAN.md` and wait for your approval

### PRD Reference
See `docs/prd.md` Sections 7 & 8: "Object Grouping" and "Z-Index Management"

### Tasks

#### 7.1: Groups collection

Create new Firestore collection `canvases/main/groups`:

```typescript
{
  id: "group_abc",
  name: "Login Form",
  shapeIds: ["shape_123", "shape_456"],
  createdBy: "user_abc",
  createdAt: timestamp
}
```

**Test Gate:** Manually create group document, verify structure

#### 7.2: Add groupId to shapes

Update shape documents:

```typescript
{
  // ... existing fields
  groupId: "group_abc" | null,
  zIndex: 5  // NEW: Stacking order
}
```

**Test Gate:** Create shape, verify `groupId: null, zIndex: 0` by default

#### 7.3: CanvasService grouping methods

Add to `src/services/canvasService.ts`:

**Methods:**
1. `groupShapes(shapeIds, userId, name?)` - Create group
   - Creates group document
   - Updates all shapes with groupId via batch write
   - Test Gate: Group 3 shapes, verify group doc + shape updates
2. `ungroupShapes(groupId)` - Dissolve group
   - Clears groupId from all shapes
   - Deletes group document
   - Test Gate: Ungroup, verify shapes independent

#### 7.4: CanvasService z-index methods

Add z-index manipulation methods:

**Methods:**
1. `bringToFront(shapeId)` - Set zIndex to max+1
   - Test Gate: Shape moves to top layer
2. `sendToBack(shapeId)` - Set zIndex to min-1
   - Test Gate: Shape moves to bottom layer
3. `bringForward(shapeId)` - Increment zIndex by 1
   - Test Gate: Shape moves up one layer
4. `sendBackward(shapeId)` - Decrement zIndex by 1
   - Test Gate: Shape moves down one layer

#### 7.5: Group UI controls

Add grouping buttons to controls panel:

**Sub-tasks:**
1. Show "Group" button when 2+ shapes selected
   - Test Gate: Select 2 shapes, see Group button
2. Click Group → call `canvasService.groupShapes()`
   - Test Gate: Shapes are grouped
3. Show "Ungroup" button when grouped shapes selected
   - Test Gate: Select grouped shapes, see Ungroup button
4. Click Ungroup → call `canvasService.ungroupShapes()`
   - Test Gate: Shapes become independent

#### 7.6: Group selection behavior

Implement group selection:

**Sub-tasks:**
1. Click any shape in group → selects entire group
   - Test Gate: Click one member, all members highlighted
2. Visual: Grouped shapes show shared dashed border
   - Test Gate: Visual distinction from individual selection
3. Move group → all members move together
   - Test Gate: Drag one, all move maintaining relative positions

#### 7.7: Z-index rendering

Update canvas rendering to respect zIndex:

**Sub-tasks:**
1. Sort shapes by zIndex before rendering
   - Test Gate: Console.log sorted shapes array
2. Render shapes in order (lowest zIndex first)
   - Test Gate: Overlapping shapes render in correct order
3. Default zIndex: 0 for all existing shapes
   - Test Gate: Migration doesn't break existing shapes

#### 7.8: Z-index UI controls

Add layer controls to controls panel:

**Sub-tasks:**
1. Show 4 buttons when shape(s) selected:
   - ⬆️🔝 To Front
   - ⬇️⬇️ To Back
   - ⬆️ Forward
   - ⬇️ Backward
   - Test Gate: All buttons visible, labeled clearly
2. Wire up click handlers to CanvasService methods
   - Test Gate: Each button calls correct method
3. Visual feedback: shape moves to new layer
   - Test Gate: Overlapping rectangles change order

### PR Checklist

- [ ] Can group 2+ selected shapes
- [ ] Group button appears when 2+ shapes selected
- [ ] Ungroup button appears when grouped shapes selected
- [ ] Click one group member → selects entire group
- [ ] Grouped shapes show shared dashed border
- [ ] Move group → all members move together
- [ ] Delete group → all members deleted
- [ ] Duplicate group → all members duplicated
- [ ] User A groups shapes → User B sees grouped behavior
- [ ] Shapes render in correct z-index order
- [ ] Bring to Front button works
- [ ] Send to Back button works
- [ ] Bring Forward button works
- [ ] Send Backward button works
- [ ] User A changes z-index → User B sees layer change
- [ ] No console errors
- [ ] Deployed and tested in production

---

## PR #8: Alignment Tools

**Branch:** `feature/pr-8-alignment-tools`  
**Goal:** Add 6 alignment options + horizontal/vertical distribution for multi-shape layouts

> 🚦 **Before starting:** Ask AI to create `docs/PR-8-ACTION-PLAN.md` and wait for your approval

### PRD Reference
See `docs/prd.md` Section 9: "Alignment Tools (P0 - Tier 2 Feature)"

### Tasks

#### 8.1: CanvasService align method

Add to `src/services/canvasService.ts`:

```typescript
async alignShapes(
  shapeIds: string[], 
  alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
): Promise<void>
```

**Requirements:**
- Fetch all shapes
- Calculate target position based on alignment type
- Update shapes with batch write
- Return Promise

**Test Gate:** Call from console with 3 shape IDs + 'left', verify all align to leftmost edge

#### 8.2: CanvasService distribute method

Add distribute method:

```typescript
async distributeShapes(
  shapeIds: string[], 
  direction: 'horizontal' | 'vertical'
): Promise<void>
```

**Requirements:**
- Sort shapes by position
- Calculate even spacing
- Update positions with batch write

**Test Gate:** Distribute 4 shapes horizontally, verify even spacing

#### 8.3: Alignment toolbar UI

Create alignment toolbar component:

**Sub-tasks:**
1. Show toolbar when 2+ shapes selected
   - Test Gate: Select 2 shapes, see alignment options
2. Two rows of buttons:
   - Row 1: [⬅️ Left] [↔️ Center] [➡️ Right] | [⬆️ Top] [↕️ Middle] [⬇️ Bottom]
   - Row 2: [↔️ Distribute H] [↕️ Distribute V]
   - Test Gate: All 8 buttons visible and labeled
3. Add tooltips for each button
   - Test Gate: Hover shows helpful tooltip

#### 8.4: Align left/center/right

Implement horizontal alignment:

**Sub-tasks:**
1. Align Left: Move all to leftmost x position
   - Test Gate: 3 shapes align to left edge of leftmost
2. Align Center: Move all to average center x position
   - Test Gate: 3 shapes align vertically centered
3. Align Right: Move all to rightmost x + width position
   - Test Gate: 3 shapes align to right edge of rightmost

#### 8.5: Align top/middle/bottom

Implement vertical alignment:

**Sub-tasks:**
1. Align Top: Move all to topmost y position
   - Test Gate: 3 shapes align to top edge of topmost
2. Align Middle: Move all to average center y position
   - Test Gate: 3 shapes align horizontally centered
3. Align Bottom: Move all to bottommost y + height position
   - Test Gate: 3 shapes align to bottom edge of bottommost

#### 8.6: Distribute horizontally

Implement even horizontal spacing:

**Sub-tasks:**
1. Sort shapes left-to-right
   - Test Gate: Console.log sorted order
2. Keep leftmost and rightmost positions fixed
   - Test Gate: End shapes don't move
3. Space middle shapes evenly
   - Test Gate: Equal spacing between all shapes
4. Account for shape widths
   - Test Gate: Spacing calculated correctly

#### 8.7: Distribute vertically

Implement even vertical spacing:

**Sub-tasks:**
1. Sort shapes top-to-bottom
2. Keep topmost and bottommost fixed
3. Space middle shapes evenly
4. Account for shape heights

**Test Gate:** 5 shapes distribute evenly from top to bottom

### PR Checklist

- [ ] Alignment toolbar appears when 2+ shapes selected
- [ ] Align Left works (all shapes align to leftmost edge)
- [ ] Align Center works (all shapes center horizontally)
- [ ] Align Right works (all shapes align to rightmost edge)
- [ ] Align Top works (all shapes align to topmost edge)
- [ ] Align Middle works (all shapes center vertically)
- [ ] Align Bottom works (all shapes align to bottommost edge)
- [ ] Distribute Horizontally works (even spacing left-to-right)
- [ ] Distribute Vertically works (even spacing top-to-bottom)
- [ ] User A aligns shapes → User B sees alignment in <100ms
- [ ] Tooltips show for all buttons
- [ ] No console errors
- [ ] Works with all shape types (rectangles, circles, triangles, text)
- [ ] Deployed and tested in production

---

## PR #9: Keyboard Shortcuts

**Branch:** `feature/pr-9-keyboard-shortcuts`  
**Goal:** Add 15+ keyboard shortcuts for power user workflows

> 🚦 **Before starting:** Ask AI to create `docs/PR-9-ACTION-PLAN.md` and wait for your approval

### PRD Reference
See `docs/prd.md` Section 10: "Keyboard Shortcuts (P0 - Tier 1 Feature)"

### Tasks

#### 9.1: Keyboard event listener setup

Create keyboard handler in Canvas component:

**Sub-tasks:**
1. Add keydown listener to window
   - Test Gate: Console.log all key presses
2. Ignore events when typing in inputs
   - Test Gate: Type in text shape, shortcuts don't fire
3. Detect Cmd (Mac) vs Ctrl (Windows/Linux)
   - Test Gate: Works on both platforms
4. Clean up listener on unmount
   - Test Gate: No memory leaks

#### 9.2: Shape operation shortcuts

Implement basic shape shortcuts:

**Sub-tasks:**
1. `Delete` or `Backspace`: Delete selected shape(s)
   - Test Gate: Select shape, press Delete, shape removed
2. `Cmd/Ctrl + D`: Duplicate selected shape(s)
   - Test Gate: Select shape, press Cmd+D, duplicate appears
3. `Cmd/Ctrl + G`: Group selected shapes
   - Test Gate: Select 2 shapes, press Cmd+G, grouped
4. `Cmd/Ctrl + Shift + G`: Ungroup
   - Test Gate: Select group, press Cmd+Shift+G, ungrouped

#### 9.3: Copy/paste shortcuts (preparation for PR #10)

Add copy/paste state management:

**Sub-tasks:**
1. `Cmd/Ctrl + C`: Copy selected shape(s) to clipboard state
   - Test Gate: Console.log clipboard contents after copy
2. Toast notification: "Copied 2 shapes"
   - Test Gate: Brief toast appears

**Note:** Full paste implementation in PR #10

#### 9.4: Movement shortcuts

Implement arrow key nudging:

**Sub-tasks:**
1. `Arrow Up/Down/Left/Right`: Move selected shape(s) by 10px
   - Test Gate: Press arrow, shape moves 10px
2. `Shift + Arrow`: Move by 1px (fine control)
   - Test Gate: Press Shift+Arrow, shape moves 1px
3. Update Firestore after nudge
   - Test Gate: Other users see nudged position
4. Prevent page scroll when arrows pressed
   - Test Gate: `e.preventDefault()` called

#### 9.5: Z-index shortcuts

Implement layer shortcuts:

**Sub-tasks:**
1. `Cmd/Ctrl + ]`: Bring forward
   - Test Gate: Shape moves up one layer
2. `Cmd/Ctrl + [`: Send backward
   - Test Gate: Shape moves down one layer
3. `Cmd/Ctrl + Shift + ]`: Bring to front
   - Test Gate: Shape moves to top layer
4. `Cmd/Ctrl + Shift + [`: Send to back
   - Test Gate: Shape moves to bottom layer

#### 9.6: Selection shortcuts

Implement selection shortcuts:

**Sub-tasks:**
1. `Cmd/Ctrl + A`: Select all shapes
   - Test Gate: All shapes become selected
2. `Escape`: Clear selection
   - Test Gate: No shapes selected after Escape

#### 9.7: Canvas shortcuts

Implement canvas controls:

**Sub-tasks:**
1. `Space + Drag`: Pan canvas (alternative to default drag)
   - Test Gate: Hold Space, drag moves canvas
2. `Cmd/Ctrl + 0`: Reset zoom to 100%
   - Test Gate: Zoom level resets to 1.0

#### 9.8: Visual feedback

Add toast notifications for shortcuts:

**Sub-tasks:**
1. Brief toasts for actions: "Duplicated 3 shapes"
   - Test Gate: Toasts appear and auto-dismiss after 1s
2. Show tooltips with keyboard hints on buttons
   - Test Gate: Hover over Delete button shows "Delete (Del)"

### PR Checklist

- [ ] Delete/Backspace removes selected shape(s)
- [ ] Cmd/Ctrl+D duplicates selected shape(s)
- [ ] Cmd/Ctrl+C copies to clipboard (shows toast)
- [ ] Cmd/Ctrl+G groups selected shapes
- [ ] Cmd/Ctrl+Shift+G ungroups
- [ ] Arrow keys move shape(s) by 10px
- [ ] Shift+Arrow keys move shape(s) by 1px
- [ ] Cmd/Ctrl+] brings forward
- [ ] Cmd/Ctrl+[ sends backward
- [ ] Cmd/Ctrl+Shift+] brings to front
- [ ] Cmd/Ctrl+Shift+[ sends to back
- [ ] Cmd/Ctrl+A selects all shapes
- [ ] Escape clears selection
- [ ] Space+Drag pans canvas
- [ ] Cmd/Ctrl+0 resets zoom
- [ ] Shortcuts ignored when typing in inputs
- [ ] Toast notifications show for actions
- [ ] Button tooltips show keyboard shortcuts
- [ ] No console errors
- [ ] Deployed and tested in production

---

## PR #10: Copy/Paste & Collaborative Comments

**Branch:** `feature/pr-10-copy-paste-comments`  
**Goal:** Add copy/paste functionality; add collaborative comment system on shapes

> 🚦 **Before starting:** Ask AI to create `docs/PR-10-ACTION-PLAN.md` and wait for your approval

### PRD Reference
See `docs/prd.md` Sections 11 & 12: "Copy/Paste" and "Collaborative Comments"

### Tasks

#### 10.1: Clipboard state management

Add clipboard to CanvasContext:

```typescript
const [clipboard, setClipboard] = useState<Shape[] | null>(null);
```

**Test Gate:** Console.log clipboard contents after copy

#### 10.2: Copy functionality

Implement copy:

**Sub-tasks:**
1. `Cmd/Ctrl + C`: Copy selected shapes to clipboard state
   - Test Gate: Clipboard contains shape data
2. Store full shape objects (not just IDs)
   - Test Gate: Console.log clipboard, verify complete data
3. Toast: "Copied 2 shapes"
   - Test Gate: Toast appears

#### 10.3: Paste functionality

Implement paste:

**Sub-tasks:**
1. `Cmd/Ctrl + V`: Paste from clipboard
   - Test Gate: Press Cmd+V, duplicates appear
2. For each shape in clipboard, call `duplicateShape()`
   - Test Gate: All shapes pasted with 20px offset
3. Auto-select pasted shapes
   - Test Gate: Pasted shapes become selected
4. Toast: "Pasted 2 shapes"
   - Test Gate: Toast appears
5. Other users see pasted shapes in <100ms
   - Test Gate: Multi-browser test

#### 10.4: Comments Firestore collection

Create `canvases/main/comments` collection:

```typescript
{
  id: "comment_123",
  shapeId: "shape_456",
  userId: "user_abc",
  username: "Alice",
  text: "This needs to be bigger",
  x: 100,            // Optional pin position
  y: 200,
  createdAt: timestamp,
  resolved: false,
  replies: [...]     // Array of reply objects
}
```

**Test Gate:** Manually create comment document, verify structure

#### 10.5: CanvasService comment methods

Add to `src/services/canvasService.ts`:

**Methods:**
1. `addComment(shapeId, text, userId, username)` - Create comment
   - Test Gate: Call from console, verify Firestore document
2. `resolveComment(commentId)` - Mark resolved
   - Test Gate: Comment resolved flag updates
3. `addReply(commentId, userId, username, text)` - Add reply
   - Test Gate: Reply appended to replies array
4. `subscribeToComments(callback)` - Real-time listener
   - Test Gate: Callback fires when comments change
5. `deleteComment(commentId)` - Remove comment
   - Test Gate: Comment document deleted

#### 10.6: Comment indicator on shapes

Add comment icon to shapes:

**Sub-tasks:**
1. Show 💬 icon in top-right corner of shapes with comments
   - Test Gate: Shape with comment shows icon
2. Badge shows count: "💬 3"
   - Test Gate: Multiple comments show count
3. Icon pulses when new comment added (animation)
   - Test Gate: Visual animation plays

#### 10.7: Comment panel UI

Create comment panel component:

**Sub-tasks:**
1. Click comment icon → opens floating panel near shape
   - Test Gate: Panel appears positioned near shape
2. Panel dimensions: 300px wide, max 400px tall, scrollable
   - Test Gate: Panel doesn't overflow screen
3. White background, shadow for elevation
   - Test Gate: Visual polish matches design

#### 10.8: Comment thread rendering

Display comment threads in panel:

**Sub-tasks:**
1. Show all comments for shape
   - Test Gate: All comments visible
2. Each comment shows: username, timestamp, text
   - Test Gate: Metadata displayed correctly
3. Replies indented with gray background
   - Test Gate: Visual hierarchy clear
4. "Reply" button under each comment
   - Test Gate: Click opens reply input

#### 10.9: Add comment functionality

Implement comment creation:

**Sub-tasks:**
1. "💬 Add Comment" button in controls panel when shape selected
   - Test Gate: Button appears
2. Click → opens comment input in panel
   - Test Gate: Textarea focused
3. Enter or Send button posts comment
   - Test Gate: Comment appears in panel
4. Escape cancels
   - Test Gate: Input cleared without posting

#### 10.10: Real-time comment sync

Implement comment updates:

**Sub-tasks:**
1. New comments appear instantly for all users
   - Test Gate: User A adds comment, User B sees it
2. Comment count badge updates in real-time
   - Test Gate: Badge increments when comment added
3. Panel auto-scrolls to newest comment
   - Test Gate: Scroll behavior correct

#### 10.11: Resolve comments

Add resolve functionality:

**Sub-tasks:**
1. "✓ Resolve" button for each comment (author or shape owner only)
   - Test Gate: Button only visible for authorized users
2. Resolved comments hidden by default
   - Test Gate: Resolved comments don't show
3. "Show resolved (5)" toggle at bottom of panel
   - Test Gate: Toggle reveals resolved comments
4. Resolved comments show with strikethrough + green checkmark
   - Test Gate: Visual indication of resolved state

### PR Checklist

- [ ] Cmd/Ctrl+C copies selected shapes to clipboard
- [ ] Cmd/Ctrl+V pastes shapes with 20px offset
- [ ] Pasted shapes auto-selected
- [ ] Toast notifications for copy/paste
- [ ] User A pastes → User B sees new shapes in <100ms
- [ ] Comment icon (💬) appears on shapes with comments
- [ ] Comment count badge shows number of comments
- [ ] Click icon opens comment panel near shape
- [ ] Can add new comment to shape
- [ ] Can reply to existing comment
- [ ] Can resolve comments
- [ ] Resolved comments hidden by default (toggle to show)
- [ ] User A adds comment → User B sees in real-time
- [ ] Comment panel scrolls to newest comment
- [ ] No console errors
- [ ] Deployed and tested in production

---

## Part 3: AI Integration (PRs #11-13, ~15 hours)

These PRs add natural language AI interface on top of all manual features.

---

## PR #11: AI Service Layer & Tool Definitions

**Branch:** `feature/pr-11-ai-service-tools`  
**Goal:** Create AI service with OpenAI integration; define all 15 function tools

> 🚦 **Before starting:** Ask AI to create `docs/PR-11-ACTION-PLAN.md` and wait for your approval

### PRD Reference
See `docs/prd.md` Sections 13 & 14: "AI Service Layer" and "Tool Definitions"

### Tasks

#### 11.1: OpenAI setup

Install and configure OpenAI SDK:

**Sub-tasks:**
1. Install: `npm install openai`
   - Test Gate: Package in package.json
2. Add `VITE_OPENAI_API_KEY` to `.env`
   - Test Gate: Key loaded in dev
3. Add to `.env.example` for documentation
   - Test Gate: Example file updated

#### 11.2: AIService class structure

Create `src/services/aiService.ts`:

**Sub-tasks:**
1. Import OpenAI and CanvasService
   - Test Gate: No import errors
2. Initialize OpenAI client in constructor
   - Test Gate: Client initialized with API key
3. Initialize CanvasService instance
   - Test Gate: Can call CanvasService methods
4. Define `executeCommand(prompt, userId)` method signature
   - Test Gate: Method exists, returns Promise

#### 11.3: Define 15 function tools

Create tool definitions array:

**Tools to define (see PRD Section 14):**
1. `createRectangle` - Create rectangle
2. `createCircle` - Create circle
3. `createTriangle` - Create triangle
4. `createText` - Create text with formatting options
5. `moveShape` - Move existing shape
6. `resizeShape` - Resize shape
7. `rotateShape` - Rotate shape
8. `duplicateShape` - Duplicate shape
9. `deleteShape` - Delete shape
10. `groupShapes` - Group multiple shapes
11. `alignShapes` - Align shapes (6 alignment types)
12. `arrangeShapesInRow` - Layout command (CRITICAL for rubric)
13. `bringToFront` - Z-index control
14. `addComment` - Add comment to shape
15. `getCanvasState` - Fetch all shapes (called before manipulations)

**Test Gate:** All 15 tool definitions follow OpenAI function calling schema

#### 11.4: Implement executeCommand

Create main AI execution flow:

**Sub-tasks:**
1. Fetch current canvas state (shapes)
   - Test Gate: Console.log shapes array
2. Call OpenAI with system prompt + user prompt + tools
   - Test Gate: API call succeeds
3. Handle response with tool calls
   - Test Gate: tool_calls array populated
4. Return CommandResult object
   - Test Gate: Result includes success, message, toolCalls

#### 11.5: Implement tool execution router

Create `executeSingleTool(call, userId)` method:

**Sub-tasks:**
1. Parse tool name and arguments
   - Test Gate: Console.log name and args
2. Switch on tool name
   - Test Gate: Correct CanvasService method called for each tool
3. Handle errors gracefully
   - Test Gate: Invalid tool name returns error, doesn't crash
4. Return result for each tool call
   - Test Gate: Results array populated

#### 11.6: Implement creation tools (4 tools)

Wire up creation tool calls to CanvasService:

**Sub-tasks:**
1. `createRectangle` → `canvasService.createShape()`
   - Test Gate: Rectangle created via AI
2. `createCircle` → `canvasService.createCircle()`
   - Test Gate: Circle created via AI
3. `createTriangle` → `canvasService.createTriangle()`
   - Test Gate: Triangle created via AI
4. `createText` → `canvasService.createText()`
   - Test Gate: Text created via AI with formatting

#### 11.7: Implement manipulation tools (5 tools)

Wire up manipulation tools:

**Sub-tasks:**
1. `moveShape` → `canvasService.updateShape(id, {x, y})`
   - Test Gate: Shape moved via AI
2. `resizeShape` → `canvasService.resizeShape()`
   - Test Gate: Shape resized via AI
3. `rotateShape` → `canvasService.rotateShape()`
   - Test Gate: Shape rotated via AI
4. `duplicateShape` → `canvasService.duplicateShape()`
   - Test Gate: Shape duplicated via AI
5. `deleteShape` → `canvasService.deleteShape()`
   - Test Gate: Shape deleted via AI

#### 11.8: Implement advanced tools (5 tools)

Wire up grouping, alignment, z-index, comments:

**Sub-tasks:**
1. `groupShapes` → `canvasService.groupShapes()`
   - Test Gate: Multiple shapes grouped via AI
2. `alignShapes` → `canvasService.alignShapes()`
   - Test Gate: Shapes aligned via AI
3. `arrangeShapesInRow` → custom layout logic
   - Test Gate: Shapes arranged horizontally (CRITICAL)
4. `bringToFront` → `canvasService.bringToFront()`
   - Test Gate: Shape layering changed via AI
5. `addComment` → `canvasService.addComment()`
   - Test Gate: Comment added via AI

#### 11.9: Implement getCanvasState tool

Add context awareness:

**Sub-tasks:**
1. `getCanvasState` → `canvasService.getShapes()`
   - Test Gate: Returns all shapes array
2. AI can call this before manipulation tools
   - Test Gate: Multi-step command (getCanvasState → moveShape) works

#### 11.10: Implement arrangeShapesInRow helper

Create layout algorithm (CRITICAL for rubric):

**Sub-tasks:**
1. Fetch shapes by IDs
   - Test Gate: All shapes fetched
2. Sort shapes by x position (left-to-right)
   - Test Gate: Correct sort order
3. Calculate even spacing
   - Test Gate: Spacing calculated correctly
4. Update all shapes with batch write
   - Test Gate: All shapes repositioned
5. Test with 3-5 shapes
   - Test Gate: Shapes arranged in horizontal row with even spacing

#### 11.11: Generate success messages

Create `generateSuccessMessage(results)` method:

**Sub-tasks:**
1. Count successful tool calls
   - Test Gate: Message shows "Completed 3 actions"
2. Generate specific messages for common actions
   - "✓ Created 1 rectangle"
   - "✓ Arranged shapes in horizontal row"
   - "✓ Aligned shapes to the left"
   - Test Gate: Messages make sense for each action type
3. Handle errors in results
   - Test Gate: Partial success shows warnings

### PR Checklist

- [ ] AIService class created with OpenAI client
- [ ] All 15 function tools defined correctly
- [ ] executeCommand method calls OpenAI API
- [ ] Tool execution router handles all 15 tools
- [ ] Creation tools work (rectangle, circle, triangle, text)
- [ ] Manipulation tools work (move, resize, rotate, duplicate, delete)
- [ ] Advanced tools work (group, align, arrange, z-index, comment)
- [ ] getCanvasState tool returns all shapes
- [ ] arrangeShapesInRow layout algorithm works (CRITICAL)
- [ ] Success messages generated for each action
- [ ] Error handling prevents crashes
- [ ] Can call AIService from console manually
- [ ] Multi-step commands work (e.g., getCanvasState → moveShape)
- [ ] No console errors
- [ ] OpenAI API costs monitored

---

## PR #12: System Prompt & Context Awareness

**Branch:** `feature/pr-12-ai-system-prompt`  
**Goal:** Create comprehensive system prompt with examples; enable context-aware shape identification

> 🚦 **Before starting:** Ask AI to create `docs/PR-12-ACTION-PLAN.md` and wait for your approval

### PRD Reference
See `docs/prd.md` Section 15: "System Prompt (P0 - Critical)"

### Tasks

#### 12.1: Create aiPrompts utility

Create `src/utils/aiPrompts.ts`:

**Sub-tasks:**
1. Export `getSystemPrompt(shapes)` function
   - Test Gate: Function exists, accepts shapes array
2. Function returns string with complete system prompt
   - Test Gate: Return type is string

#### 12.2: Canvas basics section

Add canvas fundamentals to prompt:

**Content:**
- Canvas dimensions: 5000×5000
- Coordinate system: (0,0) = top-left
- Center position: (2500, 2500)
- Default sizes for shapes

**Test Gate:** Prompt includes canvas dimensions and coordinate system

#### 12.3: Position helpers section

Add position reference guide:

**Content:**
- "center" → (2500, 2500)
- "top-left" → (100, 100)
- "top" → (2500, 100)
- ... (all 9 positions)

**Test Gate:** Prompt includes all position helpers

#### 12.4: Color codes section

Add standard color mappings:

**Content:**
- red → #ef4444
- blue → #3b82f6
- green → #10b981
- yellow → #f59e0b
- black → #000000
- white → #ffffff

**Test Gate:** Prompt includes exact hex codes for all colors

#### 12.5: Critical rules section

Add operational rules:

**Content:**
1. ALWAYS call getCanvasState() FIRST before manipulating existing shapes
2. Use shapeId from getCanvasState results
3. Identify shapes by color, position, type, grouping
4. Default rectangle size: 200×150
5. Default text fontSize: 16, color: black

**Test Gate:** Rules section emphasizes getCanvasState priority

#### 12.6: Shape identification section

Add context awareness examples:

**Content:**
- "the blue rectangle" → find shape with type="rectangle", color="#3b82f6"
- "these shapes" → identify by context
- If multiple matches, pick most recent
- If no match, tell user clearly

**Test Gate:** Prompt explains how to identify shapes from user descriptions

#### 12.7: Multi-step operation examples

Add complex command examples:

**Examples:**
1. **Login Form:** 6-step creation (labels, inputs, button)
   - Test Gate: Example shows all 6 tool calls
2. **Grid Creation:** 3×3 grid = 9 createRectangle calls
   - Test Gate: Example shows calculated positions
3. **Layout Commands:** "arrange in a row" → arrangeShapesInRow
   - Test Gate: Example emphasizes this CRITICAL command

#### 12.8: Grouping command examples

Add grouping examples:

**Content:**
- "group the blue shapes" → getCanvasState → find blue → groupShapes
- "group these" → identify shapes by context

**Test Gate:** Prompt shows how to identify shapes for grouping

#### 12.9: Alignment command examples

Add alignment examples:

**Content:**
- "align these to the left" → getCanvasState → alignShapes(ids, 'left')
- "center these vertically" → alignShapes(ids, 'middle')

**Test Gate:** Prompt includes all 6 alignment types

#### 12.10: Canvas state summary

Add current shapes summary to prompt:

**Sub-tasks:**
1. Format shapes array into readable summary
   - Test Gate: Shows first 20 shapes with key info
2. Include shape type, ID, color, position
   - Test Gate: Format: "rectangle (id: shape_123): #3b82f6 at (100, 200), size 200×150"
3. If > 20 shapes, show "... and N more shapes"
   - Test Gate: Large canvases don't overflow prompt
4. If empty canvas, show "Empty canvas"
   - Test Gate: Appropriate message for new canvas

#### 12.11: Layout command emphasis

Highlight layout commands (CRITICAL for rubric):

**Content:**
- "arrange these shapes in a horizontal row" → arrangeShapesInRow
- "space these elements evenly" → arrangeShapesInRow with spacing
- Make this example prominent in prompt

**Test Gate:** Layout commands clearly documented with examples

#### 12.12: Integrate system prompt into AIService

Update `executeCommand` in `aiService.ts`:

**Sub-tasks:**
1. Import getSystemPrompt from aiPrompts
   - Test Gate: Import works
2. Call getSystemPrompt(shapes) before OpenAI call
   - Test Gate: System prompt generated with current state
3. Pass to OpenAI as system message
   - Test Gate: API call includes system message

### PR Checklist

- [ ] getSystemPrompt function created
- [ ] Canvas basics documented (5000×5000, coordinates)
- [ ] Position helpers included (9 positions)
- [ ] Color codes included (6 standard colors)
- [ ] Critical rules section emphasizes getCanvasState first
- [ ] Shape identification explained
- [ ] Multi-step examples included (login form, grid)
- [ ] Layout command examples prominent (CRITICAL)
- [ ] Grouping command examples included
- [ ] Alignment command examples included (all 6 types)
- [ ] Current canvas state appended to prompt
- [ ] Prompt integrated into AIService executeCommand
- [ ] Test via console: AI correctly identifies "the blue rectangle"
- [ ] Test: AI creates login form (6 elements)
- [ ] Test: AI arranges shapes in a row (CRITICAL)
- [ ] No console errors

---

## PR #13: AI Chat UI

**Branch:** `feature/pr-13-ai-chat-ui`  
**Goal:** Create bottom drawer chat interface with message history and input

> 🚦 **Before starting:** Ask AI to create `docs/PR-13-ACTION-PLAN.md` and wait for your approval

### PRD Reference
See `docs/prd.md` Section 16: "AI Chat Interface (P0 - Critical)"

### Tasks

#### 13.1: AIChat component structure

Create `src/components/AI/AIChat.tsx`:

**Sub-tasks:**
1. Define Message interface (id, role, content, timestamp, status)
   - Test Gate: TypeScript types defined
2. Create component with state: messages, input, isProcessing, isOpen
   - Test Gate: Component renders
3. Import AIService
   - Test Gate: Can instantiate AIService

#### 13.2: Chat drawer layout

Create drawer UI:

**Sub-tasks:**
1. Position: Fixed bottom, full width
   - Test Gate: Drawer appears at bottom of screen
2. Initial height: 300px, max height: 500px
   - Test Gate: Drawer sized correctly
3. Slide animation: 300ms ease-out
   - Test Gate: Smooth open/close animation
4. White background with shadow
   - Test Gate: Visual polish matches design

#### 13.3: Chat header

Create header section:

**Sub-tasks:**
1. Show "AI Assistant" title
   - Test Gate: Title visible
2. Minimize button (collapse to 50px header only)
   - Test Gate: Click collapses drawer
3. Close button (×)
   - Test Gate: Click closes drawer (optional feature)
4. Header always visible even when collapsed
   - Test Gate: Can reopen from collapsed state

#### 13.4: Message history component

Create MessageHistory component:

**Sub-tasks:**
1. Scrollable container (max 10 messages visible)
   - Test Gate: Scrollbar appears with many messages
2. Render user messages (aligned right, blue background)
   - Test Gate: User messages styled correctly
3. Render AI messages (aligned left, gray background)
   - Test Gate: AI messages styled correctly
4. Show timestamp for each message (relative: "2 min ago")
   - Test Gate: Timestamps update
5. Success/error status indicators
   - Test Gate: Success shows ✓, error shows ⚠️

#### 13.5: Chat input component

Create ChatInput component:

**Sub-tasks:**
1. Textarea with placeholder "Ask AI..."
   - Test Gate: Input renders
2. Send button (arrow up ↑)
   - Test Gate: Button visible and clickable
3. Enter key sends message (Shift+Enter for new line)
   - Test Gate: Enter behavior correct
4. Disable input when processing
   - Test Gate: Input disabled during AI call
5. Auto-resize textarea (1-3 lines)
   - Test Gate: Textarea grows with content

#### 13.6: Processing state

Add loading indicator:

**Sub-tasks:**
1. Show "⚡ AI is thinking..." below input when processing
   - Test Gate: Indicator visible during API call
2. Disable input and send button
   - Test Gate: Can't send while processing
3. Clear after response received
   - Test Gate: Indicator disappears when complete

#### 13.7: Send message handler

Implement handleSend function:

**Sub-tasks:**
1. Validate input not empty
   - Test Gate: Empty input doesn't send
2. Add user message to messages state
   - Test Gate: User message appears in history
3. Clear input field
   - Test Gate: Input cleared after send
4. Set isProcessing to true
   - Test Gate: Loading state activated
5. Call aiService.executeCommand(input, userId)
   - Test Gate: API call made
6. Add AI response to messages state
   - Test Gate: AI message appears in history
7. Set isProcessing to false
   - Test Gate: Loading state cleared
8. Handle errors gracefully
   - Test Gate: Error message shown if API fails

#### 13.8: Auto-scroll behavior

Implement scroll to bottom:

**Sub-tasks:**
1. Scroll to newest message when added
   - Test Gate: New messages always visible
2. Use smooth scroll behavior
   - Test Gate: Smooth animation
3. Preserve scroll if user scrolled up manually
   - Test Gate: User control respected

#### 13.9: Example prompts (optional)

Add quick start examples:

**Sub-tasks:**
1. Show 3-4 example buttons when chat empty
   - Examples: "Create a blue rectangle", "Make a 3×3 grid", "Arrange in a row"
   - Test Gate: Buttons visible on first open
2. Click example → populates input
   - Test Gate: Input filled with example text
3. Hide examples after first message
   - Test Gate: Examples disappear after use

#### 13.10: Integrate into AppShell

Add AIChat to main app:

**Sub-tasks:**
1. Import AIChat component in AppShell
   - Test Gate: Component renders
2. Position above canvas (z-index)
   - Test Gate: Drawer appears on top
3. Initial state: open (can change to closed)
   - Test Gate: Drawer visible on page load
4. Drawer doesn't block canvas interactions
   - Test Gate: Can still draw shapes with drawer open

#### 13.11: Test AI commands end-to-end

Test complete workflow:

**Test scenarios:**
1. "Create a blue rectangle in the center"
   - Test Gate: Rectangle appears at center
2. "Make it twice as big"
   - Test Gate: Rectangle resizes
3. "Rotate 45 degrees"
   - Test Gate: Rectangle rotates
4. "Create a login form"
   - Test Gate: 6 elements appear (labels, inputs, button)
5. "Arrange these shapes in a row" (CRITICAL)
   - Test Gate: Shapes arrange horizontally
6. "Group the blue shapes"
   - Test Gate: Blue shapes grouped
7. "Align to the left"
   - Test Gate: Shapes align left

### PR Checklist

- [ ] AIChat component renders at bottom of screen
- [ ] Chat drawer opens/closes smoothly
- [ ] Message history shows user and AI messages
- [ ] User messages aligned right (blue)
- [ ] AI messages aligned left (gray)
- [ ] Timestamps show relative time
- [ ] Input field allows typing
- [ ] Send button and Enter key both work
- [ ] Processing indicator shows during AI call
- [ ] Auto-scrolls to newest message
- [ ] Example prompts visible when empty (optional)
- [ ] "Create blue rectangle" command works
- [ ] "Create login form" command works (6 elements)
- [ ] "Arrange in a row" command works (CRITICAL)
- [ ] "Group the blue shapes" command works
- [ ] "Align to the left" command works
- [ ] Error messages shown if AI fails
- [ ] User B sees shapes created by User A's AI commands
- [ ] No console errors
- [ ] OpenAI API costs reasonable (<$2 for testing)
- [ ] Deployed and tested in production

---

## Part 4: Testing & Deployment (PRs #14-17, ~8 hours)

Final polish, comprehensive testing, demo video, and production deployment.

---

## PR #14: Integration Testing

**Branch:** `feature/pr-14-integration-tests`  
**Goal:** Add integration tests for core workflows and AI commands

> 🚦 **Before starting:** Ask AI to create `docs/PR-14-ACTION-PLAN.md` and wait for your approval

### PRD Reference
See `docs/prd.md` Section "Testing Checklist"

### Tasks

#### 14.1: Update test setup

Update `tests/setup.ts`:

**Sub-tasks:**
1. Add mocks for OpenAI API
   - Test Gate: Tests don't make real API calls
2. Add test helpers for multi-user scenarios
   - Test Gate: Can simulate multiple users

#### 14.2: Core manual features tests

Create `tests/integration/manual-features.test.ts`:

**Test cases:**
1. Resize shape with handles
2. Rotate shape with rotation handle
3. Create and edit text
4. Delete shape
5. Duplicate shape
6. Create circle
7. Create triangle

**Test Gate:** All 7 tests pass

#### 14.3: Advanced features tests

Create `tests/integration/advanced-features.test.ts`:

**Test cases:**
1. Multi-select with shift-click
2. Multi-select with marquee
3. Group shapes
4. Ungroup shapes
5. Align shapes (test all 6 alignments)
6. Distribute shapes
7. Z-index operations
8. Keyboard shortcuts
9. Copy/paste
10. Add comment to shape

**Test Gate:** All 10 tests pass

#### 14.4: AI service tests

Create `tests/integration/ai-service.test.ts`:

**Test cases:**
1. AI creates rectangle
2. AI creates circle
3. AI creates triangle
4. AI creates text
5. AI moves shape
6. AI resizes shape
7. AI rotates shape
8. AI duplicates shape
9. AI deletes shape
10. AI groups shapes
11. AI aligns shapes
12. AI arranges shapes in row (CRITICAL)
13. AI creates login form (multi-step)

**Test Gate:** All 13 tests pass (mock OpenAI responses)

#### 14.5: Multi-user sync tests

Create `tests/integration/multi-user-sync.test.ts`:

**Test cases:**
1. User A resizes → User B sees resize
2. User A rotates → User B sees rotation
3. User A creates text → User B sees text
4. User A groups shapes → User B sees group
5. User A uses AI → User B sees AI-created shapes
6. User A adds comment → User B sees comment

**Test Gate:** All 6 tests pass

#### 14.6: Performance tests

Create `tests/integration/performance.test.ts`:

**Test cases:**
1. Canvas maintains 60 FPS with 50+ shapes
2. Resize operation completes in <100ms
3. Multi-select 20 shapes remains smooth
4. AI command completes in <5s

**Test Gate:** Performance targets met

### PR Checklist

- [ ] Test setup updated with mocks
- [ ] 7 core manual feature tests pass
- [ ] 10 advanced feature tests pass
- [ ] 13 AI service tests pass (including layout command)
- [ ] 6 multi-user sync tests pass
- [ ] 4 performance tests pass
- [ ] All existing MVP tests still pass
- [ ] No console errors during tests
- [ ] Test coverage > 70%

---

## PR #15: Bug Fixes & Polish

**Branch:** `feature/pr-15-bug-fixes-polish`  
**Goal:** Fix any bugs found during testing; add final polish and UX improvements

> 🚦 **Before starting:** Ask AI to create `docs/PR-15-ACTION-PLAN.md` and wait for your approval

### Tasks

#### 15.1: Bug triage

Review all known issues:

**Sub-tasks:**
1. List all bugs found during PR #1-14 testing
   - Test Gate: Comprehensive bug list created
2. Prioritize: P0 (must fix), P1 (should fix), P2 (nice-to-have)
   - Test Gate: Bugs categorized
3. Create action plan for P0 and P1 bugs
   - Test Gate: Plan documented in action plan

#### 15.2: Fix P0 bugs

Address critical bugs:

**Common P0 issues to check:**
- Shapes don't sync across users
- Locking race conditions
- AI commands fail silently
- Canvas rendering issues
- Performance degradation

**Test Gate:** All P0 bugs fixed and verified

#### 15.3: Fix P1 bugs

Address important bugs:

**Common P1 issues:**
- Minor UI glitches
- Tooltip positioning
- Toast notification timing
- Keyboard shortcut conflicts
- Comment panel overflow

**Test Gate:** All P1 bugs fixed and verified

#### 15.4: Loading states

Add loading indicators:

**Sub-tasks:**
1. Show spinner when fetching initial shapes
   - Test Gate: Loading state visible on first load
2. Show skeleton UI for comments loading
   - Test Gate: Smooth loading experience
3. Disable buttons during operations
   - Test Gate: Can't double-click actions

#### 15.5: Error boundaries

Add error handling:

**Sub-tasks:**
1. Add React error boundary component
   - Test Gate: Errors caught gracefully
2. Show user-friendly error messages
   - Test Gate: No blank screens on errors
3. Log errors to console for debugging
   - Test Gate: Errors traceable

#### 15.6: Visual polish

Enhance visual design:

**Sub-tasks:**
1. Consistent button styles across app
   - Test Gate: Visual consistency
2. Smooth transitions and animations
   - Test Gate: No jarring UI changes
3. Proper spacing and alignment
   - Test Gate: Professional appearance
4. Color scheme consistency
   - Test Gate: Colors match design system

#### 15.7: Accessibility improvements

Add a11y enhancements:

**Sub-tasks:**
1. Add aria-labels to buttons
   - Test Gate: Screen reader compatible
2. Keyboard navigation works for all controls
   - Test Gate: Tab order logical
3. Focus indicators visible
   - Test Gate: Can see focused elements
4. Color contrast meets WCAG AA
   - Test Gate: Text readable

#### 15.8: Performance optimizations

Optimize as needed:

**Sub-tasks:**
1. Memoize expensive computations
   - Test Gate: Re-renders minimized
2. Throttle/debounce where appropriate
   - Test Gate: No performance issues
3. Lazy load AI chat component
   - Test Gate: Initial load faster
4. Optimize Konva rendering
   - Test Gate: 60 FPS maintained

#### 15.9: Final multi-user testing

Comprehensive multi-user test:

**Test with 3-5 users simultaneously:**
1. All users create shapes
2. All users use manual features
3. Multiple users use AI simultaneously
4. Verify no conflicts or race conditions
5. Verify all sync working

**Test Gate:** 5+ users tested, all features work smoothly

### PR Checklist

- [ ] All P0 bugs fixed
- [ ] All P1 bugs fixed
- [ ] Loading states added
- [ ] Error boundaries implemented
- [ ] Visual polish complete
- [ ] Accessibility improvements added
- [ ] Performance optimizations applied
- [ ] Multi-user testing complete (5+ users)
- [ ] No console errors
- [ ] 60 FPS maintained
- [ ] All sync operations <100ms
- [ ] AI commands <5s latency
- [ ] Deployed and tested in production

---

## PR #16: Demo Video Production

**Branch:** `feature/pr-16-demo-video`  
**Goal:** Record and edit 3-5 minute demo video showcasing all features

> 🚦 **Before starting:** Ask AI to create `docs/PR-16-ACTION-PLAN.md` and wait for your approval

### PRD Reference
See `docs/prd.md` Section 17: "Demo Video (P0 - CRITICAL - Pass/Fail)"

### Tasks

#### 16.1: Video script

Create narration script:

**Sections (see PRD for details):**
1. Real-time Collaboration (1 min)
2. AI Command Demonstrations (1.5 min)
3. Advanced Features Walkthrough (1 min)
4. Architecture Explanation (0.5-1 min)

**Test Gate:** Script reviewed and approved

#### 16.2: Recording setup

Prepare recording environment:

**Sub-tasks:**
1. Install OBS Studio or screen recording software
   - Test Gate: Software installed and tested
2. Set up 2 browser windows (split-screen or picture-in-picture)
   - Test Gate: Both windows visible
3. Test microphone audio (no background noise)
   - Test Gate: Audio quality good
4. Test screen recording at 1080p
   - Test Gate: Video quality good

#### 16.3: Record real-time collaboration segment

Record multi-user demo:

**Content:**
- Split-screen: User A and User B
- User A creates shapes → User B sees instantly
- User A resizes/rotates → User B sees changes
- Show multi-select, grouping syncing
- Show comments appearing for both users

**Test Gate:** Segment recorded, ~1 minute length

#### 16.4: Record AI demonstrations

Record AI command demos:

**Commands to show (see PRD):**
1. "Create a blue rectangle in the center"
2. "Make it twice as big"
3. "Rotate 45 degrees"
4. "Arrange these shapes in a horizontal row" (CRITICAL)
5. "Create a login form"
6. "Group the blue shapes"
7. "Align these to the left"
8. "Add comment 'needs review' to this shape"

**Test Gate:** All 8 commands demonstrated, ~1.5 minutes

#### 16.5: Record advanced features

Record manual feature demos:

**Features to show:**
- Multi-select (shift-click and marquee)
- Keyboard shortcuts (Delete, Duplicate, Arrow nudge)
- Copy/paste
- Z-index (bring to front/back)
- Collaborative comments with reply

**Test Gate:** Segment recorded, ~1 minute length

#### 16.6: Record architecture explanation

Record architecture overview:

**Content:**
- Service layer architecture diagram (can show on screen)
- Hybrid database explanation (Firestore + RTDB)
- AI integration (same CanvasService methods)
- Real-time sync flow

**Test Gate:** Segment recorded, ~0.5-1 minute

#### 16.7: Edit video

Compile and edit:

**Sub-tasks:**
1. Combine all segments in order
   - Test Gate: Video flows smoothly
2. Add transitions between segments
   - Test Gate: Professional transitions
3. Add on-screen text for key points
   - Test Gate: Text readable
4. Sync narration with visuals
   - Test Gate: Audio matches video
5. Add intro/outro (optional)
   - Test Gate: Branded intro/outro

#### 16.8: Export and upload

Finalize video:

**Sub-tasks:**
1. Export at 1080p, 30fps
   - Test Gate: Video quality high
2. Upload to YouTube (unlisted or public)
   - Test Gate: Video accessible via link
3. Add link to README.md
   - Test Gate: Link works
4. Test video playback
   - Test Gate: No stuttering, audio/video in sync

### PR Checklist

- [ ] Video script written and approved
- [ ] Real-time collaboration segment recorded (1 min)
- [ ] AI demonstrations recorded (1.5 min, includes layout command)
- [ ] Advanced features recorded (1 min)
- [ ] Architecture explanation recorded (0.5-1 min)
- [ ] Video edited with transitions
- [ ] On-screen text added for key points
- [ ] Audio clear (no background noise)
- [ ] Video quality 1080p minimum
- [ ] Total length 3-5 minutes
- [ ] Uploaded to YouTube
- [ ] Link added to README.md
- [ ] Video reviewed and approved
- [ ] All rubric requirements met

---

## PR #17: Final Documentation & Deployment

**Branch:** `feature/pr-17-final-docs-deploy`  
**Goal:** Update all documentation; ensure production deployment stable and tested

> 🚦 **Before starting:** Ask AI to create `docs/PR-17-ACTION-PLAN.md` and wait for your approval

### Tasks

#### 17.1: Update README.md

Enhance main README:

**Sections to add/update:**
1. **Features** - List all Phase 2 features
   - Core manual features (resize, rotate, text, etc.)
   - Advanced features (multi-select, grouping, alignment, etc.)
   - AI capabilities (15 tools, layout commands)
2. **Demo Video** - Embed or link to video
3. **Quick Start** - 5-minute setup guide
4. **Tech Stack** - Updated with OpenAI
5. **Architecture** - High-level overview
6. **Live Demo** - Link to deployed app

**Test Gate:** README comprehensive and accurate

#### 17.2: Update ARCHITECTURE.md

Document Phase 2 architecture:

**Sections to add:**
1. AI Service Layer
2. Tool Definitions (15 tools)
3. System Prompt Strategy
4. Comments Data Model
5. Groups Data Model
6. Updated Shape Schema (with rotation, zIndex, groupId)

**Test Gate:** Architecture doc reflects current system

#### 17.3: Update GOTCHAS.md

Document Phase 2 gotchas:

**Potential gotchas:**
- OpenAI API rate limits
- Z-index conflicts with grouping
- Rotation offset calculations
- AI context token limits
- Multi-select performance with 100+ shapes

**Test Gate:** Gotchas documented for future reference

#### 17.4: Create PHASE2-SUMMARY.md

Summarize Phase 2 work:

**Sections:**
1. Features Implemented (all 17 PRs)
2. Tech Stack Updates
3. Testing Summary
4. Performance Metrics
5. Known Limitations
6. Future Enhancements (out of scope items)

**Test Gate:** Summary complete

#### 17.5: Update .env.example

Document all environment variables:

**Variables:**
- Firebase config (all keys)
- VITE_OPENAI_API_KEY

**Test Gate:** .env.example up to date

#### 17.6: Production deployment

Deploy to Vercel:

**Sub-tasks:**
1. Build app: `npm run build`
   - Test Gate: Build succeeds, no errors
2. Test build locally: `npm run preview`
   - Test Gate: Build works correctly
3. Deploy: `vercel --prod`
   - Test Gate: Deployment succeeds
4. Verify all env vars set in Vercel dashboard
   - Test Gate: VITE_OPENAI_API_KEY configured
5. Test deployed app
   - Test Gate: All features work in production

#### 17.7: Firebase production rules

Ensure security rules deployed:

**Sub-tasks:**
1. Review Firestore rules (from MVP)
   - Test Gate: Rules allow authed users, restrict writes
2. Review RTDB rules
   - Test Gate: Per-user node restrictions work
3. Deploy rules: `firebase deploy --only firestore:rules,database:rules`
   - Test Gate: Rules deployed successfully
4. Test rules with production app
   - Test Gate: Security enforced

#### 17.8: Production smoke tests

Final testing in production:

**Test scenarios:**
1. Sign up, log in, log out
2. Create all shape types
3. Use all manual features (resize, rotate, text, delete, duplicate)
4. Use all advanced features (multi-select, group, align, z-index, shortcuts, copy/paste, comments)
5. Use AI commands (all 15 tools, including layout command)
6. Test with 5+ concurrent users
7. Verify all sync working (<100ms)
8. Verify AI latency (<5s)
9. Verify 60 FPS performance

**Test Gate:** All tests pass in production

#### 17.9: Analytics & monitoring (optional)

Add basic monitoring:

**Sub-tasks:**
1. Add Firebase Analytics (optional)
   - Test Gate: Events tracked
2. Monitor OpenAI API usage
   - Test Gate: Costs within budget
3. Check Firebase quotas
   - Test Gate: No quota issues

#### 17.10: Final checklist review

Review Phase 2 completion:

**Use PRD "Success Metrics" section:**
- [ ] All core manual features working
- [ ] All advanced features working
- [ ] AI agent with 15 tools working
- [ ] Layout command working (CRITICAL)
- [ ] Demo video complete
- [ ] All sync <100ms
- [ ] AI latency <5s
- [ ] 60 FPS performance
- [ ] 5+ users tested

**Test Gate:** All criteria met

### PR Checklist

- [ ] README.md updated with all Phase 2 features
- [ ] Demo video linked in README
- [ ] ARCHITECTURE.md updated
- [ ] GOTCHAS.md updated
- [ ] PHASE2-SUMMARY.md created
- [ ] .env.example up to date
- [ ] Production build succeeds
- [ ] Deployed to Vercel successfully
- [ ] All env vars configured in Vercel
- [ ] Firebase rules deployed
- [ ] Production smoke tests pass (all features work)
- [ ] 5+ concurrent users tested in production
- [ ] All sync <100ms verified
- [ ] AI commands <5s verified
- [ ] 60 FPS performance verified
- [ ] Demo video accessible
- [ ] All documentation complete
- [ ] Ready for submission

---

## Phase 2 Completion Checklist

### Part 1: Core Manual Features ✅

- [ ] PR #1: Resize Shapes (8 handles, corner/edge, sync)
- [ ] PR #2: Rotate Shapes (rotation handle, angle tooltip, sync)
- [ ] PR #3: Text Layers (click-to-place, edit, font size, bold/italic/underline, sync)
- [ ] PR #4: Delete & Duplicate (controls panel, sync)
- [ ] PR #5: Circles & Triangles (drag-to-create, resize, rotate, sync)

### Part 2: Advanced Features ✅

- [ ] PR #6: Multi-Select (shift-click, marquee, multi-move)
- [ ] PR #7: Grouping & Z-Index (group/ungroup, 4 layer controls, sync)
- [ ] PR #8: Alignment Tools (6 alignments, 2 distribute, sync)
- [ ] PR #9: Keyboard Shortcuts (15+ shortcuts, all features)
- [ ] PR #10: Copy/Paste & Comments (clipboard, comment threads, sync)

### Part 3: AI Integration ✅

- [ ] PR #11: AI Service & Tools (15 tools, OpenAI integration, layout command)
- [ ] PR #12: System Prompt (context awareness, examples, shape identification)
- [ ] PR #13: AI Chat UI (bottom drawer, message history, input, commands work)

### Part 4: Testing & Deployment ✅

- [ ] PR #14: Integration Testing (all workflows, AI commands, multi-user)
- [ ] PR #15: Bug Fixes & Polish (P0/P1 bugs, loading states, UX improvements)
- [ ] PR #16: Demo Video (3-5 min, all features, layout command, uploaded)
- [ ] PR #17: Final Docs & Deploy (README, architecture, production tested)

### Final Verification

- [ ] All 17 PRs merged and deployed
- [ ] Demo video submitted
- [ ] Production app fully tested with 5+ users
- [ ] All rubric requirements met
- [ ] Documentation complete
- [ ] Target score: 96-100 points achieved

---

## Success Metrics (from PRD)

### Required Features

- [ ] Resize, rotate, text, delete, duplicate working
- [ ] Circles and triangles working
- [ ] Multi-select (shift-click + marquee)
- [ ] Object grouping
- [ ] Z-index management
- [ ] Alignment tools (6 types + distribute)
- [ ] Keyboard shortcuts (15+)
- [ ] Copy/paste
- [ ] Collaborative comments
- [ ] AI agent with 15 tools
- [ ] AI layout command ("arrange in a row") ⚠️ CRITICAL
- [ ] AI complex commands (login form, grid)
- [ ] Demo video (3-5 min, all requirements)
- [ ] Deployed to production
- [ ] 5+ concurrent users tested

### Performance Targets

- [ ] All features sync <100ms
- [ ] AI single-step commands <2s
- [ ] AI multi-step commands <5s
- [ ] 60 FPS maintained
- [ ] Canvas works with 500+ shapes

### Rubric Scoring Targets

- Collaborative Infrastructure: 28-30/30 ✅
- Canvas Features: 18-20/20 ✅
- Advanced Features: 13-15/15 ✅
- AI Agent: 23-25/25 ✅
- Technical: 9-10/10 ✅
- Documentation: 5/5 ✅
- AI Dev Log: PASS ✅
- Demo Video: PASS ✅

**Total Target: 96-100 points (A+)**

---

## Notes

- **Working Directory:** All commands run from `collabcanvas/` directory
- **Deploy Frequency:** Deploy after each PR to verify in production
- **AI Action Plans:** Always create action plan FIRST, get approval, then implement
- **Test Gates:** Follow test gates in action plans to verify sub-tasks before proceeding
- **Critical Feature:** "Arrange in a row" layout command is REQUIRED for AI rubric points
- **OpenAI Costs:** Monitor API usage, use GPT-3.5-turbo for dev testing if needed
- **Timeline:** 72 hours total, ~4 hours per PR average

---

**Ready to begin Phase 2! Start with PR #1 by asking AI to create the action plan.**

