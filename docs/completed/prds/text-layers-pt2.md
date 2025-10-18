# PRD: Text Editing Implementation

**Feature:** In-Place Text Editing for Canvas Shapes  
**Version:** 1.0  
**Status:** Ready for Development  
**Estimated Effort:** 8-10 hours

---

## Overview

This PRD implements **in-place text editing** for text shapes on the collaborative canvas. Users can double-click any text shape to enter edit mode, type directly, and save changes. The implementation provides a Figma-like editing experience with pixel-perfect HTML overlay positioning that works seamlessly across all zoom levels and pan positions.

**Current State:**
- ✅ Text shapes can be created and displayed
- ✅ Text shapes support basic properties (text, fontSize, color, fontWeight, etc.)
- ✅ Lock system integration works
- ✅ Real-time Firestore sync works
- ❌ **Text editing is not implemented**

**Goal:** Enable users to edit text content with a seamless, professional editing experience.

---

## User Stories

### As a Designer
- I want to double-click a text shape and start typing immediately
- I want my cursor to appear exactly where the text is, without any visual jump
- I want to press **Enter** to save my changes quickly
- I want to press **Escape** to cancel if I change my mind
- I want the editing experience to work at any zoom level (50%, 100%, 200%)

### As a Collaborator
- I want to see text changes update in real-time when another user saves
- I want to be prevented from editing text that someone else is currently editing
- I want to see a visual indication when text is being edited by another user

---

## Technical Requirements

### 1. State Management

**Add to CanvasContext:**
```typescript
interface CanvasContextType {
  // Existing properties...
  
  // Text editing state
  editingTextId: string | null;
  enterEdit: (shapeId: string) => void;
  saveText: (shapeId: string, text: string) => Promise<void>;
  cancelEdit: () => void;
}
```

**Implementation:**
- `editingTextId`: Tracks which text shape is currently being edited
- `enterEdit()`: Enters edit mode for a specific text shape
- `saveText()`: Saves text changes to Firestore
- `cancelEdit()`: Exits edit mode without saving

### 2. Text Editor Overlay Component

**Create `TextEditorOverlay.tsx`:**
```typescript
interface TextEditorOverlayProps {
  shapeId: string;
  initialText: string;
  position: { x: number; y: number };
  fontSize: number;
  color: string;
  onSave: (text: string) => void;
  onCancel: () => void;
}
```

**Key Features:**
- HTML `<input>` element positioned absolutely
- Pixel-perfect alignment with Konva text node
- Auto-focus and text selection on mount
- Real-time position updates during zoom/pan
- Keyboard event handling (Enter/Escape)

### 3. Position Calculation Algorithm

**Critical Requirement:** The HTML overlay must appear exactly where the Konva text is rendered.

```typescript
const calculateOverlayPosition = (
  textNode: Konva.Text,
  stage: Konva.Stage,
  container: HTMLElement
) => {
  // Get absolute position of text node in canvas coordinates
  const canvasPoint = textNode.getAbsolutePosition();
  
  // Get stage transform
  const { x: stageX, y: stageY } = stage.position();
  const zoom = stage.scaleX(); // scaleX === scaleY
  
  // Get container offset
  const containerRect = container.getBoundingClientRect();
  
  // Transform to screen coordinates
  const screenX = (canvasPoint.x - stageX) * zoom + containerRect.left;
  const screenY = (canvasPoint.y - stageY) * zoom + containerRect.top;
  
  return { x: screenX, y: screenY, zoom };
};
```

### 4. Canvas Service Integration

**Add to `canvasService.ts`:**
```typescript
async updateShapeText(shapeId: string, text: string): Promise<void> {
  try {
    const shapeRef = doc(firestore, this.shapesCollectionPath, shapeId);
    await updateDoc(shapeRef, {
      text: text,
      updatedAt: serverTimestamp()
    });
    console.log('✅ Text updated:', shapeId);
  } catch (error) {
    console.error('❌ Error updating text:', error);
    throw error;
  }
}
```

