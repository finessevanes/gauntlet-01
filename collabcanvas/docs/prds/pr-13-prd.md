# PRD: Create New Canvas & Naming — End-to-End Delivery

**Feature**: Create New Canvas & Naming

**Version**: 1.0

**Status**: Ready for Development

**Agent**: Delilah (Planning Agent)

**Target Release**: Phase 3 - Canvas Management

**Links**: 
- PR Brief: `collabcanvas/docs/pr-briefs.md` (PR #13)
- TODO: `collabcanvas/docs/todos/pr-13-todo.md` (to be created after PRD approval)
- Dependencies: PR #12 (Canvas Gallery & List View)

---

## 1. Summary

Add functionality to create new blank canvases with automatic or custom naming, and implement canvas rename functionality for existing canvases. This PR enables users to organize multiple canvases with meaningful names, unlocking the full potential of the multi-canvas architecture introduced in PR #12.

---

## 2. Problem & Goals

**Problem:** Users can currently view existing canvases (PR #12) but have no way to create new ones or customize canvas names. The gallery shows auto-generated names like "Canvas #123" which are not memorable or meaningful. Users need the ability to create new workspaces and organize them with descriptive names.

**Why now?** PR #12 established the multi-canvas architecture and gallery view. Creating new canvases is the next critical step in canvas management, required before users can fully utilize the collaborative features. Without this, users are blocked from starting new projects.

**Goals:**
- [ ] G1 — Users can create new blank canvases from the gallery view
- [ ] G2 — New canvases are created with default names that can be customized immediately
- [ ] G3 — Users can rename existing canvases to organize their work
- [ ] G4 — Canvas names display consistently across all UI locations (gallery, navbar, toolbar, browser tab) replacing the current "untitled - Paint" placeholder

---

## 3. Non-Goals / Out of Scope

To maintain focus and avoid scope creep:

- [ ] **Not implementing canvas templates** — No pre-built starter canvases (future enhancement)
- [ ] **Not implementing canvas duplication** — No "Duplicate Canvas" feature (future PR)
- [ ] **Not implementing bulk canvas creation** — Only single canvas creation
- [ ] **Not implementing canvas descriptions** — Only names, no extended metadata fields
- [ ] **Not implementing canvas tags/categories** — No organizational taxonomy beyond names
- [ ] **Not implementing canvas archiving** — No archive/unarchive functionality
- [ ] **Not implementing canvas ownership transfer** — Owner remains the creator
- [ ] **Not implementing canvas name suggestions** — No AI-powered or automated naming suggestions
- [ ] **Not implementing name history/versioning** — No audit trail of name changes

---

## 4. Success Metrics

**User-visible:**
- Create new canvas workflow completes in <2 seconds (click button → navigate to new canvas)
- Canvas name updates reflect in gallery in <100ms (real-time sync)
- Default canvas names are unique and identifiable
- Rename modal opens in <50ms

**System:**
- Canvas creation writes complete in <500ms
- Canvas rename updates propagate to all clients in <100ms
- Firestore write operations succeed 99.9% of the time
- Canvas ID generation has zero collisions

**Quality:**
- All acceptance gates pass (defined in Section 11)
- 0 console errors during canvas creation or rename
- Canvas names persist across page refreshes
- No data corruption or orphaned canvas documents

---

## 5. Users & Stories

### As a New User:
- I want to **click "Create New Canvas" button** so I can start my first project
- I want to **see my new canvas immediately** so I can begin drawing right away
- I want to **give my canvas a meaningful name** so I can identify it later

### As a Returning User:
- I want to **create multiple canvases for different projects** so I can organize my work
- I want to **rename my canvases** so I can keep my workspace organized
- I want to **see updated canvas names in the gallery** so I know which project is which

### As a Collaborator:
- I want to **see the canvas name my colleague chose** so I understand the project context
- I want to **suggest a rename** (manually, via chat) to improve organization

### As a Power User:
- I want to **quickly create and name multiple canvases** so I can organize complex projects
- I want to **use descriptive names** (e.g., "Marketing Deck v2", "Wireframe - Homepage") to stay organized

---

## 6. Experience Specification (UX)

### Entry Points and Flows

#### Flow 1: Create New Canvas (Default Name)

1. User is in gallery view
2. User clicks **"+ Create New Canvas"** button (prominent, top-right of gallery)
3. Loading state appears (button shows spinner)
4. System creates canvas with default name: "Untitled Canvas" or "Canvas <timestamp>"
5. User automatically navigates to new canvas (`/canvas/{newCanvasId}`)
6. Toast notification: "Canvas created successfully! Click the name to rename."
7. Canvas name is displayed in navbar with edit icon hint

**Time:** <2 seconds from click to canvas view

#### Flow 2: Create New Canvas (Custom Name)

1. User is in gallery view
2. User clicks **"+ Create New Canvas"** button
3. **Modal appears**: "Create New Canvas"
   - Input field: "Canvas Name" (pre-filled with "Untitled Canvas")
   - Placeholder: "e.g., Project Wireframes, Team Brainstorm"
   - Character count: "0/100"
   - Buttons: "Create" (primary), "Cancel" (secondary)
4. User types custom name (e.g., "Q4 Planning Session")
5. User clicks "Create" or presses Enter
6. Modal closes, loading state appears
7. System creates canvas with custom name
8. User navigates to new canvas
9. Toast notification: "Canvas 'Q4 Planning Session' created!"

**Time:** <3 seconds from modal open to canvas view

#### Flow 3: Rename Existing Canvas (From Gallery)

1. User is in gallery view
2. User hovers over canvas card → **"Rename"** icon button appears (pencil icon, top-right of card)
3. User clicks rename button
4. **Inline edit** or **modal** appears:
   - Input field with current name pre-filled
   - Input is focused and text is selected (easy to replace)
5. User types new name (e.g., "Final Design Mockups")
6. User presses Enter or clicks checkmark button
7. Canvas name updates in gallery immediately (optimistic UI)
8. Toast notification: "Canvas renamed to 'Final Design Mockups'"
9. Firestore write completes in background

**Time:** <1 second from click to visible update

#### Flow 4: Rename Existing Canvas (From Canvas View)

1. User is viewing a canvas
2. Canvas name is displayed in navbar (top-left or center)
3. User clicks on canvas name (clickable with edit icon hint)
4. **Inline edit activates**:
   - Canvas name becomes an input field
   - Text is focused and selected
5. User types new name
6. User presses Enter or clicks checkmark button (or clicks outside to save)
7. Name updates in navbar immediately
8. Toast notification: "Canvas renamed!"
9. Gallery reflects update in real-time (if other tab open)

**Time:** <500ms from click to visible update

### Visual Behavior

#### Create New Canvas Button

```
┌─────────────────────────────────────┐
│  Canvas Gallery                     │
│                                     │
│  [+ Create New Canvas] ← Button    │
│                                     │
│  ┌───────┐  ┌───────┐  ┌───────┐  │
│  │Canvas1│  │Canvas2│  │Canvas3│  │
│  └───────┘  └───────┘  └───────┘  │
└─────────────────────────────────────┘
```

**Button Styling:**
- Color: Primary blue (#0066CC)
- Icon: Plus sign (+)
- Position: Top-right of gallery, above canvas grid
- Size: Medium button (40px height)
- States: Default, Hover (darker blue), Active (pressed), Loading (spinner)

#### Create Canvas Modal (Option 2)

```
┌─────────────────────────────────────┐
│  Create New Canvas          [X]     │
│─────────────────────────────────────│
│                                     │
│  Canvas Name:                       │
│  ┌───────────────────────────────┐ │
│  │ Untitled Canvas             │ │ │
│  └───────────────────────────────┘ │
│  0/100 characters                   │
│                                     │
│  Examples: "Marketing Deck",        │
│  "Wireframe - Homepage"             │
│                                     │
│     [Cancel]  [Create] ← Primary    │
│                                     │
└─────────────────────────────────────┘
```

#### Canvas Card with Rename Button

```
┌─────────────────────────────────┐
│ 🎨 Q4 Planning Session    [✏️]│  ← Hover shows pencil
│                                 │
│ Last edited: 2 hours ago        │
│ 👥 3 collaborators              │
│ 🔷 15 shapes                    │
└─────────────────────────────────┘
```

#### Inline Rename in Navbar

```
Before:
[← Back] | Q4 Planning Session ✏️ | [Tools...]

During Edit:
[← Back] | [Q4 Planning Session   ] ✓ ✕ | [Tools...]
           ↑ Input field with checkmark/cancel buttons
```

### Loading States

- **Creating Canvas:** Button shows spinner + "Creating..." text
- **Renaming Canvas:** Input field shows saving indicator (checkmark animation)
- **Modal Loading:** Entire modal shows overlay spinner if needed

### Disabled States

- **Create Button:** Disabled if user has reached canvas limit (if implemented)
- **Rename Save:** Disabled if canvas name is empty or exceeds 100 characters

### Validation Feedback

- **Empty Name:** Red border, error message: "Canvas name cannot be empty"
- **Too Long (>100 chars):** Red border, error message: "Canvas name too long (max 100 characters)"
- **Invalid Characters:** Warning message: "Special characters may cause display issues" (non-blocking)
- **Duplicate Name:** Warning message: "You already have a canvas with this name" (non-blocking)

### Keyboard Shortcuts

- **`Ctrl/Cmd + N`** — Create new canvas (from gallery view)
- **`F2`** — Rename focused canvas card (from gallery view)
- **`Enter`** — Save canvas name (in rename input)
- **`Escape`** — Cancel rename (in rename input)

### Accessibility

- Create button has `aria-label="Create new canvas"`
- Rename button has `aria-label="Rename canvas [name]"`
- Input fields have `aria-label="Canvas name"` and `aria-describedby` for validation messages
- Screen reader announces: "Canvas '[name]' created" after creation
- Screen reader announces: "Canvas renamed to '[new name]'" after rename
- Focus management: After creating canvas, focus goes to canvas view; after renaming, focus returns to rename button

### Performance

- Canvas creation completes in <500ms (Firestore write)
- User navigates to new canvas in <1 second total
- Rename updates reflect in <100ms (optimistic UI + real-time sync)
- No UI blocking during async operations

---

## 7. Functional Requirements

### MUST-HAVE Requirements

#### REQ-1: Create New Canvas Service Method
- Add `createCanvas()` method to `canvasListService.ts`
- Method signature:
  ```typescript
  async createCanvas(userId: string, name?: string): Promise<string>
  ```
- Default name: "Untitled Canvas" if no name provided
- Generates unique canvas ID (Firestore auto-ID)
- Sets `ownerId`, `collaboratorIds` (initially just owner), timestamps
- Initial `shapeCount` = 0
- **Gate:** Method successfully creates canvas document and returns canvas ID

#### REQ-2: Canvas Name Validation
- Canvas name must be 1-100 characters (after trimming whitespace)
- Empty names default to "Untitled Canvas"
- Leading/trailing whitespace is trimmed
- No strict character restrictions (allow Unicode, emojis, special chars)
- **Gate:** Validation rejects empty strings and >100 character names

#### REQ-3: Create New Canvas Button in Gallery
- Add prominent "Create New Canvas" button in gallery view
- Position: Top-right of gallery, above canvas grid
- Button triggers canvas creation flow
- Shows loading state during creation
- **Gate:** Button visible, clickable, triggers creation

#### REQ-4: Create Canvas Flow (Instant Creation)
- Clicking "Create" button immediately creates canvas with default name
- User navigates to new canvas automatically
- URL updates to `/canvas/{newCanvasId}`
- Toast notification confirms creation
- **Gate:** End-to-end flow works, user lands on new canvas

#### REQ-5: Optional Create Canvas Modal (Enhanced UX)
- **Alternative to REQ-4:** Modal appears with name input
- Pre-filled with "Untitled Canvas" (editable)
- Enter key submits, Escape cancels
- Modal closes and navigates to canvas on creation
- **Gate:** Modal allows custom naming before creation

**Decision:** Implement **REQ-4** (instant creation) as primary flow. Modal (REQ-5) is optional enhancement if time permits.

#### REQ-6: Rename Canvas Service Method
- Add `renameCanvas()` method to `canvasListService.ts`
- Method signature:
  ```typescript
  async renameCanvas(canvasId: string, newName: string): Promise<void>
  ```
- Calls `updateCanvasMetadata()` with new name
- Updates `updatedAt` timestamp automatically
- **Gate:** Method successfully updates canvas name in Firestore

#### REQ-7: Rename Canvas UI in Gallery
- Add rename button (pencil icon) to canvas cards
- Appears on hover or always visible (mobile-friendly)
- Clicking rename button activates inline edit or opens modal
- **Gate:** Rename button triggers rename flow

#### REQ-8: Inline Rename Functionality
- Canvas name becomes editable input field
- Current name is pre-filled and selected (easy to replace)
- Enter saves, Escape cancels
- Clicking outside saves (optional: prompt confirmation)
- **Gate:** Inline rename works, updates persist

#### REQ-9: Rename Canvas UI in Canvas View (Navbar)
- Canvas name displayed in navbar with edit icon
- Clicking name activates inline edit
- Same inline edit behavior as gallery
- **Gate:** Rename works from canvas view

#### REQ-10: Optimistic UI for Rename
- Canvas name updates immediately in UI (before Firestore write completes)
- If Firestore write fails, revert to old name and show error toast
- **Gate:** Optimistic update provides instant feedback

#### REQ-11: Real-Time Name Sync
- When canvas is renamed, all users viewing the gallery see the update
- Users viewing the canvas see the navbar name update
- Updates propagate via Firestore subscriptions (<100ms)
- **Gate:** Multi-user name sync works in <100ms

#### REQ-12: Canvas Name Display Consistency
- Canvas name shown in:
  - Gallery card title
  - Canvas view navbar
  - Browser tab title (`<title>`)
  - Toast notifications
- All locations display same name, update consistently
- **Gate:** Name updates appear in all locations

#### REQ-13: Error Handling for Canvas Creation
- If Firestore write fails → Show error toast, stay in gallery
- If user lacks permissions → Show error, don't navigate
- If network offline → Queue creation or show offline error
- **Gate:** Error cases handled gracefully with user feedback

#### REQ-14: Error Handling for Canvas Rename
- If Firestore write fails → Revert optimistic UI, show error toast
- If canvas doesn't exist → Show error, disable rename
- If user lacks permissions → Show error, disable rename
- **Gate:** Error cases handled, UI recovers from failures

### SHOULD-HAVE Requirements

#### REQ-15: Canvas Name Character Counter
- Show "X/100 characters" in rename input
- Visual indicator when approaching limit (90+ chars)
- Prevent typing beyond 100 characters

#### REQ-16: Canvas Name Duplicate Warning
- Check if user already has canvas with same name
- Show non-blocking warning: "You already have a canvas named '[name]'"
- Allow duplicate names (warning only, not error)

#### REQ-17: Canvas Name Placeholder/Examples
- Input placeholder: "e.g., Project Wireframes, Team Brainstorm"
- Help text: "Choose a descriptive name to organize your canvases"

#### REQ-18: Keyboard Shortcut for New Canvas
- `Ctrl/Cmd + N` in gallery view creates new canvas
- `F2` on focused canvas card activates rename

---

## 8. Data Model

### Firestore Collections

#### `canvases/{canvasId}` (Updated)

No schema changes required. Existing fields used:

```typescript
interface CanvasDocument {
  id: string; // Auto-generated Firestore ID
  name: string; // "Untitled Canvas" or user-specified (1-100 chars)
  ownerId: string; // User who created canvas
  collaboratorIds: string[]; // Initially [ownerId]
  createdAt: Timestamp;
  updatedAt: Timestamp; // Updates on rename
  lastAccessedAt: Timestamp;
  shapeCount: number; // Starts at 0
}
```

**Indexing:**
- Existing composite index: `collaboratorIds (ARRAY) + updatedAt (DESC)` (from PR #12)
- No additional indexes required

### TypeScript Interfaces

```typescript
// New function signature in canvasListService
export interface CreateCanvasInput {
  name?: string; // Optional, defaults to "Untitled Canvas"
}

export interface RenameCanvasInput {
  canvasId: string;
  newName: string;
}
```

### Validation Rules

- **Canvas Name:**
  - Min length: 1 character (after trim)
  - Max length: 100 characters
  - Allowed: Unicode text, emojis, numbers, special characters
  - Trimmed: Leading/trailing whitespace removed
  - Default: "Untitled Canvas" if empty or not provided

- **Canvas ID:**
  - Generated by Firestore (auto-ID)
  - Format: 20-character alphanumeric string
  - Guaranteed unique by Firestore

---

## 9. API / Service Contracts

### Updated Service: `canvasListService.ts`

#### New Methods:

```typescript
/**
 * Create a new blank canvas
 * @param userId - Authenticated user ID (owner)
 * @param name - Optional canvas name (defaults to "Untitled Canvas")
 * @returns Promise resolving to new canvas ID
 */
async createCanvas(userId: string, name?: string): Promise<string>;

/**
 * Rename an existing canvas
 * @param canvasId - Canvas document ID
 * @param newName - New canvas name (1-100 characters, trimmed)
 * @returns Promise resolving when rename complete
 * @throws Error if canvas not found or user lacks permission
 */
async renameCanvas(canvasId: string, newName: string): Promise<void>;

/**
 * Validate canvas name
 * @param name - Canvas name to validate
 * @returns Validation result with error message if invalid
 */
validateCanvasName(name: string): { valid: boolean; error?: string };
```

#### Method Implementation Details:

**`createCanvas(userId: string, name?: string): Promise<string>`**

```typescript
async createCanvas(userId: string, name?: string): Promise<string> {
  try {
    // Validate and sanitize name
    const canvasName = name?.trim() || 'Untitled Canvas';
    const validation = this.validateCanvasName(canvasName);
    
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Create new canvas document
    const canvasRef = doc(collection(firestore, 'canvases'));
    const canvasId = canvasRef.id;

    const canvasData: CanvasDocument = {
      id: canvasId,
      name: canvasName,
      ownerId: userId,
      collaboratorIds: [userId],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastAccessedAt: serverTimestamp(),
      shapeCount: 0,
    };

    await setDoc(canvasRef, canvasData);

    console.log(`✅ Canvas created: ${canvasId} - "${canvasName}"`);
    return canvasId;
  } catch (error) {
    console.error('❌ Error creating canvas:', error);
    throw error;
  }
}
```

**`renameCanvas(canvasId: string, newName: string): Promise<void>`**

```typescript
async renameCanvas(canvasId: string, newName: string): Promise<void> {
  try {
    // Validate and sanitize name
    const trimmedName = newName.trim();
    const validation = this.validateCanvasName(trimmedName);
    
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Update canvas name using existing updateCanvasMetadata
    await this.updateCanvasMetadata(canvasId, {
      name: trimmedName,
    });

    console.log(`✅ Canvas renamed: ${canvasId} → "${trimmedName}"`);
  } catch (error) {
    console.error('❌ Error renaming canvas:', error);
    throw error;
  }
}
```

**`validateCanvasName(name: string): { valid: boolean; error?: string }`**

```typescript
validateCanvasName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Canvas name cannot be empty' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'Canvas name too long (max 100 characters)' };
  }

  return { valid: true };
}
```

**Error Handling:**
- `createCanvas()`: Throws on validation errors, Firestore write failures, permission errors
- `renameCanvas()`: Throws on validation errors, canvas not found, permission errors
- All errors logged to console and propagated to caller for UI error handling

---

## 10. UI Components to Create/Modify

### New Components

1. **`src/components/CanvasGallery/CreateCanvasButton.tsx`** — "Create New Canvas" button with loading state
2. **`src/components/CanvasGallery/CreateCanvasModal.tsx`** — Optional modal for custom naming (SHOULD-HAVE)
3. **`src/components/CanvasGallery/RenameCanvasInline.tsx`** — Inline rename input component
4. **`src/hooks/useCanvasCreation.ts`** — Custom hook for canvas creation logic
5. **`src/hooks/useCanvasRename.ts`** — Custom hook for canvas rename logic

### Modified Components

6. **`src/services/canvasListService.ts`** — Add `createCanvas()`, `renameCanvas()`, `validateCanvasName()` methods
7. **`src/components/CanvasGallery/CanvasGallery.tsx`** — Add "Create New Canvas" button at top
8. **`src/components/CanvasGallery/CanvasCard.tsx`** — Add rename button (pencil icon) on hover
9. **`src/components/Layout/Navbar.tsx`** — Add clickable canvas name with inline rename
10. **`src/App.tsx`** — Update tab title (`<title>`) to show current canvas name
11. **`src/services/types/canvasTypes.ts`** — Add `CreateCanvasInput`, `RenameCanvasInput` types if needed

---

## 11. Test Plan & Acceptance Gates

### Happy Path (15 gates)

- [ ] **Create Canvas - Default Name:** Click "Create New Canvas" → Canvas created with name "Untitled Canvas" → Navigate to new canvas in <2s
- [ ] **Create Canvas - Custom Name (Modal):** Open modal → Enter "My Project" → Click Create → Canvas created with name "My Project"
- [ ] **Canvas Creation Persistence:** Create canvas → Refresh page → Canvas appears in gallery with correct name
- [ ] **Navigate to New Canvas:** After creation → User lands on new canvas view → Canvas is empty (0 shapes)
- [ ] **Gallery Updates:** Create canvas → New canvas appears in gallery immediately (real-time)
- [ ] **Rename from Gallery - Inline:** Hover card → Click rename (pencil) → Type "Updated Name" → Press Enter → Name updates in <100ms
- [ ] **Rename from Canvas View:** Click canvas name in navbar → Type "New Name" → Press Enter → Navbar updates immediately
- [ ] **Rename Persistence:** Rename canvas → Refresh page → New name persists in gallery and navbar
- [ ] **Real-Time Name Sync (Gallery):** User A renames canvas → User B sees update in gallery in <100ms
- [ ] **Real-Time Name Sync (Canvas View):** User A renames canvas → User B sees navbar update in <100ms
- [ ] **Multi-Location Display:** Rename canvas → Name updates in gallery card, navbar, browser tab title
- [ ] **Toast Notifications:** Create canvas → Toast shows "Canvas created successfully!"
- [ ] **Toast Notifications:** Rename canvas → Toast shows "Canvas renamed to '[name]'"
- [ ] **Keyboard Shortcut - Create:** Press `Ctrl/Cmd + N` in gallery → New canvas created
- [ ] **Keyboard Shortcut - Rename:** Press Enter in rename input → Name saves

### Edge Cases (12 gates)

- [ ] **Empty Name:** Rename to empty string → Defaults to "Untitled Canvas" or validation error shows
- [ ] **Whitespace-Only Name:** Rename to "   " (spaces) → Trims to empty → Defaults or error
- [ ] **Very Long Name (>100 chars):** Type 101 characters → Validation error: "Canvas name too long (max 100 characters)"
- [ ] **Special Characters:** Rename to "Project 🎨 #1 [Draft]" → Accepts all characters, displays correctly
- [ ] **Unicode/Emoji Names:** Rename to "项目 🚀" → Saves and displays correctly
- [ ] **Duplicate Canvas Names:** Create two canvases named "Test" → Both allowed, warning shown (non-blocking)
- [ ] **Cancel Rename (Escape):** Start rename → Type new name → Press Escape → Reverts to old name
- [ ] **Cancel Rename (Click Outside):** Start rename → Click outside input → Saves or prompts confirmation
- [ ] **Rename Non-Existent Canvas:** Attempt rename of deleted canvas → Error: "Canvas not found"
- [ ] **Rename Without Permission:** Non-owner attempts rename → Error: "You don't have permission to rename this canvas"
- [ ] **Canvas Creation Failure:** Firestore write fails → Error toast, stay in gallery, no navigation
- [ ] **Rename Failure (Optimistic UI):** Rename with optimistic UI → Firestore fails → Reverts to old name, shows error toast

### Multi-User (6 gates)

- [ ] **Concurrent Creation:** Users A and B both create canvases → Both succeed, both appear in each other's galleries
- [ ] **Concurrent Rename:** User A renames canvas → User B also renames same canvas → Last write wins, both see final name
- [ ] **Owner-Only Rename:** Only canvas owner can rename → Collaborators see updated name but cannot rename
- [ ] **Gallery Real-Time Create:** User A creates canvas → User B's gallery updates immediately with new canvas
- [ ] **Gallery Real-Time Rename:** User A renames canvas → User B's gallery card updates in <100ms
- [ ] **Canvas View Real-Time Rename:** User A and B both viewing canvas → A renames → B's navbar updates in <100ms

### Performance (5 gates)

- [ ] **Canvas Creation Speed:** Firestore write completes in <500ms
- [ ] **End-to-End Creation:** Click "Create" → Land on new canvas in <2 seconds total
- [ ] **Rename Latency:** Rename action → UI updates in <50ms (optimistic), Firestore write in <100ms
- [ ] **Gallery Update Latency:** Canvas created/renamed → Gallery reflects change in <100ms
- [ ] **Keyboard Responsiveness:** Typing in rename input has no lag or dropped characters

### Security (4 gates)

- [ ] **Owner Permission:** Only canvas owner can rename canvas (enforced by Firestore rules)
- [ ] **Creation Authorization:** Only authenticated users can create canvases
- [ ] **Firestore Rules - Create:** User can create canvas with themselves as owner
- [ ] **Firestore Rules - Rename:** User can update canvas `name` field only if they are the owner

### Accessibility (3 gates)

- [ ] **Screen Reader - Create:** Button announces "Create new canvas"
- [ ] **Screen Reader - Rename:** Rename button announces "Rename canvas [current name]"
- [ ] **Keyboard Navigation:** Tab to create button → Enter creates → Tab to rename → F2 activates → Enter saves → Escape cancels

### Validation (4 gates)

- [ ] **Empty Name Validation:** Empty string defaults to "Untitled Canvas" or shows error
- [ ] **Max Length Validation:** 101 characters rejected with error message
- [ ] **Trim Whitespace:** "  Test  " becomes "Test"
- [ ] **Valid Name Acceptance:** "Valid Canvas Name 123 🎨" accepted without errors

**Total: 49 acceptance gates**

---

## 12. Definition of Done

- [ ] `createCanvas()` method implemented in `canvasListService.ts`
- [ ] `renameCanvas()` method implemented in `canvasListService.ts`
- [ ] `validateCanvasName()` helper function implemented
- [ ] "Create New Canvas" button added to gallery view
- [ ] Create canvas flow navigates user to new canvas
- [ ] Rename button added to canvas cards (gallery)
- [ ] Inline rename functionality works in gallery
- [ ] Canvas name clickable and editable in navbar (canvas view)
- [ ] Optimistic UI for rename implemented
- [ ] Real-time name sync works (<100ms)
- [ ] Canvas name displayed consistently (gallery, navbar, tab title)
- [ ] Toast notifications for create and rename
- [ ] Error handling for canvas creation failures
- [ ] Error handling for rename failures
- [ ] Validation for empty and too-long names
- [ ] All 49 acceptance gates pass
- [ ] No console errors during normal operation
- [ ] Keyboard shortcuts work (`Ctrl/Cmd + N`, `Enter`, `Escape`)
- [ ] Accessibility requirements met (screen reader, keyboard navigation)
- [ ] Firestore security rules enforce owner-only rename
- [ ] Unit tests for `createCanvas()`, `renameCanvas()`, `validateCanvasName()`
- [ ] Integration tests for create and rename flows
- [ ] Code reviewed and approved

---

## 13. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| **Canvas creation race condition** | Use Firestore auto-generated IDs (guaranteed unique). No collision possible. |
| **Concurrent rename conflicts** | Last write wins (Firestore default). Acceptable for canvas names (low impact). Consider optimistic locking if critical. |
| **Slow canvas creation** | Optimize Firestore write path. Use `setDoc()` instead of `addDoc()` for faster writes. Show loading state to manage expectations. |
| **Rename UI lag** | Implement optimistic UI updates. User sees change immediately, Firestore write happens in background. |
| **Empty or invalid names** | Strict validation on both client and server (Firestore rules). Default to "Untitled Canvas" if validation fails. |
| **User confusion with default names** | Use descriptive default: "Untitled Canvas" instead of "Canvas 123". Add timestamp if needed for uniqueness. |
| **Too many canvases created** | No limit for MVP. Future: Add quota limit (e.g., 100 canvases per user) with clear messaging. |
| **Canvas name conflicts** | Allow duplicate names (warning only). Users can organize via names, but IDs are unique. Future: Add auto-numbering ("Project", "Project (2)"). |
| **Rename permission confusion** | Only owner can rename (enforced by Firestore rules). Show clear error if collaborator attempts rename. Future: Allow collaborators to suggest renames. |
| **Navigation after creation fails** | Catch navigation errors, show error toast, stay in gallery. Ensure canvas creation succeeds before navigation. |

---

## 14. Open Questions & Decisions

**Q1:** Should canvas creation be instant (default name) or require user input (modal)?  
**Decision:** Instant creation with default name "Untitled Canvas". User can rename immediately after via navbar hint. Modal is optional enhancement (SHOULD-HAVE).

**Q2:** Should we allow duplicate canvas names?  
**Decision:** Yes, allow duplicates. Show non-blocking warning but don't prevent. Canvas IDs are unique, names are for user organization.

**Q3:** Should canvas names have auto-numbering (e.g., "Untitled Canvas 2")?  
**Decision:** No auto-numbering for MVP. Default name is always "Untitled Canvas". Users can manually add numbers if desired. Future enhancement: Auto-increment if duplicate.

**Q4:** Should collaborators be able to rename canvases?  
**Decision:** No. Only owner can rename. Firestore rules enforce this. Future: Allow collaborators to suggest renames via comment or permission system.

**Q5:** Should rename be inline (in-place edit) or modal?  
**Decision:** Inline edit for faster UX. Modal adds friction. Inline edit in gallery and navbar.

**Q6:** What happens if user clicks outside rename input while editing?  
**Decision:** Auto-save the new name (same as pressing Enter). No confirmation prompt for simplicity. ESC cancels without saving.

**Q7:** Should we show character count in rename input?  
**Decision:** SHOULD-HAVE feature. Show "X/100 characters" below input. Helps users stay within limit.

**Q8:** Should browser tab title show canvas name?  
**Decision:** Yes. Update `<title>` to "CollabCanvas - [Canvas Name]" for better browser tab organization.

**Q9:** Should we validate against profanity or inappropriate content?  
**Decision:** No validation for MVP. Trust users in private/collaborative environment. Future: Add optional content filter if needed.

**Q10:** Should default name include timestamp for uniqueness?  
**Decision:** No. Keep simple: "Untitled Canvas". Users can rename to add dates/numbers if needed. Timestamp feels too technical.

---

## 15. Rollout & Telemetry

**Feature Flag:** No

**Metrics to Track:**
- Number of canvases created per user (avg, median, max)
- Time from click to canvas creation (p50, p95, p99)
- Frequency of canvas renames (avg renames per canvas)
- Canvas name length distribution (avg, max)
- Canvas creation failures (error rate, error types)
- Rename failures (error rate, error types)
- Keyboard shortcut usage (`Ctrl/Cmd + N`, `F2`)
- Modal usage (if implemented) vs instant creation

**Manual Validation Steps Post-Deploy:**
1. Log in as User A
2. Click "Create New Canvas" → Verify canvas created with "Untitled Canvas" name
3. Navigate to new canvas → Verify empty canvas view
4. Click canvas name in navbar → Rename to "Test Project 1" → Verify update
5. Return to gallery → Verify "Test Project 1" appears in gallery
6. Create second canvas with `Ctrl/Cmd + N` → Verify keyboard shortcut works
7. Hover over "Test Project 1" card → Click rename (pencil) → Rename to "Test Project Updated"
8. Log in as User B in separate browser/tab
9. User A creates "Shared Canvas" → Verify User B's gallery updates in real-time
10. User A renames "Shared Canvas" to "Renamed Shared Canvas" → Verify User B sees update
11. User B attempts to rename "Renamed Shared Canvas" (non-owner) → Verify error: "You don't have permission"
12. User A navigates to "Test Project Updated" → User A renames to empty string → Verify defaults to "Untitled Canvas" or shows validation error
13. User A renames to 101-character string → Verify validation error
14. Check console for errors throughout all tests
15. Test screen reader announcements for create and rename actions

---

## 16. Out-of-Scope Backlog

Deferred to future PRs or enhancements:

- **Canvas templates:** Pre-built starter canvases with shapes/layouts
- **Canvas duplication:** "Duplicate Canvas" feature to clone existing canvas
- **Canvas descriptions:** Extended metadata field beyond just name
- **Canvas tags/categories:** Organizational taxonomy for filtering/grouping
- **Canvas archiving:** Archive old canvases without deleting
- **Canvas ownership transfer:** Reassign owner to another user
- **Canvas name suggestions:** AI-powered or automated naming based on content
- **Canvas name history:** Audit trail of all name changes
- **Auto-numbering duplicates:** "Project", "Project (2)", "Project (3)" pattern
- **Collaborative renaming:** Allow collaborators to rename or suggest renames
- **Canvas creation limits:** Quota system (e.g., max 100 canvases per user)
- **Bulk canvas creation:** Create multiple canvases at once
- **Canvas name profanity filter:** Content moderation for canvas names
- **Canvas name search optimization:** Indexed search for large canvas lists

---

## 17. Preflight Questionnaire

1. **What is the smallest end-to-end user outcome?**  
   User clicks "Create New Canvas" button, canvas is created with default name "Untitled Canvas", user navigates to new canvas and can start drawing.

2. **Who is the primary user and what is their critical action?**  
   Primary: Returning user. Critical action: Click "Create New Canvas" to start a new project.

3. **Must-have vs nice-to-have?**  
   Must: Create canvas with default name, rename canvas inline. Nice: Custom naming modal, character counter, duplicate warnings, keyboard shortcuts.

4. **Real-time collaboration requirements?**  
   Canvas name changes must sync to all users in <100ms (gallery and canvas view). Creation of new canvas updates galleries in real-time.

5. **Performance constraints?**  
   Canvas creation <500ms Firestore write, <2s total user experience. Rename UI updates <50ms (optimistic), <100ms real-time sync.

6. **Error/edge cases we must handle?**  
   Empty names, too-long names, creation failures, rename failures, permission errors, non-existent canvas, concurrent renames.

7. **Data model changes needed?**  
   No schema changes. Use existing `canvases` collection and `name` field. Add validation logic for names.

8. **Service APIs required?**  
   New methods: `createCanvas()`, `renameCanvas()`, `validateCanvasName()` in `canvasListService.ts`.

9. **UI entry points and states?**  
   Entry: Gallery "Create" button, canvas card rename button, navbar name click. States: Default, Loading, Editing, Error, Success.

10. **Accessibility/keyboard expectations:**  
    `Ctrl/Cmd + N` creates canvas, `F2` renames, `Enter` saves, `Escape` cancels. Screen reader announces actions.

11. **Security/permissions implications:**  
    Only owner can rename canvas (Firestore rules). Only authenticated users can create canvases. Canvas ID uniqueness guaranteed by Firestore.

12. **Dependencies or blocking integrations:**  
    Depends on PR #12 (Canvas Gallery & List View). Blocks PR #14 (Sharing - users need to create canvases to share).

13. **Rollout strategy and success metrics:**  
    No feature flag. Metrics: Creation count, rename frequency, error rates, performance latency. Manual validation with multi-user tests.

14. **What is explicitly out of scope for this iteration?**  
    Templates, duplication, descriptions, tags, archiving, ownership transfer, name suggestions, history, auto-numbering, collaborative renaming, quotas, bulk creation.

---

**END OF PRD**

