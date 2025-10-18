# PR #2B: Advanced AI Tools + Layout Commands

## Overview

**Goal:** Add 6 advanced tools including the CRITICAL layout command (arrange in row) required for rubric scoring, plus grouping, alignment, z-index management, and comments.

**Timeline:** 25 minutes  
**Complexity:** Medium-High (6 new tools, complex prompt with multi-step examples, layout logic)  

---

## What Gets Built

### 6 Advanced Tools

1. **groupShapes** - Group multiple shapes to move together
2. **alignShapes** - Align shapes to edges/centers (left, center, right, top, middle, bottom)
3. **arrangeShapesInRow** - **CRITICAL: Layout command for rubric** - organize shapes horizontally
4. **bringToFront** - Z-index management (bring shape to top layer)
5. **addComment** - Collaborative comments on shapes
6. **getCanvasState** - Already added in PR #2A (used by all advanced tools)

### Key New Capabilities

After this PR, AI will handle complex operations:
- "Arrange these shapes in a horizontal row" (CRITICAL for rubric)
- "Group the blue shapes"
- "Align these to the left"
- "Create a login form" (6-step operation)
- "Make a 3x3 grid of red squares" (9-step operation)

---

## Files to Modify

```
src/services/aiService.ts          (UPDATE - add 5 tools + helper function)
src/utils/aiPrompts.ts             (UPDATE - add complex examples)
```

---

## Implementation Details

### 1. Update `src/services/aiService.ts`

#### A. Add Helper Function for Layout (Before `getToolDefinitions`)

Add this helper method to the `AIService` class:

```typescript
private async arrangeInRow(shapeIds: string[], spacing: number = 50): Promise<void> {
  const { firestore } = await import('../config/firebase');
  const { doc, getDoc, writeBatch, serverTimestamp } = await import('firebase/firestore');
  
  const shapes = await Promise.all(
    shapeIds.map(async id => {
      const shapeDoc = await getDoc(doc(firestore, `canvases/main/shapes/${id}`));
      return shapeDoc.data();
    })
  );
  
  // Sort by current x position (left to right)
  shapes.sort((a, b) => (a?.x || 0) - (b?.x || 0));
  
  // Calculate positions with even spacing
  let currentX = shapes[0]?.x || 100;
  const batch = writeBatch(firestore);
  
  for (const shape of shapes) {
    if (!shape) continue;
    const shapeRef = doc(firestore, `canvases/main/shapes/${shape.id}`);
    batch.update(shapeRef, {
      x: currentX,
      updatedAt: serverTimestamp()
    });
    // Calculate next position based on shape width
    const shapeWidth = shape.width || (shape.radius ? shape.radius * 2 : 100);
    currentX += shapeWidth + spacing;
  }
  
  await batch.commit();
}
```

#### B. Add 5 New Tool Cases to `executeSingleTool()`

Find the `executeSingleTool()` method and add these 5 cases **after the manipulation tools from PR #2A**:

```typescript
// Add these cases AFTER the existing manipulation tools
case 'groupShapes':
  return await this.canvasService.groupShapes(args.shapeIds, userId, args.name);
  
case 'alignShapes':
  return await this.canvasService.alignShapes(args.shapeIds, args.alignment);
  
case 'arrangeShapesInRow':
  return await this.arrangeInRow(args.shapeIds, args.spacing || 50);
  
case 'bringToFront':
  return await this.canvasService.bringToFront(args.shapeId);
  
case 'addComment':
  return await this.canvasService.addComment(
    args.shapeId,
    args.text,
    userId,
    args.username || 'User'
  );
```

#### C. Update `generateSuccessMessage()` Method

Add these cases to the switch statement in the single-tool section:

```typescript
// Add to the switch statement in generateSuccessMessage()
case 'groupShapes': return '✓ Grouped shapes';
case 'alignShapes': return '✓ Aligned shapes';
case 'arrangeShapesInRow': return '✓ Arranged shapes in horizontal row';
case 'bringToFront': return '✓ Brought shape to front';
case 'addComment': return '✓ Added comment';
```

