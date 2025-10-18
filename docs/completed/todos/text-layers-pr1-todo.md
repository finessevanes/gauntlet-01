# PR #TEXT-LAYERS-PR1: Text Layer Foundation - Todo Checklist

**Timeline:** 4-6 hours  
**Depends On:** None (Foundation PR)

---

## Implementation Tasks

### src/services/canvasService.ts

#### createText() Method
- [x] Add `createText()` method with parameters (projectId, textData)
- [x] Set hardcoded `text: "TEXT"` value
- [x] Set fixed `fontSize: 24` value
- [x] Set fixed `rotation: 0` value
- [x] Set `type: 'text'`
- [x] Accept x, y coordinates from textData parameter
- [x] Accept color from textData parameter
- [x] Accept createdBy from textData parameter
- [x] Call `getNextZIndex(projectId)` for zIndex assignment
- [x] Set `groupId: null`
- [x] Set `lockedBy: null` and `lockedAt: null`
- [x] Use `serverTimestamp()` for createdAt and updatedAt
- [x] Return textRef.id (shape ID)

### src/contexts/CanvasContext.tsx

#### Type Updates
- [x] Add 'text' to selectedTool union type ('select' | 'rectangle' | 'circle' | 'triangle' | 'text')
- [x] Verify existing CanvasContextType supports text shapes
- [x] Ensure no new state needed for PR1 (editingTextId comes in PR2)

### src/hooks/useCanvas.ts

#### createText Hook Method
- [x] Add `createText` method to hook
- [x] Accept parameters: x, y, color, userId
- [x] Validate projectId is defined
- [x] Call `canvasService.createText(projectId, { x, y, color, createdBy: userId })`
- [x] Return shape ID from service call
- [x] Add error handling with proper error message

### src/components/Canvas/ToolPalette.tsx

#### Text Tool Button
- [x] Use current "T" icon or text icon
- [x] Wire up onClick to set selectedTool to 'text'
- [x] Add active state styling when selectedTool === 'text'
- [x] Ensure button follows existing toolbar styling

### src/components/Canvas/Canvas.tsx

#### Text Tool Click Handler
- [x] Add handler for canvas click when selectedTool === 'text'
- [x] Get click position (x, y) from Konva event
- [x] Get current selected color from context
- [x] Get current userId from auth context
- [x] Call createText(x, y, color, userId)
- [x] Reset selectedTool to 'select' after text creation (Note: Tool stays active for multiple text creation, consistent with other tools)

#### Text Shape Rendering
- [x] Add condition check `shape.type === 'text'` in shape rendering
- [x] Render Konva `<Text>` component with text prop
- [x] Set x={shape.x} and y={shape.y}
- [x] Set fontSize={24} (or shape.fontSize if exists)
- [x] Set fill={shape.color}
- [x] Set draggable={isLockedByMe} (integrate with existing lock logic)
- [x] Wire up onClick handler to handleShapeClick

#### Dotted Border for Selected Text
- [x] Add dotted border Rect when selectedShapeId === shape.id
- [x] Calculate text width using Konva textNode.getTextWidth()
- [x] Calculate text height using Konva textNode.getTextHeight()
- [x] Set Rect stroke="#3b82f6" (blue)
- [x] Set strokeWidth={2}
- [x] Set dash={[5, 5]} for dotted effect
- [x] Set listening={false} so border doesn't block clicks
- [x] Position border at shape.x, shape.y

#### Lock System Integration
- [x] Verify text shapes use existing lock border logic
- [x] Green border when locked by current user
- [x] Red border when locked by another user
- [x] No special handling needed (reuse existing ShapeCommentIndicator or lock logic)

---

## Testing Scenarios

### Test 1: Create Text
- [x] Click "Text" tool in toolbar
- [x] Verify text tool becomes active (highlighted button)
- [x] Click canvas at position (200, 150)
- [x] Verify text "TEXT" appears at (200, 150)
- [x] Verify text has dotted blue border (selected state)
- [x] Verify text uses currently selected color
- [x] Open second browser/user session
- [x] Verify collaborator sees "TEXT" at (200, 150) in <100ms

### Test 2: Text at Zoom Levels
- [x] Set zoom to 25% using zoom controls
- [x] Create text at any position
- [x] Verify text is readable at 25% zoom
- [x] Set zoom to 100%
- [x] Verify text remains same physical size
- [x] Set zoom to 200%
- [x] Verify text remains same physical size and readable
- [x] Verify no positioning bugs at different zoom levels

### Test 3: Lock Text
- [x] Create text "TEXT" at any position
- [x] Click text shape to lock it
- [x] Verify green border appears (locked by current user)
- [x] Open collaborator session
- [x] Verify collaborator sees green border with current user's name
- [x] Collaborator attempts to drag text
- [x] Verify collaborator cannot move text
- [x] Current user clicks elsewhere to unlock
- [x] Verify collaborator can now lock and move text

### Test 4: Move & Delete Text
- [x] Create text at position (500, 500)
- [x] Click text to lock it
- [x] Drag text to new position (800, 800)
- [x] Verify text moves smoothly
- [x] Verify collaborator sees move in <100ms
- [x] Click text to select it
- [x] Press Delete key (or use delete button)
- [x] Verify text disappears from canvas
- [x] Verify collaborator sees deletion in <100ms

