# Text Layers PR3: Text Formatting Toolbar

## Overview
Wire up the existing text formatting toolbar controls to actually apply formatting to text elements. The UI components already exist in the ToolPalette - they just need to be connected to the backend formatting logic.

## Scope

### Current State
- ✅ **UI Components**: Bold, Italic, Underline buttons and Font Size controls already exist in `ToolPalette.tsx`
- ✅ **Visual States**: Active/inactive states and disabled states are already implemented
- ✅ **Input Validation**: Font size validation (1-500px) and preset dropdown already working
- ❌ **Backend Logic**: Handler functions are currently no-op stubs in `AppShell.tsx`

### Text Formatting Controls (UI Complete - Need Wiring)
The following controls exist but need backend implementation:

1. **Bold Button** ✅ UI Complete
   - Icon: B (bold) 
   - Visual state: Active/inactive based on current text selection ✅
   - **NEEDED**: Backend toggle logic and Firestore updates

2. **Italic Button** ✅ UI Complete  
   - Icon: I (italic)
   - Visual state: Active/inactive based on current text selection ✅
   - **NEEDED**: Backend toggle logic and Firestore updates

3. **Underline Button** ✅ UI Complete
   - Icon: U (underline)
   - Visual state: Active/inactive based on current text selection ✅
   - **NEEDED**: Backend toggle logic and Firestore updates

4. **Font Size Control** ✅ UI Complete
   - Preset options: 12, 16, 20, 24, 32, 40, 48px ✅
   - Custom input field for arbitrary sizes ✅
   - Shows current font size when text is selected ✅
   - **NEEDED**: Backend font size update logic and Firestore updates

### Existing Functionality (Completed)
- ✅ Drag to move text (same as shapes)
- ✅ Transformer with rotate/resize handles (same as shapes)
- ✅ Text formatting UI components and visual states
- ✅ Font size input validation and preset dropdown

## Technical Requirements

### Backend Implementation Needed
The UI components already exist in `ToolPalette.tsx`. The following backend logic needs to be implemented:

### Handler Functions (Currently No-Op Stubs)
Replace the no-op functions in `AppShell.tsx`:
- `handleToggleBold()` - Currently: `// No-op: text formatting removed`
- `handleToggleItalic()` - Currently: `// No-op: text formatting removed`  
- `handleToggleUnderline()` - Currently: `// No-op: text formatting removed`
- `handleChangeFontSize()` - Currently: `// No-op: text formatting removed`

### Canvas Service Integration
- Add `updateTextFormatting()` method to `canvasService.ts`
- Handle Firestore updates for formatting changes
- Support real-time collaboration for formatting changes

### Konva Text Rendering Updates
- Update text rendering to apply formatting (bold, italic, underline)
- Handle font size changes in text rendering
- Ensure formatting persists after text editing

### State Management
- Track active formatting states (bold, italic, underline) ✅ Already implemented
- Monitor current font size ✅ Already implemented  
- Handle toolbar visibility ✅ Already implemented
- **NEEDED**: Connect formatting state to actual text properties

## User Experience

### Visual Design
- Consistent with existing ColorToolbar styling
- Clear visual feedback for active states
- Smooth animations for show/hide
- Accessible color contrast

### Interaction Flow
1. User selects text element
2. Formatting toolbar appears near text
3. User applies formatting (toolbar persists)
4. User enters edit mode (toolbar remains visible)
5. User can continue formatting while editing
6. Toolbar hides when text is deselected

### Keyboard Support
- Standard formatting shortcuts (Ctrl/Cmd + B/I/U)
- Support for copying, pasting, and duplicating (Ctrl/Cmd + C/V/D)
- Tab navigation within toolbar
- Enter to confirm font size changes
- Escape to close dropdowns

## Success Criteria

