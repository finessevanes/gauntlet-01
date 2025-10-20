# PRD: Canvas Sharing & Collaboration Setup — End-to-End Delivery

**Feature**: Canvas Sharing & Collaboration Setup

**Version**: 1.0

**Status**: Approved - Ready for Development

**Design Note**: 90s/00s UI aesthetic (retro Windows/Office style)

**Agent**: Delilah (Planning Agent)

**Target Release**: Phase 3 - Canvas Management

**Links**: 
- PR Brief: `collabcanvas/docs/pr-briefs.md` (PR #14)
- TODO: `collabcanvas/docs/todos/pr-14-todo.md` (to be created after PRD approval)
- Dependencies: PR #3 (Real-Time Collaboration), PR #12 (Canvas Gallery & List View)

---

## 1. Summary

Implement canvas sharing functionality that allows users to generate shareable links for their canvases and manage collaborator access. When a user opens a shared link, they automatically gain access to view and edit the canvas in real-time, enabling seamless collaboration with team members and friends. This PR unlocks the full collaborative potential of CollabCanvas by making canvas sharing effortless.

---

## 2. Problem & Goals

**Problem:** Users can currently create and manage their own canvases (PR #12, #13), but they have no way to share canvases with others. Collaboration is limited to users who already have access. Without a sharing mechanism, users cannot invite collaborators, making the real-time collaboration features underutilized. This is a critical blocker for team workflows and multi-user scenarios.

**Why now?** The multi-canvas architecture (PR #12) and canvas management features (PR #13) are complete. Real-time collaboration infrastructure exists (PR #3) but is only useful when multiple users can access the same canvas. Sharing is the missing piece that enables true collaborative workflows.

**Goals:**
- [ ] G1 — Canvas owners can generate unique shareable links for their canvases
- [ ] G2 — Users who open a shareable link automatically gain access to that canvas
- [ ] G3 — Shared canvases appear in the canvas gallery for all collaborators
- [ ] G4 — Users can see who has access to each canvas and manage collaborators
- [ ] G5 — Shareable links can be easily copied to clipboard for distribution

---

## 3. Non-Goals / Out of Scope

To maintain focus and avoid scope creep:

- [ ] **Not implementing permission levels** — All collaborators have full edit access; no view-only mode (future enhancement)
- [ ] **Not implementing access revocation** — No ability to remove collaborators once added (future PR)
- [ ] **Not implementing link expiration** — Shareable links don't expire or become invalid (future enhancement)
- [ ] **Not implementing password-protected sharing** — No password or access code requirements
- [ ] **Not implementing anonymous collaboration** — Users must be authenticated to access shared canvases
- [ ] **Not implementing email invitations** — No built-in email sending; users share links manually (copy/paste)
- [ ] **Not implementing link analytics** — No tracking of who accessed links or when
- [ ] **Not implementing ownership transfer** — Canvas ownership cannot be transferred to another user
- [ ] **Not implementing team workspaces** — No organizational hierarchy or team management
- [ ] **Not implementing canvas privacy settings** — No public/private distinction; all canvases are private by default
- [ ] **Not implementing link regeneration** — Cannot revoke and generate new links (related to access revocation)

---

## 4. Success Metrics

**User-visible:**
- Share button is prominent and discoverable (<2 clicks to generate link)
- Shareable link copied to clipboard in <100ms
- Opening shared link grants access in <2 seconds
- Collaborator list updates in real-time across all users (<100ms sync)
- Shared canvases appear in gallery immediately (<100ms sync)

**System:**
- Link generation completes in <200ms
- Firestore writes for collaborator addition complete in <500ms
- URL validation correctly identifies valid canvas IDs
- Access control rules prevent unauthorized access
- Collaborator array updates propagate in <100ms

**Quality:**
- All acceptance gates pass (defined in Section 11)
- 0 console errors during sharing workflows
- Shareable links work in all browsers and devices
- No permission errors for valid collaborators
- Real-time collaboration features work correctly for all collaborators

---

## 5. Users & Stories

### As a Canvas Owner:
- I want to **generate a shareable link for my canvas** so I can invite collaborators
- I want to **copy the link to my clipboard** so I can easily share it via chat/email
- I want to **see who has access to my canvas** so I know who can view and edit
- I want to **share multiple canvases with different people** so I can organize collaborations

### As a Collaborator (Link Recipient):
- I want to **click a shared link and immediately access the canvas** so I can start collaborating
- I want to **see the shared canvas in my gallery** so I can find it later
- I want to **know who else has access** so I understand who I'm collaborating with
- I want to **edit the canvas in real-time** so I can contribute equally

### As a Team Member:
- I want to **share design mockups with my team** so we can collaborate on projects
- I want to **brainstorm with remote colleagues** so we can work together synchronously
- I want to **maintain a list of shared workspaces** so I can organize team canvases

### As a Returning User:
- I want to **see all my canvases (owned and shared) in one gallery** so I have unified access
- I want to **distinguish between canvases I own vs. canvases shared with me** so I understand permissions

---

## 6. Experience Specification (UX)

### Entry Points and Flows

#### Flow 1: Generate Shareable Link (From Canvas View)

1. User is viewing a canvas they own
2. User clicks **"Share"** button in the navbar/toolbar (prominent placement)
3. **Share modal/panel opens** with:
   - Shareable link displayed in read-only input field
   - **"Copy Link"** button next to input
   - Visual indicator: "Anyone with this link can edit this canvas"
   - Collaborator list section (see Flow 3)
4. User clicks "Copy Link" button
5. Link copied to clipboard
6. Visual feedback: Button text changes to "✓ Copied!" for 2 seconds
7. Toast notification: "Link copied to clipboard!"
8. User shares link externally (e.g., paste in Slack, Discord, email)

**Time:** <1 second from click to link copied

**Shareable Link Format:** `https://[app-domain]/canvas/[canvasId]?share=true`

#### Flow 2: Open Shared Link (First-Time Access)

1. User receives shareable link from canvas owner (via chat, email, etc.)
2. User clicks link (or pastes in browser)
3. If **not logged in**:
   - Redirect to login page
   - After login, redirect back to canvas URL
   - Show message: "You're joining a shared canvas..."
4. If **logged in**:
   - URL parsed: extract `canvasId` from path
   - Backend checks if user already has access (exists in `collaboratorIds`)
   - If **not a collaborator yet**:
     - Add user to `collaboratorIds` array automatically
     - Update canvas `updatedAt` timestamp
     - Show toast: "You've been added to [Canvas Name]!"
   - If **already a collaborator**:
     - Skip addition step
5. Canvas loads normally with all collaboration features active
6. User's canvas gallery updates to include this shared canvas (real-time sync)
7. User can now edit, draw, chat, and collaborate

**Time:** <2 seconds from click to canvas loaded (authenticated users)

#### Flow 3: View Collaborators (In Share Modal)

1. User opens share modal from canvas view
2. **Collaborators section** displays:
   - **"People with access (X)"** heading
   - List of collaborators with:
     - Avatar or initial icon
     - Username/email
     - Badge: "Owner" for canvas owner, "Collaborator" for others
   - Collaborators listed in order: Owner first, then by join date
3. List updates in real-time as new users join via shared link
4. Owner sees themselves marked as "Owner"
5. No removal action in this PR (out of scope)

**Visual behavior:** 
- List shows up to 10 collaborators initially
- "Show all (X)" button if more than 10
- Real-time updates without refreshing modal

#### Flow 4: Access Shared Canvas from Gallery

1. User opens canvas gallery
2. Gallery shows all canvases: owned + shared
3. Shared canvases have visual indicator:
   - Icon: 👥 or "Shared" badge
   - Metadata: "Shared by [Owner Name]"
   - Collaborator count: "3 collaborators"
4. User clicks shared canvas card
5. Canvas loads normally (same as owned canvas)
6. User can edit, draw, and collaborate with full permissions

**Visual distinction:**
- Owned canvases: No special indicator
- Shared canvases: Badge or icon showing "Shared"

### Visual Behavior

#### Share Button Placement

**Option 1: Navbar (Recommended)**
```
┌─────────────────────────────────────────────────┐
│ 🎨 Canvas Name    [Tools] [Colors]     [Share] │
└─────────────────────────────────────────────────┘
```

**Option 2: Toolbar**
```
Canvas toolbar with Share icon/button alongside other tools
```

**Button Styling (90s/00s Aesthetic):**
- Icon: Share icon (🔗 or chain link glyph)
- Text: "Share" with icon
- Style: Raised button with border (Windows 95/98 style)
- Color: Light gray background (#C0C0C0), darker gray border
- Hover: Subtle highlight (brighter gray)
- Font: System font, bold

#### Share Modal/Panel (90s/00s Style)

```
╔═════════════════════════════════════════════════╗
║  Share Canvas                           [X]     ║
╠═════════════════════════════════════════════════╣
║                                                 ║
║  Share Link                                     ║
║  ┌───────────────────────────────┬──────────┐  ║
║  │ https://app.com/canvas/abc... │Copy Link │  ║
║  └───────────────────────────────┴──────────┘  ║
║                                                 ║
║  ⚠️ WARNING: Only share this link with people   ║
║     you trust. Anyone with the link can edit    ║
║     your canvas.                                ║
║                                                 ║
║  ─────────────────────────────────────────────  ║
║                                                 ║
║  People with access (3)                         ║
║                                                 ║
║  👤 Alice Johnson (You)           [Owner]       ║
║  👤 Bob Smith                     [Collaborator]║
║  👤 Carol Davis                   [Collaborator]║
║                                                 ║
║  [ Close ]                                      ║
╚═════════════════════════════════════════════════╝
```

**Modal Components (90s/00s Aesthetic):**
1. **Share Link Input:**
   - Read-only text input with inset border (Windows 95 style)
   - Monospace font (Courier New or Consolas)
   - Gray background (#F0F0F0)
   - Auto-select text on click (for manual copy)
   
2. **Copy Link Button:**
   - Raised button style (3D border effect)
   - Gray background (#C0C0C0)
   - Changes to "✓ Copied!" on click with green tint
   - Reverts to "Copy Link" after 2 seconds
   
3. **Warning Notice:**
   - Icon: ⚠️ (warning triangle)
   - Yellow background (#FFFFE0) with black border
   - Bold text for emphasis
   - Retro alert box styling
   
4. **Collaborators List:**
   - Avatar/initial icons (simple circular shapes)
   - Username or email in system font
   - Role badge in square brackets [Owner] [Collaborator]
   - Inset panel with scrollbar (Windows 95 style scrollbar if >10)

#### Canvas Gallery - Shared Canvas Cards (90s/00s Style)

```
┌─────────────────────────────────────┐
│ 👥 Q4 Planning Session    [📋 Copy] │ ← Shared badge + Copy Link button (owner only)
│                                     │
│ Shared by Alice Johnson             │ ← Owner indicator
│ Last edited: 2 hours ago            │
│ 👥 5 collaborators                  │
│ 🔷 23 shapes                        │
│                                     │
│ [Click to open]                     │
└─────────────────────────────────────┘
```

**Visual Distinction (90s/00s Aesthetic):**
- Shared badge/icon (👥) in top-left corner
- "Shared by [Owner Name]" text (if not owner, bold system font)
- **[📋 Copy] button** in top-right (owner-only, appears on hover)
  - Small raised button
  - Gray background (#C0C0C0)
  - Copies link directly without opening modal
- Thicker border (2px solid) for shared canvases (#808080)
- Light gray background tint (#F5F5F5) for shared canvases
- Card has raised 3D effect (Windows 95 panel style)

### Loading States

- **Opening Share Modal:** Modal opens immediately (<50ms), collaborators load asynchronously
- **Copying Link:** Instant clipboard write, button state change confirms success
- **Adding Collaborator (via link):** Full-page or overlay spinner: "Joining canvas..."
- **Collaborator List Updates:** Smooth addition of new items without flicker

### Keyboard Shortcuts

- **`Ctrl/Cmd + Shift + S`** — Open share modal from canvas view
- **`Ctrl/Cmd + C`** — Copy link when share modal is focused (if input selected)
- **`Escape`** — Close share modal

### Accessibility

- Share button has `aria-label="Share canvas"`
- Share modal has proper focus trap (Esc to close)
- Collaborator list has `role="list"` and items have `role="listitem"`
- Copy button announces "Link copied to clipboard" to screen readers (via aria-live)
- Visual indicators (badges, icons) have accessible text alternatives
- Link input is selectable and copyable for users without JavaScript clipboard API

### Performance

- Share modal opens in <50ms
- Link generation completes in <200ms (or uses pre-generated URL)
- Copy to clipboard succeeds in <100ms
- Adding collaborator (via link) completes in <2 seconds
- Collaborator list updates propagate in real-time (<100ms)
- Gallery updates with shared canvases in <100ms

---

## 7. Functional Requirements

### MUST-HAVE Requirements

#### REQ-1: Generate Shareable Link
- Shareable link uses canvas ID in URL path: `/canvas/{canvasId}`
- Query parameter optional: `?share=true` (indicates link was shared, for analytics)
- Link format: `https://[app-domain]/canvas/{canvasId}?share=true`
- Link generation is instant (uses existing canvas ID, no backend call needed)
- **Gate:** Shareable link correctly navigates to canvas when opened

#### REQ-2: Copy Link to Clipboard
- "Copy Link" button uses Clipboard API (`navigator.clipboard.writeText()`)
- Fallback for browsers without Clipboard API: auto-select text input (user can Ctrl+C)
- Visual feedback: Button text changes to "✓ Copied!" for 2 seconds
- Toast notification confirms copy success
- **Gate:** Link is copied to clipboard and can be pasted successfully

#### REQ-3: Parse Canvas ID from Shareable Link
- App routes handle `/canvas/{canvasId}` path
- Extract `canvasId` from URL on page load
- Validate canvas ID format (Firestore auto-generated ID)
- Handle invalid canvas IDs gracefully (404 or redirect to gallery)
- **Gate:** Valid canvas IDs load canvas; invalid IDs show error

#### REQ-4: Add User to Collaborators on Link Access
- When user opens `/canvas/{canvasId}` link:
  1. Check if user is authenticated (redirect to login if not)
  2. Check if user is already in `collaboratorIds` array
  3. If not in array:
     - Add `userId` to `collaboratorIds` via Firestore `arrayUnion`
     - Update canvas `updatedAt` timestamp
     - Show toast: "You've been added to [Canvas Name]!"
  4. If already in array:
     - Skip addition step (idempotent)
  5. Load canvas normally
- **Gate:** New users are added to `collaboratorIds` automatically; existing collaborators are not duplicated

#### REQ-5: Real-Time Collaborator Sync
- When canvas `collaboratorIds` array updates, all clients subscribed to canvas see update
- Gallery queries use `where('collaboratorIds', 'array-contains', userId)`
- New collaborators see shared canvas appear in gallery immediately (<100ms)
- **Gate:** Gallery updates in real-time when user is added as collaborator

#### REQ-6: Share Button in Canvas View
- Add "Share" button to navbar or toolbar (visible when viewing canvas)
- Button only visible to canvas **owner** (check `canvas.ownerId === userId`)
- Clicking button opens share modal/panel
- **Gate:** Share button appears for owners only; clicking opens modal

#### REQ-7: Share Modal UI
- Modal displays:
  1. Shareable link in read-only input field (90s inset style)
  2. "Copy Link" button (raised 3D button)
  3. **Warning notice:** "⚠️ Only share this link with people you trust. Anyone with the link can edit your canvas." (yellow background, bold text)
  4. Collaborators list (see REQ-8)
- Modal can be closed via X button, Escape key, or clicking outside
- 90s/00s aesthetic: Double-line border, system font, gray color scheme
- **Gate:** Modal displays all required elements with retro styling; closes on expected interactions

#### REQ-8: Display Collaborators List
- Fetch collaborator usernames/emails using `collaboratorIds` array
- Display list in share modal:
  - Avatar/initial icon (if available)
  - Username or email
  - Badge: "Owner" for `ownerId`, "Collaborator" for others
- Owner appears first, then collaborators sorted by join date (or alphabetically)
- List updates in real-time when new collaborators join
- **Gate:** Collaborators list displays correct users with proper roles

#### REQ-9: Distinguish Shared Canvases in Gallery
- Canvas cards in gallery show indicator if canvas is shared with user (not owned by user)
- Indicators:
  - Badge/icon: 👥 in top-left corner
  - Metadata text: "Shared by [Owner Name]" (bold)
  - Thicker border (2px) and light gray background tint
  - 3D raised effect (90s panel style)
- User can visually distinguish owned vs. shared canvases
- **Gate:** Shared canvases have clear retro-styled visual distinction in gallery

#### REQ-10: Access Control Enforcement
- Firestore security rules enforce access control:
  - Users can only read canvases where `userId in collaboratorIds`
  - Only owner (`ownerId`) can update canvas metadata (name, settings)
  - All collaborators can create/update/delete shapes within canvas
- Unauthorized access attempts return permission denied error
- **Gate:** Non-collaborators cannot access canvas; collaborators have full shape editing permissions

#### REQ-11: Authentication Required for Shared Links
- Unauthenticated users clicking shared links redirect to login page
- After login, redirect back to canvas URL (preserve `canvasId` in redirect)
- Post-login flow adds user to `collaboratorIds` and loads canvas
- **Gate:** Unauthenticated users prompted to login; post-login flow completes successfully

#### REQ-12: Error Handling for Invalid Links
- If canvas ID doesn't exist (deleted or invalid):
  - Show error message: "Canvas not found or you don't have access"
  - Provide "Return to Gallery" button
  - Log error for debugging
- If Firestore read fails (network error):
  - Show error message: "Unable to load canvas. Please try again."
  - Provide retry button
- **Gate:** Invalid links show clear error messages; users can recover gracefully

#### REQ-13: Toast Notifications for Sharing Actions
- Successful link copy: "Link copied to clipboard!"
- User added to canvas: "You've been added to [Canvas Name]!"
- Error adding user: "Unable to join canvas. Please try again."
- **Gate:** Toast notifications appear for all sharing actions

### SHOULD-HAVE Requirements

#### REQ-14: Copy Link Button in Gallery (Canvas Cards)
- Add "📋 Copy" button to canvas cards in gallery (top-right)
- **Owner-only:** Button visible only if user is canvas owner
- Appears on card hover (desktop) or always visible (mobile)
- Clicking button copies shareable link to clipboard without opening modal
- Visual feedback: Button text changes to "✓ Copied!" for 2 seconds
- Toast notification: "Link copied to clipboard!"
- 90s styling: Small raised button, gray background (#C0C0C0)
- **Gate:** Copy button appears for owned canvases, copies link successfully

#### REQ-15: Show Online Collaborators
- In share modal, show which collaborators are currently online/viewing canvas
- Use presence data from RTDB (`sessions/{canvasId}/users/{userId}`)
- Display green circle indicator or "●" next to active users
- Updates in real-time as users join/leave canvas
- 90s style: Simple green/gray circle bullets

#### REQ-16: Collaborator Join Notifications
- When new collaborator joins via link, show toast to existing users:
  - "[Username] joined the canvas"
- Updates collaborator list in real-time without closing modal
- Retro toast style (Windows 95 notification)

#### REQ-17: Canvas Owner Indicator in Gallery
- In gallery, show badge or icon on canvases user owns (vs. shared with user)
- Badge: "★" or "[OWNER]" in top-left
- Helps user quickly identify which canvases they have full control over
- 90s style: Bold square brackets or star icon

---

## 8. Data Model

### Firestore Collections

#### `canvases/{canvasId}` (Existing - No Schema Changes)

No new fields required. Existing schema from PR #12:

```typescript
interface CanvasDocument {
  id: string;                  // Firestore document ID
  name: string;                // Canvas name
  ownerId: string;             // User who created canvas
  collaboratorIds: string[];   // [ownerId, ...sharedUserIds] ← Key field for sharing
  createdAt: Timestamp;
  updatedAt: Timestamp;        // Updates when collaborators added
  lastAccessedAt: Timestamp;
  shapeCount: number;
}
```

**Key Field: `collaboratorIds`**
- Array of user IDs with access to canvas
- Always includes `ownerId` as first element
- New collaborators added via `arrayUnion` (prevents duplicates)
- Queried via `where('collaboratorIds', 'array-contains', userId)`

**Indexing:**
- Existing composite index: `collaboratorIds (ARRAY) + updatedAt (DESC)` (from PR #12)
- Sufficient for sharing queries

#### `users/{userId}` (Existing - Reference for Collaborator Names)

```typescript
interface UserDocument {
  id: string;
  email: string;
  displayName?: string;  // Optional username
  createdAt: Timestamp;
}
```

**Usage:**
- Fetch collaborator names using `userIds` from `collaboratorIds` array
- Display in share modal collaborator list

### TypeScript Interfaces

#### New Types for Sharing Feature

```typescript
// Collaborator metadata for display
export interface CollaboratorInfo {
  userId: string;
  email: string;
  displayName: string | null;
  isOwner: boolean;
  isOnline?: boolean; // SHOULD-HAVE: from presence data
}

// Share modal props
export interface ShareModalProps {
  canvasId: string;
  canvasName: string;
  isOwner: boolean;
  onClose: () => void;
}
```

#### Service Method Signatures (New)

```typescript
// In canvasListService.ts (new methods)

/**
 * Add user to canvas collaborators via shareable link
 * @param canvasId - Canvas to add user to
 * @param userId - User to add as collaborator
 * @returns Promise resolving to canvas metadata
 */
async addCollaborator(canvasId: string, userId: string): Promise<CanvasMetadata>;

/**
 * Get collaborator info for a canvas
 * @param canvasId - Canvas to fetch collaborators for
 * @returns Promise resolving to array of collaborator info
 */
async getCollaborators(canvasId: string): Promise<CollaboratorInfo[]>;

/**
 * Generate shareable link for canvas
 * @param canvasId - Canvas ID to generate link for
 * @returns Shareable URL string
 */
generateShareableLink(canvasId: string): string;
```

### Validation Rules

- **Canvas ID Format:** Firestore auto-generated ID (20-character alphanumeric)
- **Collaborator IDs:** Must be valid authenticated user IDs
- **Access Control:** 
  - User must be in `collaboratorIds` to read canvas
  - Only `ownerId` can modify canvas metadata
  - All collaborators can modify shapes/chat/comments

### URL Routing

#### New Routes

```typescript
// /canvas/:canvasId - View/edit specific canvas
// Query params:
//   ?share=true - Indicates link was from shareable link (optional, for analytics)

// Example: https://app.collabcanvas.com/canvas/abc123xyz?share=true
```

#### Route Handling Logic

```typescript
// Pseudo-code for canvas route handler
async function handleCanvasRoute(canvasId: string, userId: string) {
  // 1. Validate canvas ID format
  if (!isValidCanvasId(canvasId)) {
    return redirect('/gallery', { error: 'Invalid canvas ID' });
  }
  
  // 2. Check if user is authenticated
  if (!userId) {
    return redirect('/login', { redirectTo: `/canvas/${canvasId}` });
  }
  
  // 3. Check if canvas exists
  const canvas = await canvasListService.getCanvasById(canvasId);
  if (!canvas) {
    return showError('Canvas not found');
  }
  
  // 4. Check if user has access
  if (!canvas.collaboratorIds.includes(userId)) {
    // 5. Add user as collaborator (auto-grant access via shareable link)
    await canvasListService.addCollaborator(canvasId, userId);
    showToast(`You've been added to "${canvas.name}"!`);
  }
  
  // 6. Load canvas
  setCurrentCanvasId(canvasId);
  await canvasListService.updateCanvasAccess(canvasId);
}
```

---

## 9. API / Service Contracts

### canvasListService.ts (New Methods)

#### `addCollaborator(canvasId: string, userId: string): Promise<CanvasMetadata>`

**Purpose:** Add a user to canvas collaborators array (when they open shareable link)

**Pre-conditions:**
- Canvas exists
- User is authenticated
- User is not already a collaborator (idempotent)

**Implementation:**
```typescript
async addCollaborator(canvasId: string, userId: string): Promise<CanvasMetadata> {
  const canvasRef = doc(firestore, 'canvases', canvasId);
  
  // Use arrayUnion to prevent duplicates
  await updateDoc(canvasRef, {
    collaboratorIds: arrayUnion(userId),
    updatedAt: serverTimestamp(),
  });
  
  // Return updated canvas metadata
  return await this.getCanvasById(canvasId);
}
```

**Post-conditions:**
- `userId` exists in `collaboratorIds` array
- `updatedAt` timestamp updated
- Canvas appears in user's gallery

**Error Handling:**
- Throw error if canvas doesn't exist
- Throw error if Firestore write fails
- Surface error to UI (toast notification)

#### `getCollaborators(canvasId: string): Promise<CollaboratorInfo[]>`

**Purpose:** Fetch collaborator details for display in share modal

**Pre-conditions:**
- Canvas exists
- User has read access to canvas

**Implementation:**
```typescript
async getCollaborators(canvasId: string): Promise<CollaboratorInfo[]> {
  // 1. Get canvas document
  const canvas = await this.getCanvasById(canvasId);
  if (!canvas) throw new Error('Canvas not found');
  
  // 2. Fetch user documents for all collaborators
  const collaboratorPromises = canvas.collaboratorIds.map(async (userId) => {
    const userDoc = await getDoc(doc(firestore, 'users', userId));
    const userData = userDoc.data();
    
    return {
      userId,
      email: userData?.email || 'Unknown',
      displayName: userData?.displayName || null,
      isOwner: userId === canvas.ownerId,
    };
  });
  
  // 3. Resolve all promises
  const collaborators = await Promise.all(collaboratorPromises);
  
  // 4. Sort: owner first, then alphabetically
  return collaborators.sort((a, b) => {
    if (a.isOwner) return -1;
    if (b.isOwner) return 1;
    return (a.displayName || a.email).localeCompare(b.displayName || b.email);
  });
}
```

**Post-conditions:**
- Returns array of collaborator info objects
- Owner is first in array
- All collaborators have valid user data

**Error Handling:**
- Return empty array if canvas not found
- Handle missing user documents gracefully (show "Unknown" user)

#### `generateShareableLink(canvasId: string): string`

**Purpose:** Generate shareable URL for canvas

**Pre-conditions:**
- Canvas ID is valid
- App is running in browser (has `window.location`)

**Implementation:**
```typescript
generateShareableLink(canvasId: string): string {
  const baseUrl = window.location.origin; // e.g., https://app.collabcanvas.com
  return `${baseUrl}/canvas/${canvasId}?share=true`;
}
```

**Post-conditions:**
- Returns valid URL string
- URL includes canvas ID in path
- URL includes share query parameter

**Error Handling:**
- No expected errors (synchronous URL construction)

### clipboardService.ts (New Utility Service)

#### `copyToClipboard(text: string): Promise<boolean>`

**Purpose:** Copy text to user's clipboard with browser compatibility

**Implementation:**
```typescript
async copyToClipboard(text: string): Promise<boolean> {
  try {
    // Modern Clipboard API (preferred)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed'; // Avoid scrolling
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    return success;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}
```

**Error Handling:**
- Return `false` on failure
- Log error for debugging
- UI should show fallback (manual copy instruction)

---

## 10. UI Components to Create/Modify

### New Components

#### `src/components/Canvas/ShareButton.tsx`
**Purpose:** Button to open share modal (in canvas navbar/toolbar)

**Props:**
```typescript
interface ShareButtonProps {
  canvasId: string;
  canvasName: string;
  isOwner: boolean; // Only show button if true
}
```

**Behavior:**
- Renders button with share icon
- Visible only if `isOwner === true`
- Clicks open share modal

#### `src/components/Canvas/ShareModal.tsx`
**Purpose:** Modal displaying shareable link and collaborators

**Props:**
```typescript
interface ShareModalProps {
  canvasId: string;
  canvasName: string;
  isOpen: boolean;
  onClose: () => void;
}
```

**State:**
- Shareable link (string)
- Copy button state ('Copy Link' | '✓ Copied!')
- Collaborators list (array)
- Loading states

**Children Components:**
- ShareLinkInput (read-only input with link)
- CopyLinkButton
- CollaboratorsList

#### `src/components/Canvas/CollaboratorsList.tsx`
**Purpose:** Display list of users with access to canvas

**Props:**
```typescript
interface CollaboratorsListProps {
  canvasId: string;
  collaborators: CollaboratorInfo[];
  loading: boolean;
}
```

**Renders:**
- Heading: "People with access (X)"
- List items: Avatar + Name + Role badge
- Loading skeleton if loading

### Modified Components

#### `src/components/Canvas/Canvas.tsx`
**Changes:**
- Import and render `ShareButton` in navbar/toolbar
- Pass canvas ID, name, and ownership status as props
- Handle share button visibility (owner only)

#### `src/components/CanvasGallery/CanvasCard.tsx`
**Changes:**
- Add visual indicator for shared canvases (badge/icon)
- Show "Shared by [Owner]" text if canvas is shared with user (not owned)
- Conditionally render based on `canvas.ownerId !== currentUserId`

#### `src/App.tsx` (or Router Component)
**Changes:**
- Add route handler for `/canvas/:canvasId`
- Extract canvas ID from URL params
- Call `handleCanvasAccess` function on route load:
  1. Check authentication
  2. Check if user is collaborator
  3. Add user to collaborators if not
  4. Set current canvas ID
- Handle authentication redirect with canvas ID preservation

### New Hooks

#### `src/hooks/useShareCanvas.ts`
**Purpose:** Encapsulate sharing logic (copy link, fetch collaborators)

**Returns:**
```typescript
{
  shareableLink: string;
  copyLinkToClipboard: () => Promise<boolean>;
  collaborators: CollaboratorInfo[];
  loadingCollaborators: boolean;
  refreshCollaborators: () => Promise<void>;
}
```

### New Services/Utilities

#### `src/services/clipboardService.ts`
**Purpose:** Handle clipboard operations with browser compatibility

**Methods:**
- `copyToClipboard(text: string): Promise<boolean>`

#### `src/utils/routeHelpers.ts` (if doesn't exist)
**Purpose:** URL and routing utilities

**Methods:**
- `parseCanvasIdFromUrl(): string | null`
- `isValidCanvasId(id: string): boolean`

---

## 11. Test Plan & Acceptance Gates

### Happy Path

#### Test 1: Generate and Copy Shareable Link
- [ ] **Action:** Owner opens canvas, clicks "Share" button
- [ ] **Expected:** Share modal opens with shareable link displayed
- [ ] **Action:** Owner clicks "Copy Link" button
- [ ] **Expected:** Link copied to clipboard, button shows "✓ Copied!", toast appears
- [ ] **Gate:** Clipboard contains correct shareable link (verify via paste)

#### Test 2: Open Shareable Link (New Collaborator)
- [ ] **Action:** User B (not yet collaborator) clicks shareable link
- [ ] **Expected:** User B redirects to login if not authenticated
- [ ] **Action:** User B logs in
- [ ] **Expected:** User B redirects to canvas, added to collaborators, toast shows "You've been added to [Canvas Name]!"
- [ ] **Gate:** User B is added to `collaboratorIds`, canvas loads successfully

#### Test 3: Open Shareable Link (Existing Collaborator)
- [ ] **Action:** User B (already collaborator) clicks shareable link again
- [ ] **Expected:** Canvas loads immediately, no duplicate addition
- [ ] **Gate:** User B not duplicated in `collaboratorIds`, no error occurs

#### Test 4: Shared Canvas Appears in Gallery
- [ ] **Action:** User B (new collaborator) accesses shared canvas
- [ ] **Expected:** Shared canvas appears in User B's gallery with "Shared" indicator
- [ ] **Gate:** Gallery real-time sync shows shared canvas within 100ms

#### Test 5: Collaborators List Updates
- [ ] **Action:** Owner opens share modal, User C joins via link (in another browser)
- [ ] **Expected:** Collaborators list in owner's share modal updates in real-time to include User C
- [ ] **Gate:** Real-time sync shows new collaborator within 100ms

#### Test 6: Collaborators Can Edit Canvas
- [ ] **Action:** User B (collaborator) creates shape on shared canvas
- [ ] **Expected:** Shape appears for all users (Owner, User B, User C) in real-time
- [ ] **Gate:** Real-time collaboration features work for all collaborators

### Edge Cases

#### Test 7: Invalid Canvas ID in URL
- [ ] **Action:** User navigates to `/canvas/invalid-id-123`
- [ ] **Expected:** Error message displays: "Canvas not found or you don't have access"
- [ ] **Expected:** "Return to Gallery" button appears
- [ ] **Gate:** No crash, clear error message, user can recover

#### Test 8: Deleted Canvas Link
- [ ] **Action:** Owner deletes canvas, User B tries to access via saved shareable link
- [ ] **Expected:** Error message: "Canvas not found or you don't have access"
- [ ] **Gate:** No crash, clear error message

#### Test 9: Unauthenticated User Clicks Link
- [ ] **Action:** Logged-out user clicks shareable link
- [ ] **Expected:** Redirect to login page
- [ ] **Action:** User logs in
- [ ] **Expected:** Redirect back to canvas URL, user added as collaborator, canvas loads
- [ ] **Gate:** Post-login redirect preserves canvas ID, access granted

#### Test 10: Network Failure During Collaborator Addition
- [ ] **Setup:** Simulate network failure during Firestore write
- [ ] **Action:** User clicks shareable link
- [ ] **Expected:** Error toast: "Unable to join canvas. Please try again."
- [ ] **Expected:** Retry mechanism or manual retry button
- [ ] **Gate:** Error handled gracefully, user can retry

#### Test 11: Copy Link Without Clipboard API
- [ ] **Setup:** Browser without `navigator.clipboard` support
- [ ] **Action:** Owner clicks "Copy Link" button
- [ ] **Expected:** Link text auto-selected, user can Ctrl+C manually
- [ ] **Expected:** Fallback message: "Link selected, press Ctrl+C to copy"
- [ ] **Gate:** Fallback works, user can copy link manually

#### Test 12: Share Button Visibility
- [ ] **Action:** Collaborator (non-owner) views shared canvas
- [ ] **Expected:** Share button **not visible** (only owner can share)
- [ ] **Gate:** Permission check works, only owners see share button

### Multi-User Scenarios

#### Test 13: Concurrent Collaborator Additions
- [ ] **Setup:** Users B, C, D click shareable link simultaneously
- [ ] **Expected:** All three users added to `collaboratorIds` without duplicates
- [ ] **Expected:** No race conditions or conflicts
- [ ] **Gate:** All users successfully access canvas, `collaboratorIds` has 4 users (Owner + B + C + D)

#### Test 14: Real-Time Gallery Sync
- [ ] **Setup:** User B has gallery open
- [ ] **Action:** User B clicks shareable link in another tab
- [ ] **Expected:** Gallery tab updates to show new shared canvas
- [ ] **Gate:** Real-time sync works across tabs/windows

#### Test 15: Real-Time Collaborators List Sync
- [ ] **Setup:** Owner has share modal open
- [ ] **Action:** User E joins via link
- [ ] **Expected:** Owner's collaborators list updates to include User E within 100ms
- [ ] **Gate:** Real-time subscription to canvas updates collaborators list

### Performance

#### Test 16: Share Modal Load Time
- [ ] **Action:** Owner clicks "Share" button
- [ ] **Measurement:** Time from click to modal fully rendered
- [ ] **Gate:** Modal opens in <50ms (instant UI), collaborators load in <500ms

#### Test 17: Link Copy Speed
- [ ] **Action:** Owner clicks "Copy Link" button
- [ ] **Measurement:** Time from click to clipboard write complete
- [ ] **Gate:** Link copied in <100ms, button state updates immediately

#### Test 18: Collaborator Addition Speed
- [ ] **Action:** New user clicks shareable link (authenticated)
- [ ] **Measurement:** Time from click to canvas fully loaded
- [ ] **Gate:** User added and canvas loaded in <2 seconds

#### Test 19: Gallery Update Speed (Shared Canvas)
- [ ] **Action:** User added as collaborator
- [ ] **Measurement:** Time from Firestore write to gallery UI update
- [ ] **Gate:** Gallery updates in <100ms (real-time sync)

### Security & Access Control

#### Test 20: Non-Collaborator Cannot Access Canvas
- [ ] **Setup:** User Z is not in `collaboratorIds`
- [ ] **Action:** User Z tries to access canvas via direct URL manipulation
- [ ] **Expected:** Firestore rules deny read access
- [ ] **Expected:** Error: "You don't have access to this canvas"
- [ ] **Gate:** Access control enforced by Firestore rules

#### Test 21: Only Owner Can Update Canvas Metadata
- [ ] **Setup:** User B is collaborator (not owner)
- [ ] **Action:** User B attempts to rename canvas via API
- [ ] **Expected:** Firestore rules deny write access
- [ ] **Expected:** Error or no-op
- [ ] **Gate:** Only owner can modify canvas metadata (name, settings)

#### Test 22: All Collaborators Can Edit Shapes
- [ ] **Setup:** Users A (owner), B, C (collaborators) all on same canvas
- [ ] **Action:** Each user creates, updates, deletes shapes
- [ ] **Expected:** All users can modify shapes successfully
- [ ] **Gate:** Firestore rules allow all collaborators shape CRUD operations

---

## 12. Definition of Done (End-to-End)

- [ ] **Service methods implemented and unit-tested**
  - `canvasListService.addCollaborator()` works correctly
  - `canvasListService.getCollaborators()` returns accurate data
  - `canvasListService.generateShareableLink()` returns valid URLs
  - `clipboardService.copyToClipboard()` handles browser compatibility

- [ ] **UI components implemented with all states**
  - ShareButton renders for owners only
  - ShareModal displays link, copy button, collaborators list
  - CollaboratorsList shows accurate real-time data
  - Copy button has "Copy Link" → "✓ Copied!" state transition
  - Loading states for async operations (fetching collaborators)

- [ ] **Routing and URL handling implemented**
  - `/canvas/:canvasId` route correctly parses canvas ID
  - Unauthenticated users redirect to login with preserved canvas ID
  - Authenticated users automatically added to collaborators
  - Invalid canvas IDs show clear error messages

- [ ] **Real-time sync verified (<100ms)**
  - New collaborators see shared canvas in gallery immediately
  - Collaborators list updates in real-time when users join
  - Gallery updates when `collaboratorIds` changes

- [ ] **Visual indicators for shared canvases**
  - Gallery cards show "Shared" badge for non-owned canvases
  - "Shared by [Owner Name]" text displays correctly
  - Owned vs. shared canvases visually distinguishable

- [ ] **Clipboard functionality works**
  - Modern Clipboard API used when available
  - Fallback for older browsers (auto-select text)
  - Visual feedback on successful copy

- [ ] **Access control enforced**
  - Firestore rules prevent non-collaborators from reading canvas
  - Only owners can update canvas metadata
  - All collaborators can edit shapes/chat/comments

- [ ] **Error handling comprehensive**
  - Invalid canvas IDs show error, don't crash app
  - Network failures show clear error messages
  - Users can retry or recover from errors

- [ ] **Toast notifications for all actions**
  - "Link copied to clipboard!"
  - "You've been added to [Canvas Name]!"
  - "Unable to join canvas. Please try again." (error case)

- [ ] **Keyboard/Accessibility checks pass**
  - Share modal has focus trap, closes on Escape
  - Copy button accessible via keyboard
  - Screen readers announce link copy success

- [ ] **All acceptance gates pass**
  - All 22 tests from Section 11 pass
  - Happy path, edge cases, multi-user, performance, security tests

- [ ] **Performance targets met**
  - Share modal opens in <50ms
  - Link copy completes in <100ms
  - Collaborator addition completes in <2 seconds
  - Real-time sync <100ms

---

## 13. Risks & Mitigations

### Risk 1: Clipboard API Browser Compatibility
**Likelihood:** Medium  
**Impact:** Medium  
**Description:** Older browsers may not support `navigator.clipboard` API, causing copy link feature to fail.  
**Mitigation:** Implement fallback using `document.execCommand('copy')` with auto-selected text input. Test across browsers (Chrome, Firefox, Safari, Edge). Provide manual copy instruction if both fail.

### Risk 2: Race Condition on Concurrent Collaborator Addition
**Likelihood:** Low  
**Impact:** Medium  
**Description:** Multiple users clicking shareable link simultaneously could cause Firestore write conflicts or duplicates in `collaboratorIds` array.  
**Mitigation:** Use Firestore `arrayUnion` operation which is atomic and prevents duplicates. Test with concurrent users. Monitor Firestore logs for write conflicts.

### Risk 3: Unauthenticated Link Sharing Creates Onboarding Friction
**Likelihood:** Medium  
**Impact:** Medium  
**Description:** Users sharing links with unauthenticated recipients face extra friction (login required), potentially reducing collaboration adoption.  
**Mitigation:** Ensure post-login redirect preserves canvas ID correctly. Provide clear messaging during redirect: "You're joining a shared canvas...". Consider adding guest access in future PR (out of scope here).

### Risk 4: No Collaborator Removal Creates Permanent Access
**Likelihood:** Medium  
**Impact:** Low  
**Description:** Once user added to collaborators via link, they have permanent access with no removal mechanism (out of scope for this PR).  
**Mitigation:** Document limitation clearly. Plan follow-up PR for collaborator management (remove users, revoke access, regenerate links). Educate users to only share links with trusted collaborators.

### Risk 5: Large Collaborator Lists Impact Performance
**Likelihood:** Low  
**Impact:** Low  
**Description:** Canvases with 50+ collaborators may have slow collaborator list rendering or Firestore query performance.  
**Mitigation:** Implement pagination or "Show more" button for collaborators list (>10 users). Optimize Firestore queries with limits. Monitor performance with test canvases (seed 50+ collaborators).

### Risk 6: Shareable Links Publicly Accessible (No Expiration)
**Likelihood:** Medium  
**Impact:** Medium  
**Description:** Shareable links never expire, so if link is leaked publicly, anyone can access canvas indefinitely.  
**Mitigation:** Document limitation. Educate users to share links privately (DM, email, not public forums). Plan follow-up PR for link expiration and regeneration. Consider adding "Revoke Link" feature in future.

### Risk 7: Owner Deletion Orphans Shared Canvas
**Likelihood:** Low  
**Impact:** High  
**Description:** If canvas owner account is deleted, shared canvas may become orphaned (no owner to manage settings).  
**Mitigation:** Out of scope for this PR. Plan ownership transfer feature in future PR. For now, prevent owner account deletion if they own canvases (add validation).

---

## 14. Rollout & Telemetry

### Feature Flag
- **Flag Name:** `enable_canvas_sharing`
- **Default:** `true` (ship enabled, but flag allows emergency disable)
- **Rollout Strategy:** Ship to 100% of users immediately (Phase 3 feature, low risk)

### Metrics to Track

**Usage Metrics:**
- Number of shareable links generated per day
- Number of new collaborators added via links per day
- Percentage of canvases with >1 collaborator (shared canvases)
- Average collaborators per canvas
- Time from link generation to first collaborator join

**Performance Metrics:**
- Share modal load time (p50, p95, p99)
- Link copy time (p50, p95, p99)
- Collaborator addition time (p50, p95, p99)
- Gallery update latency (real-time sync)

**Error Metrics:**
- Failed clipboard writes (browser compatibility issues)
- Failed collaborator additions (Firestore errors)
- Invalid canvas ID access attempts (404s)
- Permission denied errors (non-collaborators)

**Engagement Metrics:**
- Number of canvases opened via shareable link vs. gallery
- Retention: Do users who join via link return?
- Collaboration depth: Number of shapes edited by collaborators

### Manual Validation Steps Post-Deploy

1. **Smoke Test:**
   - Create canvas, generate shareable link, copy link
   - Open link in incognito window (new user), verify access granted
   - Check gallery shows shared canvas
   - Verify real-time collaboration works (create shape, see on both sides)

2. **Browser Compatibility:**
   - Test clipboard copy in Chrome, Firefox, Safari, Edge
   - Verify fallback works if Clipboard API unavailable

3. **Access Control:**
   - Attempt to access canvas without being collaborator (should fail)
   - Verify only owner sees "Share" button
   - Verify collaborators can edit shapes but not rename canvas

4. **Performance Check:**
   - Open share modal, measure load time (<50ms)
   - Copy link, measure time (<100ms)
   - Add collaborator via link, measure time (<2s)

5. **Error Handling:**
   - Navigate to `/canvas/invalid-id`, verify error message
   - Disconnect network, attempt to add collaborator, verify error handling

---

## 15. Open Questions

**Q1:** Should we implement a "Copy Link" button in the canvas gallery (on canvas cards) for quick sharing without opening canvas?  
**✅ DECISION:** YES — Add "Copy Link" button to canvas cards for quick sharing (owner only).

**Q2:** Should collaborators be able to see the shareable link (read-only) even if they can't share?  
**✅ DECISION:** NO — Shareable link visible only to canvas owner in share modal.

**Q3:** Should we send email notifications when a user is added as collaborator (via link)?  
**✅ DECISION:** NO — No email notifications (email infrastructure out of scope).

**Q4:** Should we track who shared the link with whom (referral tracking)?  
**✅ DECISION:** NO — No detailed referral tracking. Basic `?share=true` query param only.

**Q5:** Should we display a warning when sharing links publicly (e.g., on social media)?  
**✅ DECISION:** YES — Add warning in share modal: "⚠️ Only share this link with people you trust. Anyone with the link can edit your canvas."

---

## 16. Appendix: Out-of-Scope Backlog

Items explicitly deferred for future work:

- [ ] **Collaborator Removal** — Remove users from `collaboratorIds` array (PR #15+)
- [ ] **Permission Levels** — View-only vs. edit permissions (future enhancement)
- [ ] **Link Expiration** — Time-based or click-based link expiration (future enhancement)
- [ ] **Password-Protected Links** — Require password to access shared canvas (future enhancement)
- [ ] **Link Regeneration** — Revoke old link, generate new one (related to collaborator removal)
- [ ] **Email Invitations** — Send link via email from app (requires email service integration)
- [ ] **Anonymous/Guest Collaboration** — Allow unauthenticated users to edit canvas temporarily (future enhancement)
- [ ] **Link Analytics** — Track link opens, unique visitors, geographic data (future analytics PR)
- [ ] **Ownership Transfer** — Transfer canvas ownership to another collaborator (future enhancement)
- [ ] **Team Workspaces** — Organizational hierarchy, team-owned canvases (enterprise feature)
- [ ] **Public/Private Canvas Settings** — Public canvases discoverable without link (future enhancement)
- [ ] **Canvas Templates from Shared Canvases** — Save shared canvas as template (future feature)
- [ ] **Collaborator Join Notifications** — Email/push notifications when someone joins (requires notification system)

---

## 17. Preflight Questionnaire Answers

**1. What is the smallest end-to-end user outcome we must deliver in this PR?**  
Owner generates shareable link → Non-collaborator clicks link → User added to canvas → Can edit canvas in real-time.

**2. Who is the primary user and what is their critical action?**  
Primary user: Canvas owner who wants to invite collaborators. Critical action: Generate shareable link and copy to clipboard.

**3. Must-have vs nice-to-have: what gets cut first if time tight?**  
Must-have: Generate link, copy link, add collaborator on link click, basic access control.  
Nice-to-have: Real-time collaborator list updates, online status indicators, visual gallery distinctions.

**4. Real-time collaboration requirements (peers, <100ms sync)?**  
- Collaborator addition must sync to gallery in <100ms
- Collaborators list in share modal should update in real-time (SHOULD-HAVE)
- All existing real-time features (shapes, cursors, chat) continue to work for all collaborators

**5. Performance constraints (FPS, shape count, latency targets)?**  
- Share modal opens in <50ms
- Link copy completes in <100ms
- Collaborator addition completes in <2 seconds
- Real-time sync <100ms (existing constraint)

**6. Error/edge cases we must handle (validation, conflicts, offline)?**  
- Invalid canvas IDs (deleted, typo, non-existent)
- Unauthenticated users (redirect to login)
- Network failures during collaborator addition
- Clipboard API unsupported (fallback)
- Concurrent collaborator additions (use arrayUnion)

**7. Data model changes needed (new fields/collections)?**  
No schema changes. Use existing `collaboratorIds` array in `canvases` collection.

**8. Service APIs required (create/update/delete/subscribe)?**  
- `addCollaborator(canvasId, userId)` — Add user to collaborators
- `getCollaborators(canvasId)` — Fetch collaborator details
- `generateShareableLink(canvasId)` — Generate shareable URL
- `copyToClipboard(text)` — Clipboard utility

**9. UI entry points and states (empty, loading, locked, error)?**  
- Entry: "Share" button in canvas navbar (owner only)
- States: Modal loading (fetching collaborators), copy button states (Copy Link / ✓ Copied!), error states (invalid link, permission denied)

**10. Accessibility/keyboard expectations:**  
- Share button keyboard accessible (Tab, Enter)
- Share modal focus trap (Esc to close)
- Copy button keyboard accessible
- Screen reader announces link copy success

**11. Security/permissions implications:**  
- Only owners can generate links (share button visible to owners only)
- All collaborators have full edit permissions (no view-only yet)
- Firestore rules enforce access control (non-collaborators denied)
- Shareable links grant permanent access (no expiration)

**12. Dependencies or blocking integrations:**  
- Requires PR #12 (multi-canvas architecture with `collaboratorIds`)
- Requires PR #3 (real-time collaboration infrastructure)
- No blocking external integrations

**13. Rollout strategy (flag, migration) and success metrics:**  
- Feature flag: `enable_canvas_sharing` (default true)
- No data migration needed (use existing schema)
- Success metrics: Link generation count, collaborator addition rate, collaboration engagement (shapes edited by non-owners)

**14. What is explicitly out of scope for this iteration?**  
- Collaborator removal
- Permission levels (view-only)
- Link expiration
- Email invitations
- Anonymous collaboration
- Link analytics beyond basic query param

---

**PRD Status:** ✅ Ready for Review (YOLO: false — Awaiting user feedback before creating TODO)

**Next Steps:**
1. User reviews PRD
2. User provides feedback or approval
3. Upon approval, Delilah creates detailed TODO breakdown (pr-14-todo.md)