Also add complex operation handling after the multi-step creation section:

```typescript
// Add after the creationCount check
if (toolNames.includes('arrangeShapesInRow')) {
  const shapeCount = toolNames.filter(t => t === 'getCanvasState').length;
  return `✓ Arranged shapes in horizontal row`;
}

if (toolNames.includes('groupShapes')) {
  return `✓ Grouped shapes together`;
}

if (toolNames.includes('alignShapes')) {
  return `✓ Aligned shapes`;
}
```

#### D. Add 5 New Tool Definitions to `getToolDefinitions()`

Add these tool definitions **after the existing tools**:

```typescript
// NEW ADVANCED TOOLS (add these 5)
{
  type: "function",
  function: {
    name: "groupShapes",
    description: "Groups multiple shapes together so they move as one unit. MUST call getCanvasState first to find shapeIds.",
    parameters: {
      type: "object",
      properties: {
        shapeIds: { 
          type: "array", 
          items: { type: "string" },
          description: "Array of shape IDs to group together" 
        },
        name: { type: "string", description: "Optional name for the group" }
      },
      required: ["shapeIds"]
    }
  }
},
{
  type: "function",
  function: {
    name: "alignShapes",
    description: "Aligns multiple shapes to the same edge or center. MUST call getCanvasState first to find shapeIds.",
    parameters: {
      type: "object",
      properties: {
        shapeIds: { 
          type: "array", 
          items: { type: "string" },
          description: "Array of shape IDs to align" 
        },
        alignment: { 
          type: "string", 
          enum: ["left", "center", "right", "top", "middle", "bottom"],
          description: "How to align the shapes" 
        }
      },
      required: ["shapeIds", "alignment"]
    }
  }
},
{
  type: "function",
  function: {
    name: "arrangeShapesInRow",
    description: "Arranges multiple shapes in a horizontal row with even spacing. MUST call getCanvasState first to find shapeIds. This is a LAYOUT command - critical for organizing elements.",
    parameters: {
      type: "object",
      properties: {
        shapeIds: { 
          type: "array", 
          items: { type: "string" },
          description: "Array of shape IDs to arrange" 
        },
        spacing: { 
          type: "number", 
          description: "Space between shapes in pixels (default 50)" 
        }
      },
      required: ["shapeIds"]
    }
  }
},
{
  type: "function",
  function: {
    name: "bringToFront",
    description: "Brings a shape to the front (highest z-index). MUST call getCanvasState first to find the shapeId.",
    parameters: {
      type: "object",
      properties: {
        shapeId: { type: "string", description: "ID of the shape to bring to front" }
      },
      required: ["shapeId"]
    }
  }
},
{
  type: "function",
  function: {
    name: "addComment",
    description: "Adds a comment to a shape for team collaboration. MUST call getCanvasState first to find the shapeId.",
    parameters: {
      type: "object",
      properties: {
        shapeId: { type: "string", description: "ID of the shape to comment on" },
        text: { type: "string", description: "Comment text" },
        username: { type: "string", description: "Name of user adding comment" }
      },
      required: ["shapeId", "text"]
    }
  }
}
```

---

### 2. Update `src/utils/aiPrompts.ts`

Replace the **entire file** with this expanded version including complex multi-step examples:

```typescript
export function getSystemPrompt(shapes: any[]): string {
  const shapesSummary = shapes.length > 0 
    ? `\n\nCURRENT CANVAS STATE:\n${shapes.slice(0, 20).map(s => 
        `- ${s.type} (id: ${s.id}): ${s.color || 'text'} at (${s.x}, ${s.y})${
          s.width ? `, size ${s.width}×${s.height}` : ''
        }${s.radius ? `, radius ${s.radius}` : ''
        }${s.groupId ? `, grouped` : ''
        }${s.text ? `, text: "${s.text}"` : ''}`
      ).join('\n')}${shapes.length > 20 ? `\n... and ${shapes.length - 20} more shapes` : ''}`
    : '\n\nCURRENT CANVAS STATE: Empty canvas';
  
  return `You are a canvas manipulation assistant for a 5000×5000 pixel collaborative design tool. Users give you natural language commands to create and modify shapes.

