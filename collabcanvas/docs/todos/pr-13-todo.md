# PR-13 TODO — Create New Canvas & Naming

**Branch**: `feature/pr-13-create-canvas-naming`  
**Source PRD**: `collabcanvas/docs/prds/pr-13-prd.md`  
**Owner (Agent)**: Building Agent

---

## 0. Clarifying Questions & Assumptions

### Questions Resolved in PRD:
- Q: Should canvas creation be instant or require modal input?
- A: Instant creation with default name "Untitled Canvas". Modal is optional enhancement.

- Q: Should we allow duplicate canvas names?
- A: Yes, allow duplicates with non-blocking warning.

- Q: Should collaborators be able to rename canvases?
- A: No. Only owner can rename (enforced by Firestore rules).

### Assumptions (unblock coding now; confirm in PR):
- Default canvas name is always "Untitled Canvas" (no auto-numbering)
- Rename is inline edit (no modal) for faster UX
- Clicking outside rename input auto-saves (ESC cancels)
- Browser tab title updates to show canvas name
- Keyboard shortcut `Ctrl/Cmd + N` works in gallery view only (not canvas view)
- Canvas creation navigates immediately to new canvas (no "stay in gallery" option)

---

## 1. Repo Prep

- [ ] Create branch `feature/pr-13-create-canvas-naming`
- [ ] Confirm Firebase emulators running (Auth, Firestore, RTDB)
- [ ] Verify test runner works (`npm test`)
- [ ] Read PRD thoroughly (`collabcanvas/docs/prds/pr-13-prd.md`)
- [ ] Review existing `canvasListService.ts` to understand current structure
- [ ] Test Gate: Development environment ready

---

## 2. Service Layer (deterministic contracts)

### 2.1 Add Canvas Name Validation Helper

- [ ] Add `validateCanvasName(name: string)` to `canvasListService.ts`
  - Returns: `{ valid: boolean; error?: string }`
  - Validation rules:
    - Trim whitespace: `const trimmed = name.trim()`
    - Empty check: `if (trimmed.length === 0) return { valid: false, error: 'Canvas name cannot be empty' }`
    - Length check: `if (trimmed.length > 100) return { valid: false, error: 'Canvas name too long (max 100 characters)' }`
    - Success: `return { valid: true }`
  - Test Gate: Unit test validates empty, too-long, and valid names

### 2.2 Implement Create Canvas Method

- [ ] Add `createCanvas(userId: string, name?: string): Promise<string>` to `canvasListService.ts`
  - Sanitize name: `const canvasName = name?.trim() || 'Untitled Canvas'`
  - Validate name: Call `validateCanvasName(canvasName)`, throw error if invalid
  - Generate canvas ID: `const canvasRef = doc(collection(firestore, 'canvases'))`
  - Create canvas document:
    ```typescript
    const canvasData: CanvasDocument = {
      id: canvasRef.id,
      name: canvasName,
      ownerId: userId,
      collaboratorIds: [userId],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastAccessedAt: serverTimestamp(),
      shapeCount: 0,
    };
    await setDoc(canvasRef, canvasData);
    ```
  - Return canvas ID: `return canvasRef.id`
  - Console log: `console.log('✅ Canvas created: ${canvasId} - "${canvasName}"')`
  - Error handling: Catch errors, log to console, rethrow
  - Test Gate: Creates canvas in Firestore with correct data structure

- [ ] Unit test `createCanvas()` method
  - Test with default name (no name provided)
  - Test with custom name
  - Test with empty string (should default to "Untitled Canvas")
  - Test with whitespace-only name (should default to "Untitled Canvas")
  - Test with 100-character name (should succeed)
  - Test with 101-character name (should throw error)
  - Test Gate: All test cases pass

### 2.3 Implement Rename Canvas Method

