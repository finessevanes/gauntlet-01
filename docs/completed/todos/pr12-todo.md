# PR #12: AI Manipulation Tools - Todo Checklist

**Timeline:** 25 minutes  
**Depends On:** PR #1 must be complete and tested

---

## Implementation Tasks

### src/services/aiService.ts

#### executeSingleTool() Method
- [x] Add `moveShape` case to switch statement
- [x] Add `resizeShape` case to switch statement (handle both radius and width/height)
- [x] Add `rotateShape` case to switch statement
- [x] Add `duplicateShape` case to switch statement
- [x] Add `deleteShape` case to switch statement
- [x] Add `getCanvasState` case to switch statement

#### getToolDefinitions() Method
- [x] Add `moveShape` tool definition (description, parameters, required fields)
- [x] Add `resizeShape` tool definition (description, parameters for width/height/radius)
- [x] Add `rotateShape` tool definition (description, parameters)
- [x] Add `duplicateShape` tool definition (description, parameters)
- [x] Add `deleteShape` tool definition (description, parameters)
- [x] Add `getCanvasState` tool definition (description, empty parameters)

#### generateSuccessMessage() Method
- [x] Add case for `moveShape` → "✓ Moved shape to new position"
- [x] Add case for `resizeShape` → "✓ Resized shape"
- [x] Add case for `rotateShape` → "✓ Rotated shape"
- [x] Add case for `duplicateShape` → "✓ Duplicated shape"
- [x] Add case for `deleteShape` → "✓ Deleted shape"
- [x] Add case for `getCanvasState` → "✓ Retrieved canvas state"

### src/utils/aiPrompts.ts

- [x] Replace entire file with expanded system prompt
- [x] Verify CRITICAL RULES section includes getCanvasState requirement
- [x] Verify POSITION HELPERS section is present
- [x] Verify COLOR CODES section has exact hex values
- [x] Verify SIZE HELPERS section is present
- [x] Verify SHAPE IDENTIFICATION section is present
- [x] Verify CREATION EXAMPLES section is present
- [x] Verify MANIPULATION EXAMPLES section is present (all 5 tool types)
- [x] Verify CONTEXT AWARENESS section is present

---

## Basic Manipulation Tests

### Test 1: Move Shape
- [x] Run: `await testAI("create a blue rectangle at 500, 500")`
- [x] Run: `await testAI("move the blue rectangle to the center")`
- [x] Verify: Rectangle moves to approximately (2400, 2425)
- [x] Verify: Output is "✓ Moved shape to new position"

### Test 2: Resize Rectangle
- [x] Run: `await testAI("make it twice as big")`
- [x] Verify: Rectangle becomes 400×300 (from 200×150)
- [x] Verify: Output is "✓ Resized shape"

### Test 3: Resize Circle
- [x] Run: `await testAI("create a red circle at 1000, 1000")`
- [x] Run: `await testAI("make the circle bigger")`
- [x] Verify: Circle radius increases to ~112 (1.5x from 75)
- [x] Verify: Output is "✓ Resized shape"

### Test 4: Rotate Shape
- [x] Run: `await testAI("rotate the blue rectangle 45 degrees")`
- [x] Verify: Rectangle rotates 45 degrees (visually obvious)
- [x] Verify: Output is "✓ Rotated shape"

### Test 5: Duplicate Shape
- [x] Run: `await testAI("duplicate the red circle")`
- [x] Verify: Copy appears with 20px offset
- [x] Verify: Output is "✓ Duplicated shape"

### Test 6: Delete Shape
- [x] Run: `await testAI("delete the blue rectangle")`
- [x] Verify: Blue rectangle disappears from canvas
- [x] Verify: Output is "✓ Deleted shape"

---

## Context Awareness Tests

### Test 7: "it" Reference
- [x] Run: `await testAI("create a green triangle at 1500, 1500")`
- [x] Run: `await testAI("rotate it 90 degrees")`
- [x] Run: `await testAI("duplicate it")`
- [x] Verify: Triangle rotates, then duplicates
- [x] Verify: Outputs are "✓ Rotated shape" → "✓ Duplicated shape"

### Test 8: Identify by Color
- [x] Run: `await testAI("create a yellow rectangle and a yellow circle")`
- [x] Run: `await testAI("move the yellow rectangle to the top")`
- [x] Verify: Only rectangle moves (not circle)
- [x] Verify: Output is "✓ Moved shape to new position"

### Test 9: Identify by Text
- [x] Run: `await testAI("create text saying Hello at 1000, 1000")`
- [x] Run: `await testAI("move the text saying Hello to the center")`
- [x] Verify: Text moves to center
- [x] Verify: Output is "✓ Moved shape to new position"

### Test 10: Multiple Operations in Sequence
- [x] Run: `await testAI("create a blue circle at 2000, 2000")`
- [x] Run: `await testAI("make it smaller")`
- [x] Run: `await testAI("move it to the bottom-right")`
- [x] Run: `await testAI("rotate it 180 degrees")`
- [x] Verify: Circle shrinks → moves → rotates
- [x] Verify: All 3 operations show success messages

---

## Error Handling Tests

### Test 11: Shape Not Found
- [x] Run: `await testAI("move the purple hexagon to the left")`
- [x] Verify: AI responds that it can't find purple hexagon
- [x] Verify: Command doesn't crash the application

### Test 12: Ambiguous Reference with Fallback
- [x] Run: `await testAI("create 3 blue rectangles at random positions")`
- [x] Run: `await testAI("move the blue rectangle to the center")`
- [x] Verify: AI picks most recent blue rectangle
- [x] Verify: Output is "✓ Moved shape to new position"

---

## Success Criteria Verification

### Core Implementation
- [x] All 6 new tool cases added to executeSingleTool() switch
- [x] All 6 new tool definitions added to getToolDefinitions()
- [x] System prompt updated with manipulation examples
- [x] generateSuccessMessage() handles all 6 new tools

### Core Functionality
- [x] Can move shapes by color ("move the blue rectangle")
- [x] Can resize shapes with size helpers ("twice as big")
- [x] Can rotate shapes by degrees
- [x] Can duplicate shapes
- [x] Can delete shapes by identifier
- [x] AI calls getCanvasState() before manipulation
- [x] Context awareness works ("it", "that", color/type references)

### Quality Checks
- [x] Position calculations accurate (centered shapes truly centered)
- [x] Size calculations correct (2x, 0.5x, 1.5x)
- [x] Rotation works for all shape types
- [x] Duplicate offset is consistent (20px)
- [x] Error handling graceful (shape not found doesn't crash)
- [x] Commands complete in <2 seconds

### Test Results Summary
- [x] All 6 basic manipulation tests pass (Tests 1-6)
- [x] All 4 context awareness tests pass (Tests 7-10)
- [x] All 2 error handling tests pass (Tests 11-12)
- [x] All 12 test commands pass overall

---

## Final Sign-Off

- [ ] All implementation tasks completed
- [ ] All 12 tests executed and passing
- [ ] All success criteria met
- [ ] All quality checks verified
- [ ] Ready to merge PR #2A

**Next Step:** Move to PR #2B (Advanced Tools: group, align, arrange in row, z-index, comment)