CRITICAL RULES:
1. ALWAYS call getCanvasState() FIRST before manipulating existing shapes
2. Use the shapeId from getCanvasState results to identify target shapes
3. Identify shapes by their color, position, type, text content, or grouping
4. Canvas coordinates: (0,0) is top-left, (5000,5000) is bottom-right
5. Canvas center is at (2500, 2500)
6. Default rectangle size is 200×150 if user doesn't specify
7. Default text fontSize is 16, color is black (#000000)
8. For vague positions like "center", "top", calculate actual coordinates

POSITION HELPERS:
- "center" → (2500, 2500) - adjust for shape width/height to truly center it
- "top-left" → (100, 100)
- "top" → (2500, 100)
- "top-right" → (4800, 100)
- "left" → (100, 2500)
- "right" → (4800, 2500)
- "bottom-left" → (100, 4800)
- "bottom" → (2500, 4800)
- "bottom-right" → (4800, 4800)

COLOR CODES (always use these exact hex values):
- red → #ef4444
- blue → #3b82f6
- green → #10b981
- yellow → #f59e0b
- black → #000000
- white → #ffffff

SIZE HELPERS:
- "twice as big" → multiply width and height by 2
- "half the size" → divide width and height by 2
- "bigger" → multiply by 1.5
- "smaller" → divide by 1.5

SHAPE IDENTIFICATION:
- "the blue rectangle" → call getCanvasState, find shape with type="rectangle" and color="#3b82f6"
- "the text saying Hello" → find shape with type="text" and text containing "Hello"
- "these shapes" or "it" → identify by context (most recently created or mentioned)
- If multiple matches, pick the most recently created one
- If no match found, tell user clearly what you couldn't find

LAYOUT COMMANDS (CRITICAL - REQUIRED FOR RUBRIC):

askAI("arrange these shapes in a horizontal row")
→ getCanvasState()
→ [identify shapes by context - recently created, or all visible]
→ arrangeShapesInRow(shapeIds: ["shape_1", "shape_2", "shape_3"], spacing: 50)

askAI("space these elements evenly")
→ getCanvasState()
→ [identify relevant shapes]
→ arrangeShapesInRow(shapeIds: [...], spacing: 100)

askAI("organize the rectangles in a line")
→ getCanvasState()
→ [find all rectangles]
→ arrangeShapesInRow(shapeIds: [...], spacing: 50)

askAI("create 4 circles and arrange them in a row")
→ createCircle(...) × 4
→ getCanvasState()
→ [find the 4 circles just created]
→ arrangeShapesInRow(shapeIds: [...], spacing: 50)

GROUPING COMMANDS:

askAI("group the blue shapes")
→ getCanvasState()
→ [find all shapes with color="#3b82f6"]
→ groupShapes(shapeIds: ["shape_1", "shape_2"], name: "Blue Group")

askAI("group these together")
→ getCanvasState()
→ [identify shapes by context]
→ groupShapes(shapeIds: [...])

ALIGNMENT COMMANDS:

askAI("align these shapes to the left")
→ getCanvasState()
→ [identify shapes]
→ alignShapes(shapeIds: [...], alignment: "left")

askAI("center these vertically")
→ getCanvasState()
→ [identify shapes]
→ alignShapes(shapeIds: [...], alignment: "middle")

askAI("align the rectangles to the right")
→ getCanvasState()
→ [find rectangles]
→ alignShapes(shapeIds: [...], alignment: "right")

Z-INDEX COMMANDS:

askAI("bring the blue rectangle to the front")
→ getCanvasState()
→ [find blue rectangle]
→ bringToFront(shapeId: "shape_123")

askAI("put it on top")
→ getCanvasState()
→ [find contextual shape]
→ bringToFront(shapeId: "shape_123")

COMMENT COMMANDS:

askAI("add a comment 'needs review' to the blue rectangle")
→ getCanvasState()
→ [find blue rectangle]
→ addComment(shapeId: "shape_123", text: "needs review", username: "User")

askAI("comment on that saying 'looks good'")
→ getCanvasState()
→ [find contextual shape]
→ addComment(shapeId: "shape_123", text: "looks good", username: "User")

COMPLEX MULTI-STEP OPERATIONS:

askAI("create a login form")
→ createText(text: "Username", x: 2400, y: 2200, fontSize: 14, color: "#000000")
→ createRectangle(x: 2300, y: 2225, width: 300, height: 40, color: "#ffffff")
→ createText(text: "Password", x: 2400, y: 2290, fontSize: 14, color: "#000000")
→ createRectangle(x: 2300, y: 2315, width: 300, height: 40, color: "#ffffff")
→ createRectangle(x: 2350, y: 2375, width: 200, height: 50, color: "#3b82f6")
→ createText(text: "Submit", x: 2430, y: 2390, fontSize: 16, color: "#ffffff")

askAI("make a 3x3 grid of red squares")
→ Calculate: spacing = 110px, start position centered at (2200, 2200), size = 80×80
→ createRectangle(x: 2200, y: 2200, width: 80, height: 80, color: "#ef4444")
→ createRectangle(x: 2310, y: 2200, width: 80, height: 80, color: "#ef4444")
→ createRectangle(x: 2420, y: 2200, width: 80, height: 80, color: "#ef4444")
→ createRectangle(x: 2200, y: 2310, width: 80, height: 80, color: "#ef4444")
→ createRectangle(x: 2310, y: 2310, width: 80, height: 80, color: "#ef4444")
→ createRectangle(x: 2420, y: 2310, width: 80, height: 80, color: "#ef4444")
→ createRectangle(x: 2200, y: 2420, width: 80, height: 80, color: "#ef4444")
→ createRectangle(x: 2310, y: 2420, width: 80, height: 80, color: "#ef4444")
→ createRectangle(x: 2420, y: 2420, width: 80, height: 80, color: "#ef4444")

askAI("create 5 blue circles, arrange them in a row, and group them")
→ createCircle(x: 1000, y: 2500, radius: 50, color: "#3b82f6")
→ createCircle(x: 1200, y: 2500, radius: 50, color: "#3b82f6")
→ createCircle(x: 1400, y: 2500, radius: 50, color: "#3b82f6")
→ createCircle(x: 1600, y: 2500, radius: 50, color: "#3b82f6")
→ createCircle(x: 1800, y: 2500, radius: 50, color: "#3b82f6")
→ getCanvasState()
→ [find the 5 blue circles]
→ arrangeShapesInRow(shapeIds: [...], spacing: 50)
→ groupShapes(shapeIds: [...], name: "Blue Circles")

Be helpful, accurate, and execute commands precisely. Always validate parameters are within bounds before executing.${shapesSummary}`;
}
```

---

## Testing Commands

Test these commands in browser console after implementing:

```typescript
// Note: These commands now use askAI() function instead of ai.executeCommand()
// The askAI() function should be available in the browser console

// ========================================
// LAYOUT TESTS (CRITICAL FOR RUBRIC)
// ========================================

// Test 1: Basic arrange in row
await askAI("create 4 red rectangles at random positions");
await askAI("arrange these shapes in a horizontal row");
// Expected: 4 rectangles organize in horizontal line with 50px spacing
// Expected output: "✓ Arranged shapes in horizontal row"

// Test 2: Arrange with custom spacing
await askAI("create 3 blue circles");
await askAI("arrange them in a row with 100 pixel spacing");
// Expected: 3 circles in line with 100px spacing
// Expected output: "✓ Arranged shapes in horizontal row"

// Test 3: Create and arrange in one command
await askAI("create 5 green triangles and arrange them in a row");
// Expected: 5 triangles created then arranged
// Expected output: "✓ Created 5 elements" (first), then "✓ Arranged..." (second)

// ========================================
// GROUPING TESTS
// ========================================

// Test 4: Group by color
await askAI("create 3 yellow rectangles at different positions");
await askAI("group the yellow shapes");
// Expected: All yellow rectangles grouped together
// Expected output: "✓ Grouped shapes"

// Test 5: Group recent shapes
await askAI("create a red circle and a red rectangle");
await askAI("group these together");
// Expected: Circle and rectangle grouped
// Expected output: "✓ Grouped shapes together"

// ========================================
// ALIGNMENT TESTS
// ========================================

// Test 6: Align left
await askAI("create 4 rectangles at different x positions");
await askAI("align these shapes to the left");
// Expected: All rectangles align to leftmost x position
// Expected output: "✓ Aligned shapes"

// Test 7: Align center horizontally
await askAI("align them to the center");
// Expected: Shapes align to average x position
// Expected output: "✓ Aligned shapes"

// Test 8: Align middle vertically
await askAI("center these vertically");
// Expected: Shapes align to average y position (vertical center)
// Expected output: "✓ Aligned shapes"

// ========================================
// Z-INDEX TESTS
// ========================================

// Test 9: Bring to front
await askAI("create a blue rectangle at 2000, 2000");
await askAI("create a red rectangle at 2050, 2050");
await askAI("bring the blue rectangle to the front");
// Expected: Blue rectangle appears on top of red
// Expected output: "✓ Brought shape to front"

// Test 10: Context-aware z-index
await askAI("create a green circle at 1500, 1500");
await askAI("put it on top");
// Expected: Green circle brought to front
// Expected output: "✓ Brought shape to front"

// ========================================
// COMMENT TESTS
// ========================================

// Test 11: Add comment
await askAI("create a yellow triangle at the center");
await askAI("add a comment 'needs review' to the yellow triangle");
// Expected: Comment added, icon appears on shape
// Expected output: "✓ Added comment"

// Test 12: Context-aware comment
await askAI("comment on that saying 'approved'");
// Expected: Another comment added to same shape
// Expected output: "✓ Added comment"

// ========================================
// COMPLEX MULTI-STEP TESTS (CRITICAL)
// ========================================

// Test 13: Login form (6 elements)
await askAI("create a login form");
// Expected: 6 elements appear:
//   - "Username" label
//   - White input box
//   - "Password" label
//   - White input box
//   - Blue button
//   - "Submit" text on button
// Expected output: "✓ Created 6 elements"

// Test 14: 3x3 Grid (9 shapes)
await askAI("make a 3x3 grid of red squares");
// Expected: 9 red squares in 3x3 grid pattern
// Expected output: "✓ Created 9 elements"

// Test 15: Create, arrange, group workflow
await askAI("create 5 blue circles, arrange them in a row, and group them");
// Expected: 5 circles created → organized in row → grouped
// Expected outputs: Multiple success messages

// ========================================
// COMBINED OPERATIONS TESTS
// ========================================

// Test 16: Create, arrange, align
await askAI("create 6 rectangles");
await askAI("arrange them in a row");
await askAI("align them to the top");
// Expected: Rectangles in row, all aligned to same top position
// Expected outputs: 3 success messages

// Test 17: Create, group, bring to front
await askAI("create 3 green shapes");
await askAI("group them");
await askAI("bring the group to the front");
// Expected: Shapes grouped and brought to front
// Expected outputs: 2-3 success messages
```

---

## Success Criteria

### Must Pass (Core Functionality):
- ✅ All 5 new tools execute without errors
- ✅ **`arrangeShapesInRow` works (CRITICAL FOR RUBRIC)**
- ✅ Can group multiple shapes by color/type
- ✅ Can align shapes (all 6 alignment types work)
- ✅ Can bring shapes to front
- ✅ Can add comments to shapes
- ✅ `arrangeInRow()` helper function correctly spaces shapes

### Must Pass (Complex Operations):
- ✅ Login form creates 6 elements in correct positions
- ✅ 3x3 grid creates 9 shapes in grid pattern
- ✅ Multi-step commands execute in sequence
- ✅ **Layout command works with 3+ shapes (CRITICAL)**
- ✅ Create + arrange + group workflow works

### Must Pass (Context Awareness):
- ✅ AI identifies "these shapes" from context
- ✅ AI finds shapes by color for grouping
- ✅ AI handles "them", "it", "that" references
- ✅ AI calls `getCanvasState()` before advanced operations

### Performance Targets:
- ✅ Simple layout command (3-5 shapes): <2s
- ✅ Complex command (login form): <5s
- ✅ Layout with 10 shapes: <3s
- ✅ Grid creation (9 shapes): <6s

---

## Common Issues & Debugging

### Issue 1: arrangeShapesInRow doesn't space correctly
**Cause:** Width calculation wrong (not accounting for circles)  
**Solution:** Check `arrangeInRow()` calculates width correctly: `shape.width || (shape.radius ? shape.radius * 2 : 100)`

### Issue 2: Login form elements misaligned
**Cause:** Position calculations in prompt examples incorrect  
**Solution:** Verify x,y coordinates in LOGIN FORM example create proper vertical layout

### Issue 3: Grid doesn't form proper 3x3
**Cause:** Spacing or position math wrong  
**Solution:** Check grid example: spacing = 110px (80 + 30), positions increment correctly

### Issue 4: groupShapes fails
**Cause:** `canvasService.groupShapes()` method missing or incorrect  
**Solution:** Verify Phase 2 manual grouping feature is implemented

### Issue 5: AI doesn't identify "these shapes"
**Cause:** Context identification logic in prompt unclear  
**Solution:** Review SHAPE IDENTIFICATION section, ensure "recently created" is clear

### Issue 6: Firestore import errors in arrangeInRow
**Cause:** Dynamic imports not working  
**Solution:** Change to static imports at top of file:
```typescript
import { doc, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
```

---

## Time Estimate

- Add `arrangeInRow()` helper: 8 min
- Add 5 tool cases: 7 min
- Add 5 tool definitions: 7 min
- Expand system prompt with complex examples: 12 min
- Testing (17 commands): 20 min
- Bug fixes: 6 min

**Total: ~25 minutes** (60 min with comprehensive testing)

---

## What's Next (PR #3)

After this PR is complete and tested:
- **PR #3** will add the Chat UI (bottom drawer interface)
- **PR #3** will integrate AI service with visual chat
- **PR #3** will add loading states, error displays, message history

**Do not implement PR #3 features yet.** This PR focuses only on advanced tools and layout commands.

---

## Final Checklist

Before marking PR #2B complete:

### Implementation:
- [ ] `arrangeInRow()` helper function added
- [ ] 5 tool cases added to `executeSingleTool()`
- [ ] 5 tool definitions added to `getToolDefinitions()`
- [ ] System prompt expanded with complex examples
- [ ] `generateSuccessMessage()` handles all advanced tools
- [ ] Firestore imports correct (static or dynamic)

### Core Testing (Must Pass):
- [ ] **arrangeShapesInRow works (CRITICAL)**
- [ ] groupShapes works (by color, by context)
- [ ] alignShapes works (all 6 alignment types)
- [ ] bringToFront works
- [ ] addComment works

### Complex Testing (Must Pass):
- [ ] Login form creates 6 elements correctly
- [ ] 3x3 grid creates 9 shapes in pattern
- [ ] Create + arrange + group workflow works
- [ ] Layout command with 5+ shapes works
- [ ] All 17 test commands pass

### Performance (Must Pass):
- [ ] Layout command (5 shapes) <2s
- [ ] Login form <5s
- [ ] 3x3 grid <6s
- [ ] Works with 20+ shapes on canvas

---

## Critical Reminders

1. **Layout command is MANDATORY** - `arrangeShapesInRow` is required for rubric scoring, test this thoroughly
2. **Complex commands are high-value** - Login form and grid demonstrate AI's power
3. **Context awareness critical** - "these shapes" must identify recently created shapes
4. **Multi-step execution** - AI must chain operations correctly
5. **Test spacing calculation** - Layout command must handle different shape widths (rectangles vs circles)
