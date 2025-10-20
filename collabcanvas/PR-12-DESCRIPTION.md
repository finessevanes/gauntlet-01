# PR #12: Canvas Gallery & List View

## Summary

Transform CollabCanvas from a single shared canvas to a multi-canvas application with a gallery view for canvas management. All data storage (shapes, chat, comments, presence) is now canvas-scoped, enabling proper isolation between different collaborative workspaces.

## What Changed

### New Files Created
- `src/services/canvasListService.ts` - Service for querying and managing canvas metadata
- `src/components/CanvasGallery/CanvasGallery.tsx` - Main gallery view component
- `src/components/CanvasGallery/CanvasCard.tsx` - Individual canvas card component
- `src/components/CanvasGallery/CanvasEmptyState.tsx` - Empty state for users with no canvases
- `src/components/CanvasGallery/CanvasGallery.css` - Gallery and card styling
- `src/hooks/useCanvasList.ts` - Custom hook for canvas list state management
- `src/utils/formatRelativeTime.ts` - Utility for "2 hours ago" time formatting
- `tests/integration/canvas-gallery.test.tsx` - Integration tests for gallery feature
- `tests/unit/services/canvasListService.test.ts` - Unit tests for canvas list service
- `tests/unit/utils/formatRelativeTime.test.ts` - Unit tests for time formatting

### Modified Files
- `src/services/types/canvasTypes.ts` - Added CanvasMetadata, CanvasDocument, CanvasCardProps interfaces
- `src/services/shapeService.ts` - All methods now accept `canvasId` as first parameter
- `src/services/canvasService.ts` - Updated all facade methods to accept `canvasId`
- `src/services/zIndexService.ts` - Refactored for canvas-scoped paths
- `src/services/groupService.ts` - Refactored for canvas-scoped paths
- `src/services/alignmentService.ts` - Refactored for canvas-scoped paths
- `src/services/commentService.ts` - Refactored for canvas-scoped paths
- `src/services/chatService.ts` - Updated to use canvas-scoped subcollections
- `src/services/presenceService.ts` - Refactored for canvas-scoped RTDB paths
- `src/services/cursorService.ts` - Refactored for canvas-scoped RTDB paths
- `src/services/aiService.ts` - Updated to accept and pass canvasId parameter
- `src/contexts/CanvasContext.tsx` - Added `currentCanvasId` state and updated all callbacks
- `src/hooks/usePresence.ts` - Updated to use currentCanvasId from context
- `src/hooks/useCursors.ts` - Updated to use currentCanvasId from context
- `src/App.tsx` - Implemented routing logic for `/gallery` and `/canvas/:canvasId`
- `src/components/Layout/AppShell.tsx` - Updated to support gallery navigation and canvas-scoped chat
- `src/components/Layout/PaintTitleBar.tsx` - Added "Back to Gallery" button
- `src/contexts/AuthContext.tsx` - Simplified logout (rely on disconnect handlers)
- `src/main.tsx` - Updated testAI helper to accept canvasId
- `firestore.rules` - Added rules for `canvases` collection and canvas-scoped subcollections
- `database.rules.json` - Updated for canvas-scoped sessions paths
- `firestore.indexes.json` - Added composite index for canvas queries

### Breaking Changes
⚠️ **All service methods now require `canvasId` as the first parameter**
- `canvasService.createShape(canvasId, shapeInput)` (was `createShape(shapeInput)`)
- `canvasService.subscribeToShapes(canvasId, callback)` (was `subscribeToShapes(callback)`)
- All other shape, comment, group, alignment, z-index operations follow the same pattern
- Chat service: `saveMessage(canvasId, message)` instead of `saveMessage(message)`
- Presence/cursor: All methods now require `canvasId` parameter

⚠️ **Old `canvases/main` data will not be migrated automatically**
- New canvases use the `canvases/{canvasId}` structure
- Legacy `canvases/main` rules kept for backward compatibility
- Manual cleanup of old data may be needed

## Testing

### Automated Tests ✅
- [x] Integration tests created and passing (`canvas-gallery.test.tsx`)
  - Gallery loading with multiple canvases
  - Canvas card metadata display
  - Canvas selection navigation
  - Empty state for new users
  - Real-time gallery updates
  - Accessibility (ARIA attributes, keyboard navigation)
  - Loading states
- [x] Service unit tests created and passing (`canvasListService.test.ts`)
  - getCanvasesForUser with filters
  - subscribeToUserCanvases real-time updates
  - getCanvasById
  - updateCanvasAccess
  - updateCanvasMetadata
- [x] Utils unit tests created and passing (`formatRelativeTime.test.ts`)
  - All time ranges tested (seconds, minutes, hours, days, weeks, months, years)
  - Edge cases handled

