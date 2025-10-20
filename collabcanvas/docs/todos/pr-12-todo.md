# PR-12 TODO — Canvas Gallery & List View

**Branch**: `feature/pr-12-canvas-gallery`  
**Source PRD**: `collabcanvas/docs/prds/pr-12-prd.md`  
**Owner (Agent)**: Building Agent

---

## 0. Clarifying Questions & Assumptions

### Questions Resolved in PRD:
- Q: Should we migrate existing `canvases/main` data?
- A: No migration. Leave old data as-is. Start fresh with new structure.

### Assumptions (unblock coding now; confirm in PR):
- For testing, we'll manually create 2-3 canvas documents in Firestore
- Gallery will use real-time subscriptions (not one-time fetch)
- Canvas metadata (shapeCount, updatedAt) uses eventual consistency model
- URL routing will be simple (no React Router library, just URL parsing)
- "Back to Gallery" button will be added to Navbar component
- Empty state is expected behavior for new users (not an error)

---

## 1. Repo Prep

- [ ] Create branch `feature/pr-12-canvas-gallery`
- [ ] Confirm Firebase emulators running (Auth, Firestore, RTDB)
- [ ] Verify test runner works (`npm test`)
- [ ] Read PRD thoroughly (`collabcanvas/docs/prds/pr-12-prd.md`)

---

## 2. Service Layer (deterministic contracts)

### 2.1 Create Canvas List Service

- [ ] Create `src/services/canvasListService.ts`
  - Test Gate: File created, exports defined

- [ ] Implement `getCanvasesForUser(userId: string): Promise<CanvasMetadata[]>`
  - Query: `where('collaboratorIds', 'array-contains', userId)`
  - Order by: `updatedAt desc`
  - Limit: 50
  - Return empty array on error (log to console)
  - Test Gate: Returns canvases user has access to

- [ ] Implement `subscribeToUserCanvases(userId, callback): Unsubscribe`
  - Same query as above, but with `onSnapshot`
  - Real-time updates when canvases change
  - Return unsubscribe function
  - Test Gate: Callback fires when canvas list changes

- [ ] Implement `getCanvasById(canvasId: string): Promise<CanvasMetadata | null>`
  - Fetch single canvas document
  - Return null if not found or access denied
  - Test Gate: Returns canvas metadata or null correctly

- [ ] Implement `updateCanvasAccess(canvasId: string): Promise<void>`
  - Update `lastAccessedAt` to current timestamp
  - Use `serverTimestamp()`
  - Fail silently (non-critical)
  - Test Gate: Timestamp updates in Firestore

- [ ] Implement `updateCanvasMetadata(canvasId, updates): Promise<void>`
  - Update fields like `updatedAt`, `shapeCount`
  - Validate updates object
  - Test Gate: Metadata updates correctly

- [ ] Add TypeScript interfaces for `CanvasMetadata`, `CanvasDocument`
  - Match schema from PRD Section 8
  - Export interfaces
  - Test Gate: TypeScript compiles without errors

### 2.2 Refactor Canvas Service for Multi-Canvas

- [ ] Update `canvasService.ts` method signatures to accept `canvasId` parameter
  - `createShape(canvasId, shapeInput)` (was just `shapeInput`)
  - `subscribeToShapes(canvasId, callback)` (was just `callback`)
  - `updateShape(canvasId, shapeId, updates)`
  - `deleteShape(canvasId, shapeId)`
  - `lockShape(canvasId, shapeId, userId)`
  - `unlockShape(canvasId, shapeId, userId)`
  - Update all ~20+ methods
  - Test Gate: TypeScript compiles, all signatures updated

- [ ] Update internal paths in `canvasService.ts`
  - Change `shapesCollectionPath` from `'canvases/main/shapes'` to dynamic
  - Use: `canvases/${canvasId}/shapes`
  - Same for groups, comments collections
  - Test Gate: Paths correctly scoped to canvasId

- [ ] Add canvas metadata updates to shape operations
  - On `createShape()`: increment `shapeCount`, update `updatedAt`
  - On `deleteShape()`: decrement `shapeCount`, update `updatedAt`
  - Use `updateCanvasMetadata()` from canvasListService
  - Test Gate: Canvas metadata syncs with shape operations

### 2.3 Refactor Chat Service for Multi-Canvas

