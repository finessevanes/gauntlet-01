# PR-16 TODO — Pencil Tool (Free-form Drawing)

**Branch**: `feat/pr-16-pencil-tool`  
**Source PRD**: [pr-16-prd.md](../prds/pr-16-prd.md)  
**Owner (Agent)**: Delilah

---

## 0. Clarifying Questions & Assumptions

- **Questions**: None - PRD is comprehensive
- **Assumptions** (unblock coding now; confirm in PR):
  - Pencil tool will use same color palette as existing shapes
  - Stroke width will be 1-10px range (same as existing stroke controls)
  - Path points will be captured at 60 FPS for smooth drawing
  - Existing shape locking mechanism applies to paths

---

## 1. Repo Prep

- [ ] Create branch `feat/pr-16-pencil-tool`
- [ ] Confirm env, emulators, and test runner are working
- [ ] Read PRD thoroughly and understand all requirements

---

## 2. Data Model & Types

- [ ] Add Path interface to `src/services/types/canvasTypes.ts`
  - Test Gate: TypeScript compiles without errors
- [ ] Add CreatePathInput interface
  - Test Gate: TypeScript compiles without errors
- [ ] Update existing Shape type to include "path" in type union
  - Test Gate: TypeScript compiles without errors

---

## 3. Service Layer (deterministic contracts)

- [ ] Add `createPath()` method to `src/services/canvasService.ts`
  - Test Gate: Unit test passes for valid/invalid cases
- [ ] Add `updatePath()` method to `src/services/canvasService.ts`
  - Test Gate: Unit test passes for valid/invalid cases
- [ ] Add `subscribeToPaths()` method to `src/services/canvasService.ts`
  - Test Gate: Unit test passes for subscription/unsubscription
- [ ] Add path validation logic (minimum 2 points, valid stroke width)
  - Test Gate: Unit test passes for edge cases

---

## 4. UI Components - Tool Palette

- [ ] Add pencil tool button to `src/components/Canvas/ToolPalette.tsx`
  - Test Gate: Button renders with pencil icon
- [ ] Add active state styling for pencil tool
  - Test Gate: Button shows active state when selected
- [ ] Wire up onClick handler to set active tool
  - Test Gate: Clicking button sets activeTool to 'pencil'
- [ ] Add keyboard shortcut (P key) for pencil tool
  - Test Gate: P key activates pencil tool

---

## 5. Drawing Logic & State Management

- [ ] Add pencil mode state to `src/hooks/useDrawing.ts`
  - Test Gate: Hook returns pencil mode state
- [ ] Implement `handlePencilDown` in Canvas component
  - Test Gate: Mouse down starts path creation
- [ ] Implement `handlePencilMove` with point tracking
  - Test Gate: Mouse move adds points to path array (throttled to 60 FPS)
- [ ] Implement `handlePencilUp` to save path to Firestore
  - Test Gate: Mouse up creates path document in Firestore
- [ ] Add drawing preview (real-time visual feedback)
  - Test Gate: Preview line follows mouse during drawing

---

## 6. Path Rendering

- [ ] Add path case to `src/components/Canvas/CanvasShape.tsx`
  - Test Gate: Path renders with Konva Line component
- [ ] Implement path point-to-point line rendering
  - Test Gate: Path displays correctly with proper color and stroke width
- [ ] Handle stroke width rendering (1-10px range)
  - Test Gate: Different stroke widths render correctly
- [ ] Handle color rendering (use selected color)
  - Test Gate: Path uses currently selected color

---

## 7. Real-Time Sync Integration

- [ ] Test path creation syncs to other users
  - Test Gate: 2-browser test shows path appears in <100ms
- [ ] Verify sync latency meets <100ms target
  - Test Gate: Manual timing test confirms <100ms sync
- [ ] Handle concurrent drawing scenarios
  - Test Gate: Multiple users can draw simultaneously without conflicts

---

## 8. Integration with Existing Systems

- [ ] Integrate with existing color palette
  - Test Gate: Pencil tool uses selected color from palette
- [ ] Integrate with existing stroke width controls
  - Test Gate: Pencil tool uses selected stroke width
- [ ] Ensure pencil tool works with existing shape locking
  - Test Gate: Paths can be locked/unlocked like other shapes

---

## 9. Edge Cases & Error Handling

- [ ] Handle drawing outside canvas bounds
  - Test Gate: Path clips to canvas edges, no errors
- [ ] Handle empty paths (single click)
  - Test Gate: Single click doesn't create path
- [ ] Handle rapid drawing without gaps
  - Test Gate: Fast mouse movement creates smooth path
- [ ] Handle network errors during path creation
  - Test Gate: Network failure shows error toast, no partial writes

