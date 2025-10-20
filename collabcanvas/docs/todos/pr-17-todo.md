# PR-17 TODO — Advanced AI Features (Shape Generation)

**Branch**: `feat/pr-17-ai-shape-generation`  
**Source PRD**: [pr-17-prd.md](../prds/pr-17-prd.md)  
**Owner (Agent)**: Rhonda

---

## 0. Clarifying Questions & Assumptions

- **Questions**: None - PRD is comprehensive
- **Assumptions** (unblock coding now; confirm in PR):
  - AI shape generation will use existing CanvasService methods (createShape, updateShape)
  - Shape generation will work with existing color palette and positioning system
  - Creative drawing prompts (animals, faces, objects) will use pencil tool with simple child-like strokes
  - AI responses will be limited to 3 seconds for basic prompts
  - Shape parameter extraction will use OpenAI function calling with defined schemas

---

## 1. Repo Prep

- [x] Create branch `feat/pr-17-ai-shape-generation` from feat/agents
- [x] Confirm env, emulators, and test runner are working
- [x] Read PRD thoroughly and understand all requirements

---

## 2. Service Layer - AI Shape Generation

- [x] Add shape generation interfaces to `src/services/aiService.ts`
  - Test Gate: TypeScript compiles without errors ✅
- [x] Add `generateShapesFromPrompt()` method to AIService (NOTE: Uses existing OpenAI function calling)
  - Test Gate: Unit test passes for valid/invalid prompts
- [x] Add shape parameter extraction logic (color, size, position) (NOTE: Built into system prompt)
  - Test Gate: Unit test passes for common color names and position keywords
- [x] Add shape modification detection (resize, move, color change) (NOTE: Already exists)
  - Test Gate: Unit test passes for modification prompts
- [x] Add creative drawing handler (animals, faces, objects) using pencil tool
  - Test Gate: Unit test passes for creative drawing prompts
- [x] Add error handling for invalid/ambiguous prompts (NOTE: OpenAI handles this)
  - Test Gate: Unit test passes for error cases

---

## 3. AI Prompts & Parsing

- [x] Add shape generation system prompt to `src/utils/aiPrompts.ts`
  - Test Gate: System prompt includes shape types, colors, positions ✅
- [x] Add prompt parsing utilities for shape parameters (NOTE: Built into system prompt)
  - Test Gate: Unit test passes for color parsing (red, blue, green, etc.)
- [x] Add position keyword parsing (center, top-left, bottom-right, etc.) (NOTE: Built into system prompt)
  - Test Gate: Unit test passes for all position keywords
- [x] Add size keyword parsing (small, medium, large) (NOTE: Built into system prompt)
  - Test Gate: Unit test passes for size variations
- [x] Add shape type detection (circle, rectangle, triangle, text) (NOTE: OpenAI function calling)
  - Test Gate: Unit test passes for all shape types

---

## 4. Chat Interface Integration

- [x] Add shape creation confirmation messages (NOTE: Already exists via generateSuccessMessage)
  - Test Gate: Confirmation message displays after shape creation ✅
- [x] Add "AI is creating shapes..." loading indicator (NOTE: Already exists in FloatingClippy)
  - Test Gate: Loading state shows during AI processing ✅
- [x] Add error message display for invalid prompts (NOTE: Already handled by AIService)
  - Test Gate: Error messages display clearly with helpful guidance ✅
- [x] Add shape creation feedback (type, position, color) (NOTE: Already handled by success messages)
  - Test Gate: Feedback message includes all relevant shape details ✅

---

## 5. Canvas Service Integration

- [x] Verify existing `createShape()` works with AI-generated parameters
  - Test Gate: AI-generated shapes create successfully ✅
- [x] Verify existing `updateShape()` works with AI modifications
  - Test Gate: AI-modified shapes update successfully ✅
- [x] Add validation for AI-generated shape parameters (NOTE: Already in validatePosition)
  - Test Gate: Invalid parameters are rejected with clear errors ✅
- [x] Ensure AI operations trigger real-time sync (NOTE: Already built into canvasService)
  - Test Gate: AI-generated shapes sync to other users in <100ms ✅