- [ ] Update `chatService.ts` method signatures
  - `saveMessage(canvasId, message)` (was just `message`)
  - `subscribeToMessages(canvasId, userId, callback)`
  - `getMessageHistory(canvasId, userId, limit?)`
  - Test Gate: TypeScript compiles, all signatures updated

- [ ] Update internal paths in `chatService.ts`
  - Change from `chatMessages/{messageId}` with userId filter
  - To: `canvases/${canvasId}/chatMessages/{messageId}`
  - Update query paths
  - Test Gate: Paths correctly scoped to canvasId

### 2.4 Refactor Presence & Cursor Services for Multi-Canvas

- [ ] Update `presenceService.ts` method signatures
  - `setOnline(canvasId, userId, username)`
  - `setOffline(canvasId, userId)`
  - `subscribeToPresence(canvasId, callback)`
  - Test Gate: TypeScript compiles

- [ ] Update RTDB paths in `presenceService.ts`
  - Change from `sessions/main/users/${userId}`
  - To: `sessions/${canvasId}/users/${userId}`
  - Test Gate: Paths correctly scoped to canvasId

- [ ] Update `cursorService.ts` method signatures
  - `updateCursor(canvasId, userId, position)`
  - `subscribeToCursors(canvasId, callback)`
  - Test Gate: TypeScript compiles

- [ ] Update RTDB paths in `cursorService.ts`
  - Change from `sessions/main/users/${userId}/cursor`
  - To: `sessions/${canvasId}/users/${userId}/cursor`
  - Test Gate: Paths correctly scoped to canvasId

### 2.5 Service Unit Tests

- [ ] Write unit tests for `canvasListService.getCanvasesForUser()`
  - Mock Firestore query
  - Test returns correct canvases
  - Test empty result handling
  - Test Gate: All tests pass

- [ ] Write unit tests for `canvasListService.subscribeToUserCanvases()`
  - Mock onSnapshot
  - Test callback fires
  - Test unsubscribe works
  - Test Gate: All tests pass

- [ ] Update existing service tests to pass `canvasId` parameter
  - Update all canvasService tests
  - Update all chatService tests
  - Test Gate: All existing tests still pass

---

## 3. Data Model & Rules

### 3.1 Firestore Rules

- [ ] Add rules for `canvases/{canvasId}` collection in `firestore.rules`
  ```javascript
  match /canvases/{canvasId} {
    allow read: if request.auth != null && 
      request.auth.uid in resource.data.collaboratorIds;
    allow create: if request.auth != null && 
      request.resource.data.ownerId == request.auth.uid;
    allow update: if request.auth != null && 
      resource.data.ownerId == request.auth.uid;
  }
  ```
  - Test Gate: Rules file syntax valid

- [ ] Update rules for canvas-scoped shapes
  ```javascript
  match /canvases/{canvasId}/shapes/{shapeId} {
    allow read: if request.auth != null;
    allow create: if request.auth != null;
    allow update: if request.auth != null;
    allow delete: if request.auth != null;
  }
  ```
  - Test Gate: Rules file syntax valid

- [ ] Update rules for canvas-scoped chat messages
  ```javascript
  match /canvases/{canvasId}/chatMessages/{messageId} {
    allow read: if request.auth != null;
    allow create: if request.auth != null && 
      request.resource.data.userId == request.auth.uid;
  }
  ```
  - Test Gate: Rules file syntax valid

- [ ] Update rules for canvas-scoped comments, groups, selections
  - Copy existing patterns but under `canvases/{canvasId}/...`
  - Test Gate: Rules file syntax valid

- [ ] Deploy rules to emulator and test
  - Start emulator with new rules
  - Test authorized access works
  - Test unauthorized access blocked
  - Test Gate: Security rules enforce correctly

### 3.2 Firestore Indexes

- [ ] Add composite index to `firestore.indexes.json`
  ```json
  {
    "collectionGroup": "canvases",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "collaboratorIds", "arrayConfig": "CONTAINS" },
      { "fieldPath": "updatedAt", "order": "DESCENDING" }
    ]
  }
  ```
  - Test Gate: Index definition valid

- [ ] Test query performance with index
  - Query should complete in <100ms
  - Test Gate: Query uses index (check emulator logs)

### 3.3 RTDB Rules

- [ ] Update `database.rules.json` for canvas-scoped sessions
  ```json
  {
    "sessions": {
      "$canvasId": {
        "users": {
          "$userId": {
            ".read": true,
            ".write": "$userId === auth.uid"
          }
        }
      }
    }
  }
  ```
  - Test Gate: Rules file syntax valid

