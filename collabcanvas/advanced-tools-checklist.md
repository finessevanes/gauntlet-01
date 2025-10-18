# Advanced AI Tools Implementation Checklist

## Overview
**PR #2B: Advanced AI Tools + Layout Commands + Auto-Grouping**  
**Timeline:** 25 minutes  
**Complexity:** Medium-High (6 new tools, complex prompt with multi-step examples, layout logic, semantic grouping)

---

## 🎯 NEW FEATURE: Auto-Grouping for Semantic UI Patterns

### What Changed?
The AI now automatically groups elements when creating **semantic UI patterns** (forms, grids, buttons, etc.) so they act as a single unit. This means users can say "create a login form" and then "move it to the right" - the entire form moves together.

### Auto-Grouping Rules

**SEMANTIC PATTERNS** (auto-group with descriptive names):
- ✅ Forms: "create a login form", "create a signup form"
- ✅ Grids: "make a 3x3 grid of red squares"
- ✅ UI Components: "create a button with text on it", "create a navigation bar"
- ✅ Structured Layouts: dashboards, panels, cards, headers

**NON-SEMANTIC PATTERNS** (do NOT auto-group):
- ❌ "create 3 circles and 2 rectangles" - no semantic meaning
- ❌ "add 5 red squares" - just quantity, no structure
- ❌ "make some blue shapes" - too vague

### Implementation Changes
1. **System Prompt Updated** (`aiPrompts.ts`):
   - Added AUTO-GROUPING RULE section with clear examples
   - Updated all multi-element examples to include grouping with descriptive names
   - Distinguished between semantic and non-semantic patterns

2. **Success Messages Enhanced** (`aiService.ts`):
   - Detects grouped creations: `"✓ Created Login Form (6 elements grouped)"`
   - Shows group names: `"✓ Grouped shapes as 'Login Form'"`
   - Returns group metadata for better messaging

3. **Input Box Styling**:
   - White rectangles (`#ffffff`) with black borders (1px stroke)
   - Labels positioned above inputs
   - Forms are properly structured and visually distinct

### Example Usage
```javascript
// User types: "create a login form"
// AI automatically:
// 1. Creates 6 elements (labels, inputs, button, text)
// 2. Positions them vertically with proper spacing
// 3. Groups them all as "Login Form"
// 4. Returns: "✓ Created Login Form (6 elements grouped)"

// User then types: "move it to the right"
// AI recognizes "it" = "Login Form" group
// All 6 elements move together as one unit
```

---

## Implementation Tasks

### 1. Update `src/services/aiService.ts`

#### A. Add Helper Function for Layout
- [x] Add `arrangeInRow()` helper method to `AIService` class
- [x] Import required Firestore functions (doc, getDoc, writeBatch, serverTimestamp)
- [x] Implement shape fetching logic with Promise.all
- [x] Add shape sorting by x position (left to right)
- [x] Calculate positions with even spacing
- [x] Implement batch update with proper spacing calculation
- [x] Handle different shape widths (rectangles vs circles)
- [x] Add error handling for missing shapes

#### B. Add 5 New Tool Cases to `executeSingleTool()`
- [x] Add `groupShapes` case after existing manipulation tools
- [x] Add `alignShapes` case with proper parameter handling
- [x] Add `arrangeShapesInRow` case calling `arrangeInRow()` helper
- [x] Add `bringToFront` case for z-index management
- [x] Add `addComment` case with user context
- [x] Ensure all cases have proper error handling

#### C. Update `generateSuccessMessage()` Method
- [x] Add success messages for all 5 new tools in switch statement
- [x] Add complex operation handling for `arrangeShapesInRow`
- [x] Add complex operation handling for `groupShapes`
- [x] Add complex operation handling for `alignShapes`
- [x] Ensure multi-step operation messages are clear

#### D. Add 5 New Tool Definitions to `getToolDefinitions()`
- [x] Add `groupShapes` tool definition with proper parameters
- [x] Add `alignShapes` tool definition with alignment enum
- [x] Add `arrangeShapesInRow` tool definition (CRITICAL for rubric)
- [x] Add `bringToFront` tool definition for z-index management
- [x] Add `addComment` tool definition for collaboration
- [x] Ensure all definitions have proper descriptions and requirements