### 5. Konva Integration

**Update `CanvasShape.tsx`:**
- Add `onDblClick` handler to text shapes
- Auto-enter edit mode for newly created text
- Hide Konva text during editing to prevent overlap
- Disable canvas pan/zoom while editing

---

## Implementation Phases

### Phase 1: Context & State (2 hours)
- [ ] Add `editingTextId` state to `CanvasContext`
- [ ] Implement `enterEdit()`, `saveText()`, `cancelEdit()` functions
- [ ] Update `CanvasProvider` with new state management
- [ ] Expose functions in `useCanvas` hook

### Phase 2: Text Editor Overlay (3 hours)
- [ ] Create `TextEditorOverlay.tsx` component
- [ ] Implement position calculation algorithm
- [ ] Add auto-focus and text selection
- [ ] Handle keyboard events (Enter/Escape)
- [ ] Style overlay to match text appearance

### Phase 3: Canvas Service (1 hour)
- [ ] Add `updateShapeText()` method to `canvasService.ts`
- [ ] Use server timestamp for `updatedAt` field
- [ ] Handle Firestore write errors gracefully

### Phase 4: Konva Integration (2 hours)
- [ ] Add `onDblClick` handler to text shapes
- [ ] Auto-enter edit mode for new text creation
- [ ] Hide Konva text during editing
- [ ] Disable canvas interactions while editing

### Phase 5: Testing & QA (2 hours)
- [ ] Test at 50%, 100%, 200% zoom levels
- [ ] Test panning during edit mode
- [ ] Test lock system enforcement
- [ ] Cross-browser compatibility testing

---

## Technical Specifications

### Position Calculation Requirements

**Critical:** The overlay must align within 1 pixel tolerance at all zoom levels.

**Algorithm:**
1. Get absolute position of Konva text node: `node.getAbsolutePosition()`
2. Transform to screen coordinates accounting for:
   - Stage zoom (`stage.scaleX()`, `stage.scaleY()`)
   - Stage position (`stage.x`, `stage.y`)
   - Container offset (`getBoundingClientRect()`)
3. Update position on zoom/pan events during editing

### State Management Flow

```
User double-clicks text shape
    ↓
enterEdit(shapeId) called
    ↓
editingTextId = shapeId
    ↓
TextEditorOverlay rendered with calculated position
    ↓
User types and presses Enter
    ↓
saveText(shapeId, newText) called
    ↓
Firestore updated with server timestamp
    ↓
editingTextId = null
    ↓
TextEditorOverlay unmounted
```

### Lock System Integration

- Only the user who locked the shape can edit it
- Other users see the text as read-only
- Lock status checked before entering edit mode
- Visual feedback for locked text shapes

---

## Acceptance Criteria

### Functional Requirements
- [ ] Double-click text shape enters edit mode
- [ ] Newly created text automatically enters edit mode
- [ ] Enter key saves changes to Firestore
- [ ] Escape key cancels editing without saving
- [ ] Click outside saves changes (blur behavior)
- [ ] Lock system prevents unauthorized editing

### Technical Requirements
- [ ] Overlay alignment ≤ 1 pixel tolerance
- [ ] No visible jump when entering/exiting edit mode
- [ ] Works at 50%, 100%, 200% zoom levels
- [ ] Works after panning canvas to any position
- [ ] Overlay repositions correctly during zoom/pan
- [ ] Real-time updates visible to other users

### Performance Requirements
- [ ] Edit mode entry < 50ms response time
- [ ] Smooth repositioning during zoom/pan
- [ ] No memory leaks from overlay components
- [ ] Firestore updates complete within 200ms

### Accessibility Requirements
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Screen reader compatible
- [ ] Focus management during edit mode
- [ ] Clear visual feedback for editing state

---

## Risk Mitigation

### High-Risk Areas

