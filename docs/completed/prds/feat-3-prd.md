# PRD: Text Layers Feature

**Feature:** Text Layer Support with Rich Formatting  
**Version:** 1.0 (MVP)  
**Status:** Ready for Development  
**Estimated Effort:** 12-16 hours

---

## Overview

Add support for text layers on the canvas, allowing users to create, edit, and format text elements. Text layers will behave like shape layers with additional text-specific properties (content, font size, bold, italic, underline).

---

## Goals

1. **Text Creation** - Users can add text elements to the canvas
2. **Text Editing** - Users can edit text content inline
3. **Font Sizing** - Users can adjust text size from predefined options
4. **Rich Formatting** - Users can apply bold, italic, and underline styles
5. **Real-time Sync** - Text changes sync across all collaborators

---

## User Stories

### As a User
- I want to add text to my canvas so I can label and annotate designs
- I want to edit text by double-clicking so I can fix typos
- I want to change font size so I can create visual hierarchy
- I want to make text bold, italic, or underlined for emphasis
- I want text changes to sync in real-time with collaborators

### As a Collaborator
- I want to see when someone is editing text (via lock indicator)
- I want to see text formatting updates immediately
- I want to edit text that others have created (when unlocked)

---

## Data Model

### Text Shape Structure

**Path:** `projects/{projectId}/canvases/main/shapes/{shapeId}`

```typescript
{
  id: string,                              // Firestore auto-generated ID
  type: "text",                            // Type can be: "rectangle" | "text" | "circle" | "triangle"
  text: string,                            // Text content
  x: number,                               // X position in canvas
  y: number,                               // Y position in canvas
  fontSize: number,                        // Font size in px (12-48 range)
  color: string,                           // Text color (default black)
  fontWeight: "normal" | "bold",           // Text formatting
  fontStyle: "normal" | "italic",          // Text formatting
  textDecoration: "none" | "underline",    // Text formatting
  rotation: number,                        // Rotation in degrees
  zIndex: number,                          // Stacking order
  groupId: string | null,                  // Group membership
  createdBy: string,                       // Creator UID
  createdAt: Timestamp,                    // Creation timestamp
  lockedBy: string | null,                 // Current lock holder UID
  lockedAt: Timestamp | null,              // Lock acquisition time
  updatedAt: Timestamp                     // Last update timestamp
}
```

---

## API Specification

### canvasService.ts Extensions

```typescript
// Create new text layer
async createText(
  projectId: string,
  textData: {
    text: string;
    x: number;
    y: number;
    fontSize: number;
    color: string;
    fontWeight?: "normal" | "bold";
    fontStyle?: "normal" | "italic";
    textDecoration?: "none" | "underline";
    createdBy: string;
  }
): Promise<string> {
  const textRef = doc(
    collection(firestore, `projects/${projectId}/canvases/main/shapes`)
  );
  await setDoc(textRef, {
    id: textRef.id,
    type: 'text',
    text: textData.text,
    x: textData.x,
    y: textData.y,
    fontSize: textData.fontSize,
    color: textData.color,
    fontWeight: textData.fontWeight || "normal",
    fontStyle: textData.fontStyle || "normal",
    textDecoration: textData.textDecoration || "none",
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

// Update text content
async updateText(projectId: string, shapeId: string, text: string): Promise<void> {
  const shapeRef = doc(firestore, `projects/${projectId}/canvases/main/shapes/${shapeId}`);
  await updateDoc(shapeRef, {
    text: text,
    updatedAt: serverTimestamp()
  });
}

// Update font size
async updateTextFontSize(projectId: string, shapeId: string, fontSize: number): Promise<void> {
  const shapeRef = doc(firestore, `projects/${projectId}/canvases/main/shapes/${shapeId}`);
  await updateDoc(shapeRef, {
    fontSize: fontSize,
    updatedAt: serverTimestamp()
  });
}

// Update text formatting (bold, italic, underline)
async updateTextFormatting(
  projectId: string,
  shapeId: string,
  formatting: {
    fontWeight?: "normal" | "bold";
    fontStyle?: "normal" | "italic";
    textDecoration?: "none" | "underline";
  }
): Promise<void> {
  const shapeRef = doc(firestore, `projects/${projectId}/canvases/main/shapes/${shapeId}`);
  await updateDoc(shapeRef, {
    ...formatting,
    updatedAt: serverTimestamp()
  });
}
```

---

## UI Components

### 1. Toolbar Updates

**Add Text Tool Button:**