### 2. Update `src/utils/aiPrompts.ts`

#### A. Replace Entire System Prompt
- [x] Replace entire file with expanded version
- [x] Add complex multi-step examples
- [x] Include layout command examples (CRITICAL)
- [x] Add grouping command examples
- [x] Add alignment command examples
- [x] Add z-index command examples
- [x] Add comment command examples
- [x] Include complex multi-step operations (login form, 3x3 grid)

#### B. Add Critical Layout Examples
- [x] Add "arrange these shapes in a horizontal row" example
- [x] Add "space these elements evenly" example
- [x] Add "organize the rectangles in a line" example
- [x] Add "create 4 circles and arrange them in a row" example
- [x] Ensure all examples show proper getCanvasState() usage

#### C. Add Complex Operation Examples
- [x] Add login form creation (6-step operation)
- [x] Add 3x3 grid creation (9-step operation)
- [x] Add create + arrange + group workflow
- [x] Ensure examples show proper coordinate calculations

---

## Testing Tasks

### Core Functionality Tests (Must Pass)
- [ ] **arrangeShapesInRow works (CRITICAL FOR RUBRIC)**
- [ ] groupShapes works (by color, by context)
- [ ] alignShapes works (all 6 alignment types: left, center, right, top, middle, bottom)
- [ ] bringToFront works
- [ ] addComment works
- [ ] `arrangeInRow()` helper function correctly spaces shapes

### Test Commands (Browser Console)

Test these commands in browser console after implementing:

```typescript
// Note: These commands use testAI() function instead of askAI()
// The testAI() function should be available in the browser console

// ========================================
// LAYOUT TESTS (CRITICAL FOR RUBRIC)
// ========================================

// Test 1: Basic arrange in row
await testAI("create 4 red rectangles at random positions");
await testAI("arrange these shapes in a horizontal row");
// Expected: 4 rectangles organize in horizontal line with 50px spacing
// Expected output: "✓ Arranged shapes in horizontal row"

// Test 2: Arrange with custom spacing
await testAI("create 3 blue circles");
await testAI("arrange them in a row with 100 pixel spacing");
// Expected: 3 circles in line with 100px spacing
// Expected output: "✓ Arranged shapes in horizontal row"

// Test 3: Create and arrange in one command
await testAI("create 5 green triangles and arrange them in a row");
// Expected: 5 triangles created then arranged
// Expected output: "✓ Created 5 elements" (first), then "✓ Arranged..." (second)

// ========================================
// GROUPING TESTS
// ========================================

// Test 4: Group by color
await testAI("create 3 yellow rectangles at different positions");
await testAI("group the yellow shapes");
// Expected: All yellow rectangles grouped together
// Expected output: "✓ Grouped shapes"

// Test 5: Group recent shapes
await testAI("create a red circle and a red rectangle");
await testAI("group these together");
// Expected: Circle and rectangle grouped
// Expected output: "✓ Grouped shapes together"

// ========================================
// ALIGNMENT TESTS
// ========================================

// Test 6: Align left
await testAI("create 4 rectangles at different x and y positions");
await testAI("align these shapes to the left");
// Expected: All rectangles have same x (leftmost), but keep different y positions
// Note: If rectangles were in a horizontal row, they will stack vertically at same x
// Expected output: "✓ Aligned shapes"

// Test 7: Align center horizontally
await testAI("align them to the center");
// Expected: Shapes align to average x position
// Expected output: "✓ Aligned shapes"

// Test 8: Align middle vertically
await testAI("center these vertically");
// Expected: Shapes align to average y position (vertical center)
// Expected output: "✓ Aligned shapes"

// ========================================
// Z-INDEX TESTS
// ========================================

// Test 9: Bring to front
await testAI("create a blue rectangle at 2000, 2000");
await testAI("create a red rectangle at 2050, 2050");
await testAI("bring the blue rectangle to the front");
// Expected: Blue rectangle appears on top of red
// Expected output: "✓ Brought shape to front"

// Test 10: Context-aware z-index
await testAI("create a green circle at 1500, 1500");
await testAI("put it on top");
// Expected: Green circle brought to front
// Expected output: "✓ Brought shape to front"

// ========================================
// COMMENT TESTS
// ========================================

// Test 11: Add comment
await testAI("create a yellow triangle at the center");
await testAI("add a comment 'needs review' to the yellow triangle");
// Expected: Comment added, icon appears on shape
// Expected output: "✓ Added comment"

// Test 12: Context-aware comment
await testAI("comment on that saying 'approved'");
// Expected: Another comment added to same shape
// Expected output: "✓ Added comment"

// ========================================
// COMPLEX MULTI-STEP TESTS (CRITICAL)
// ========================================

// Test 13: Login form (6 elements + auto-grouped)
await testAI("create a login form");
// Expected: 6 elements appear:
//   - "Username" label (black text)
//   - White input box (white rectangle with black border)
//   - "Password" label (black text)
//   - White input box (white rectangle with black border)
//   - Blue button (blue rectangle)
//   - "Login" text on button (white text, centered)
// CRITICAL: All 6 elements should be AUTO-GROUPED as "Login Form"
// Expected output: "✓ Created Login Form (6 elements grouped)"

// Test 14: 3x3 Grid (9 shapes + auto-grouped)
await testAI("make a 3x3 grid of red squares");
// Expected: 9 red squares in 3x3 grid pattern
// CRITICAL: All 9 squares should be AUTO-GROUPED as "3x3 Grid"
// Expected output: "✓ Created 3x3 Grid (9 elements grouped)"

// Test 15: Create, arrange, group workflow (user-requested grouping)
await testAI("create 5 blue circles, arrange them in a row, and group them");
// Expected: 5 circles created → organized in row → grouped
// NOTE: User explicitly requested grouping with "and group them"
// Expected output: Should include grouping action with a descriptive name

// ========================================
// AUTO-GROUPING BEHAVIOR TESTS (CRITICAL)
// ========================================

// Test 16: Non-semantic pattern (should NOT auto-group)
await testAI("create 3 circles and 2 rectangles");
// Expected: 5 shapes created with proper spacing
// CRITICAL: Should NOT auto-group (no semantic meaning)
// Expected output: "✓ Created 5 elements"

// Test 17: Semantic UI component (should auto-group)
await testAI("create a button with text on it");
// Expected: Blue rectangle + white text layered on top
// CRITICAL: Should auto-group as "Button"
// Expected output: "✓ Created Button (2 elements grouped)"

// Test 18: Context reference after auto-grouping
await testAI("create a login form");
// Then immediately:
await testAI("move it to the right");
// Expected: "it" should refer to the entire "Login Form" group
// All 6 elements should move together as one unit

// ========================================
// COMBINED OPERATIONS TESTS
// ========================================

// Test 19: Create, arrange, align
await testAI("create 6 rectangles");
await testAI("arrange them in a row");
await testAI("align them to the top");
// Expected: Rectangles in row, all aligned to same top position
// Expected outputs: 3 success messages

// Test 20: Create, group, bring to front
await testAI("create 3 green shapes");
await testAI("group them");
await testAI("bring the group to the front");
// Expected: Shapes grouped and brought to front
// Expected outputs: 2-3 success messages
```

### Layout Tests (CRITICAL)
- [ ] Test 1: Basic arrange in row (4 red rectangles)
  ```javascript
  await askAI("create 4 red rectangles at random positions");
  await askAI("arrange these shapes in a horizontal row");
  ```
  - Expected: 4 rectangles organize in horizontal line with 50px spacing
  - Expected output: "✓ Arranged shapes in horizontal row"

- [ ] Test 2: Arrange with custom spacing (3 blue circles, 100px spacing)
  ```javascript
  await askAI("create 3 blue circles");
  await askAI("arrange them in a row with 100 pixel spacing");
  ```
  - Expected: 3 circles in line with 100px spacing
  - Expected output: "✓ Arranged shapes in horizontal row"