### Build Status ✅
- [x] TypeScript compilation successful (no errors)
- [x] Build completes successfully
- [x] All automated tests pass (28+ tests)

### Manual Testing Required ⚠️
The following require manual verification by the user:
- [ ] Visual appearance (gallery grid layout, card styling, hover effects)
- [ ] Canvas creation for testing (manually create test canvases in Firestore)
- [ ] Real multi-user testing (2+ browser windows)
- [ ] Cross-canvas isolation (verify shapes don't leak between canvases)
- [ ] Performance testing (gallery load <500ms, canvas load <1s)
- [ ] Multi-browser compatibility (Chrome, Firefox, Safari)
- [ ] Accessibility testing with screen readers
- [ ] Invalid canvas ID handling (navigate to `/canvas/invalid-id`)

## Acceptance Gates Status

### Implemented & Testable
✅ Architecture refactored - all services accept canvasId
✅ Gallery UI components created with responsive grid
✅ Routing implemented (`/gallery` and `/canvas/:canvasId`)
✅ Canvas context manages currentCanvasId state
✅ Real-time subscriptions properly scoped
✅ Firestore and RTDB rules updated
✅ Empty state displays for users with no canvases
✅ Canvas cards show metadata (name, time, collaborators, shapes)
✅ Relative time formatting works
✅ Keyboard navigation support
✅ ARIA attributes for accessibility

### Requires Manual Verification
⚠️ Gallery loads in <500ms (need real data)
⚠️ Canvas loads in <1s (need real data)
⚠️ Real-time sync <100ms within canvas
⚠️ Cross-canvas isolation verified
⚠️ Multi-user collaboration works per canvas
⚠️ No data leakage between canvases
⚠️ Invalid canvas ID handling
⚠️ Canvas metadata updates (shapeCount)

## Checklist

- [x] All TODO items completed for automated implementation
- [x] Code follows existing patterns (facade pattern, service layer)
- [x] TypeScript types added for all new interfaces
- [x] Comments added for complex logic (multi-canvas subscriptions)
- [x] No console errors during build
- [x] Tests created and passing (integration + unit)
- [x] Firestore rules enforce canvas access control
- [x] RTDB rules updated for canvas-scoped sessions

## Notes & Considerations

### Architecture Decisions
1. **Service Layer Refactor**: All services now accept `canvasId` as first parameter. This is a breaking change but ensures consistency across the codebase.

2. **Subscription Management**: Canvas subscriptions are properly cleaned up when switching between canvases to prevent memory leaks.

3. **Chat Scoping**: Chat messages moved from top-level collection to canvas-scoped subcollections (`canvases/{canvasId}/chatMessages`).

4. **Presence Isolation**: Realtime Database paths changed from `sessions/main/users` to `sessions/{canvasId}/users` for proper presence scoping.

5. **Backward Compatibility**: Old `canvases/main` rules preserved temporarily for any existing data.

### Known Limitations
- **No Canvas Creation**: Users cannot create canvases yet (coming in PR #13)
- **No Canvas Deletion**: Delete functionality deferred to PR #15
- **No Canvas Sharing**: Share features deferred to PR #14
- **No Thumbnails**: Canvas cards show metadata only (thumbnails in PR #18)
- **Eventual Consistency**: Canvas metadata (shapeCount, updatedAt) uses eventual consistency model

### Future Improvements
- Add canvas creation flow (PR #13)
- Add canvas sharing and collaborator management (PR #14)
- Add canvas deletion with confirmation (PR #15)
- Add canvas thumbnails for visual preview (PR #18)
- Add search and filtering (PR #19)
- Optimize Firestore queries with more specific indexes
- Add canvas templates and presets

### Testing Strategy
The PR includes comprehensive automated tests, but several aspects require manual validation:
- User must create test canvases manually in Firestore Console
- Visual appearance and UX feel needs human verification
- Real multi-browser testing needed for collaboration
- Performance benchmarking with real network latency

## Migration Path for Testing

To test this PR, you'll need to manually create canvas documents in Firestore:

```javascript
// In Firestore Console, create documents at: canvases/test-canvas-1
{
  id: "test-canvas-1",
  name: "Test Canvas 1",
  ownerId: "<your-user-id>",
  collaboratorIds: ["<your-user-id>"],
  createdAt: <serverTimestamp>,
  updatedAt: <serverTimestamp>,
  lastAccessedAt: <serverTimestamp>,
  shapeCount: 0
}
```

Then create shapes at: `canvases/test-canvas-1/shapes/{shapeId}`

## Links
- PRD: `collabcanvas/docs/prds/pr-12-prd.md`
- TODO: `collabcanvas/docs/todos/pr-12-todo.md`
- Base Branch: `feat/agents`
- Compare Branch: `feat/pr-12-canvas-gallery`