- [ ] Add `renameCanvas(canvasId: string, newName: string): Promise<void>` to `canvasListService.ts`
  - Sanitize name: `const trimmedName = newName.trim()`
  - Validate name: Call `validateCanvasName(trimmedName)`, throw error if invalid
  - Update canvas: Call existing `updateCanvasMetadata(canvasId, { name: trimmedName })`
  - Console log: `console.log('✅ Canvas renamed: ${canvasId} → "${trimmedName}"')`
  - Error handling: Catch errors, log to console, rethrow
  - Test Gate: Renames canvas and updates `updatedAt` timestamp

- [ ] Unit test `renameCanvas()` method
  - Test successful rename
  - Test rename with empty name (should throw error)
  - Test rename with too-long name (should throw error)
  - Test rename with whitespace (should trim)
  - Test rename with special characters (should allow)
  - Test Gate: All test cases pass

---

## 3. Data Model & Rules

### 3.1 Update Firestore Security Rules

- [ ] Update `firestore.rules` for canvas creation
  - Rule: Only authenticated users can create canvases
  - Rule: `ownerId` must match authenticated user UID
  - Rule: `collaboratorIds` must include owner
  ```javascript
  // In canvases collection rules
  allow create: if request.auth != null 
    && request.resource.data.ownerId == request.auth.uid
    && request.auth.uid in request.resource.data.collaboratorIds;
  ```
  - Test Gate: Unauthenticated creation fails, authenticated creation succeeds

- [ ] Update `firestore.rules` for canvas rename
  - Rule: Only canvas owner can update `name` field
  ```javascript
  // In canvases collection rules
  allow update: if request.auth != null 
    && resource.data.ownerId == request.auth.uid;
  ```
  - Test Gate: Non-owner rename fails, owner rename succeeds

- [ ] Test Firestore rules with emulator
  - Create canvas as User A → Should succeed
  - Create canvas as unauthenticated user → Should fail
  - Rename canvas as owner → Should succeed
  - Rename canvas as non-owner collaborator → Should fail
  - Test Gate: All security rules enforced correctly

---

## 4. UI Components

### 4.1 Create Canvas Button Component