Current layout: `[Rectangle] [Circle] [Triangle] | [Red] [Blue] [Green] [Yellow]`  
Updated layout: `[Rectangle] [Circle] [Triangle] [Text] | [Red] [Blue] [Green] [Yellow]`

**Text Tool Behavior:**
- Click "Text" button to activate text placement mode
- User clicks on canvas → text input appears
- Enter creates text, Escape cancels
- Double-click existing text to edit

### 2. Controls Panel for Text

**When Text Shape Selected:**

```
┌──────────────────────────────────┐
│ Text                             │
├──────────────────────────────────┤
│ [🗑️ Delete]  [📋 Duplicate]     │
├──────────────────────────────────┤
│ [B] [I] [U]  |  Font: [16px ▼]  │
└──────────────────────────────────┘
```

**Formatting Buttons:**
- **[B]** Bold toggle
- **[I]** Italic toggle  
- **[U]** Underline toggle
- Active state: Blue background (#3b82f6), white text
- Inactive state: Gray background, dark text
- Multiple formats can be active simultaneously (e.g., bold + italic)

**Font Size Dropdown:**
- Options: 12, 14, 16, 18, 20, 24, 32, 48 px
- Default: 16px
- Changes sync in real-time

### 3. Konva Text Rendering

```typescript
<Text
  text={shape.text}
  x={shape.x}
  y={shape.y}
  fontSize={shape.fontSize}
  fill={shape.color}
  fontStyle={
    shape.fontWeight === 'bold' && shape.fontStyle === 'italic' ? 'bold italic' : 
    shape.fontWeight === 'bold' ? 'bold' : 
    shape.fontStyle === 'italic' ? 'italic' : 
    'normal'
  }
  textDecoration={shape.textDecoration || 'none'}
  rotation={shape.rotation || 0}
  draggable={isLockedByMe}
  onClick={handleTextClick}
  onDblClick={handleTextEdit}
/>
```

---

## State Management

### CanvasContext Updates

Add text-specific state:

```typescript
interface CanvasContextType {
  projectId: string | null;
  setProjectId: (id: string) => void;
  selectedTool: 'select' | 'rectangle' | 'circle' | 'triangle' | 'text';
  editingTextId: string | null;
  setEditingTextId: (id: string | null) => void;
  // ... existing properties
}
```

### useCanvas Hook Updates

All operations use `projectId` from context:

```typescript
const { projectId } = useContext(CanvasContext);

const createText = async (textData: any) => {
  if (!projectId) throw new Error("No project selected");
  return canvasService.createText(projectId, textData);
};

const updateText = async (shapeId: string, text: string) => {
  if (!projectId) throw new Error("No project selected");
  return canvasService.updateText(projectId, shapeId, text);
};

const toggleBold = async (shapeId: string, currentWeight: string) => {
  if (!projectId) throw new Error("No project selected");
  const newWeight = currentWeight === 'bold' ? 'normal' : 'bold';
  return canvasService.updateTextFormatting(projectId, shapeId, { fontWeight: newWeight });
};

const toggleItalic = async (shapeId: string, currentStyle: string) => {
  if (!projectId) throw new Error("No project selected");
  const newStyle = currentStyle === 'italic' ? 'normal' : 'italic';
  return canvasService.updateTextFormatting(projectId, shapeId, { fontStyle: newStyle });
};

const toggleUnderline = async (shapeId: string, currentDecoration: string) => {
  if (!projectId) throw new Error("No project selected");
  const newDecoration = currentDecoration === 'underline' ? 'none' : 'underline';
  return canvasService.updateTextFormatting(projectId, shapeId, { textDecoration: newDecoration });
};
```

---

## Security Rules

### Firestore Rules

Text shapes use existing shape rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Canvas Shapes (includes text layers)
    match /projects/{projectId}/canvases/{canvasId}/shapes/{shapeId} {
      allow read, write: if request.auth != null && 
                            request.auth.uid in get(/databases/$(database)/documents/projects/$(projectId)).data.members;
    }
  }
}
```

---

## Testing Scenarios

### Scenario 1: Create Text
1. User A clicks "Text" tool in toolbar
2. User A clicks on canvas at position (100, 100)
3. Text input appears
4. User A types "Hello World"
5. User A presses Enter
6. Text appears on canvas
7. User B sees "Hello World" at (100, 100) in <100ms

### Scenario 2: Edit Text
1. User A creates text "Hello"
2. User B sees "Hello"
3. User A double-clicks the text
4. Text becomes editable (locked by User A)
5. User A changes text to "Hello World"
6. User A clicks outside to finish editing
7. User B sees "Hello World" in <100ms

### Scenario 3: Format Text - Bold, Italic, Underline
1. User A creates text "Important"
2. User A locks the text
3. User A clicks Bold button
4. User B sees bold "Important" in <100ms
5. User A clicks Italic button
6. User B sees bold + italic "Important" in <100ms
7. User A clicks Underline button
8. User B sees bold + italic + underlined "Important" in <100ms

### Scenario 4: Change Font Size
1. User A creates text "Title"
2. User A locks the text
3. User A opens font size dropdown
4. User A selects "32px"
5. Text size increases immediately
6. User B sees 32px "Title" in <100ms

### Scenario 5: Multi-Format Combinations
1. User A creates text "Formatted"
2. User A makes text bold → User B sees update in <100ms
3. User A adds italic → User B sees bold + italic in <100ms
4. User A removes bold → User B sees only italic in <100ms
5. User A adds underline → User B sees italic + underline in <100ms

### Scenario 6: Text Layer Isolation
1. User A creates text "Text 1" in Project A
2. User A creates text "Text 2" in Project B
3. Project A only shows "Text 1"
4. Project B only shows "Text 2"
5. Both users collaborate in Project A, only see "Text 1"

---

## Error Handling

### canvasService Errors

```typescript
// Invalid font size
throw new Error("Font size must be one of: 12, 14, 16, 18, 20, 24, 32, 48");