---

## 10. Performance Optimization

- [ ] Throttle point capture to 60 FPS
  - Test Gate: Drawing maintains 60 FPS during interaction
- [ ] Optimize path rendering for large paths
  - Test Gate: Path with 100+ points renders smoothly
- [ ] Ensure performance with 50+ existing shapes
  - Test Gate: Drawing works smoothly with many shapes on canvas

---

## 11. Unit Tests

- [ ] Write unit tests for `createPath()` method
  - Test Gate: All test cases pass (valid input, invalid input, edge cases)
- [ ] Write unit tests for `updatePath()` method
  - Test Gate: All test cases pass
- [ ] Write unit tests for path validation logic
  - Test Gate: All test cases pass
- [ ] Write unit tests for drawing hook logic
  - Test Gate: All test cases pass

---

## 12. Integration Tests

- [ ] Write integration test for pencil tool workflow
  - Test Gate: End-to-end test passes (tool selection → drawing → sync)
- [ ] Write integration test for multi-user drawing
  - Test Gate: Test passes with multiple users drawing simultaneously
- [ ] Write integration test for performance with many shapes
  - Test Gate: Test passes with 50+ existing shapes

---

## 13. Visual Testing

- [ ] Test pencil tool button states (normal, active, disabled)
  - Test Gate: All states render correctly
- [ ] Test drawing preview states (drawing, syncing, error)
  - Test Gate: All states display appropriate feedback
- [ ] Test path rendering with different colors and stroke widths
  - Test Gate: Visual output matches expected appearance

---

## 14. Accessibility Testing

- [ ] Test keyboard navigation (P key shortcut)
  - Test Gate: P key activates pencil tool, focus management works
- [ ] Test screen reader compatibility
  - Test Gate: Screen reader announces tool selection and drawing actions
- [ ] Test focus management during drawing
  - Test Gate: Focus remains appropriate during drawing interaction

---

## 15. Cross-Platform Testing

- [ ] Test on desktop browsers (Chrome, Firefox, Safari)
  - Test Gate: Drawing works consistently across browsers
- [ ] Test on mobile devices (touch events)
  - Test Gate: Touch drawing works on mobile devices
- [ ] Test with different input devices (mouse, trackpad, touch)
  - Test Gate: All input methods work smoothly

---

## 16. Performance Testing

- [ ] Test drawing performance with 50+ existing shapes
  - Test Gate: Maintains 60 FPS during drawing
- [ ] Test sync performance with multiple users
  - Test Gate: All users see updates in <100ms
- [ ] Test large path performance (100+ points)
  - Test Gate: Large paths render smoothly without lag

---

## 17. Documentation & PR

- [ ] Update `PR-16-todo.md` with test results
- [ ] Write PR description summary:
  - Goal and scope (from PRD)
  - Files changed and rationale
  - Test steps (happy path, edge cases, multi-user, perf)
  - Known limitations and follow-ups
  - Links: PRD, TODO, designs
- [ ] Keep PR description updated after each failed test until all gates pass
- [ ] Open PR with checklist copied here

---

## Copyable Checklist (for PR description)

- [ ] Branch created
- [ ] Data model and types implemented
- [ ] Service methods implemented + unit tests
- [ ] UI components implemented
- [ ] Drawing logic implemented
- [ ] Path rendering implemented
- [ ] Real-time sync verified (<100ms)
- [ ] Integration with existing systems
- [ ] Edge cases and error handling
- [ ] Performance optimization
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Visual testing completed
- [ ] Accessibility testing completed
- [ ] Cross-platform testing completed
- [ ] Performance testing completed
- [ ] Documentation updated

---

## Implementation Notes

- **Start with data model**: Define types and interfaces first
- **Service layer first**: Implement and test service methods before UI
- **UI integration**: Wire up components after service layer is solid
- **Test as you go**: Don't wait until the end to test
- **Performance from start**: Consider performance implications in each step
- **Real-time sync**: Test sync functionality early and often

---

## Risk Mitigation

- **Performance**: Test with many shapes early to catch performance issues
- **Sync conflicts**: Test concurrent drawing scenarios thoroughly
- **Cross-platform**: Test on different devices and browsers
- **Edge cases**: Handle drawing outside bounds and empty paths

---

## Success Criteria

- [ ] User can select pencil tool and draw smooth paths
- [ ] Paths sync in real-time to all collaborators (<100ms)
- [ ] Drawing maintains 60 FPS performance
- [ ] Works with 50+ existing shapes on canvas
- [ ] All tests pass (unit, integration, visual, accessibility, performance)
- [ ] Cross-platform compatibility verified
- [ ] Documentation complete and PR ready

---