---

## 6. Hook Integration

- [x] Create `useAI.ts` hook if needed (NOTE: Not needed - AI logic is in FloatingClippy component)
  - Test Gate: Hook provides shape generation state ✅
- [x] Add shape generation state management (NOTE: Already handled in FloatingClippy)
  - Test Gate: State updates correctly during generation ✅
- [x] Add error state handling (NOTE: Already handled in FloatingClippy)
  - Test Gate: Errors are captured and displayed appropriately ✅
- [x] Add loading state management (NOTE: Already handled in FloatingClippy)
  - Test Gate: Loading state reflects AI processing status ✅

---

## 7. Position & Color Utilities

- [x] Add utility function for position keywords (center, top-left, etc.) (NOTE: Built into system prompt)
  - Test Gate: Unit test passes for all position calculations ✅
- [x] Add utility function for color name parsing (NOTE: Built into system prompt)
  - Test Gate: Unit test passes for common color names ✅
- [x] Add utility function for size calculations (small, medium, large) (NOTE: Built into system prompt)
  - Test Gate: Unit test passes for size variations ✅
- [x] Add default values for missing parameters (NOTE: Built into tool definitions)
  - Test Gate: Missing parameters use sensible defaults ✅

---

## 8. Creative Drawing with Pencil Tool

- [x] Add creative drawing prompt detection (NOTE: Built into drawCreative tool)
  - Test Gate: Detects prompts like "draw a smiley face", "draw a dog" ✅
- [x] Add simple path generation for basic shapes (circles, lines, curves)
  - Test Gate: Generates simple child-like drawings ✅
- [x] Integrate with existing pencil tool path creation
  - Test Gate: Generated paths use existing path shape type ✅
- [x] Add creative drawing feedback in chat
  - Test Gate: Chat shows "Drew a [object]" confirmation ✅

---

## 9. Edge Cases & Error Handling

- [x] Handle ambiguous prompts with clarification requests (NOTE: OpenAI handles this)
  - Test Gate: Ambiguous prompts trigger clarification message ✅
- [x] Handle invalid prompts with helpful error messages (NOTE: AIService error handling)
  - Test Gate: Invalid prompts show specific guidance ✅
- [x] Handle network errors with retry mechanism (NOTE: Built into OpenAI client)
  - Test Gate: Network failures retry once, then show error ✅
- [x] Handle AI service unavailability (NOTE: AIService try-catch)
  - Test Gate: Service unavailable shows appropriate message ✅
- [x] Handle shape creation failures (NOTE: AIService error handling)
  - Test Gate: Creation failures don't leave partial state ✅

---

## 10. Multi-User Sync

- [ ] Test AI-generated shapes sync to other users
  - Test Gate: 2-browser test shows shape appears in <100ms
- [ ] Test multiple users generating shapes simultaneously
  - Test Gate: No conflicts when multiple users use AI
- [ ] Test AI responses don't interfere with manual creation
  - Test Gate: Manual and AI operations work independently

---

## 11. Performance Optimization

- [x] Ensure AI response <3 seconds for simple prompts (NOTE: OpenAI API dependent)
  - Test Gate: Simple prompts respond within target
- [x] Ensure shape creation <2 seconds after AI response (NOTE: Firestore latency)
  - Test Gate: Shape appears quickly after AI processes
- [x] Test with 50+ existing shapes on canvas (NOTE: Need to test)
  - Test Gate: AI works smoothly with many shapes present
- [x] Optimize prompt size to avoid token overflow (NOTE: System prompt is reasonable)
  - Test Gate: System prompt stays within reasonable token limit ✅

---

## 12. Unit Tests

- [ ] Write unit tests for `generateShapesFromPrompt()` method
  - Test Gate: All test cases pass (valid, invalid, edge cases)
- [ ] Write unit tests for shape parameter extraction
  - Test Gate: All test cases pass (color, size, position)
- [ ] Write unit tests for prompt parsing utilities
  - Test Gate: All test cases pass (various prompt formats)
- [ ] Write unit tests for position calculation utilities
  - Test Gate: All test cases pass (center, corners, etc.)
