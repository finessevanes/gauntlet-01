# PRD: Text Layers Foundation (PR1)

**Feature:** Text Layer Support - Foundation Only  
**Version:** 1.0 (Foundation PR1 of 3)  
**Status:** Ready for Development  
**Estimated Effort:** 4-6 hours

---

## Overview

This is **PR1 of 3** for text layer support. This foundational PR establishes basic text shape creation and rendering using Konva's native `<Text>` component. Users will be able to place text shapes on the canvas with hardcoded "TEXT" content. Text editing, formatting controls, and transformation tools are explicitly out of scope for this PR.

**What's In PR1:**
- Click text tool → click canvas → text shape appears
- Text displays "TEXT" placeholder (not editable)
- Dotted border indicating text selection
- Zoom-independent sizing (24px default)
- Real-time Firestore sync
- Lock system integration

**What's Coming Later:**
- PR2: Text editing (double-click to edit)
- PR3: Formatting controls (bold, italic, font size, rotation)

---

## Technical Architecture

### Why Konva Native (Not HTML Overlay)

**Previous Approach (Failed):**
- HTML `<input>` overlays positioned above canvas
- Caused zoom/pan positioning bugs
- Z-index conflicts with other UI elements
- Poor performance with multiple text shapes

**New Approach (Konva Native):**
- Use Konva `<Text>` component directly
- Integrates with canvas coordinate system
- No positioning bugs
- Handles zoom/pan automatically
- Consistent with other shapes

### Rendering Strategy

```typescript
// Konva Text component
<Text
  text="TEXT"                    // Hardcoded in PR1
  x={shape.x}
  y={shape.y}
  fontSize={24}                  // Fixed in PR1
  fill={shape.color}
  draggable={isLockedByMe}
  onClick={handleTextClick}
  // Dotted border via separate Rect component
/>
```

### Zoom Independence

Text appears the same physical size regardless of zoom level:
- Base fontSize: 24px at 100% zoom
- Konva handles scaling automatically
- Readable at all zoom levels (25%-200%)

---

## Goals

1. **Text Tool Activation** - Users can activate text placement mode
2. **Text Creation** - Users can click canvas to place text shapes
3. **Visual Feedback** - Dotted border indicates text selection
4. **Real-time Sync** - Text syncs to Firestore in <100ms
5. **Lock Integration** - Text respects existing lock system

---

## User Stories

### As a User
- I want to click the text tool so I can activate text placement mode
- I want to click on the canvas so a text shape appears at that position
- I want to see a dotted border so I know the text shape is selected
- I want to lock/move/delete text like other shapes

### As a Collaborator
- I want to see when someone creates text in <100ms
- I want to see green borders when someone locks text
- I want to lock and move text that others created

---

## Data Model

### Text Shape Structure

**Path:** `projects/{projectId}/canvases/main/shapes/{shapeId}`

```typescript
{
  id: string,                    // Firestore auto-generated ID
  type: "text",                  // New shape type
  text: "TEXT",                  // Hardcoded in PR1
  x: number,                     // Click position X
  y: number,                     // Click position Y
  fontSize: 24,                  // Fixed in PR1
  color: string,                 // From selected color
  rotation: 0,                   // Fixed in PR1
  zIndex: number,                // Auto-assigned
  groupId: null,                 // Not used in PR1
  createdBy: string,             // Creator UID
  createdAt: Timestamp,
  lockedBy: string | null,       // Lock system
  lockedAt: Timestamp | null,
  updatedAt: Timestamp
}
```

**Note:** Reuses existing `ShapeData` type with `type: "text"`. No new TypeScript interfaces needed.

---

## API Specification

### canvasService.ts Extension

```typescript
// Create text shape (simplified for PR1)
async createText(
  projectId: string,
  textData: {
    x: number;
    y: number;
    color: string;
    createdBy: string;
  }
): Promise<string> {
  const textRef = doc(
    collection(firestore, `projects/${projectId}/canvases/main/shapes`)
  );
  
  await setDoc(textRef, {
    id: textRef.id,
    type: 'text',
    text: 'TEXT',              // Hardcoded
    x: textData.x,
    y: textData.y,
    fontSize: 24,              // Fixed
    color: textData.color,
    rotation: 0,
    zIndex: await this.getNextZIndex(projectId),
    groupId: null,
    createdBy: textData.createdBy,
    createdAt: serverTimestamp(),
    lockedBy: null,
    lockedAt: null,
    updatedAt: serverTimestamp()
  });
  
  return textRef.id;
}
```

**Note:** No update methods needed in PR1. Text content is immutable until PR2.

---

## UI Components

### 1. Toolbar Updates

**Add Text Tool Button:**

Current: `[Rectangle] [Circle] [Triangle] | [Color Palette]`  
Updated: `[Rectangle] [Circle] [Triangle] [Text] | [Color Palette]`

**Icon:** "T" or text icon (already exists)
**Behavior:**
- Click to activate text placement mode
- Click canvas to create text at click position
- Text automatically created with current selected color

### 2. Canvas Text Rendering

```typescript
// In Canvas.tsx
{shape.type === 'text' && (
  <>
    {/* Konva Text */}
    <Text
      text="TEXT"
      x={shape.x}
      y={shape.y}
      fontSize={24}
      fill={shape.color}
      draggable={isLockedByMe}
      onClick={() => handleShapeClick(shape.id)}
    />
    
    {/* Dotted border when selected */}
    {selectedShapeId === shape.id && (
      <Rect
        x={shape.x}
        y={shape.y}
        width={/* calculated from text width */}
        height={28}  // fontSize + padding
        stroke="#3b82f6"
        strokeWidth={2}
        dash={[5, 5]}
        listening={false}
      />
    )}
  </>
)}
```

