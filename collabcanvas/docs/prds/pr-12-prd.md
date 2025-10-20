# PRD: Canvas Gallery & List View — End-to-End Delivery

**Feature**: Canvas Gallery & List View

**Version**: 1.0

**Status**: Ready for Development

**Agent**: Delilah (Planning Agent)

**Target Release**: Phase 3 - Canvas Management

**Links**: 
- PR Brief: `collabcanvas/docs/pr-briefs.md` (PR #12)
- TODO: `collabcanvas/docs/todos/pr-12-todo.md` (to be created after PRD approval)
- Dependencies: PR #1 (Authentication System), PR #2 (Canvas Core & Shape Tools)

---

## 1. Summary

Create a canvas gallery interface that displays all canvases a user has access to (owned or shared), refactor the single-canvas architecture to support multiple canvases with unique IDs, and implement canvas selection to load a specific canvas for editing. This PR transforms CollabCanvas from a single shared canvas to a multi-canvas application.

---

## 2. Problem & Goals

**Problem:** Currently, all users share a single hardcoded "main" canvas (`canvases/main`). Users cannot create multiple canvases, cannot organize their work, and all users see the same shapes regardless of whether they're working on different projects. This is a critical blocker for real-world usability.

**Why now?** Phase 1 (foundation) and Phase 2 (AI chat) are complete. Users need the ability to manage multiple canvases before we add sharing (PR #14) and other canvas management features (PR #13, #15). This is the foundation for Phase 3.

**Goals:**
- [ ] G1 — Users see a gallery view on login showing all canvases they have access to
- [ ] G2 — Users can click a canvas card to open and edit that specific canvas
- [ ] G3 — Canvas data (shapes, comments, chat) is properly scoped to individual canvas IDs
- [ ] G4 — Existing real-time collaboration features continue to work within each canvas

---

## 3. Non-Goals / Out of Scope

To maintain focus and avoid scope creep:

- [ ] **Not implementing canvas creation** — No "Create New Canvas" button (PR #13)
- [ ] **Not implementing canvas naming/renaming** — Canvases use auto-generated names (PR #13)
- [ ] **Not implementing canvas deletion** — No delete functionality yet (PR #15)
- [ ] **Not implementing canvas sharing** — No shareable links or collaborator management (PR #14)
- [ ] **Not implementing canvas search/filtering** — No search bar or filters (PR #19)
- [ ] **Not implementing canvas thumbnails** — Cards show metadata only, no visual preview (PR #18)
- [ ] **Not implementing canvas templates** — No starter templates or presets
- [ ] **Not migrating existing data** — Old `canvases/main` data can be left as-is or manually cleaned

---

## 4. Success Metrics

**User-visible:**
- Gallery loads and displays canvas list in <500ms
- Clicking a canvas opens it in <1 second
- Canvas metadata (name, last modified, collaborators) displays correctly
- Empty state appears when user has no canvases (first-time users)

**System:**
- Canvas switching maintains <100ms sync latency for real-time features
- Firestore queries optimized with proper indexing
- Canvas list query uses pagination (limit 50 initially)
- URL updates with canvas ID for bookmarking/sharing

**Quality:**
- All acceptance gates pass (defined in Section 11)
- 0 console errors during normal operation
- Real-time collaboration features work correctly within each canvas
- No data leakage between canvases

---

## 5. Users & Stories

### As a First-Time User:
- I want to **see a welcome message** when I have no canvases yet so I know what to do next
- I want to **understand what canvases are** so I can organize my work

### As a Returning User:
- I want to **see all my canvases in a list/grid** so I can find my work quickly
- I want to **see when each canvas was last modified** so I know which is most recent
- I want to **see who else has access to each canvas** so I know if it's shared
- I want to **click a canvas to open it** so I can continue working

### As a Collaborator:
- I want to **see canvases shared with me** alongside my own canvases so I have access to all my work

### As a Developer (PR #13, #14):
- I want **a proper canvases collection** so I can build creation and sharing features
- I want **canvas IDs in URLs** so I can implement deep linking

---

## 6. Experience Specification (UX)

### Entry Points and Flows

#### Flow 1: First-Time User (No Canvases)
1. User signs up and logs in
2. Gallery view loads showing empty state
3. Empty state displays:
   - Friendly message: "Welcome! You don't have any canvases yet."
   - Explanation: "Canvases are collaborative drawing spaces where you can create shapes and chat with Clippy."
   - Call to action: "Create your first canvas in the next update!" (placeholder for PR #13)
4. Clippy avatar visible in empty state

#### Flow 2: Returning User (Has Canvases)
1. User logs in
2. Gallery view loads showing canvas cards in a grid
3. Each card displays:
   - Canvas name (e.g., "Canvas #1", "Untitled Canvas")
   - Last modified timestamp (e.g., "Last edited 2 hours ago")
   - Collaborator count (e.g., "3 collaborators" or "Just you")
   - Shape count preview (e.g., "12 shapes")
4. User hovers over card → subtle elevation/shadow effect
5. User clicks card → loads that canvas in the main app view

#### Flow 3: Canvas Loading
1. User clicks canvas card
2. Loading state appears (spinner or skeleton)
3. URL updates: `/canvas/{canvasId}`
4. Canvas loads with:
   - All shapes for that canvas rendered
   - Real-time sync subscriptions set up
   - Chat history loaded for that canvas
   - Presence shows who's currently on this canvas
5. User can draw, collaborate, chat (existing features work)

### Visual Behavior

**Gallery Layout:**
- Grid layout: 3 columns on desktop, 2 on tablet, 1 on mobile
- Card spacing: 24px gap between cards
- Card dimensions: 300px width, auto height (responsive)
- Card styling: White background, subtle border, rounded corners (8px)

**Canvas Card Components:**
```
┌─────────────────────────────────────┐
│ 🎨 Canvas #123                      │
│                                     │
│ Last edited: 2 hours ago            │
│ 👥 3 collaborators                  │
│ 🔷 15 shapes                        │
│                                     │
│ [Click to open]                     │
└─────────────────────────────────────┘
```

**Empty State:**
```
┌─────────────────────────────────────┐
│                                     │
│         📋 [Clippy avatar]          │
│                                     │
│   Welcome! You don't have any       │
│   canvases yet.                     │
│                                     │
│   Canvases are collaborative        │
│   drawing spaces where you can      │
│   create shapes and chat with me!   │
│                                     │
│   [Create New Canvas - Coming Soon] │
│                                     │
└─────────────────────────────────────┘
```

### Loading States

- **Initial Gallery Load:** Full-page spinner with "Loading your canvases..."
- **Canvas Selection:** Card shows loading overlay, rest of gallery dimmed
- **No Canvases (Empty State):** Immediate display, no loading spinner

### Keyboard Shortcuts

- **`1-9`** — Quick select canvas by position (if applicable)
- **`Enter`** — Open focused canvas card
- **`Escape`** — Return to gallery from canvas view (future)
- **`Tab`** — Navigate between canvas cards

### Accessibility

- Gallery has `role="list"`, cards have `role="listitem"`
- Each card is a clickable button with proper focus styles
- Screen reader announces: "Canvas [name], last edited [time], [X] collaborators, [X] shapes"
- Empty state has descriptive text for screen readers
- Loading states have `aria-live="polite"` announcements

### Performance

- Gallery must load in <500ms with up to 50 canvases
- Canvas selection opens canvas in <1 second
- Real-time sync maintains <100ms latency after canvas loads
- Pagination: Load 50 canvases initially, "Load More" button for additional

---

## 7. Functional Requirements

### MUST-HAVE Requirements

#### REQ-1: Create Canvases Collection
- Add new top-level Firestore collection: `canvases/{canvasId}`
- Canvas document schema:
  ```typescript
  {
    id: string,
    name: string, // e.g., "Canvas #123" (PR #13 will add custom naming)
    ownerId: string,
    collaboratorIds: string[], // Includes owner + shared users
    createdAt: Timestamp,
    updatedAt: Timestamp,
    lastAccessedAt: Timestamp,
    shapeCount: number, // Denormalized for display
  }
  ```
- **Gate:** New `canvases` collection exists with proper schema

#### REQ-2: Refactor Shape Storage to Canvas-Scoped
- Change from: `canvases/main/shapes/{shapeId}`
- Change to: `canvases/{canvasId}/shapes/{shapeId}`
- Update all canvasService methods to accept `canvasId` parameter
- Update Firestore rules for canvas-scoped shapes
- **Gate:** Shapes are properly scoped to canvas IDs, no cross-canvas data leakage

#### REQ-3: Refactor Chat Storage to Canvas-Scoped
- Change from: `chatMessages/{messageId}` with `userId` scoping
- Change to: `canvases/{canvasId}/chatMessages/{messageId}`
- Update chatService to accept `canvasId` parameter
- Update Firestore rules for canvas-scoped chat
- **Gate:** Chat messages are scoped to canvas IDs, not leaked across canvases

#### REQ-4: Refactor Presence to Canvas-Scoped
- Change from: `sessions/main/users/{userId}`
- Change to: `sessions/{canvasId}/users/{userId}`
- Update presenceService and cursorService to accept `canvasId`
- **Gate:** Presence shows only users on the same canvas

#### REQ-5: Create Canvas List Service
- Create `src/services/canvasListService.ts`
- Methods:
  ```typescript
  async getCanvasesForUser(userId: string): Promise<CanvasMetadata[]>
  subscribeToUserCanvases(userId: string, callback: (canvases: CanvasMetadata[]) => void): Unsubscribe
  async getCanvasById(canvasId: string): Promise<CanvasMetadata | null>
  async updateCanvasAccess(canvasId: string): Promise<void> // Updates lastAccessedAt
  ```
- Query: `where('collaboratorIds', 'array-contains', userId)` + `orderBy('updatedAt', 'desc')` + `limit(50)`
- **Gate:** Service successfully queries canvases user has access to

#### REQ-6: Create Gallery UI Component
- Create `src/components/CanvasGallery/CanvasGallery.tsx`
- Display grid of canvas cards
- Each card shows: name, lastAccessedAt (relative time), collaborator count, shape count
- Cards are clickable → navigate to canvas
- **Gate:** Gallery renders correctly with multiple canvases

#### REQ-7: Create Canvas Card Component
- Create `src/components/CanvasGallery/CanvasCard.tsx`
- Props: `canvas: CanvasMetadata`, `onClick: () => void`
- Display all metadata fields
- Hover effects: subtle shadow/elevation
- Loading state when clicked
- **Gate:** Card displays metadata correctly and triggers onClick

#### REQ-8: Create Empty State Component
- Create `src/components/CanvasGallery/CanvasEmptyState.tsx`
- Display when user has no canvases
- Show friendly message, explanation, Clippy avatar
- Placeholder button for PR #13 (disabled)
- **Gate:** Empty state displays correctly for users with no canvases

#### REQ-9: Update App Routing
- Add routing logic to App.tsx or create router
- Routes:
  - `/gallery` (default) — Gallery view
  - `/canvas/:canvasId` — Canvas editor view
- On login → redirect to `/gallery`
- On canvas selection → navigate to `/canvas/:canvasId`
- **Gate:** URL updates correctly, back button returns to gallery

#### REQ-10: Update Canvas Context for Multi-Canvas
- Add `currentCanvasId: string | null` to CanvasContext
- Add `setCurrentCanvasId(id: string)` method
- Update all service calls to pass `currentCanvasId`
- **Gate:** Canvas context manages current canvas ID correctly

#### REQ-11: Canvas Loading Logic
- When URL is `/canvas/:canvasId`:
  1. Extract canvasId from URL
  2. Call `setCurrentCanvasId(canvasId)`
  3. Subscribe to shapes for that canvas
  4. Subscribe to chat messages for that canvas
  5. Subscribe to presence for that canvas
  6. Show loading state until data arrives
- **Gate:** Canvas loads correctly with all data scoped to canvas ID

#### REQ-12: Firestore Rules for Canvas Collection
- Add rules for `canvases/{canvasId}`:
  ```javascript
  // Users can read canvases they have access to
  allow read: if request.auth != null && 
    request.auth.uid in resource.data.collaboratorIds;
  
  // Users can create canvases (owner is creator)
  allow create: if request.auth != null && 
    request.resource.data.ownerId == request.auth.uid;
  
  // Only owner can update (for now)
  allow update: if request.auth != null && 
    resource.data.ownerId == request.auth.uid;
  ```
- Update rules for canvas-scoped shapes, chat, comments
- **Gate:** Security rules prevent unauthorized access to canvases

#### REQ-13: Update Shape Service for Canvas ID
- Modify all methods in `canvasService.ts`:
  ```typescript
  async createShape(canvasId: string, shapeInput: ShapeCreateInput): Promise<string>
  subscribeToShapes(canvasId: string, callback: (shapes: ShapeData[]) => void): Unsubscribe
  async updateShape(canvasId: string, shapeId: string, updates: ShapeUpdateInput): Promise<void>
  // ... all other methods
  ```
- Update internal paths to use `canvasId`
- **Gate:** All shape operations work with canvas-scoped paths

#### REQ-14: Update Chat Service for Canvas ID
- Modify `chatService.ts`:
  ```typescript
  async saveMessage(canvasId: string, message: ChatMessageInput): Promise<string>
  subscribeToMessages(canvasId: string, userId: string, callback: (messages: ChatMessage[]) => void): Unsubscribe
  ```
- Update paths to `canvases/{canvasId}/chatMessages`
- **Gate:** Chat messages load correctly per canvas

#### REQ-15: Gallery Loading State
- Show full-page spinner while loading canvases
- Handle loading, error, and empty states
- Display error message if query fails
- **Gate:** Loading states provide clear feedback

### SHOULD-HAVE Requirements

#### REQ-16: Relative Time Display
- Show "Last edited 2 hours ago" instead of timestamps
- Use library like `date-fns` or custom helper
- Update in real-time or on hover

#### REQ-17: Collaborative Indicator
- Show avatars or count of currently online users per canvas
- Real-time update when users join/leave

#### REQ-18: Optimistic UI for Canvas Selection
- Immediately show loading state when card clicked
- Don't wait for navigation to start

---

## 8. Data Model

### Firestore Collections

#### `canvases/{canvasId}` (NEW)
```typescript
interface CanvasDocument {
  id: string; // Same as document ID
  name: string; // "Canvas #123" or custom name (PR #13)
  ownerId: string; // User who created it
  collaboratorIds: string[]; // [ownerId, ...sharedUserIds]
  createdAt: Timestamp;
  updatedAt: Timestamp; // Updates on shape changes
  lastAccessedAt: Timestamp; // Updates when user opens canvas
  shapeCount: number; // Denormalized from shapes subcollection
}
```

**Indexing:**
- Composite index: `collaboratorIds (ARRAY) + updatedAt (DESC)`
- Single field: `ownerId (ASC)`

#### `canvases/{canvasId}/shapes/{shapeId}` (REFACTORED)
- Same schema as before, now canvas-scoped
- Path changed from `canvases/main/shapes/{shapeId}`

#### `canvases/{canvasId}/chatMessages/{messageId}` (REFACTORED)
- Same schema as PR #11, now canvas-scoped
- Path changed from `chatMessages/{messageId}`

#### `canvases/{canvasId}/comments/{commentId}` (REFACTORED)
- Same schema as before, now canvas-scoped
- Path changed from `canvases/main/comments/{commentId}`

#### `canvases/{canvasId}/groups/{groupId}` (REFACTORED)
- Same schema as before, now canvas-scoped
- Path changed from `canvases/main/groups/{groupId}`

### RTDB Paths (REFACTORED)

#### `sessions/{canvasId}/users/{userId}` (REFACTORED)
- Path changed from `sessions/main/users/{userId}`
- Same schema: cursor position and presence data

### TypeScript Interfaces

```typescript
// New types for canvas metadata
export interface CanvasMetadata {
  id: string;
  name: string;
  ownerId: string;
  collaboratorIds: string[];
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
  shapeCount: number;
}

export interface CanvasCardProps {
  canvas: CanvasMetadata;
  onClick: (canvasId: string) => void;
  isLoading?: boolean;
}

// Update existing CanvasContext interface
interface CanvasContextType {
  currentCanvasId: string | null; // NEW
  setCurrentCanvasId: (id: string | null) => void; // NEW
  // ... existing fields
}
```

### Validation Rules

- `canvasId`: Must be valid Firestore document ID (generated or custom)
- `name`: 1-100 characters, non-empty after trim
- `ownerId`: Must match authenticated user on creation
- `collaboratorIds`: Must include ownerId, max 100 collaborators
- `shapeCount`: Non-negative integer

---

## 9. API / Service Contracts

### New Service: `canvasListService.ts`

```typescript
class CanvasListService {
  /**
   * Get all canvases user has access to (owned or shared)
   * @param userId - Authenticated user ID
   * @returns Promise resolving to array of canvas metadata
   */
  async getCanvasesForUser(userId: string): Promise<CanvasMetadata[]>;

  /**
   * Subscribe to real-time updates of user's canvases
   * @param userId - Authenticated user ID
   * @param callback - Called when canvas list changes
   * @returns Unsubscribe function
   */
  subscribeToUserCanvases(
    userId: string, 
    callback: (canvases: CanvasMetadata[]) => void
  ): Unsubscribe;

  /**
   * Get metadata for a specific canvas
   * @param canvasId - Canvas document ID
   * @returns Promise resolving to canvas metadata or null if not found
   */
  async getCanvasById(canvasId: string): Promise<CanvasMetadata | null>;

  /**
   * Update lastAccessedAt timestamp when user opens canvas
   * @param canvasId - Canvas document ID
   * @returns Promise resolving when update complete
   */
  async updateCanvasAccess(canvasId: string): Promise<void>;

  /**
   * Update canvas metadata (name, updatedAt, shapeCount)
   * @param canvasId - Canvas document ID
   * @param updates - Partial canvas data to update
   * @returns Promise resolving when update complete
   */
  async updateCanvasMetadata(
    canvasId: string, 
    updates: Partial<CanvasMetadata>
  ): Promise<void>;
}
```

**Error Handling:**
- `getCanvasesForUser()`: Returns empty array on error, logs to console
- `getCanvasById()`: Returns null if canvas not found or access denied
- `updateCanvasAccess()`: Fails silently (non-critical operation)
- All methods: Throw on auth errors, catch and log Firestore errors

### Updated Service: `canvasService.ts`

**All methods now require `canvasId` as first parameter:**

```typescript
// Example refactored signatures
async createShape(canvasId: string, shapeInput: ShapeCreateInput): Promise<string>;
subscribeToShapes(canvasId: string, callback: (shapes: ShapeData[]) => void): Unsubscribe;
async updateShape(canvasId: string, shapeId: string, updates: ShapeUpdateInput): Promise<void>;
async deleteShape(canvasId: string, shapeId: string): Promise<void>;
// ... all other methods updated similarly
```

### Updated Service: `chatService.ts`

```typescript
async saveMessage(canvasId: string, message: ChatMessageInput): Promise<string>;
subscribeToMessages(
  canvasId: string, 
  userId: string, 
  callback: (messages: ChatMessage[]) => void
): Unsubscribe;
async getMessageHistory(canvasId: string, userId: string, limit?: number): Promise<ChatMessage[]>;
```

### Updated Service: `presenceService.ts` & `cursorService.ts`

```typescript
// presenceService
async setOnline(canvasId: string, userId: string, username: string): Promise<void>;
subscribeToPresence(canvasId: string, callback: (users: PresenceUser[]) => void): Unsubscribe;

// cursorService
async updateCursor(canvasId: string, userId: string, position: CursorPosition): Promise<void>;
subscribeToCursors(canvasId: string, callback: (cursors: CursorData[]) => void): Unsubscribe;
```

---

## 10. UI Components to Create/Modify

### New Components

1. **`src/components/CanvasGallery/CanvasGallery.tsx`** — Main gallery view, grid layout, loads canvas list
2. **`src/components/CanvasGallery/CanvasCard.tsx`** — Individual canvas card with metadata
3. **`src/components/CanvasGallery/CanvasEmptyState.tsx`** — Empty state for users with no canvases
4. **`src/components/CanvasGallery/CanvasGallery.css`** — Styling for gallery and cards
5. **`src/services/canvasListService.ts`** — Service for querying canvas collection
6. **`src/hooks/useCanvasList.ts`** — Custom hook for canvas list state management
7. **`src/utils/formatRelativeTime.ts`** — Helper for "2 hours ago" formatting

### Modified Components

8. **`src/App.tsx`** — Add routing logic, show gallery vs canvas based on URL
9. **`src/contexts/CanvasContext.tsx`** — Add `currentCanvasId` state and update subscriptions
10. **`src/services/canvasService.ts`** — Update all methods to accept `canvasId` parameter
11. **`src/services/chatService.ts`** — Update methods to accept `canvasId` parameter
12. **`src/services/presenceService.ts`** — Update methods to accept `canvasId` parameter
13. **`src/services/cursorService.ts`** — Update methods to accept `canvasId` parameter
14. **`src/hooks/useCanvas.ts`** — Pass `currentCanvasId` to all service calls
15. **`src/hooks/usePresence.ts`** — Pass `currentCanvasId` to presence service
16. **`src/hooks/useCursors.ts`** — Pass `currentCanvasId` to cursor service
17. **`src/components/Chat/FloatingClippy.tsx`** — Ensure chat scoped to current canvas
18. **`firestore.rules`** — Add rules for `canvases` collection and update subcollection rules

---

## 11. Test Plan & Acceptance Gates

### Happy Path (12 gates)

- [ ] **Gallery Load:** User logs in → Gallery displays with all canvases in <500ms
- [ ] **Canvas Card Display:** Each card shows correct name, timestamp, collaborator count, shape count
- [ ] **Relative Time:** "Last edited" shows relative time (e.g., "2 hours ago")
- [ ] **Canvas Selection:** Click card → URL updates to `/canvas/{canvasId}` → Canvas loads in <1 second
- [ ] **Canvas Loading:** Selected canvas displays all shapes correctly
- [ ] **Real-Time Sync:** Create shape on canvas → Collaborator sees update in <100ms
- [ ] **Canvas Scoping:** Shapes/chat/presence only from current canvas (no cross-canvas data)
- [ ] **URL Direct Access:** Navigate directly to `/canvas/{canvasId}` → Canvas loads correctly
- [ ] **Multiple Canvases:** User with 10 canvases sees all 10 in gallery
- [ ] **Collaborator View:** User B (shared access) sees canvas in their gallery
- [ ] **Canvas Metadata:** Shape count updates when shapes created/deleted
- [ ] **Return to Gallery:** Navigate back to gallery → See updated "last accessed" time

### Edge Cases (8 gates)

- [ ] **Empty State:** User with no canvases sees empty state with Clippy message
- [ ] **No Collaborators:** Canvas with only owner shows "Just you"
- [ ] **Invalid Canvas ID:** Navigate to `/canvas/invalid-id` → Show error, redirect to gallery
- [ ] **Deleted Canvas:** Canvas deleted while viewing → Handle gracefully, redirect to gallery
- [ ] **Canvas Permission Lost:** User removed from canvas → No longer appears in gallery
- [ ] **Zero Shapes:** Canvas with no shapes shows "0 shapes" correctly
- [ ] **Large Canvas List:** User with 50+ canvases → Pagination works, all canvases accessible
- [ ] **Slow Network:** Gallery shows loading state, doesn't show stale data

### Multi-User (6 gates)

- [ ] **Concurrent Access:** Users A and B both viewing same canvas → Real-time sync works
- [ ] **Cross-Canvas Isolation:** User A on Canvas 1, User B on Canvas 2 → No interference
- [ ] **Presence Scoping:** Canvas shows only users currently on that canvas
- [ ] **Chat Scoping:** Chat messages only for current canvas
- [ ] **Concurrent Gallery Access:** Multiple users browsing gallery → No conflicts
- [ ] **Shape Count Accuracy:** Shape created → Gallery reflects updated count in real-time

### Performance (5 gates)

- [ ] **Gallery Load Time:** <500ms to display canvas list (up to 50 canvases)
- [ ] **Canvas Load Time:** <1 second to load canvas with 50 shapes
- [ ] **Real-Time Sync Latency:** <100ms for shape changes
- [ ] **Query Optimization:** Firestore query uses indexes, no full collection scans
- [ ] **Memory Management:** Switching canvases unsubscribes old listeners

### Security (4 gates)

- [ ] **Canvas Access Control:** User cannot access canvas not in their `collaboratorIds`
- [ ] **Shape Access Control:** User cannot modify shapes on canvas they don't have access to
- [ ] **Query Security:** User query only returns canvases they have access to
- [ ] **Direct URL Access:** Unauthorized canvas ID redirects to gallery with error

### Accessibility (3 gates)

- [ ] **Screen Reader:** Gallery announces "X canvases available" and reads card metadata
- [ ] **Keyboard Navigation:** Tab through cards, Enter to open, Escape to close
- [ ] **Focus Management:** Opening canvas maintains focus state

**Total: 38 acceptance gates**

---

## 12. Definition of Done

- [ ] `canvases` collection created with proper schema
- [ ] All services refactored to accept `canvasId` parameter
- [ ] Firestore rules updated for canvas-scoped collections
- [ ] RTDB paths updated for canvas-scoped sessions
- [ ] `canvasListService.ts` implemented and tested
- [ ] Gallery UI component renders correctly
- [ ] Canvas card component displays all metadata
- [ ] Empty state component shows for users with no canvases
- [ ] Routing implemented (`/gallery` and `/canvas/:canvasId`)
- [ ] Canvas context manages `currentCanvasId` correctly
- [ ] All subscriptions properly scoped to current canvas
- [ ] All 38 acceptance gates pass
- [ ] No console errors during normal operation
- [ ] Real-time collaboration features work within each canvas
- [ ] No data leakage between canvases
- [ ] Performance targets met (gallery <500ms, canvas <1s)
- [ ] Security rules prevent unauthorized access
- [ ] Accessibility requirements met
- [ ] Code reviewed and approved

---

## 13. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| **Data migration complexity** | Don't migrate old `canvases/main` data. Create new canvases going forward. Old data can be cleaned manually or left as-is. |
| **Breaking existing features** | Thoroughly test all real-time features after refactor. Maintain same service interfaces where possible. |
| **Firestore query performance** | Use composite indexes. Implement pagination (limit 50). Monitor query latency in production. |
| **Too many subscriptions** | Unsubscribe from old canvas when switching. Implement cleanup in useEffect hooks. |
| **URL state management** | Use React Router or simple URL parsing. Ensure back button works correctly. |
| **Stale canvas metadata** | Use Firestore transactions or cloud functions to update `shapeCount` and `updatedAt` (or accept eventual consistency). |
| **Empty gallery confusion** | Clear empty state messaging. Add hint about upcoming PR #13 for canvas creation. |
| **Canvas ID collisions** | Use Firestore auto-generated IDs or UUIDs. Never allow user-specified IDs. |

---

## 14. Open Questions & Decisions

**Q1:** Should we migrate existing `canvases/main` data to new structure?  
**Decision:** No. Leave old data as-is. Users can manually recreate canvases. Migration complexity not worth it for MVP.

**Q2:** How should we handle canvas creation temporarily (before PR #13)?  
**Decision:** For testing, create canvases manually in Firestore or via console utility. Production users won't have access until PR #13.

**Q3:** Should gallery be paginated or infinite scroll?  
**Decision:** Paginated with "Load More" button. Initial load shows 50 canvases, then load 50 more on demand.

**Q4:** Should we show canvas thumbnails in gallery?  
**Decision:** No (deferred to PR #18). Cards show metadata only to reduce complexity and improve load time.

**Q5:** How do we handle `shapeCount` updates (denormalization)?  
**Decision:** Update `shapeCount` and `updatedAt` on every shape create/delete in `canvasService`. Accept eventual consistency (race conditions are rare and non-critical).

**Q6:** Should gallery update in real-time or on page load only?  
**Decision:** Real-time using `subscribeToUserCanvases()`. Gallery reflects changes instantly when canvases are updated.

**Q7:** What happens if user navigates directly to `/canvas/:canvasId` without going through gallery?  
**Decision:** Canvas loads if user has access. Gallery link in navbar allows returning to gallery.

**Q8:** Should we add a "Back to Gallery" button in canvas view?  
**Decision:** Yes, add button in navbar (top-left) that navigates to `/gallery`.

---

## 15. Rollout & Telemetry

**Feature Flag:** No

**Metrics to Track:**
- Gallery load time (p50, p95, p99)
- Canvas load time (p50, p95, p99)
- Number of canvases per user (avg, median, max)
- Canvas switching frequency (avg switches per session)
- Error rate for invalid canvas IDs
- Firestore query latency

**Manual Validation Steps Post-Deploy:**
1. Create 3 test canvases manually in Firestore
2. Log in as User A → Verify gallery shows all 3 canvases
3. Click Canvas 1 → Verify it loads with correct shapes
4. Create shapes on Canvas 1 → Verify `shapeCount` updates in gallery
5. Share Canvas 1 with User B → Verify User B sees it in their gallery
6. User A and User B both on Canvas 1 → Verify real-time sync works
7. User A on Canvas 1, User B on Canvas 2 → Verify no cross-canvas interference
8. Check console for errors
9. Test keyboard navigation and accessibility
10. Test invalid canvas ID URL → Verify error handling

---

## 16. Out-of-Scope Backlog

Deferred to future PRs:

- **PR #13:** Canvas creation ("Create New Canvas" button, naming)
- **PR #14:** Canvas sharing (shareable links, collaborator management)
- **PR #15:** Canvas deletion
- **PR #18:** Canvas thumbnails (visual preview in gallery)
- **PR #19:** Canvas search and filtering
- **Canvas templates:** Pre-built starter canvases
- **Canvas duplication:** "Duplicate Canvas" button
- **Canvas archiving:** Archive old canvases instead of deleting
- **Canvas favorites:** Star/favorite canvases for quick access
- **Canvas sorting options:** Sort by name, date created, date modified
- **Collaborative canvas creation:** Multiple users create canvas together
- **Canvas permissions:** View-only vs edit access per user

---

## 17. Preflight Questionnaire

1. **What is the smallest end-to-end user outcome?**  
   User logs in, sees gallery of canvases, clicks one, opens it, creates a shape that syncs to collaborators.

2. **Who is the primary user and what is their critical action?**  
   Primary: Returning user. Critical action: Click canvas card to open and resume work.

3. **Must-have vs nice-to-have?**  
   Must: Gallery view, canvas selection, multi-canvas data model. Nice: Thumbnails, search, advanced metadata.

4. **Real-time collaboration requirements?**  
   Real-time sync (<100ms) must continue to work within each canvas. Gallery updates real-time when canvases change.

5. **Performance constraints?**  
   Gallery load <500ms, canvas load <1s, sync <100ms, support 50+ canvases per user.

6. **Error/edge cases we must handle?**  
   Empty state, invalid canvas IDs, permission loss, deleted canvases, slow network, cross-canvas isolation.

7. **Data model changes needed?**  
   New `canvases` collection. Refactor shapes, chat, comments, groups to canvas-scoped subcollections. Update RTDB paths.

8. **Service APIs required?**  
   New `canvasListService` (get, subscribe, update). Refactor existing services to accept `canvasId`.

9. **UI entry points and states?**  
   Entry: Login → Gallery. States: Loading (spinner), Loaded (grid), Empty (message), Error (redirect).

10. **Accessibility/keyboard expectations:**  
    Tab navigation, Enter to open, screen reader announcements, focus management.

11. **Security/permissions implications:**  
    Canvas access controlled by `collaboratorIds`. Firestore rules enforce read/write permissions. No cross-canvas data leakage.

12. **Dependencies or blocking integrations:**  
    Depends on PR #1 (auth) and PR #2 (canvas core). Blocks PR #13 (creation), PR #14 (sharing), PR #15 (deletion).

13. **Rollout strategy and success metrics:**  
    No feature flag. Metrics: Load times, error rates, usage. Validate manually with test canvases.

14. **What is explicitly out of scope for this iteration?**  
    Canvas creation, naming, deletion, sharing, thumbnails, search, templates. Focus is gallery view and data model refactor.

---

**END OF PRD**