// Empty text
throw new Error("Text cannot be empty");

// No project selected
throw new Error("No project selected");

// Invalid formatting value
throw new Error("Invalid formatting option");
```

### UI Error Display

- Toast notifications for success/error messages
- Inline error messages in text input
- Loading states on buttons during async operations
- Graceful fallbacks for failed data fetches
- Disable formatting buttons when shape not locked by user

---

## Success Criteria

The feature is complete when:

1. ✅ Users can click Text tool to activate text placement
2. ✅ Users can click canvas to create text at that position
3. ✅ Users can type text content inline
4. ✅ Users can edit existing text by double-clicking
5. ✅ Users can change font size from dropdown (12-48px)
6. ✅ Users can toggle bold formatting
7. ✅ Users can toggle italic formatting
8. ✅ Users can toggle underline formatting
9. ✅ Multiple formatting options can be active simultaneously
10. ✅ Text changes sync to all users in <100ms
11. ✅ Formatting changes sync to all users in <100ms
12. ✅ Text respects lock system (edit only when locked by user)
13. ✅ Text can be moved, deleted, duplicated like other shapes
14. ✅ Text layers are isolated per project
15. ✅ All tests pass

---

## Out of Scope (Post-MVP)

- Custom font families
- Font color independent of shape color
- Text alignment (left/center/right)
- Line height adjustment
- Letter spacing
- Text background/fill
- Multi-line text with word wrap
- Rich text editor (links, lists, etc.)
- Text rotation separate from shape rotation
- Copy/paste text formatting
- Font size slider (vs. dropdown)
- Text search/replace
- Spell check
- Text character limit
- Font preview in dropdown

---

## Notes for Development

### Path Pattern

When updating services, use this pattern:

```typescript
// Get path with projectId
const path = `projects/${projectId}/canvases/main/shapes`;
```

### Context Usage Pattern

Always get `projectId` from context:

```typescript
const { projectId } = useContext(CanvasContext);

if (!projectId) {
  throw new Error("No project selected");
}

// Use projectId in service calls
await canvasService.createText(projectId, textData);
```

### Font Style Combination Pattern

Konva requires combined font style string:

```typescript
const getFontStyle = (shape: TextShape): string => {
  if (shape.fontWeight === 'bold' && shape.fontStyle === 'italic') {
    return 'bold italic';
  }
  if (shape.fontWeight === 'bold') return 'bold';
  if (shape.fontStyle === 'italic') return 'italic';
  return 'normal';
};
```

### Default Values Pattern

Always provide defaults for optional formatting:

```typescript
{
  fontWeight: textData.fontWeight || "normal",
  fontStyle: textData.fontStyle || "normal",
  textDecoration: textData.textDecoration || "none"
}
```

---

## Questions & Clarifications

If you encounter any ambiguity during development:

1. **Data Model Questions** → Refer to "Data Model" section
2. **API Questions** → Refer to "API Specification" section
3. **UI Questions** → Refer to "UI Components" section
4. **Security Questions** → Refer to "Security Rules" section

---
