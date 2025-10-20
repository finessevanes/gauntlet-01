# PR-14 TODO — Canvas Sharing & Collaboration Setup

**Branch**: `feat/pr-14-canvas-sharing`  
**Source PRD**: `collabcanvas/docs/prds/pr-14-prd.md`  
**Owner (Agent)**: Building Agent (to be assigned)

**Design Note**: 90s/00s UI aesthetic (retro Windows/Office style)

---

## 0. Clarifying Questions & Assumptions

### Questions Resolved:
- ✅ Copy Link button in gallery? **YES** (owner-only, on canvas cards)
- ✅ Collaborators see link? **NO** (owner-only in modal)
- ✅ Email notifications? **NO** (out of scope)
- ✅ Referral tracking? **NO** (basic `?share=true` only)
- ✅ Public sharing warning? **YES** (in share modal)

### Assumptions:
- Users share links via external channels (Slack, Discord, email) — no built-in invite system
- Shareable links grant permanent access (no expiration)
- All collaborators have full edit permissions (no view-only mode)
- 90s/00s UI uses Windows 95/98 style (raised buttons, inset inputs, system fonts)
- Canvas ID in URL is sufficient for sharing (no separate share token needed)

---

## 1. Repo Prep

- [x] Create branch `feat/pr-14-canvas-sharing` from latest main
  - Test Gate: Branch created, checked out successfully ✅
  
- [x] Confirm Firebase emulators running (Auth, Firestore, RTDB) ✅
  - Test Gate: `npm run emulators` runs without errors
  
- [x] Confirm test environment works ✅
  - Test Gate: `npm test` runs, existing tests pass

---

## 2. Service Layer (deterministic contracts)

### 2.1 Canvas List Service Extensions

- [x] **Add `addCollaborator()` method to canvasListService** ✅
  - Location: `src/services/canvasListService.ts`
  - Signature: `async addCollaborator(canvasId: string, userId: string): Promise<CanvasMetadata>`
  - Implementation:
    - Use `arrayUnion` to add userId to `collaboratorIds`
    - Update `updatedAt` timestamp
    - Return updated canvas metadata
  - Handle errors: canvas not found, Firestore write failure
  - Test Gate: Unit test passes — user added to collaboratorIds, no duplicates

- [x] **Add `getCollaborators()` method to canvasListService** ✅
  - Signature: `async getCollaborators(canvasId: string): Promise<CollaboratorInfo[]>`
  - Implementation:
    - Fetch canvas document
    - For each userId in `collaboratorIds`, fetch user document
    - Build CollaboratorInfo array with email, displayName, isOwner
    - Sort: owner first, then alphabetically
  - Handle errors: canvas not found, missing user documents
  - Test Gate: Unit test passes — returns correct collaborator info, owner first

- [x] **Add `generateShareableLink()` method to canvasListService** ✅
  - Signature: `generateShareableLink(canvasId: string): string`
  - Implementation:
    - Get `window.location.origin`
    - Return `${origin}/canvas/${canvasId}?share=true`
  - Test Gate: Unit test passes — returns valid URL with canvas ID

### 2.2 Clipboard Service (New)

- [x] **Create `src/services/clipboardService.ts`** ✅
  - Export singleton instance
  
- [x] **Implement `copyToClipboard()` method** ✅
  - Signature: `async copyToClipboard(text: string): Promise<boolean>`
  - Implementation:
    - Try modern Clipboard API: `navigator.clipboard.writeText()`
    - Fallback: create temp textarea, execCommand('copy')
    - Return true on success, false on failure
  - Test Gate: Unit test passes (mock Clipboard API) — returns true on success

---

## 3. TypeScript Types

- [x] **Define CollaboratorInfo interface** ✅
  - Location: `src/services/types/canvasTypes.ts` (or new sharing types file)
  - Fields:
    ```typescript
    interface CollaboratorInfo {
      userId: string;
      email: string;
      displayName: string | null;
      isOwner: boolean;
      isOnline?: boolean; // SHOULD-HAVE
    }
    ```
  - Test Gate: No TypeScript errors when importing type