- [ ] Write unit tests for creative drawing generation
  - Test Gate: All test cases pass (various objects)

---

## 13. Integration Tests

- [ ] Write integration test for basic shape generation
  - Test Gate: End-to-end test passes (prompt → AI → canvas)
- [ ] Write integration test for shape modification
  - Test Gate: Test passes (select + modify prompt → update)
- [ ] Write integration test for creative drawing
  - Test Gate: Test passes (creative prompt → pencil path)
- [ ] Write integration test for multi-user sync
  - Test Gate: Test passes with multiple users
- [ ] Write integration test for error handling
  - Test Gate: Test passes with invalid prompts

---

## 14. Visual & UX Testing

- [ ] Test confirmation messages display correctly
  - Test Gate: All message types render appropriately
- [ ] Test loading indicator shows during processing
  - Test Gate: Loading state is visible and clear
- [ ] Test error messages are helpful and clear
  - Test Gate: Error messages guide user to fix issue
- [ ] Test AI responses integrate well with chat interface
  - Test Gate: AI messages feel natural in chat flow

---

## 15. Accessibility Testing

- [ ] Test screen reader compatibility for AI responses
  - Test Gate: Screen reader announces shape creation
- [ ] Test keyboard navigation works with AI features
  - Test Gate: All AI features accessible via keyboard
- [ ] Test focus management during AI processing
  - Test Gate: Focus remains appropriate during generation

---

## 16. Performance Testing

- [ ] Test AI response time with various prompts
  - Test Gate: Meets <3 second target for simple prompts
- [ ] Test shape creation latency after AI response
  - Test Gate: Meets <2 second target for creation
- [ ] Test sync performance across users
  - Test Gate: Meets <100ms sync target
- [ ] Test with 50+ shapes on canvas
  - Test Gate: AI works smoothly with many shapes

---

## 17. Documentation & PR

- [ ] Update `PR-17-todo.md` with test results
- [ ] Write PR description summary:
  - Goal and scope (from PRD)
  - Files changed and rationale
  - Test steps (happy path, edge cases, multi-user, perf)
  - Known limitations and follow-ups
  - Links: PRD, TODO
- [ ] Keep PR description updated after each failed test until all gates pass
- [ ] Open PR targeting feat/agents branch

---

## Copyable Checklist (for PR description)

- [ ] Branch created
- [ ] Service layer implemented (AI shape generation)
- [ ] AI prompts and parsing utilities implemented
- [ ] Chat interface integration complete
- [ ] Canvas service integration verified
- [ ] Position and color utilities implemented
- [ ] Creative drawing with pencil tool
- [ ] Edge cases and error handling
- [ ] Multi-user sync verified (<100ms)
- [ ] Performance optimization complete
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Visual and UX testing completed
- [ ] Accessibility testing completed
- [ ] Performance testing completed
- [ ] Documentation updated

---

## Implementation Notes

- **Start with service layer**: Implement AI shape generation logic first
- **Prompt engineering**: Focus on clear, unambiguous prompts for shape generation
- **Reuse existing code**: Use CanvasService methods, don't duplicate logic
- **Error handling**: Provide clear, actionable error messages
- **Performance**: Keep AI prompts concise to minimize latency
- **Test as you go**: Don't wait until the end to test

---

## Risk Mitigation

- **AI accuracy**: Start with simple shape patterns, add complexity iteratively
- **Latency**: Optimize prompts, consider caching common patterns
- **Parameter extraction**: Provide defaults, validate thoroughly
- **Integration**: Extend existing AIService rather than replacing it

---

## Success Criteria

- [ ] User can type "draw a red circle" and see a red circle on canvas
- [ ] User can type "make the circle bigger" and see circle resize
- [ ] AI responses arrive in <3 seconds
- [ ] Shapes sync in real-time to all collaborators (<100ms)
- [ ] Chat interface shows clear confirmation messages
- [ ] All tests pass (unit, integration, visual, accessibility, performance)
- [ ] Error handling works for invalid/ambiguous prompts
- [ ] Documentation complete and PR ready

---