### Test 5: Text Color
- [x] Select red color from color palette
- [x] Create text at position (1000, 1000)
- [x] Verify text appears in red
- [x] Select blue color from color palette
- [x] Create another text at position (1200, 1000)
- [x] Verify second text appears in blue
- [x] Verify first text remains red
- [x] Verify both texts maintain colors after refresh

---

## Success Criteria Verification

### Core Implementation
- [x] Text tool button appears in toolbar after triangle button
- [x] Clicking text tool activates text placement mode
- [] Clicking canvas creates text shape at exact click position
- [x] Text displays "TEXT" as placeholder content (hardcoded)
- [x] Text has dotted blue border when selected
- [x] Text is readable at zoom level 25%
- [x] Text is readable at zoom level 100%
- [x] Text is readable at zoom level 200%
- [x] Text maintains same physical size across all zoom levels

### Real-time Sync & Collaboration
- [x] Text syncs to Firestore in <100ms after creation
- [x] Text respects lock system (shows green border when locked by self)
- [x] Text shows red border when locked by another user
- [x] Text can be moved when locked by current user
- [x] Text movement syncs to collaborators in <100ms
- [x] Text can be deleted using existing controls (Delete key or button)
- [x] Text deletion syncs to collaborators in <100ms
- [x] Text uses selected color from color palette
- [x] Multiple text shapes can exist with different colors

### Data Integrity
- [x] Text shapes saved with correct Firestore path: `projects/{projectId}/canvases/main/shapes/{shapeId}`
- [x] Text shape has all required fields (id, type, text, x, y, fontSize, color, rotation, zIndex, groupId, createdBy, createdAt, lockedBy, lockedAt, updatedAt)
- [x] Text shape type field is exactly "text"
- [x] Text content field is exactly "TEXT" (hardcoded)
- [x] fontSize is exactly 24 (hardcoded)
- [x] rotation is exactly 0 (hardcoded)
- [x] zIndex is properly assigned and incremental
- [x] createdBy contains valid user UID
- [x] Timestamps are server-generated

---

## Quality Checks

### Code Quality
- [ ] No TypeScript errors in canvasService.ts
- [ ] No TypeScript errors in CanvasContext.tsx
- [ ] No TypeScript errors in useCanvas.ts
- [ ] No TypeScript errors in ToolPalette.tsx
- [ ] No TypeScript errors in Canvas.tsx
- [ ] No console errors during text creation
- [ ] No console warnings during text rendering
- [ ] Code follows existing patterns and conventions

### Performance
- [ ] Text creation completes in <100ms
- [ ] Text rendering doesn't cause canvas lag
- [ ] Multiple text shapes (10+) render smoothly
- [ ] Zoom changes don't cause text flickering
- [ ] Pan/drag operations remain smooth with text shapes

### Edge Cases
- [ ] Creating text at canvas edge (0, 0) works correctly
- [ ] Creating text at canvas far corner (5000, 5000) works correctly
- [ ] Creating text with different colors works
- [ ] Switching between text tool and other tools works
- [ ] Creating text, then immediately creating rectangle works
- [ ] Text survives page refresh
- [ ] Text survives user logout/login

---

## Final Sign-Off

- [ ] All canvasService.ts tasks completed (13 items)
- [ ] All CanvasContext.tsx tasks completed (3 items)
- [ ] All useCanvas.ts tasks completed (6 items)
- [ ] All ToolPalette.tsx tasks completed (6 items)
- [ ] All Canvas.tsx tasks completed (15 items)
- [ ] All 5 test scenarios executed and passing
- [ ] All 27 success criteria verified
- [ ] All 8 code quality checks passing
- [ ] All 5 performance checks verified
- [ ] All 7 edge cases tested
- [ ] No regressions in existing shape functionality
- [ ] Ready to merge PR #TEXT-LAYERS-PR1

**Next Step:** Move to PR #TEXT-LAYERS-PR2 (Text Editing - double-click to edit, content changes)

---

## Notes & Reminders

### Hardcoded Values in PR1
- `text: "TEXT"` - Do not make editable yet
- `fontSize: 24` - Do not add size controls yet
- `rotation: 0` - Do not add rotation handles yet

### Explicitly Out of Scope (Wait for PR2/PR3)
- ❌ Text editing (double-click to edit) → PR2
- ❌ Changing text content → PR2
- ❌ Font size dropdown → PR3
- ❌ Bold/italic/underline controls → PR3
- ❌ Text rotation handles → PR3
- ❌ Font family selection → Future
- ❌ Text alignment → Future
- ❌ Multi-line text → Future

### Implementation Tips
- Reuse existing ShapeData type, no new interfaces needed
- Use Konva native `<Text>` component, not HTML overlay
- Zoom independence is automatic with Konva
- Lock system integration uses existing logic
- Follow path pattern: `projects/${projectId}/canvases/main/shapes`

### Error Handling
- Validate projectId exists before creating text
- Validate position within canvas bounds (0-5000, 0-5000)
- Show toast notification on creation failure
- Log errors to console for debugging
- Graceful fallback: keep text tool active on failure