- [ ] Test 3: Create and arrange in one command (5 green triangles)
  ```javascript
  await askAI("create 5 green triangles and arrange them in a row");
  ```
  - Expected: 5 triangles created then arranged
  - Expected output: "✓ Created 5 elements" (first), then "✓ Arranged..." (second)

### Grouping Tests
- [ ] Test 4: Group by color (3 yellow rectangles)
  ```javascript
  await askAI("create 3 yellow rectangles at different positions");
  await askAI("group the yellow shapes");
  ```
  - Expected: All yellow rectangles grouped together
  - Expected output: "✓ Grouped shapes"

- [ ] Test 5: Group recent shapes (red circle and rectangle)
  ```javascript
  await askAI("create a red circle and a red rectangle");
  await askAI("group these together");
  ```
  - Expected: Circle and rectangle grouped
  - Expected output: "✓ Grouped shapes together"

### Alignment Tests
- [ ] Test 6: Align left (4 rectangles at different x positions)
  ```javascript
  await askAI("create 4 rectangles at different x positions");
  await askAI("align these shapes to the left");
  ```
  - Expected: All rectangles align to leftmost x position
  - Expected output: "✓ Aligned shapes"

- [ ] Test 7: Align center horizontally
  ```javascript
  await askAI("align them to the center");
  ```
  - Expected: Shapes align to average x position
  - Expected output: "✓ Aligned shapes"

- [ ] Test 8: Align middle vertically
  ```javascript
  await askAI("center these vertically");
  ```
  - Expected: Shapes align to average y position (vertical center)
  - Expected output: "✓ Aligned shapes"

- [ ] Verify all 6 alignment types work correctly (left, center, right, top, middle, bottom)

### Z-Index Tests
- [ ] Test 9: Bring to front (blue rectangle over red)
  ```javascript
  await askAI("create a blue rectangle at 2000, 2000");
  await askAI("create a red rectangle at 2050, 2050");
  await askAI("bring the blue rectangle to the front");
  ```
  - Expected: Blue rectangle appears on top of red
  - Expected output: "✓ Brought shape to front"

- [ ] Test 10: Context-aware z-index ("put it on top")
  ```javascript
  await askAI("create a green circle at 1500, 1500");
  await askAI("put it on top");
  ```
  - Expected: Green circle brought to front
  - Expected output: "✓ Brought shape to front"

### Comment Tests
- [ ] Test 11: Add comment to specific shape
  ```javascript
  await askAI("create a yellow triangle at the center");
  await askAI("add a comment 'needs review' to the yellow triangle");
  ```
  - Expected: Comment added, icon appears on shape
  - Expected output: "✓ Added comment"

- [ ] Test 12: Context-aware comment ("comment on that")
  ```javascript
  await askAI("comment on that saying 'approved'");
  ```
  - Expected: Another comment added to same shape
  - Expected output: "✓ Added comment"

### Complex Multi-Step Tests (CRITICAL)
- [ ] Test 13: Login form (6 elements)
  ```javascript
  await askAI("create a login form");
  ```
  - Expected: 6 elements appear:
    - [ ] "Username" label
    - [ ] White input box
    - [ ] "Password" label
    - [ ] White input box
    - [ ] Blue button
    - [ ] "Submit" text on button
  - Expected output: "✓ Created 6 elements"

- [ ] Test 14: 3x3 Grid (9 shapes)
  ```javascript
  await askAI("make a 3x3 grid of red squares");
  ```
  - Expected: 9 red squares in 3x3 grid pattern
  - Expected: Proper spacing (110px)
  - Expected output: "✓ Created 9 elements"

- [ ] Test 15: Create, arrange, group workflow
  ```javascript
  await askAI("create 5 blue circles, arrange them in a row, and group them");
  ```
  - Expected: 5 circles created → organized in row → grouped
  - Expected output: Multiple success messages