### 3. Lock System Integration

Text shapes use existing lock system:
- **Green border:** Locked by current user (can move/delete)
- **Red border:** Locked by another user (read-only)
- **No border:** Unlocked (clickable)

No new lock UI needed. Reuse existing `ShapeCommentIndicator` or lock border logic.

---

## State Management

### CanvasContext Updates

Add text tool to existing tool selection:

```typescript
interface CanvasContextType {
  selectedTool: 'select' | 'rectangle' | 'circle' | 'triangle' | 'text';
  // ... existing properties
}
```

**Note:** No `editingTextId` state needed until PR2 (editing).

### useCanvas Hook Updates

```typescript
const { projectId } = useContext(CanvasContext);

const createText = async (x: number, y: number, color: string, userId: string) => {
  if (!projectId) throw new Error("No project selected");
  return canvasService.createText(projectId, { x, y, color, createdBy: userId });
};
```

---

## Implementation Phases

### Phase 1: Service Layer (1-2 hours)
1. Add `createText` method to `canvasService.ts`
2. Ensure method uses `projectId` parameter
3. Set hardcoded values: `text: "TEXT"`, `fontSize: 24`, `rotation: 0`

### Phase 2: UI Layer (2-3 hours)
1. Add text tool button to `ToolPalette.tsx`
2. Add `'text'` to `selectedTool` type in `CanvasContext`
3. Handle text tool click in Canvas.tsx
4. Render Konva `<Text>` component for text shapes
5. Add dotted border for selected text shapes
6. Wire up click handler to create text at click position

### Phase 3: Testing & Polish (1 hour)
1. Test text creation at various canvas positions
2. Test zoom levels (25%, 100%, 200%)
3. Verify lock system works with text
4. Test real-time sync with collaborator
5. Verify text respects existing delete/duplicate controls

---

## Testing Scenarios

### Scenario 1: Create Text
1. User A clicks "Text" tool in toolbar
2. User A clicks canvas at position (200, 150)
3. Text "TEXT" appears at (200, 150) with dotted border
4. User B sees "TEXT" at (200, 150) in <100ms

### Scenario 2: Text at Zoom Levels
1. User A sets zoom to 25%
2. User A creates text → text is readable
3. User A zooms to 200%
4. Text remains same physical size and readable

### Scenario 3: Lock Text
1. User A creates text "TEXT"
2. User A clicks text → locks it (green border)
3. User B sees green border (User A locked)
4. User B cannot move text
5. User A unlocks → User B can now lock it

### Scenario 4: Move & Delete Text
1. User A creates text
2. User A locks text
3. User A drags text to new position → syncs in <100ms
4. User A clicks delete → text removed → syncs in <100ms

### Scenario 5: Text Color
1. User A selects red color
2. User A creates text → text is red
3. User A selects blue color
4. User A creates another text → text is blue
5. First text remains red, second is blue

---

## Success Criteria

The feature is complete when:

1. ✅ Text tool button appears in toolbar
2. ✅ Clicking text tool activates text placement mode
3. ✅ Clicking canvas creates text shape at click position
4. ✅ Text displays "TEXT" as placeholder content
5. ✅ Text has dotted border when selected
6. ✅ Text is readable at all zoom levels (25%-200%)
7. ✅ Text syncs to Firestore in <100ms
8. ✅ Text respects lock system (green/red borders)
9. ✅ Text can be moved when locked by current user
10. ✅ Text can be deleted using existing controls
11. ✅ Text uses selected color from color palette

---

## Explicitly Out of Scope

**Not in PR1 (Coming in Future PRs):**

- ❌ Text editing (double-click to edit) → PR2
- ❌ Changing text content → PR2
- ❌ Font size dropdown → PR3
- ❌ Bold/italic/underline controls → PR3
- ❌ Text rotation handles → PR3
- ❌ Font family selection → Future
- ❌ Text alignment → Future
- ❌ Multi-line text → Future

---

## Error Handling

```typescript
// No project selected
if (!projectId) {
  throw new Error("No project selected");
}

// Invalid position (out of canvas bounds)
if (x < 0 || x > 5000 || y < 0 || y > 5000) {
  throw new Error("Text position out of canvas bounds");
}
```

**UI Error Display:**
- Toast notification on creation failure
- Console error logging for debugging
- Graceful fallback (no text created, tool remains active)

---

## Notes for Development

### Path Pattern

Always use `projectId` in Firestore paths:

```typescript
const path = `projects/${projectId}/canvases/main/shapes`;
```

### Shape Type Check

```typescript
if (shape.type === 'text') {
  // Render text component
}
```

### Default Values

All text shapes in PR1 use these defaults:
- `text: "TEXT"` (hardcoded)
- `fontSize: 24` (fixed)
- `rotation: 0` (no rotation)
- `color`: From selected color palette

### Konva Text Width Calculation

For dotted border sizing:

```typescript
const textWidth = konvaTextNode.getTextWidth();
const textHeight = konvaTextNode.getTextHeight();
```

---

## Questions & Clarifications

If you encounter any ambiguity during development:

1. **Data Model Questions** → Refer to "Data Model" section
2. **API Questions** → Refer to "API Specification" section
3. **UI Questions** → Refer to "UI Components" section
4. **Scope Questions** → Refer to "Explicitly Out of Scope" section

---