- [ ] **Define ShareModalProps interface**
  - Location: Component file or shared types
  - Fields:
    ```typescript
    interface ShareModalProps {
      canvasId: string;
      canvasName: string;
      isOpen: boolean;
      onClose: () => void;
    }
    ```

---

## 4. Routing & URL Handling

### 4.1 Route Configuration

- [ ] **Add `/canvas/:canvasId` route to App.tsx (or router)**
  - Parse `canvasId` from URL params
  - Extract `?share=true` query param (optional, for analytics)
  - Test Gate: Navigating to `/canvas/test123` renders canvas view

### 4.2 Canvas Access Logic

- [ ] **Create `handleCanvasAccess()` helper function**
  - Location: `src/utils/routeHelpers.ts` or inline in App.tsx
  - Logic:
    1. Check if user is authenticated → redirect to login if not
    2. Validate canvas ID format (Firestore ID)
    3. Fetch canvas metadata via `getCanvasById()`
    4. Check if user in `collaboratorIds`
    5. If not in array → call `addCollaborator()`
    6. Show toast: "You've been added to [Canvas Name]!"
    7. Set `currentCanvasId` in CanvasContext
    8. Call `updateCanvasAccess()` to update lastAccessedAt
  - Test Gate: Integration test — opening link adds user to collaborators

- [ ] **Implement authentication redirect with canvas ID preservation**
  - If unauthenticated, redirect to `/login?redirect=/canvas/{canvasId}`
  - After login, redirect back to canvas URL
  - Test Gate: Unauthenticated user redirects to login, then back to canvas

- [ ] **Handle invalid canvas IDs gracefully**
  - Show error page or modal: "Canvas not found or you don't have access"
  - Provide "Return to Gallery" button
  - Test Gate: Navigating to `/canvas/invalid-id` shows error, no crash

---

## 5. UI Components (New)

### 5.1 ShareButton Component