- [ ] Create `src/components/CanvasGallery/CreateCanvasButton.tsx`
  - Props: `onClick: () => void`, `loading: boolean`
  - Render button with plus icon and "Create New Canvas" text
  - Button styling:
    - Primary color (blue #0066CC)
    - Medium size (40px height)
    - Plus icon on left
  - States:
    - Default: Blue background, white text
    - Hover: Darker blue (#0052A3)
    - Loading: Show spinner, "Creating..." text, disabled
    - Disabled: Gray background, not clickable
  - Accessibility: `aria-label="Create new canvas"`, `aria-busy={loading}`
  - Test Gate: Component renders correctly in all states

### 4.2 Rename Canvas Inline Component

- [ ] Create `src/components/CanvasGallery/RenameCanvasInline.tsx`
  - Props:
    ```typescript
    {
      currentName: string;
      onSave: (newName: string) => Promise<void>;
      onCancel: () => void;
      autoFocus?: boolean;
    }
    ```
  - State:
    - `editingName: string` - Local state for input value
    - `saving: boolean` - Loading state during save
    - `error: string | null` - Validation error message
  - Render input field with current name pre-filled and selected
  - Validation:
    - On blur or Enter: Validate name, show error if invalid
    - Character counter: "X/100 characters"
    - Red border if error
  - Keyboard handlers:
    - Enter: Save name (call `onSave`)
    - Escape: Cancel edit (call `onCancel`)
  - Click outside: Auto-save (same as Enter)
  - Test Gate: Inline edit works, validation displays, keyboard shortcuts work

### 4.3 Update Canvas Card for Rename Button

- [ ] Modify `src/components/CanvasGallery/CanvasCard.tsx`
  - Add state: `isRenaming: boolean`
  - Add rename button (pencil icon):
    - Position: Top-right of card
    - Visibility: Show on hover or always (mobile-friendly)
    - Icon: Pencil/edit icon
    - Aria-label: "Rename canvas [name]"
  - When rename clicked:
    - Set `isRenaming = true`
    - Replace card title with `<RenameCanvasInline>`
  - When rename saved:
    - Call `canvasListService.renameCanvas()`
    - Optimistic UI: Update local state immediately
    - On error: Revert and show toast
    - Set `isRenaming = false`
  - When rename cancelled:
    - Set `isRenaming = false`
    - Revert to original name
  - Test Gate: Rename button appears, inline edit works, save/cancel work

### 4.4 Update Navbar for Canvas Name Display

- [ ] Modify `src/components/Layout/Navbar.tsx`
  - State: `isEditingName: boolean`
  - Display canvas name with edit icon hint
  - Replace "untitled - Paint" with actual canvas name
  - Position: Left side or center of navbar
  - Styling: Bold text, clickable (cursor: pointer)
  - Click handler: Set `isEditingName = true`
  - When editing:
    - Replace name text with `<RenameCanvasInline>`
    - Auto-focus input
  - When saved:
    - Call `canvasListService.renameCanvas()`
    - Update `currentCanvasId` context
    - Set `isEditingName = false`
  - Test Gate: Canvas name displayed, clickable, inline edit works

### 4.5 Update Gallery for Create Button

- [ ] Modify `src/components/CanvasGallery/CanvasGallery.tsx`
  - Import `CreateCanvasButton` component
  - Add button at top of gallery (above canvas grid)
  - Position: Top-right, aligned with gallery header
  - State: `creatingCanvas: boolean`
  - Click handler: Call `handleCreateCanvas()`
  - Test Gate: Button rendered in correct position

---

## 5. Integration & Hooks

### 5.1 Create Canvas Creation Hook

- [ ] Create `src/hooks/useCanvasCreation.ts`
  - Custom hook for canvas creation logic
  - State:
    - `creating: boolean`
    - `error: string | null`
  - Function: `createCanvas(name?: string): Promise<string | null>`
    - Set `creating = true`
    - Call `canvasListService.createCanvas(userId, name)`
    - On success:
      - Return canvas ID
      - Show toast: "Canvas created successfully!"
    - On error:
      - Set error state
      - Show toast: "Failed to create canvas: [error]"
      - Return null
    - Set `creating = false`
  - Export: `{ createCanvas, creating, error }`
  - Test Gate: Hook creates canvas, manages loading state, handles errors

### 5.2 Create Canvas Rename Hook

- [ ] Create `src/hooks/useCanvasRename.ts`
  - Custom hook for canvas rename logic
  - State:
    - `renaming: boolean`
    - `error: string | null`
    - `optimisticName: string | null` - For optimistic UI
  - Function: `renameCanvas(canvasId: string, newName: string): Promise<boolean>`
    - Validate name locally first
    - Set `optimisticName = newName` (optimistic UI)
    - Set `renaming = true`
    - Call `canvasListService.renameCanvas(canvasId, newName)`
    - On success:
      - Show toast: "Canvas renamed to '[newName]'"
      - Clear `optimisticName`
      - Return true
    - On error:
      - Revert optimistic UI: Clear `optimisticName`
      - Show toast: "Failed to rename canvas: [error]"
      - Set error state
      - Return false
    - Set `renaming = false`
  - Export: `{ renameCanvas, renaming, error, optimisticName }`
  - Test Gate: Hook renames canvas, manages optimistic UI, handles errors

### 5.3 Wire Create Button to Hook

- [ ] Update `CanvasGallery.tsx` with creation logic
  - Import and use `useCanvasCreation()` hook
  - Handler: `handleCreateCanvas()`
    ```typescript
    const handleCreateCanvas = async () => {
      const canvasId = await createCanvas(); // No name = default "Untitled Canvas"
      if (canvasId) {
        navigate(`/canvas/${canvasId}`); // Navigate to new canvas
      }
    };
    ```
  - Pass `creating` state to `CreateCanvasButton` as `loading` prop
  - Test Gate: Clicking button creates canvas and navigates

### 5.4 Wire Rename to Hook

- [ ] Update `CanvasCard.tsx` with rename logic
  - Import and use `useCanvasRename()` hook
  - Handler: `handleRename(newName: string)`
    ```typescript
    const handleRename = async (newName: string) => {
      const success = await renameCanvas(canvas.id, newName);
      if (success) {
        setIsRenaming(false);
      }
    };
    ```
  - Display `optimisticName` if set, otherwise `canvas.name`
  - Test Gate: Rename updates optimistically, reverts on error

- [ ] Update `Navbar.tsx` with rename logic
  - Same pattern as CanvasCard
  - Use current canvas ID from context
  - Test Gate: Navbar rename works

---

## 6. Routing & Navigation

### 6.1 Canvas Creation Navigation

- [ ] Update navigation logic after canvas creation
  - After successful `createCanvas()`:
    - Update URL: `window.location.href = '/canvas/' + canvasId` or use navigation API
    - Canvas context loads new canvas automatically (already implemented in PR #12)
  - Test Gate: User navigates to new canvas after creation

### 6.2 Browser Tab Title Update

- [ ] Update `src/App.tsx` to show canvas name in tab title
  - Listen to `currentCanvasId` from CanvasContext
  - When canvas loaded, update: `document.title = 'CollabCanvas - ' + canvasName`
  - When in gallery: `document.title = 'CollabCanvas - Gallery'`
  - When no canvas: `document.title = 'CollabCanvas'`
  - Test Gate: Browser tab title updates when canvas changes or is renamed

### 6.3 Keyboard Shortcut for New Canvas

- [ ] Add keyboard shortcut handler in `CanvasGallery.tsx`
  - Listen for `Ctrl/Cmd + N` key combination
  - Only active when gallery view is visible (not canvas view)
  - Handler: Call `handleCreateCanvas()`
  - Prevent default browser behavior (new window)
  ```typescript
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleCreateCanvas();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  ```
  - Test Gate: `Ctrl/Cmd + N` creates new canvas when in gallery view

---

## 7. Real-Time Sync

### 7.1 Gallery Real-Time Updates

- [ ] Verify canvas creation updates gallery in real-time
  - User A creates canvas → User B's gallery updates automatically
  - Uses existing `subscribeToUserCanvases()` from PR #12
  - New canvas appears in gallery within 100ms
  - Test Gate: Two-browser test confirms real-time creation

### 7.2 Rename Real-Time Updates

- [ ] Verify rename updates propagate in real-time
  - User A renames canvas → User B sees update in gallery <100ms
  - User A renames canvas → User B sees navbar update <100ms (if viewing same canvas)
  - Uses existing Firestore subscription
  - Test Gate: Two-browser test confirms real-time rename sync

---

## 8. Tests

### 8.1 Unit Tests - Service Layer

- [ ] Write unit tests for `canvasListService.ts`
  - File: `tests/unit/services/canvasListService.test.ts`
  - Test `validateCanvasName()`:
    - Valid names (1-100 chars)
    - Empty name (invalid)
    - Too long name (>100 chars, invalid)
    - Whitespace trimming
  - Test `createCanvas()`:
    - Default name creation
    - Custom name creation
    - Name validation errors
  - Test `renameCanvas()`:
    - Successful rename
    - Validation errors
    - Non-existent canvas
  - Test Gate: All unit tests pass (>90% coverage)

### 8.2 Integration Tests - Canvas Creation

- [ ] Write integration test for canvas creation flow
  - File: `tests/integration/canvas-creation.test.tsx`
  - Test: User clicks "Create New Canvas" → Canvas created → User navigates to canvas
  - Test: Default name is "Untitled Canvas"
  - Test: Canvas appears in gallery
  - Test: Canvas metadata correct (ownerId, collaboratorIds, shapeCount=0)
  - Test Gate: End-to-end creation flow works

### 8.3 Integration Tests - Canvas Rename

- [ ] Write integration test for canvas rename flow
  - File: `tests/integration/canvas-rename.test.tsx`
  - Test: User renames from gallery → Name updates
  - Test: User renames from canvas view → Name updates
  - Test: Validation errors displayed correctly
  - Test: Optimistic UI works (immediate update, reverts on error)
  - Test: Real-time sync (User A rename → User B sees update)
  - Test Gate: End-to-end rename flow works

### 8.4 Integration Tests - Multi-User Scenarios

- [ ] Write multi-user test for canvas creation and rename
  - File: `tests/integration/canvas-multi-user.test.tsx`
  - Test: User A creates canvas → User B's gallery updates
  - Test: User A (owner) renames → User B sees update
  - Test: User B (non-owner) cannot rename → Error displayed
  - Test: Concurrent renames → Last write wins
  - Test Gate: Multi-user scenarios work correctly

### 8.5 Accessibility Tests

- [ ] Test keyboard navigation
  - Tab to "Create New Canvas" button → Enter creates canvas
  - Tab to rename button → Enter activates inline edit
  - Type new name → Enter saves → Escape cancels
  - Test Gate: All keyboard shortcuts work

- [ ] Test screen reader announcements
  - Create button has correct aria-label
  - Rename button has correct aria-label
  - Loading states have aria-busy
  - Success messages announced
  - Test Gate: Screen reader friendly

---

## 9. Error Handling & Edge Cases

### 9.1 Canvas Creation Errors

- [ ] Handle Firestore write failures
  - Network error → Show toast: "Failed to create canvas. Check your connection."
  - Permission error → Show toast: "You don't have permission to create canvases."
  - Unknown error → Show toast: "An error occurred. Please try again."
  - Stay in gallery (don't navigate)
  - Test Gate: All error cases handled gracefully

### 9.2 Rename Errors

- [ ] Handle rename validation errors
  - Empty name → Show inline error: "Canvas name cannot be empty"
  - Too long → Show inline error: "Canvas name too long (max 100 characters)"
  - Red border on input
  - Don't submit to Firestore
  - Test Gate: Validation errors display correctly

- [ ] Handle rename Firestore errors
  - Network error → Revert optimistic UI, show toast
  - Canvas not found → Show toast: "Canvas not found. It may have been deleted."
  - Permission error → Show toast: "You don't have permission to rename this canvas."
  - Test Gate: Firestore errors handled, UI reverts

### 9.3 Edge Cases

- [ ] Test canvas creation with special characters
  - Name: "Project 🎨 #1 [Draft]"
  - Should save and display correctly
  - Test Gate: Special chars handled

- [ ] Test canvas creation with Unicode
  - Name: "项目 🚀"
  - Should save and display correctly
  - Test Gate: Unicode handled

- [ ] Test rapid canvas creation
  - Click "Create" button 5 times quickly
  - Should create 5 separate canvases
  - All with unique IDs
  - Test Gate: No race conditions or duplicate IDs

- [ ] Test rename cancel behavior
  - Start rename → Type new name → Press Escape
  - Name reverts to original
  - No Firestore write
  - Test Gate: Cancel works correctly

---

## 10. Polish & UX

### 10.1 Toast Notifications

- [ ] Add success toast for canvas creation
  - Message: "Canvas created successfully! Click the name to rename."
  - Duration: 3 seconds
  - Position: Bottom-right
  - Test Gate: Toast displays after creation

- [ ] Add success toast for canvas rename
  - Message: "Canvas renamed to '[newName]'"
  - Duration: 2 seconds
  - Test Gate: Toast displays after rename

- [ ] Add error toasts for failures
  - Creation failure: "Failed to create canvas: [error]"
  - Rename failure: "Failed to rename canvas: [error]"
  - Validation errors: Use inline errors (not toasts)
  - Test Gate: Error toasts display on failures

### 10.2 Loading States

- [ ] Create button loading state
  - Show spinner
  - Text changes to "Creating..."
  - Button disabled
  - Test Gate: Loading state displays during creation

- [ ] Rename input saving state
  - Show small spinner or checkmark animation
  - Input disabled during save
  - Test Gate: Saving state displays

### 10.3 Character Counter (SHOULD-HAVE)

- [ ] Add character counter to rename input
  - Display: "X/100 characters" below input
  - Update in real-time as user types
  - Color: Gray normally, yellow when >90 chars, red when >100
  - Prevent typing beyond 100 characters
  - Test Gate: Counter displays and prevents overflow

### 10.4 Placeholder Text & Help

- [ ] Add helpful placeholder to rename input
  - Placeholder: "e.g., Project Wireframes, Team Brainstorm"
  - Only show when input is empty
  - Test Gate: Placeholder displays correctly

- [ ] Add tooltip to create button
  - Tooltip: "Create a new blank canvas (Ctrl/Cmd + N)"
  - Shows on hover after 500ms
  - Test Gate: Tooltip displays

### 10.5 Duplicate Name Warning (SHOULD-HAVE)

- [ ] Check for duplicate names when renaming
  - Query user's canvases for matching name
  - Show non-blocking warning: "You already have a canvas named '[name]'"
  - Allow save anyway (warning only, not error)
  - Test Gate: Warning displays for duplicates, save still works

---

## 11. Performance Optimization

### 11.1 Canvas Creation Performance

- [ ] Measure canvas creation time
  - Target: Firestore write <500ms
  - Target: Total user experience (click → navigate) <2s
  - Use console.time() to measure
  - Test Gate: Performance targets met

### 11.2 Rename Performance

- [ ] Measure rename latency
  - Target: Optimistic UI update <50ms
  - Target: Firestore write <100ms
  - Target: Real-time sync <100ms
  - Test Gate: Performance targets met

### 11.3 Gallery Update Performance

- [ ] Measure gallery update latency after creation/rename
  - Target: New canvas appears in gallery <100ms
  - Target: Renamed canvas updates in gallery <100ms
  - Uses existing Firestore subscription (already optimized in PR #12)
  - Test Gate: Gallery updates within performance targets

---

## 12. Documentation

### 12.1 Code Comments

- [ ] Add JSDoc comments to new service methods
  - `createCanvas()`
  - `renameCanvas()`
  - `validateCanvasName()`
  - Include parameter descriptions, return values, error conditions
  - Test Gate: All public methods documented

### 12.2 Update README (if needed)

- [ ] Add section on canvas management features
  - How to create new canvas
  - How to rename canvas
  - Keyboard shortcuts
  - Test Gate: README updated

### 12.3 Inline Code Comments

- [ ] Add comments for complex logic
  - Optimistic UI implementation
  - Validation logic
  - Keyboard event handlers
  - Test Gate: Code is well-commented

---

## 13. PR Preparation

### 13.1 Final Testing Checklist

- [ ] All 49 acceptance gates pass (from PRD Section 11)
- [ ] No console errors or warnings
- [ ] All unit tests pass (`npm test`)
- [ ] All integration tests pass
- [ ] Tested in two browsers simultaneously (multi-user)
- [ ] Tested keyboard shortcuts
- [ ] Tested screen reader (basic validation)
- [ ] Tested edge cases (empty names, long names, special chars)
- [ ] Performance targets met
- [ ] Test Gate: Complete end-to-end validation

### 13.2 Code Review Preparation

- [ ] Run linter: `npm run lint` → Fix all issues
- [ ] Format code: `npm run format` (if available)
- [ ] Remove debug console.logs (keep intentional logs)
- [ ] Remove commented-out code
- [ ] Check for TODO comments → Resolve or document
- [ ] Test Gate: Code clean and ready for review

### 13.3 Write PR Description

- [ ] PR Title: "feat: Add canvas creation and naming functionality (PR #13)"
- [ ] PR Description sections:
  - **Overview:** Summary of features added
  - **Changes:**
    - Service layer: `createCanvas()`, `renameCanvas()`, `validateCanvasName()`
    - UI components: Create button, rename inline edit, navbar updates
    - Real-time sync for creation and rename
  - **Testing:**
    - Unit tests for service methods
    - Integration tests for creation and rename flows
    - Multi-user tests for real-time sync
  - **Screenshots/GIFs:**
    - Create new canvas flow
    - Rename from gallery
    - Rename from canvas view
  - **Checklist:**
    - [ ] All acceptance gates pass
    - [ ] Tests written and passing
    - [ ] No breaking changes
    - [ ] Documentation updated
  - **Closes:** Links to PR #13 in project board
- [ ] Test Gate: PR description complete and clear

### 13.4 Create PR

- [ ] Push branch to remote: `git push origin feature/pr-13-create-canvas-naming`
- [ ] Open PR on GitHub
- [ ] Add labels: `feature`, `phase-3`, `canvas-management`
- [ ] Assign reviewers
- [ ] Link to PRD: `collabcanvas/docs/prds/pr-13-prd.md`
- [ ] Link to TODO: `collabcanvas/docs/todos/pr-13-todo.md`
- [ ] Test Gate: PR created and ready for review

---

## 14. Post-Merge Validation

### 14.1 Production Smoke Tests

- [ ] Deploy to staging/production
- [ ] Test canvas creation in production environment
- [ ] Test canvas rename in production environment
- [ ] Verify Firestore rules deployed correctly
- [ ] Check production console for errors
- [ ] Test Gate: Features work in production

### 14.2 Monitor Metrics

- [ ] Monitor Firestore write operations (creation/rename)
- [ ] Monitor error rates
- [ ] Monitor performance latency
- [ ] Check user feedback (if available)
- [ ] Test Gate: No regressions or issues reported

---

## Summary Checklist (Copy to PR Description)

- [ ] Branch created: `feature/pr-13-create-canvas-naming`
- [ ] Service methods implemented: `createCanvas()`, `renameCanvas()`, `validateCanvasName()`
- [ ] UI implemented: Create button, rename inline edit, navbar updates
- [ ] Real-time sync verified (<100ms for gallery and canvas view)
- [ ] Toast notifications for success and errors
- [ ] Firestore security rules updated and tested
- [ ] Browser tab title updates with canvas name
- [ ] Keyboard shortcuts work (`Ctrl/Cmd + N`, `Enter`, `Escape`)
- [ ] Tests written and passing:
  - [ ] Unit tests for service layer
  - [ ] Integration tests for creation flow
  - [ ] Integration tests for rename flow
  - [ ] Multi-user tests for real-time sync
- [ ] Error handling implemented for all failure cases
- [ ] Accessibility tested (keyboard navigation, screen reader)
- [ ] Performance targets met (<2s creation, <100ms rename sync)
- [ ] All 49 acceptance gates pass
- [ ] Code reviewed and approved
- [ ] Documentation updated

---

## Notes for Building Agent

### Implementation Order:
1. **Service layer first** (Section 2) - Core logic without UI dependencies
2. **Firestore rules** (Section 3) - Security enforcement
3. **UI components** (Section 4) - Visual elements
4. **Hooks and integration** (Section 5) - Wire everything together
5. **Routing and navigation** (Section 6) - User flow completion
6. **Tests** (Section 8) - Validate everything works
7. **Polish** (Section 10) - UX improvements

### Key Patterns:
- **Optimistic UI:** Update local state immediately, revert on error
- **Validation:** Client-side validation before Firestore write
- **Error handling:** Try-catch blocks, toast notifications, graceful degradation
- **Real-time sync:** Use existing Firestore subscriptions from PR #12

### Common Pitfalls to Avoid:
- Don't forget to trim whitespace from canvas names
- Don't allow navigation if canvas creation fails
- Don't forget to update browser tab title
- Don't forget to prevent default behavior for `Ctrl/Cmd + N`
- Don't forget optimistic UI revert on rename failure
- Don't forget to test with non-owner users (permission errors)

### Time Estimates:
- Service layer: 1 hour
- Firestore rules: 30 minutes
- UI components: 2 hours
- Hooks and integration: 1 hour
- Tests: 1.5 hours
- Polish and edge cases: 1 hour
- **Total: ~7 hours**

---

**END OF TODO**