### Functional Requirements
- [ ] Bold formatting works correctly (wire up backend)
- [ ] Italic formatting works correctly (wire up backend)
- [ ] Underline formatting works correctly (wire up backend)
- [ ] Font size changes apply immediately (wire up backend)
- [ ] Custom font sizes are supported ✅ Already implemented
- [ ] Toolbar appears/disappears appropriately ✅ Already implemented
- [ ] Toolbar persists during text editing ✅ Already implemented
- [ ] Keyboard shortcuts work as expected (add keyboard handlers)

### Performance Requirements
- [ ] Toolbar renders without lag ✅ Already implemented
- [ ] Formatting changes apply instantly (wire up backend)
- [ ] No impact on canvas performance ✅ Already implemented
- [ ] Smooth animations (60fps) ✅ Already implemented

### Accessibility Requirements
- [ ] All controls are keyboard accessible ✅ Already implemented
- [ ] Screen reader support for toolbar ✅ Already implemented
- [ ] High contrast mode compatibility ✅ Already implemented
- [ ] Focus indicators visible ✅ Already implemented

## Implementation Notes

### Current Implementation Status
- ✅ **UI Components**: All formatting controls exist in `ToolPalette.tsx`
- ✅ **Visual States**: Active/inactive states working correctly
- ✅ **Input Validation**: Font size validation and preset dropdown working
- ❌ **Backend Logic**: Handler functions are no-op stubs in `AppShell.tsx`
- ❌ **Firestore Integration**: No formatting updates to database
- ❌ **Konva Rendering**: Text doesn't apply formatting visually

### Implementation Tasks
1. **Replace No-Op Handlers** in `AppShell.tsx`:
   - Implement `handleToggleBold()` with actual toggle logic
   - Implement `handleToggleItalic()` with actual toggle logic  
   - Implement `handleToggleUnderline()` with actual toggle logic
   - Implement `handleChangeFontSize()` with actual size logic

2. **Add Canvas Service Method**:
   - Create `updateTextFormatting()` in `canvasService.ts`
   - Handle Firestore updates for formatting changes
   - Support real-time collaboration

3. **Update Konva Text Rendering**:
   - Apply `fontWeight`, `fontStyle`, `textDecoration` to Konva Text components
   - Handle font size changes in text rendering
   - Ensure formatting persists after text editing

4. **Add Keyboard Shortcuts**:
   - Implement Ctrl/Cmd + B for bold
   - Implement Ctrl/Cmd + I for italic
   - Implement Ctrl/Cmd + U for underline

### Dependencies
- ✅ Text editing system (existing)
- ✅ Canvas selection system (existing) 
- ✅ Keyboard event system (existing)
- ✅ CSS animation system (existing)

### Testing Requirements
- Unit tests for new formatting functions
- Integration tests for toolbar behavior
- ✅ Accessibility testing (already implemented)
- ✅ Cross-browser compatibility (already implemented)

### Future Enhancements
- Text color picker
- Font family selection
- Text alignment controls
- Line spacing controls
- Text effects (shadow, outline)

## Acceptance Criteria

1. **Formatting Controls**: All 4 formatting controls work correctly with proper visual feedback ✅ UI Complete, ❌ Backend Needed
2. **Toolbar Positioning**: Toolbar appears in correct position relative to selected text ✅ Already implemented
3. **Persistence**: Toolbar remains visible during text editing mode ✅ Already implemented
4. **Keyboard Support**: All keyboard shortcuts work as expected ❌ Need to implement
5. **Performance**: No noticeable lag when applying formatting ✅ UI Complete, ❌ Backend Needed
6. **Accessibility**: Toolbar is fully accessible via keyboard and screen readers ✅ Already implemented
7. **Integration**: Seamlessly works with existing text and canvas systems ❌ Need to wire up backend

## Dependencies
- ✅ Text editing system (existing)
- ✅ Canvas selection system (existing)
- ✅ Keyboard event system (existing)
- ✅ CSS animation system (existing)