- [ ] Deploy RTDB rules to emulator and test
  - Test Gate: Presence updates work with new paths

---

## 4. UI Components

### 4.1 Create Utility Helpers

- [ ] Create `src/utils/formatRelativeTime.ts`
  - Function: `formatRelativeTime(date: Date): string`
  - Return "Just now", "2 minutes ago", "3 hours ago", "2 days ago", etc.
  - Use simple logic (no library needed)
  - Test Gate: Function returns correct strings

### 4.2 Create Custom Hook for Canvas List

- [ ] Create `src/hooks/useCanvasList.ts`
  - State: `canvases: CanvasMetadata[]`, `loading: boolean`, `error: string | null`
  - Use `canvasListService.subscribeToUserCanvases()`
  - Cleanup subscription on unmount
  - Test Gate: Hook compiles, exports correctly

- [ ] Implement hook logic
  - Subscribe to user's canvases on mount
  - Update state when canvases change
  - Handle loading and error states
  - Test Gate: Hook updates state correctly

### 4.3 Create Gallery Components

- [ ] Create directory `src/components/CanvasGallery/`
  - Test Gate: Directory exists

- [ ] Create `src/components/CanvasGallery/CanvasEmptyState.tsx`
  - Props: none
  - Display: Clippy avatar, friendly message, explanation
  - Message: "Welcome! You don't have any canvases yet."
  - Explanation: "Canvases are collaborative drawing spaces..."
  - Placeholder button: "Create New Canvas - Coming Soon!" (disabled)
  - Test Gate: Component renders without errors

- [ ] Create `src/components/CanvasGallery/CanvasCard.tsx`
  - Props: `canvas: CanvasMetadata`, `onClick: (id: string) => void`
  - Display: Canvas name, relative time, collaborator count, shape count
  - Hover effect: Subtle shadow/elevation
  - Click handler: Call `onClick(canvas.id)`
  - Test Gate: Component renders with mock data

- [ ] Create `src/components/CanvasGallery/CanvasGallery.tsx`
  - Use `useCanvasList()` hook
  - If loading: Show spinner
  - If error: Show error message
  - If empty: Show `<CanvasEmptyState />`
  - If canvases: Show grid of `<CanvasCard />` components
  - Grid: 3 columns desktop, 2 tablet, 1 mobile (responsive)
  - Test Gate: Component renders all states correctly

- [ ] Create `src/components/CanvasGallery/CanvasGallery.css`
  - Grid layout styles
  - Card styles (white bg, border, rounded corners)
  - Hover effects (shadow, slight elevation)
  - Loading spinner styles
  - Empty state styles
  - Responsive breakpoints
  - Test Gate: Styles applied correctly

### 4.4 Update Context & Hooks

- [ ] Update `src/contexts/CanvasContext.tsx` interface
  - Add: `currentCanvasId: string | null`
  - Add: `setCurrentCanvasId: (id: string | null) => void`
  - Test Gate: TypeScript compiles

- [ ] Implement `currentCanvasId` state in CanvasProvider
  - Use `useState<string | null>(null)`
  - Provide state and setter in context value
  - Test Gate: Context provides new values