### Combined Operations Tests
- [ ] Test 16: Create, arrange, align
  ```javascript
  await askAI("create 6 rectangles");
  await askAI("arrange them in a row");
  await askAI("align them to the top");
  ```
  - Expected: 3 success messages for each operation

- [ ] Test 17: Create, group, bring to front
  ```javascript
  await askAI("create 3 green shapes");
  await askAI("group them");
  await askAI("bring the group to the front");
  ```
  - Expected: Shapes grouped and brought to front
  - Expected output: 2-3 success messages

---

## Performance Targets (Must Pass)
- [ ] Simple layout command (3-5 shapes): <2s
- [ ] Complex command (login form): <5s
- [ ] Layout with 10 shapes: <3s
- [ ] Grid creation (9 shapes): <6s
- [ ] Works with 20+ shapes on canvas

---

## Context Awareness Tests (Must Pass)
- [ ] AI identifies "these shapes" from context
- [ ] AI finds shapes by color for grouping
- [ ] AI handles "them", "it", "that" references
- [ ] AI calls `getCanvasState()` before advanced operations
- [ ] AI identifies recently created shapes correctly

---

## Common Issues & Debugging Checklist

### Issue 1: arrangeShapesInRow doesn't space correctly
- [ ] Check `arrangeInRow()` calculates width correctly
- [ ] Verify: `shape.width || (shape.radius ? shape.radius * 2 : 100)`
- [ ] Test with different shape types (rectangles, circles, triangles)

### Issue 2: Login form elements misaligned
- [ ] Verify x,y coordinates in LOGIN FORM example
- [ ] Check vertical layout positioning
- [ ] Ensure proper spacing between elements

### Issue 3: Grid doesn't form proper 3x3
- [ ] Check grid example spacing = 110px (80 + 30)
- [ ] Verify positions increment correctly
- [ ] Test with different shape sizes

### Issue 4: groupShapes fails
- [ ] Verify `canvasService.groupShapes()` method exists
- [ ] Check Phase 2 manual grouping feature is implemented
- [ ] Test with different shape combinations

### Issue 5: AI doesn't identify "these shapes"
- [ ] Review SHAPE IDENTIFICATION section in prompt
- [ ] Ensure "recently created" logic is clear
- [ ] Test context identification with multiple shapes

### Issue 6: Firestore import errors in arrangeInRow
- [ ] Change to static imports at top of file
- [ ] Add: `import { doc, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';`
- [ ] Add: `import { firestore } from '../config/firebase';`

---

## Final Implementation Checklist

### Code Implementation
- [x] `arrangeInRow()` helper function added
- [x] 5 tool cases added to `executeSingleTool()`
- [x] 5 tool definitions added to `getToolDefinitions()`
- [x] System prompt expanded with complex examples
- [x] `generateSuccessMessage()` handles all advanced tools
- [x] Firestore imports correct (static or dynamic)

### Core Testing (Must Pass)
- [ ] **arrangeShapesInRow works (CRITICAL)**
- [ ] groupShapes works (by color, by context)
- [ ] alignShapes works (all 6 alignment types)
- [ ] bringToFront works
- [ ] addComment works

### Complex Testing (Must Pass)
- [ ] Login form creates 6 elements correctly
- [ ] 3x3 grid creates 9 shapes in pattern
- [ ] Create + arrange + group workflow works
- [ ] Layout command with 5+ shapes works
- [ ] All 17 test commands pass

### Performance (Must Pass)
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

---

## Time Estimates

- [ ] Add `arrangeInRow()` helper: 8 min
- [ ] Add 5 tool cases: 7 min
- [ ] Add 5 tool definitions: 7 min
- [ ] Expand system prompt with complex examples: 12 min
- [ ] Testing (17 commands): 20 min
- [ ] Bug fixes: 6 min

**Total: ~25 minutes** (60 min with comprehensive testing)

---

## Next Steps After Completion

- [ ] Mark PR #2B complete
- [ ] Prepare for PR #3 (Chat UI integration)
- [ ] Document any issues encountered
- [ ] Update implementation notes