- [ ] **Create `src/components/Canvas/ShareButton.tsx`**
  - Props: `{ canvasId, canvasName, isOwner }`
  - Renders button with share icon (🔗)
  - 90s styling: Raised button, gray background (#C0C0C0), system font bold
  - Only renders if `isOwner === true`
  - Clicking opens share modal (via state)
  - Test Gate: Button renders for owner, not for collaborators

### 5.2 ShareModal Component

- [ ] **Create `src/components/Canvas/ShareModal.tsx`**
  - Props: `{ canvasId, canvasName, isOpen, onClose }`
  - State: 
    - shareableLink (string)
    - copyButtonText ('Copy Link' | '✓ Copied!')
    - collaborators (CollaboratorInfo[])
    - loadingCollaborators (boolean)
  - 90s styling:
    - Double-line border (╔═╗ style)
    - System font
    - Gray color scheme
  - Test Gate: Modal renders with all sections

- [ ] **ShareModal: Shareable Link Section**
  - Read-only input field with link
  - 90s inset border, monospace font (Courier New)
  - Gray background (#F0F0F0)
  - Auto-select text on click
  - Test Gate: Link displays correctly, selectable

- [ ] **ShareModal: Copy Link Button**
  - Raised 3D button style
  - Gray background (#C0C0C0)
  - Calls `clipboardService.copyToClipboard()`
  - On success: Button text → "✓ Copied!" (green tint) for 2 seconds
  - Show toast: "Link copied to clipboard!"
  - Test Gate: Clicking button copies link, visual feedback works

- [ ] **ShareModal: Warning Notice**
  - Yellow background (#FFFFE0), black border
  - Icon: ⚠️
  - Text: "Only share this link with people you trust. Anyone with the link can edit your canvas."
  - Bold text, retro alert box styling
  - Test Gate: Warning displays prominently

- [ ] **ShareModal: Collaborators List Section**
  - Heading: "People with access (X)"
  - Fetch collaborators via `getCollaborators(canvasId)`
  - Render list with:
    - Avatar/initial icon (simple circle)
    - Username or email (system font)
    - Role badge: [Owner] or [Collaborator]
  - Inset panel with scrollbar (Windows 95 style) if >10
  - Test Gate: Collaborators list displays correct users, owner first

- [ ] **ShareModal: Close Functionality**
  - X button in top-right
  - Escape key listener
  - Click outside modal (optional)
  - Test Gate: Modal closes on all expected interactions

### 5.3 CollaboratorsList Component (Optional Subcomponent)

- [ ] **Create `src/components/Canvas/CollaboratorsList.tsx`**
  - Props: `{ canvasId, collaborators, loading }`
  - Renders list items with avatar + name + badge
  - Loading skeleton while fetching
  - 90s style: inset panel, system font
  - Test Gate: List renders correctly, loading state works

### 5.4 CopyLinkButton Component (Gallery Version)

- [ ] **Create `src/components/CanvasGallery/CopyLinkButton.tsx`**
  - Props: `{ canvasId, isOwner }`
  - Small button: "[📋 Copy]" or icon only
  - 90s styling: Raised button, gray (#C0C0C0)
  - Appears on hover (desktop) or always visible (mobile)
  - Calls `generateShareableLink()` + `copyToClipboard()`
  - Visual feedback: "✓ Copied!" for 2 seconds
  - Toast: "Link copied to clipboard!"
  - Test Gate: Button copies link without opening modal

---

## 6. UI Components (Modified)

### 6.1 Canvas.tsx

- [ ] **Add ShareButton to Canvas navbar/toolbar**
  - Import ShareButton component
  - Pass props: `canvasId`, `canvasName`, `isOwner`
  - `isOwner = currentCanvas.ownerId === user.uid`
  - Position: Navbar top-right (next to other tools)
  - Test Gate: Share button visible for owners, hidden for collaborators

- [ ] **Add ShareModal state management**
  - State: `isShareModalOpen` (boolean)
  - ShareButton onClick → `setIsShareModalOpen(true)`
  - ShareModal onClose → `setIsShareModalOpen(false)`
  - Test Gate: Modal opens/closes correctly

### 6.2 CanvasCard.tsx (Gallery)

- [ ] **Add shared canvas visual indicators**
  - 90s styling:
    - Thicker border (2px solid #808080) for shared canvases
    - Light gray background tint (#F5F5F5)
    - Raised 3D effect (Windows 95 panel style)
  - Icon: 👥 in top-left corner
  - Text: "Shared by [Owner Name]" (bold, system font)
  - Conditional render: `canvas.ownerId !== currentUserId`
  - Test Gate: Shared canvases visually distinct from owned canvases

- [ ] **Add CopyLinkButton to canvas cards (owner only)**
  - Position: Top-right corner
  - Only visible if `canvas.ownerId === currentUserId`
  - Renders CopyLinkButton component
  - Test Gate: Copy button appears for owned canvases on hover

### 6.3 App.tsx (or Router)

- [ ] **Add `/canvas/:canvasId` route handler**
  - Extract `canvasId` from URL params
  - Call `handleCanvasAccess()` on route load
  - Handle authentication redirect
  - Set `currentCanvasId` in CanvasContext
  - Test Gate: Route parses canvas ID, loads canvas correctly

- [ ] **Handle post-login redirect to canvas**
  - Store intended canvas URL in login redirect state
  - After successful login, redirect to stored URL
  - Test Gate: Unauthenticated user logs in, lands on canvas

---

## 7. Custom Hooks

### 7.1 useShareCanvas Hook

- [ ] **Create `src/hooks/useShareCanvas.ts`**
  - Params: `canvasId`
  - Returns:
    ```typescript
    {
      shareableLink: string;
      copyLinkToClipboard: () => Promise<boolean>;
      collaborators: CollaboratorInfo[];
      loadingCollaborators: boolean;
      refreshCollaborators: () => Promise<void>;
    }
    ```
  - Implementation:
    - Generate shareable link on mount
    - Fetch collaborators on mount (async)
    - copyLinkToClipboard wraps clipboardService
  - Test Gate: Hook returns correct data, copy function works

---

## 8. Firestore Security Rules (Verify Existing)

- [ ] **Verify canvases collection rules allow collaborator access**
  - Rule: `allow get: if request.auth.uid in resource.data.collaboratorIds`
  - Rule: `allow list: if request.auth != null` (filtered by query)
  - Test Gate: Non-collaborators cannot read canvas, collaborators can

- [ ] **Verify only owner can update canvas metadata**
  - Rule: `allow update: if resource.data.ownerId == request.auth.uid`
  - Test Gate: Collaborators cannot rename canvas, owner can

- [ ] **Verify all collaborators can edit shapes**
  - Shapes subcollection: `allow create/update/delete: if request.auth != null`
  - Test Gate: All collaborators can create/edit/delete shapes

---

## 9. Styling (90s/00s Aesthetic)

- [ ] **Create shared styles for 90s UI components**
  - Location: `src/components/Canvas/ShareModal.css` or shared styles
  - Styles:
    - Raised button: `border: 2px outset #C0C0C0; background: #C0C0C0;`
    - Inset input: `border: 2px inset #808080; background: #F0F0F0;`
    - Modal border: Double-line ASCII-style or thick border
    - System font: `font-family: 'MS Sans Serif', 'Segoe UI', sans-serif;`
    - Warning box: Yellow background (#FFFFE0), black border
  - Test Gate: Components have retro Windows 95/98 appearance

- [ ] **Apply 90s styling to ShareButton**
  - Raised 3D button effect
  - Gray background with outset border
  - Hover state: slightly brighter
  - Test Gate: Button looks retro, not modern flat

- [ ] **Apply 90s styling to ShareModal**
  - Double-line or thick border (╔═╗ style)
  - Gray header bar with title
  - Inset panels for input and collaborators list
  - System font throughout
  - Test Gate: Modal looks like Windows 95 dialog box

- [ ] **Apply 90s styling to canvas cards (shared indicator)**
  - Raised 3D panel effect for cards
  - Thicker border for shared canvases
  - Square brackets for badges: [Owner], [Collaborator]
  - Test Gate: Cards have retro raised panel appearance

---

## 10. Integration & Real-time

### 10.1 Collaborator Addition Flow

- [ ] **Test end-to-end link sharing flow**
  - Owner generates link, copies to clipboard
  - New user (not authenticated) clicks link
  - User redirects to login, then back to canvas
  - User added to `collaboratorIds`
  - Canvas loads, user can edit shapes
  - Test Gate: Full flow works, user added successfully

- [ ] **Test collaborator addition with existing user**
  - Existing collaborator clicks link again
  - No duplicate addition (arrayUnion prevents)
  - Canvas loads immediately
  - Test Gate: Idempotent — no errors, no duplicates

### 10.2 Real-time Sync

- [ ] **Test gallery updates when user added as collaborator**
  - User A shares link with User B
  - User B clicks link, added to collaborators
  - User B's gallery updates to show shared canvas
  - Test Gate: Gallery real-time sync <100ms

- [ ] **Test collaborators list real-time updates**
  - Owner has share modal open
  - New user joins via link (in another browser)
  - Owner's collaborators list updates automatically
  - Test Gate: Real-time subscription works, list updates <100ms

---

## 11. Tests

### 11.1 Unit Tests (Services)

- [ ] **Write tests for `canvasListService.addCollaborator()`**
  - Test: Adds user to collaboratorIds via arrayUnion
  - Test: Updates updatedAt timestamp
  - Test: Returns updated canvas metadata
  - Test: Handles canvas not found error
  - Test Gate: All service tests pass

- [ ] **Write tests for `canvasListService.getCollaborators()`**
  - Test: Fetches collaborator user documents
  - Test: Returns array with owner first
  - Test: Handles missing user documents gracefully
  - Test Gate: All service tests pass

- [ ] **Write tests for `canvasListService.generateShareableLink()`**
  - Test: Returns URL with canvas ID
  - Test: Includes origin and path
  - Test: Includes ?share=true query param
  - Test Gate: All service tests pass

- [ ] **Write tests for `clipboardService.copyToClipboard()`**
  - Test: Uses Clipboard API when available (mock)
  - Test: Falls back to execCommand when Clipboard API missing
  - Test: Returns true on success, false on failure
  - Test Gate: All service tests pass

### 11.2 Component Tests

- [ ] **Write tests for ShareButton component**
  - Test: Renders for owners only
  - Test: Does not render for collaborators
  - Test: Clicking opens share modal
  - Test Gate: Component tests pass

- [ ] **Write tests for ShareModal component**
  - Test: Displays shareable link
  - Test: Copy button copies link to clipboard
  - Test: Warning notice displays
  - Test: Collaborators list displays correctly
  - Test: Modal closes on X button, Escape key
  - Test Gate: Component tests pass

- [ ] **Write tests for CopyLinkButton (gallery)**
  - Test: Renders for owned canvases only
  - Test: Copies link without opening modal
  - Test: Shows "✓ Copied!" feedback
  - Test Gate: Component tests pass

- [ ] **Write tests for CanvasCard updates**
  - Test: Shared canvases have visual indicators
  - Test: "Shared by [Owner]" text displays for non-owners
  - Test: CopyLinkButton appears for owners
  - Test Gate: Component tests pass

### 11.3 Integration Tests

- [ ] **Test: Generate and copy shareable link**
  - Open canvas as owner
  - Click "Share" button
  - Verify modal opens
  - Click "Copy Link" button
  - Verify link in clipboard (via mock)
  - Test Gate: End-to-end link generation works

- [ ] **Test: Open shareable link (new collaborator)**
  - Generate shareable link
  - Open link in new browser/incognito (new user)
  - Login required → redirect to login
  - After login → redirect to canvas
  - User added to collaboratorIds
  - Canvas loads
  - Test Gate: New user access flow works

- [ ] **Test: Open shareable link (existing collaborator)**
  - Existing collaborator clicks link
  - Canvas loads immediately
  - No duplicate addition
  - Test Gate: Idempotent access flow works

- [ ] **Test: Shared canvas appears in gallery**
  - User added as collaborator
  - Gallery updates to include shared canvas
  - Canvas card shows "Shared by [Owner]"
  - Test Gate: Gallery real-time sync works

- [ ] **Test: Collaborators can edit canvas**
  - Collaborator creates shape
  - Shape appears for owner and other collaborators
  - Real-time sync <100ms
  - Test Gate: Collaboration features work for all users

- [ ] **Test: Invalid canvas ID handling**
  - Navigate to `/canvas/invalid-id`
  - Error message displays
  - "Return to Gallery" button works
  - No crash
  - Test Gate: Error handling works

- [ ] **Test: Access control enforcement**
  - Non-collaborator tries to access canvas (direct API call)
  - Firestore rules deny read
  - Error handled gracefully
  - Test Gate: Security rules enforced

---

## 12. Performance

- [ ] **Measure share modal open time**
  - Click "Share" button
  - Measure time to modal fully rendered
  - Target: <50ms
  - Test Gate: Modal opens instantly

- [ ] **Measure link copy time**
  - Click "Copy Link" button
  - Measure time to clipboard write complete
  - Target: <100ms
  - Test Gate: Copy completes quickly

- [ ] **Measure collaborator addition time**
  - New user clicks shareable link
  - Measure time from click to canvas loaded
  - Target: <2 seconds (authenticated user)
  - Test Gate: Access grant is fast

- [ ] **Measure gallery update latency**
  - User added as collaborator
  - Measure time to gallery UI update
  - Target: <100ms
  - Test Gate: Real-time sync is fast

---

## 13. Accessibility

- [ ] **ShareButton accessibility**
  - `aria-label="Share canvas"`
  - Keyboard accessible (Tab, Enter)
  - Focus visible indicator
  - Test Gate: Screen reader announces button, keyboard works

- [ ] **ShareModal accessibility**
  - Focus trap (Esc to close)
  - `role="dialog"`, `aria-modal="true"`
  - First focusable element focused on open
  - Close button has `aria-label="Close"`
  - Test Gate: Keyboard navigation works, screen reader compatible

- [ ] **Copy button accessibility**
  - Keyboard accessible
  - `aria-live="polite"` for "Copied!" announcement
  - Visual and auditory feedback
  - Test Gate: Screen reader announces copy success

- [ ] **Collaborators list accessibility**
  - `role="list"` and `role="listitem"`
  - Screen reader announces count: "3 collaborators"
  - Each item announces name and role
  - Test Gate: Screen reader reads list correctly

---

## 14. Polish & Edge Cases

- [ ] **Toast notifications for all sharing actions**
  - Link copied: "Link copied to clipboard!"
  - User added: "You've been added to [Canvas Name]!"
  - Error: "Unable to join canvas. Please try again."
  - 90s style: Windows 95 notification appearance (optional)
  - Test Gate: All toasts display correctly

- [ ] **Handle clipboard API unsupported browsers**
  - Fallback to execCommand or manual copy instruction
  - Message: "Link selected, press Ctrl+C to copy"
  - Test Gate: Fallback works in older browsers

- [ ] **Handle network failures gracefully**
  - Firestore write fails → show error toast
  - Retry mechanism or manual retry button
  - Test Gate: Error recovery works

- [ ] **Empty collaborators list state**
  - If only owner, show: "You're the only person with access"
  - Encourage sharing: "Share the link to invite collaborators"
  - Test Gate: Empty state displays correctly

- [ ] **Loading states**
  - Share modal: Show skeleton while loading collaborators
  - Gallery: Show loading indicator while fetching canvases
  - Test Gate: Loading states provide clear feedback

---

## 15. Documentation

- [ ] **Update README with sharing feature**
  - Add section: "Sharing Canvases"
  - Explain how to generate and share links
  - Document collaborator permissions
  - Test Gate: README is clear and accurate

- [ ] **Add inline code comments**
  - Document `addCollaborator()` logic
  - Document route handling for canvas access
  - Document 90s styling choices
  - Test Gate: Code is well-commented

- [ ] **Create PR description**
  - Use structure from planning agent template:
    - Goal and scope (from PRD)
    - Files changed and rationale
    - Test steps (happy path, edge cases, multi-user, perf)
    - Known limitations and follow-ups
    - Links: PRD, TODO, designs
  - Test Gate: PR description is comprehensive

---

## 16. Final Checklist (Definition of Done)

- [ ] **Service methods implemented and unit-tested**
  - `addCollaborator()`, `getCollaborators()`, `generateShareableLink()`, `copyToClipboard()`
  
- [ ] **UI components implemented with all states**
  - ShareButton, ShareModal, CollaboratorsList, CopyLinkButton (gallery)
  - Loading, error, empty states
  
- [ ] **Routing and URL handling**
  - `/canvas/:canvasId` route works
  - Unauthenticated redirect with canvas ID preservation
  - Invalid canvas ID error handling
  
- [ ] **Real-time sync verified (<100ms)**
  - Gallery updates when collaborators added
  - Collaborators list updates in share modal
  
- [ ] **90s/00s UI styling applied**
  - Raised buttons, inset inputs, system fonts
  - Windows 95/98 aesthetic throughout
  
- [ ] **Visual indicators for shared canvases**
  - Gallery cards show "Shared by [Owner]"
  - 👥 badge, thicker border, 3D panel effect
  
- [ ] **Clipboard functionality works**
  - Modern Clipboard API + fallback
  - Visual feedback on copy success
  
- [ ] **Access control enforced**
  - Firestore rules prevent unauthorized access
  - Only owners can share/rename
  - All collaborators can edit shapes
  
- [ ] **Error handling comprehensive**
  - Invalid canvas IDs, network failures, clipboard errors
  - Clear error messages, recovery options
  
- [ ] **Toast notifications**
  - Link copied, user added, errors
  
- [ ] **Keyboard/Accessibility**
  - Focus trap, aria labels, screen reader support
  
- [ ] **All acceptance gates pass**
  - 22 tests from PRD Section 11
  
- [ ] **Performance targets met**
  - Share modal <50ms, copy <100ms, add collaborator <2s, sync <100ms
  
- [ ] **PR description complete**
  - Summary, files changed, test steps, limitations, links

---

## Copyable Checklist (for PR description)

```markdown
## Canvas Sharing Checklist

### Service Layer
- [ ] `addCollaborator()` method implemented
- [ ] `getCollaborators()` method implemented
- [ ] `generateShareableLink()` method implemented
- [ ] `copyToClipboard()` utility implemented
- [ ] Service unit tests pass

### UI Components
- [ ] ShareButton (canvas view) implemented
- [ ] ShareModal with all sections implemented
- [ ] CollaboratorsList implemented
- [ ] CopyLinkButton (gallery cards) implemented
- [ ] 90s/00s styling applied throughout

### Routing & Access Control
- [ ] `/canvas/:canvasId` route works
- [ ] Authentication redirect preserves canvas ID
- [ ] Invalid canvas ID error handling
- [ ] Firestore security rules verified

### Real-time & Collaboration
- [ ] Collaborator addition syncs <100ms
- [ ] Gallery updates when user added
- [ ] Collaborators list real-time updates
- [ ] All collaborators can edit shapes

### Testing
- [ ] Unit tests: Service methods (4 tests)
- [ ] Component tests: ShareButton, ShareModal, CopyLinkButton
- [ ] Integration tests: Full sharing flow (6 tests)
- [ ] Performance tests: Modal, copy, add user, sync

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Focus management in modal
- [ ] ARIA labels present

### Polish
- [ ] Toast notifications for all actions
- [ ] Loading states
- [ ] Error handling
- [ ] 90s/00s retro styling
- [ ] PR description complete
```

---

## Notes for Building Agent

### Key Implementation Details:

1. **No Schema Changes:** Use existing `collaboratorIds` array in canvas documents. No new collections needed.

2. **arrayUnion is Critical:** Use Firestore `arrayUnion()` for collaborator addition to prevent duplicates atomically.

3. **90s UI Consistency:** Match existing Clippy chat style (yellow speech bubbles, retro fonts). Windows 95/98 aesthetic throughout.

4. **Owner-Only Actions:** 
   - Share button visible only if `canvas.ownerId === user.uid`
   - CopyLinkButton in gallery same check
   - Shareable link only shown to owner in modal

5. **Warning Required:** Yellow warning box in share modal about link security (per user request).

6. **Gallery Copy Button:** New feature — quick copy from gallery cards without opening modal (SHOULD-HAVE, but user said yes).

7. **Security:** Firestore rules already exist (from PR #12). Verify they work correctly for collaborator access.

8. **Performance:** Share modal must be instant (<50ms). Fetch collaborators asynchronously to avoid blocking UI.

### Testing Priority:

**Critical Path:**
1. Generate link → Copy to clipboard
2. Open link → Add collaborator → Load canvas
3. Gallery updates with shared canvas
4. Collaborators can edit shapes

**Edge Cases:**
- Invalid canvas IDs
- Unauthenticated users
- Clipboard API fallback
- Concurrent collaborator additions

### Estimated Time: 3.5 hours

- Service layer: 45 min
- UI components: 90 min
- Routing & access: 30 min
- Testing: 45 min
- Polish & styling: 30 min

---

**TODO Status:** ✅ Ready for Implementation

**Next Step:** Assign to Building Agent