1. **Position Calculation Accuracy**
   - **Risk:** Overlay misalignment at different zoom levels
   - **Mitigation:** Extensive testing at multiple zoom levels, unit tests for position calculation

2. **Real-time Synchronization**
   - **Risk:** Conflicts when multiple users edit simultaneously
   - **Mitigation:** Lock system enforcement, optimistic updates with conflict resolution

3. **Performance Impact**
   - **Risk:** Overlay repositioning causes lag during zoom/pan
   - **Mitigation:** Debounced position updates, efficient event handling

### Testing Strategy

1. **Unit Tests**
   - Position calculation algorithm
   - State management functions
   - Firestore update methods

2. **Integration Tests**
   - Edit mode entry/exit flow
   - Lock system integration
   - Real-time synchronization

3. **Manual QA**
   - Cross-browser testing (Chrome, Safari, Firefox)
   - Zoom level testing (25% to 300%)
   - Pan testing during edit mode
   - Multi-user collaboration testing

---

## Success Metrics

### User Experience
- **Edit Mode Entry:** < 50ms from double-click to overlay visible
- **Position Accuracy:** ≤ 1 pixel deviation at all zoom levels
- **Save Performance:** < 200ms from Enter key to Firestore update
- **User Satisfaction:** Seamless editing experience comparable to Figma

### Technical Performance
- **Memory Usage:** No significant increase during edit mode
- **CPU Usage:** Smooth 60fps during zoom/pan while editing
- **Network:** Efficient Firestore updates with minimal bandwidth

### Collaboration
- **Real-time Sync:** Changes visible to other users within 100ms
- **Conflict Resolution:** Lock system prevents editing conflicts
- **Multi-user:** Supports 10+ concurrent users editing different text shapes

---

## Out of Scope

The following features are explicitly **not included** in this implementation:

- **Text Formatting:** Bold, italic, underline controls
- **Multi-line Text:** Line breaks and paragraph support
- **Font Selection:** Font family dropdown
- **Text Alignment:** Left, center, right alignment options
- **Rich Text:** HTML formatting or markdown support
- **Text Rotation:** Rotating text shapes (handled by existing rotation system)
- **Mobile Editing:** Touch-optimized editing interface

These features will be addressed in future iterations.

---

## Implementation Notes

### Development Environment Setup
- Ensure React 18+ for proper portal support
- Konva 9+ for stable text node positioning
- Firebase 9+ for server timestamp support
- TypeScript strict mode for type safety

### Code Organization
```
src/
├── components/Canvas/
│   ├── TextEditorOverlay.tsx    # New overlay component
│   └── CanvasShape.tsx          # Updated with edit handlers
├── contexts/
│   └── CanvasContext.tsx       # Updated with edit state
├── services/
│   └── canvasService.ts        # Updated with updateShapeText
└── hooks/
    └── useCanvas.ts            # Updated with edit functions
```

### Testing Checklist
- [ ] Create text shape → auto-enter edit mode
- [ ] Double-click existing text → enter edit mode
- [ ] Type text → see changes in real-time
- [ ] Press Enter → save to Firestore
- [ ] Press Escape → cancel without saving
- [ ] Zoom to 50% → overlay still aligned
- [ ] Zoom to 200% → overlay still aligned
- [ ] Pan canvas → overlay follows text
- [ ] Lock text → cannot edit
- [ ] Multi-user → see other user's changes

---

## Conclusion

This PRD provides a complete roadmap for implementing text editing functionality. The implementation focuses on creating a seamless, professional editing experience that integrates perfectly with the existing canvas system while maintaining real-time collaboration capabilities.

Upon completion, users will be able to:
1. **Create text shapes** that automatically enter edit mode
2. **Edit existing text** by double-clicking
3. **Save changes** with Enter key or click outside
4. **Cancel editing** with Escape key
5. **Collaborate in real-time** with other users

The technical approach ensures pixel-perfect positioning, smooth performance, and robust collaboration features that meet professional design tool standards.