- [ ] Update `src/hooks/useCanvas.ts`
  - Get `currentCanvasId` from context
  - Pass `currentCanvasId` to all service calls
  - Handle case where `currentCanvasId` is null (don't call services)
  - Test Gate: Hook passes canvasId correctly

- [ ] Update `src/hooks/usePresence.ts`
  - Get `currentCanvasId` from context
  - Pass `currentCanvasId` to presenceService calls
  - Resubscribe when `currentCanvasId` changes
  - Cleanup old subscription on change
  - Test Gate: Presence scoped to canvas

- [ ] Update `src/hooks/useCursors.ts`
  - Get `currentCanvasId` from context
  - Pass `currentCanvasId` to cursorService calls
  - Resubscribe when `currentCanvasId` changes
  - Cleanup old subscription on change
  - Test Gate: Cursors scoped to canvas

- [ ] Update `src/components/Chat/FloatingClippy.tsx` (or parent)
  - Get `currentCanvasId` from context
  - Pass `currentCanvasId` to chat service calls
  - Test Gate: Chat scoped to canvas

### 4.5 Update Routing & Navigation

- [ ] Update `src/App.tsx` to implement routing
  - Parse URL: Extract path and canvasId
  - State: `currentView: 'gallery' | 'canvas'`, `urlCanvasId: string | null`
  - On mount: Parse `window.location.pathname`
  - `/gallery` or `/` → Show gallery
  - `/canvas/:canvasId` → Show canvas with that ID
  - Test Gate: Routing logic works

- [ ] Implement URL state management in App.tsx
  - Listen to `popstate` event (back button)
  - Update view when URL changes
  - Test Gate: Back button works

- [ ] Create gallery view in App.tsx
  - Render `<CanvasGallery />` when `currentView === 'gallery'`
  - Handle canvas selection: Update URL, set canvasId, change view
  - `navigateToCanvas(canvasId)` helper
  - Test Gate: Gallery displays and canvas selection works

- [ ] Update canvas view in App.tsx
  - Only render `<Canvas />` when `currentView === 'canvas'` and `urlCanvasId` exists
  - Call `setCurrentCanvasId(urlCanvasId)` when rendering canvas
  - Show loading state while canvas loading
  - Test Gate: Canvas loads with correct ID

- [ ] Add "Back to Gallery" button to Navbar
  - Update `src/components/Layout/Navbar.tsx`
  - Add button (left side): "← Gallery"
  - Click: Navigate to `/gallery`
  - Only show when on canvas view
  - Test Gate: Button appears and navigates correctly

- [ ] Handle invalid canvas ID
  - Check if canvas exists before loading
  - If not found or no access: Show error, redirect to gallery
  - Test Gate: Invalid ID handled gracefully

---

## 5. Integration & Realtime

### 5.1 Canvas Loading Flow

- [ ] Implement canvas load sequence in CanvasContext
  - When `currentCanvasId` changes and is not null:
    1. Unsubscribe from previous canvas (if any)
    2. Call `canvasListService.updateCanvasAccess(currentCanvasId)`
    3. Subscribe to shapes for new canvas
    4. Subscribe to presence for new canvas
    5. Subscribe to cursors for new canvas
    6. Subscribe to chat for new canvas
  - Test Gate: Subscriptions switch correctly

- [ ] Implement subscription cleanup
  - Store unsubscribe functions in refs
  - Call all unsubscribe functions when canvas changes
  - Cleanup on component unmount
  - Test Gate: No memory leaks, old subscriptions cleaned

### 5.2 Gallery Real-Time Updates

- [ ] Wire gallery to show real-time canvas list updates
  - `useCanvasList` hook already subscribing
  - Verify list updates when canvas metadata changes
  - Test Gate: Gallery reflects changes in <100ms

### 5.3 Cross-Canvas Isolation Testing

- [ ] Test shapes don't leak across canvases
  - Open Canvas A, create shape
  - Open Canvas B, verify shape not visible
  - Test Gate: Shape only on Canvas A

- [ ] Test chat doesn't leak across canvases
  - Open Canvas A, send chat message
  - Open Canvas B, verify message not visible
  - Test Gate: Chat only on Canvas A

- [ ] Test presence doesn't leak across canvases
  - User A on Canvas A, User B on Canvas B
  - Verify User A doesn't see User B in presence
  - Test Gate: Presence scoped correctly

- [ ] Test concurrent canvas access
  - User A edits Canvas 1, User B edits Canvas 2 simultaneously
  - Verify no interference
  - Test Gate: Both users work independently

### 5.4 Real-Time Sync Within Canvas

- [ ] Test shape creation syncs across users
  - User A creates shape on Canvas X
  - User B (also on Canvas X) sees shape in <100ms
  - Test Gate: Real-time sync works

- [ ] Test all existing real-time features still work
  - Shape updates, deletes, locks
  - Chat messages
  - Cursors
  - Presence
  - Test Gate: All features functional

---

## 6. Tests

### 6.a) Interactions ("does it click")

- [ ] Test gallery loads on login
  - Open app → Should see gallery
  - Test Gate: Gallery displays

- [ ] Test canvas card click opens canvas
  - Click card → URL changes → Canvas loads
  - Test Gate: Canvas opens correctly

- [ ] Test "Back to Gallery" button
  - From canvas, click button → Returns to gallery
  - Test Gate: Navigation works

- [ ] Test keyboard navigation in gallery
  - Tab through cards
  - Enter to open focused card
  - Test Gate: Keyboard nav works

- [ ] Test empty state displays for new users
  - User with no canvases sees empty state
  - Test Gate: Empty state shows

### 6.b) Logic

- [ ] Test canvas query filters correctly
  - Create canvas owned by User A
  - User B should not see it (not in collaboratorIds)
  - Add User B to collaboratorIds → User B sees it
  - Test Gate: Access control works

- [ ] Test canvas metadata updates
  - Create shape → shapeCount increments
  - Delete shape → shapeCount decrements
  - Test Gate: Metadata stays in sync

- [ ] Test invalid canvas ID handling
  - Navigate to `/canvas/invalid-id`
  - Should show error and redirect to gallery
  - Test Gate: Error handled gracefully

- [ ] Test subscription cleanup
  - Switch from Canvas A to Canvas B
  - Verify Canvas A subscription cleaned up (check listeners count)
  - Test Gate: No memory leaks

- [ ] Test canvas access timestamp updates
  - Open canvas → lastAccessedAt updates
  - Test Gate: Timestamp updates

### 6.c) Visuals

- [ ] Test gallery loading state
  - While loading: Spinner visible
  - After load: Canvases or empty state visible
  - Test Gate: Loading state works

- [ ] Test gallery empty state
  - Clear friendly message
  - Clippy avatar visible
  - Placeholder button present
  - Test Gate: Empty state renders correctly

- [ ] Test canvas card styling
  - Proper layout (name, metadata, spacing)
  - Hover effect visible
  - Responsive grid (3, 2, 1 columns)
  - Test Gate: Cards styled correctly

- [ ] Test canvas loading state
  - While loading: Spinner visible
  - After load: Canvas renders
  - Test Gate: Canvas loading state works

- [ ] Test error states
  - Network error: Show error message
  - Invalid canvas: Show error, redirect
  - Test Gate: Error messages clear

### 6.d) Integration Tests

- [ ] Write integration test: Gallery load
  - Login → Gallery loads → Shows canvases
  - Test file: `tests/integration/canvas-gallery.test.tsx`
  - Test Gate: Integration test passes

- [ ] Write integration test: Canvas selection
  - Click card → URL updates → Canvas loads → Shapes visible
  - Test Gate: Integration test passes

- [ ] Write integration test: Cross-canvas isolation
  - 2 canvases, verify data doesn't leak
  - Test Gate: Integration test passes

- [ ] Write integration test: Real-time sync per canvas
  - 2 users on same canvas, verify sync works
  - Test Gate: Integration test passes

### 6.e) Unit Tests

- [ ] Write unit tests for `formatRelativeTime()`
  - Test various time differences
  - Test Gate: All tests pass

- [ ] Write unit tests for `useCanvasList` hook
  - Mock service, test state updates
  - Test Gate: All tests pass

- [ ] Verify all existing tests still pass
  - Run full test suite: `npm test`
  - Fix any broken tests due to service signature changes
  - Test Gate: 0 failing tests

---

## 7. Performance

- [ ] Measure gallery load time
  - Create 50 test canvases
  - Measure time from login to gallery display
  - Target: <500ms
  - Test Gate: Performance target met

- [ ] Measure canvas load time
  - Canvas with 50 shapes
  - Measure time from card click to canvas render
  - Target: <1 second
  - Test Gate: Performance target met

- [ ] Measure real-time sync latency
  - User A creates shape → Measure time until User B sees it
  - Target: <100ms
  - Test Gate: Sync latency acceptable

- [ ] Test memory management
  - Switch between 10 canvases
  - Check browser memory usage (DevTools)
  - Verify subscriptions cleaned up (no growth)
  - Test Gate: No memory leaks

- [ ] Test with large canvas list
  - 100+ canvases (use script to create)
  - Verify pagination works
  - Verify scrolling smooth
  - Test Gate: Large lists handled well

- [ ] Optimize queries if needed
  - Check Firestore query logs
  - Verify indexes used
  - Add indexes if missing
  - Test Gate: Queries optimized

---

## 8. Docs & PR

- [ ] Update README if needed
  - Document new routing structure
  - Document multi-canvas architecture
  - Update any outdated info
  - Test Gate: README accurate

- [ ] Add inline code comments
  - Comment complex routing logic
  - Comment subscription cleanup logic
  - Comment canvas metadata update logic
  - Test Gate: Code well-documented

- [ ] Update this TODO with test results
  - Mark all gates as pass/fail
  - Document any issues encountered
  - Test Gate: TODO updated

- [ ] Write PR description using template:
  
  **Goal and Scope:**
  - Transform CollabCanvas from single canvas to multi-canvas application
  - Add gallery view for canvas management
  - Refactor all data storage to be canvas-scoped
  
  **Files Changed:**
  - NEW: `canvasListService.ts` - Canvas collection queries
  - NEW: `CanvasGallery/` components - Gallery UI
  - NEW: `useCanvasList.ts` - Gallery state hook
  - MODIFIED: `canvasService.ts` - Added canvasId parameter
  - MODIFIED: `chatService.ts` - Added canvasId parameter
  - MODIFIED: `presenceService.ts` - Added canvasId parameter
  - MODIFIED: `cursorService.ts` - Added canvasId parameter
  - MODIFIED: `CanvasContext.tsx` - Added currentCanvasId state
  - MODIFIED: `App.tsx` - Added routing logic
  - MODIFIED: `firestore.rules` - Added canvas collection rules
  - MODIFIED: `database.rules.json` - Updated for canvas-scoped sessions
  
  **Test Steps:**
  1. Login → Verify gallery displays
  2. Click canvas card → Verify canvas loads
  3. Create shapes → Verify real-time sync works
  4. Open 2 different canvases → Verify no cross-canvas data
  5. Check presence → Verify scoped to current canvas
  6. Test "Back to Gallery" button
  7. Test empty state for new users
  8. Test invalid canvas ID handling
  
  **Breaking Changes:**
  - All service methods now require `canvasId` as first parameter
  - Old `canvases/main` data not migrated (manual cleanup needed)
  
  **Known Limitations:**
  - No canvas creation yet (PR #13)
  - No canvas deletion yet (PR #15)
  - No canvas sharing yet (PR #14)
  - Canvas metadata uses eventual consistency
  
  **Links:**
  - PRD: `collabcanvas/docs/prds/pr-12-prd.md`
  - TODO: `collabcanvas/docs/todos/pr-12-todo.md`
  
  Test Gate: PR description complete

- [ ] Open PR with all information
  - Link to PRD and TODO
  - Include test results
  - Tag reviewers
  - Test Gate: PR created

---

## Copyable Checklist (for PR description)

- [ ] Branch created: `feature/pr-12-canvas-gallery`
- [ ] Services refactored: canvasId parameter added to all methods
- [ ] New canvasListService implemented + unit tests
- [ ] Firestore rules updated for canvas collection
- [ ] RTDB rules updated for canvas-scoped sessions
- [ ] UI implemented: Gallery, CanvasCard, EmptyState
- [ ] Routing implemented: /gallery and /canvas/:canvasId
- [ ] Context updated: currentCanvasId state management
- [ ] Real-time sync verified: <100ms within canvas
- [ ] Cross-canvas isolation verified: No data leakage
- [ ] Tests written: Unit, integration, acceptance gates
- [ ] Performance targets met: Gallery <500ms, Canvas <1s
- [ ] Accessibility tested: Keyboard nav, screen readers
- [ ] All 38 acceptance gates passed
- [ ] Docs updated: README, inline comments
- [ ] No console errors during normal operation

---

## Implementation Notes

**Key Architectural Changes:**
- Single canvas (`canvases/main`) → Multi-canvas (`canvases/{canvasId}`)
- All subcollections now canvas-scoped
- Services require `canvasId` parameter
- URL is source of truth for current canvas
- Subscriptions must cleanup when switching canvases

**Common Pitfalls to Avoid:**
- Forgetting to pass `canvasId` to service calls
- Not cleaning up subscriptions when switching canvases
- Assuming `currentCanvasId` is always non-null
- Not handling invalid canvas IDs
- Creating memory leaks with multiple subscriptions

**Testing Strategy:**
- Test each service method with new signature
- Test cross-canvas isolation thoroughly
- Test subscription cleanup (check listener count)
- Test edge cases (invalid IDs, no access, empty list)
- Use 2-browser testing for real-time sync

**Performance Considerations:**
- Use composite indexes for canvas queries
- Implement pagination (50 canvases per page)
- Cleanup old subscriptions immediately
- Avoid re-subscribing unnecessarily
- Monitor Firestore read counts

---

**Total Tasks:** ~100+ individual checkboxes across all sections  
**Estimated Time:** 8-12 hours of focused development  
**Complexity:** High (major architectural refactor)  
**Risk Level:** High (breaking changes to all services)

