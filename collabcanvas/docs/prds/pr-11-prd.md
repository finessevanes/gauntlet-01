# PRD: Chat Persistence & History — End-to-End Delivery

**Feature**: Chat Persistence & History

**Version**: 1.0

**Status**: Ready for Development

**Agent**: Delilah (Planning Agent)

**Target Release**: Phase 2 - AI Chat (CRITICAL PRIORITY)

**Links**: 
- PR Brief: `collabcanvas/docs/pr-briefs.md` (PR #11)
- TODO: `collabcanvas/docs/todos/pr-11-todo.md` (to be created after PRD approval)
- Dependencies: PR #10 (Chat Functionality & AI Connection)

---

## 1. Summary

Implement persistent chat history storage in Firestore, allowing users to see their previous conversations with Clippy when returning to a canvas. Chat messages are saved automatically and loaded on canvas open, surviving page refreshes and providing continuity across sessions.

---

## 2. Problem & Goals

**Problem:** Currently, chat messages with Clippy exist only in local React state and disappear when the user refreshes the page or navigates away. Users lose their conversation history and have no record of past AI interactions or suggestions. This creates a poor user experience and limits the usefulness of the AI assistant.

**Why now?** PR #10 made AI chat functional, but without persistence, users can't reference past conversations or build on previous context. Persistence is essential before expanding AI features or rolling out to multiple users.

**Goals:**
- [ ] G1 — Chat messages persist across page refreshes and browser sessions
- [ ] G2 — Users see their full conversation history when returning to a canvas
- [ ] G3 — Messages are saved automatically without user action (seamless UX)
- [ ] G4 — Chat history is scoped per-user and per-canvas (each user has their own private conversation with Clippy for each canvas)

---

## 3. Non-Goals / Out of Scope

To maintain focus and avoid scope creep:

- [ ] **Not implementing cross-user chat sync** — Chat is intentionally private; User A's messages don't appear in User B's chat (only shape changes sync)
- [ ] **Not implementing conversation context** — AI doesn't remember past messages yet (each message is independent)
- [ ] **Not implementing message editing/deletion** — Messages are immutable once sent
- [ ] **Not implementing search/filtering** — Users can't search through old messages yet
- [ ] **Not implementing pagination/lazy loading** — All messages load at once (optimize later if needed)
- [ ] **Not implementing message reactions/threading** — Simple linear conversation only
- [ ] **Not implementing export/download** — Can't export chat history yet
- [ ] **Not implementing cleanup/archival** — Old messages stay forever (no auto-deletion)

---

## 4. Success Metrics

**User-visible:**
- Messages persist: User sends message, refreshes page → message still visible
- History loads quickly: Canvas opens → chat history appears within 500ms
- Seamless experience: User never sees loading spinners or broken state

**System:**
- Write latency: Messages saved to Firestore in <200ms
- Read latency: Chat history loaded from Firestore in <500ms
- Data consistency: 100% of messages saved successfully (no dropped messages)
- Error rate: <1% (excluding network failures)

**Quality:**
- All acceptance gates pass (defined in Section 11)
- 0 console errors during normal operation
- Firestore reads/writes are optimized (no unnecessary queries)

---

## 5. Users & Stories

### As a Canvas User:
- I want my **chat history to persist** so I can reference past AI suggestions after refreshing the page
- I want to **see previous messages when I return to a canvas** so I have context for what I've already asked Clippy
- I want **messages to save automatically** so I don't have to click "Save" or worry about losing my conversation
- I want **my chat to be private** so other collaborators don't see my personal AI conversations

### As a Collaborator:
- I want **my chat history separate from other users** so we each have our own private Clippy assistant
- I want **canvas changes to sync** (already working) while **chat stays private**

### As a Developer:
- I want **clear service methods** for saving and loading chat messages
- I want **Firestore queries to be efficient** to avoid performance issues with large chat histories
- I want **error handling** for offline mode and sync failures

---

## 6. Experience Specification (UX)

### Entry Points and Flows

**First Time Opening Canvas (No Chat History):**
1. User opens canvas → FloatingClippy loads
2. No messages in Firestore → Empty state with Clippy greeting displayed
3. User sends first message → Saves to Firestore + appears in UI
4. AI responds → Response saves to Firestore + appears in UI

**Returning to Canvas (Has Chat History):**
1. User opens canvas → FloatingClippy loads
2. Chat history loads from Firestore (query by canvasId + userId)
3. Messages appear in UI within 500ms
4. User sees full conversation history
5. User can continue conversation where they left off

**Sending New Messages (After History Loads):**
1. User types message → Sends
2. Message saves to Firestore in <200ms
3. Message appears in UI immediately (optimistic update)
4. AI responds → Response saves to Firestore
5. History remains intact across refreshes

### Visual Behavior

**Loading States:**
- **Initial load:** No loading spinner (empty state shows immediately)
- **History loading:** Messages fade in smoothly when loaded from Firestore
- **Saving messages:** No visible indicator (happens in background)
- **If slow network:** Show subtle "Loading messages..." text at bottom of chat panel

**Error States:**
- **Failed to load:** Show Clippy message: "⚠️ Couldn't load chat history. Starting fresh!"
- **Failed to save:** Show toast notification: "⚠️ Message not saved. Check your connection."
- **Offline:** Show banner: "🔌 Offline mode — messages won't save until you reconnect"

**Empty State:**
- Same as PR #9: Clippy greeting with "👋 Hi! I'm Clippy, your canvas assistant. Ask me anything!"
- No "No messages yet" text (greeting serves as empty state)

**Message Display:**
- All messages from Firestore displayed in chronological order
- Newest message at bottom (auto-scroll)
- User messages (white bubble, right-aligned)
- AI messages (yellow bubble, left-aligned with Clippy avatar)

### Performance

- **History load time:** <500ms for up to 100 messages
- **Save latency:** <200ms per message
- **UI responsiveness:** Chat panel remains interactive while loading
- **Scroll performance:** Smooth auto-scroll to bottom (60 FPS)

### Offline Mode & Edge Cases

**Offline Handling:**
1. User goes offline → Show offline banner
2. User sends message → Stays in UI but not saved to Firestore
3. User comes back online → Retry saving queued messages (future enhancement)
4. **For this PR:** Offline messages are lost (show warning)

**Race Conditions:**
- **User sends message during history load:** Queue message until history finishes loading
- **Multiple tabs open:** Each tab has independent local state (no real-time sync of chat across tabs)

**Data Consistency:**
- Messages saved with Firestore `serverTimestamp()` for accurate ordering
- If save fails, retry once automatically before showing error

---

## 7. Functional Requirements (Must/Should)

### MUST-HAVE Requirements

#### REQ-1: Firestore Collection Schema
- **MUST** create `chatMessages` collection in Firestore
- **MUST** store messages with structure:
  ```typescript
  {
    id: string,                    // Auto-generated by Firestore
    canvasId: string,              // Links message to specific canvas
    userId: string,                // User who sent/received message
    role: 'user' | 'assistant',    // Message sender
    content: string,               // Message text
    createdAt: Timestamp,          // Firestore serverTimestamp()
  }
  ```
- **Gate:** Firestore collection exists, documents can be created/read

#### REQ-2: Query Messages by Canvas + User
- **MUST** query messages filtered by: `canvasId === currentCanvas AND userId === currentUser`
- **MUST** order messages by `createdAt` ascending (oldest first)
- **MUST** limit to 100 most recent messages (performance safeguard)
- **Gate:** Query returns correct messages for current canvas and user only

#### REQ-3: Save User Messages
- **MUST** save user messages to Firestore immediately after sending
- **MUST** include: canvasId, userId, role: 'user', content, createdAt
- **MUST** use Firestore `serverTimestamp()` for `createdAt`
- **Gate:** User sends message → Document created in Firestore within 200ms

#### REQ-4: Save AI Responses
- **MUST** save AI responses to Firestore after receiving from AIService
- **MUST** include: canvasId, userId, role: 'assistant', content, createdAt
- **MUST** save both success and error messages from AI
- **Gate:** AI responds → Document created in Firestore within 200ms

#### REQ-5: Load Chat History on Canvas Open
- **MUST** query Firestore for chat history when canvas component mounts
- **MUST** populate messages array in component state
- **MUST** display messages in chronological order
- **MUST** auto-scroll to bottom after loading
- **Gate:** User opens canvas → Chat history appears within 500ms

#### REQ-6: ChatService Module
- **MUST** create `src/services/chatService.ts` with methods:
  - `saveMessage(message: ChatMessageInput): Promise<string>` — Save single message
  - `loadChatHistory(canvasId: string, userId: string): Promise<ChatMessage[]>` — Load messages
  - `subscribeToChatHistory(canvasId: string, userId: string, callback): Unsubscribe` — Real-time listener (optional for this PR)
- **MUST** abstract all Firestore operations
- **Gate:** Service methods work independently (unit testable)

#### REQ-7: Integration with FloatingClippy
- **MUST** modify parent component (AppShell.tsx) to:
  - Call `loadChatHistory()` on mount
  - Call `saveMessage()` when user sends message
  - Call `saveMessage()` when AI responds
- **MUST** maintain existing UI behavior (no breaking changes)
- **Gate:** Existing chat UI works exactly as before, but messages persist

#### REQ-8: Error Handling - Save Failures
- **MUST** catch Firestore write errors
- **MUST** log errors to console: `console.error('Failed to save message:', error)`
- **MUST** show toast notification: "⚠️ Message not saved. Check your connection."
- **MUST** keep message visible in UI even if save fails
- **Gate:** Network error → Toast appears, message stays in UI

#### REQ-9: Error Handling - Load Failures
- **MUST** catch Firestore read errors
- **MUST** log errors to console: `console.error('Failed to load chat history:', error)`
- **MUST** show Clippy message: "⚠️ Couldn't load chat history. Starting fresh!"
- **MUST** allow user to continue chatting (start with empty messages array)
- **Gate:** Network error → Error message appears, user can send new messages

#### REQ-10: Prevent Duplicate Messages
- **MUST** avoid saving the same message multiple times
- **MUST** use Firestore auto-generated IDs (don't generate IDs client-side)
- **MUST** implement idempotency check if needed (check if message already exists)
- **Gate:** User sends message → Only one document created in Firestore

### SHOULD-HAVE Requirements

#### REQ-11: Real-Time Updates (Optional for this PR)
- **SHOULD** use Firestore `onSnapshot()` listener for real-time updates
- **SHOULD** allow new messages to appear automatically without refresh
- **Gate:** User sends message in Tab A → Message appears in Tab B (same user, same canvas)

#### REQ-12: Optimistic UI Updates
- **SHOULD** add message to UI immediately before Firestore save completes
- **SHOULD** show subtle loading indicator on message until save confirms
- **Gate:** User sends message → Appears instantly, confirmed after 200ms

#### REQ-13: Message Retry Logic
- **SHOULD** retry failed saves once automatically
- **SHOULD** queue messages if user is offline (save when back online)
- **Gate:** Offline → Message queued → Online → Message saves

---

## 8. Data Model

### Firestore Schema

**Collection:** `chatMessages`

**Path:** `/chatMessages/{messageId}`

**Document Structure:**
```typescript
interface ChatMessageDocument {
  id: string;                     // Auto-generated by Firestore
  canvasId: string;               // Foreign key to canvases collection
  userId: string;                 // Foreign key to users (auth UID)
  role: 'user' | 'assistant';     // Message sender type
  content: string;                // Message text (max 10,000 chars)
  createdAt: Timestamp;           // Firestore serverTimestamp()
}
```

**Indexes Required:**
- Composite index: `canvasId ASC, userId ASC, createdAt ASC`
- Reason: Query by canvas + user, sort by time

**Firestore Rules:**
```javascript
match /chatMessages/{messageId} {
  // Users can only read their own messages
  allow read: if request.auth != null 
    && resource.data.userId == request.auth.uid;
  
  // Users can only create messages for themselves
  allow create: if request.auth != null 
    && request.resource.data.userId == request.auth.uid
    && request.resource.data.canvasId is string
    && request.resource.data.role in ['user', 'assistant']
    && request.resource.data.content is string;
  
  // No updates or deletes (messages are immutable)
  allow update, delete: if false;
}
```

**Query Example:**
```typescript
const messagesRef = collection(db, 'chatMessages');
const q = query(
  messagesRef,
  where('canvasId', '==', currentCanvasId),
  where('userId', '==', currentUserId),
  orderBy('createdAt', 'asc'),
  limit(100)
);
```

### TypeScript Interfaces (Update `types.ts`)

**Add to `src/components/Chat/types.ts`:**
```typescript
// Input for saving messages (before Firestore)
export interface ChatMessageInput {
  canvasId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
}

// Existing ChatMessage interface (no changes)
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Internal Firestore document type (for service layer)
interface ChatMessageDocument {
  id: string;
  canvasId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Timestamp;
}
```

---

## 9. API / Service Contracts

### ChatService Module

**File:** `src/services/chatService.ts`

**Methods:**

#### 1. saveMessage
```typescript
/**
 * Saves a chat message to Firestore
 * @param message - Message data (canvasId, userId, role, content)
 * @returns Promise<string> - Document ID of saved message
 * @throws Error if save fails
 */
async saveMessage(message: ChatMessageInput): Promise<string>
```

**Pre-conditions:**
- User must be authenticated
- canvasId must be valid
- content must be non-empty (max 10,000 chars)

**Post-conditions:**
- Document created in `/chatMessages/{messageId}`
- Returns Firestore auto-generated ID
- Throws error if validation fails or network error

**Error cases:**
- `Error: User not authenticated`
- `Error: Canvas ID required`
- `Error: Message content required`
- `FirebaseError: Permission denied` (if rules fail)

---

#### 2. loadChatHistory
```typescript
/**
 * Loads chat history for a specific canvas and user
 * @param canvasId - Canvas ID to load messages for
 * @param userId - User ID to load messages for
 * @returns Promise<ChatMessage[]> - Array of messages (oldest first)
 * @throws Error if query fails
 */
async loadChatHistory(
  canvasId: string, 
  userId: string
): Promise<ChatMessage[]>
```

**Pre-conditions:**
- User must be authenticated
- canvasId and userId must be valid

**Post-conditions:**
- Returns array of messages sorted by createdAt ascending
- Converts Firestore Timestamps to JavaScript Dates
- Returns empty array `[]` if no messages found
- Throws error if query fails

**Error cases:**
- `Error: Canvas ID and User ID required`
- `FirebaseError: Permission denied`
- `FirebaseError: Network error`

---

#### 3. subscribeToChatHistory (Optional)
```typescript
/**
 * Subscribes to real-time chat history updates
 * @param canvasId - Canvas ID to subscribe to
 * @param userId - User ID to subscribe for
 * @param callback - Function called when messages change
 * @returns Unsubscribe function
 */
subscribeToChatHistory(
  canvasId: string,
  userId: string,
  callback: (messages: ChatMessage[]) => void
): () => void
```

**Pre-conditions:**
- User must be authenticated
- canvasId and userId must be valid

**Post-conditions:**
- Callback invoked immediately with current messages
- Callback invoked whenever messages change in Firestore
- Returns unsubscribe function to clean up listener

---

### Integration with AIService (No Changes)

AIService remains unchanged. Parent component calls:
1. `AIService.executeCommand()` — Get AI response
2. `ChatService.saveMessage()` — Save AI response to Firestore

---

## 10. UI Components to Create/Modify

### New Files to Create

1. **`src/services/chatService.ts`** — Chat persistence service
   - `saveMessage()` method
   - `loadChatHistory()` method
   - `subscribeToChatHistory()` method (optional)
   - Error handling and validation

### Files to Modify

2. **`src/components/Layout/AppShell.tsx`** — Integrate chat persistence
   - Import `chatService`
   - Call `loadChatHistory()` on mount (when canvas loads)
   - Call `saveMessage()` after user sends message
   - Call `saveMessage()` after AI responds
   - Handle loading states and errors

3. **`src/components/Chat/FloatingClippy.tsx`** — (Minor changes)
   - Accept `messages` prop with loaded history
   - No internal changes needed (already displays messages correctly)

4. **`firestore.rules`** — Add security rules for chatMessages collection
   - Read: User can only read their own messages
   - Create: User can only create messages for themselves
   - Update/Delete: Disabled (immutable messages)

5. **`src/components/Chat/types.ts`** — Add `ChatMessageInput` interface

---

## 11. Test Plan & Acceptance Gates

### Happy Path (10 gates)

- [ ] **Gate 1.1:** User opens canvas with no chat history → Empty state appears, no Firestore query errors
- [ ] **Gate 1.2:** User sends first message → Message saves to Firestore within 200ms
- [ ] **Gate 1.3:** User sends message → AI responds → Both messages save to Firestore
- [ ] **Gate 1.4:** User refreshes page → Chat history loads within 500ms, messages appear in correct order
- [ ] **Gate 1.5:** User sends 10 messages → All 10 messages persist after refresh
- [ ] **Gate 1.6:** User returns to canvas after 24 hours → Full chat history still visible
- [ ] **Gate 1.7:** User switches to different canvas → Sees different chat history (canvas-specific)
- [ ] **Gate 1.8:** User A sends message → User B doesn't see it (private per user)
- [ ] **Gate 1.9:** Messages appear in chronological order (oldest → newest)
- [ ] **Gate 1.10:** Chat auto-scrolls to bottom after loading history

### Edge Cases (8 gates)

- [ ] **Gate 2.1:** User opens canvas with 100+ messages → Only 100 most recent messages load
- [ ] **Gate 2.2:** User sends very long message (5000 chars) → Message saves successfully
- [ ] **Gate 2.3:** User sends message immediately after canvas loads (during history load) → Message queues until history finishes loading
- [ ] **Gate 2.4:** User sends messages rapidly (5 in 2 seconds) → All messages save without duplicates
- [ ] **Gate 2.5:** User has chat history from multiple canvases → Each canvas shows correct history
- [ ] **Gate 2.6:** New user (first time) → No errors, empty state works correctly
- [ ] **Gate 2.7:** User with no canvasId (edge case) → Error handled gracefully
- [ ] **Gate 2.8:** Firestore returns empty array → UI shows empty state, no errors

### Error Handling (6 gates)

- [ ] **Gate 3.1:** Network error during history load → Error message appears, user can still send messages
- [ ] **Gate 3.2:** Network error during message save → Toast notification appears, message stays in UI
- [ ] **Gate 3.3:** Firestore permission denied → User sees error, no infinite loops or crashes
- [ ] **Gate 3.4:** User goes offline → Warning banner appears (future enhancement)
- [ ] **Gate 3.5:** Firestore query timeout → Error handled, user can retry
- [ ] **Gate 3.6:** After any error, user can send new messages (recovery works)

### Data Integrity (5 gates)

- [ ] **Gate 4.1:** Saved messages have correct structure (canvasId, userId, role, content, createdAt)
- [ ] **Gate 4.2:** User messages saved with `role: 'user'`, AI messages with `role: 'assistant'`
- [ ] **Gate 4.3:** Timestamps use Firestore `serverTimestamp()` (not client Date.now())
- [ ] **Gate 4.4:** No duplicate messages in Firestore (each send = 1 document)
- [ ] **Gate 4.5:** Messages cannot be modified or deleted (Firestore rules enforced)

### Multi-Canvas & Multi-User (4 gates)

- [ ] **Gate 5.1:** User A and User B on same canvas → Each sees their own private chat history
- [ ] **Gate 5.2:** User A on Canvas 1 and Canvas 2 → Each canvas has separate chat history
- [ ] **Gate 5.3:** User A sends message on Canvas 1 → Message does NOT appear in Canvas 2 chat
- [ ] **Gate 5.4:** Query filters correctly: `canvasId == X AND userId == Y`

### Performance (3 gates)

- [ ] **Gate 6.1:** History loads in <500ms for 50 messages
- [ ] **Gate 6.2:** Message saves in <200ms (measured in Network tab)
- [ ] **Gate 6.3:** No unnecessary Firestore reads (only one query on mount)

**Total: 36 acceptance gates**

---

## 12. Definition of Done

- [ ] `chatService.ts` created with `saveMessage()` and `loadChatHistory()` methods
- [ ] Firestore collection `chatMessages` created with correct schema
- [ ] Firestore security rules updated for `chatMessages` collection
- [ ] Composite index created: `canvasId ASC, userId ASC, createdAt ASC`
- [ ] `AppShell.tsx` modified to integrate chat persistence
- [ ] `ChatMessageInput` interface added to `types.ts`
- [ ] User messages save to Firestore automatically
- [ ] AI responses save to Firestore automatically
- [ ] Chat history loads on canvas open
- [ ] Messages display in chronological order
- [ ] All 36 acceptance gates pass
- [ ] Error handling works for save/load failures
- [ ] Chat is scoped per-user and per-canvas (private)
- [ ] Messages persist across page refreshes
- [ ] 0 console errors during normal operation
- [ ] No duplicate messages in Firestore
- [ ] Performance targets met (<500ms load, <200ms save)
- [ ] Unit tests written for `chatService.ts`
- [ ] Integration test written for chat persistence flow
- [ ] Code reviewed and approved

---

## 13. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| **Firestore costs** (reads/writes scale with usage) | Limit queries to 100 messages; optimize with real-time listeners (onSnapshot) instead of repeated queries; monitor Firebase usage dashboard |
| **Query performance** (100+ messages) | Add composite index; limit to 100 most recent messages; implement pagination later if needed |
| **Race condition** (save during history load) | Queue messages in local state until history finishes loading; then save queued messages |
| **Duplicate messages** (user clicks Send multiple times) | Disable Send button while saving; use Firestore transaction if needed |
| **Offline mode** (messages lost if offline) | Show offline banner; implement retry queue later; for this PR, just warn user |
| **User switches canvas mid-save** | Cancel in-flight saves when unmounting; or let them complete (harmless) |
| **Large message content** (10,000+ chars) | Validate max length client-side (500 chars in UI, enforce 10k in service); Firestore has 1MB document limit |
| **Security rules bypass** | Test rules thoroughly; ensure `userId` and `canvasId` validation server-side |

---

## 14. Open Questions & Decisions

**Q1:** Should chat history sync in real-time across multiple tabs?  
**Decision:** **Optional for this PR.** Use `loadChatHistory()` initially (one-time fetch). Can add `subscribeToChatHistory()` later if needed. Most users have one tab open.

**Q2:** How many messages to load initially?  
**Decision:** **100 most recent messages.** Prevents performance issues. Add pagination later if users request it.

**Q3:** Should messages be editable or deletable?  
**Decision:** **No.** Messages are immutable for this PR. Editing/deletion is future work.

**Q4:** What if user sends a message while history is loading?  
**Decision:** **Queue the message** in local state, wait for history to finish loading, then save to Firestore. Prevents race conditions.

**Q5:** Should we show a loading spinner while loading history?  
**Decision:** **No visible spinner.** Show empty state immediately, then fade in messages when loaded. Feels faster.

**Q6:** How to handle canvasId? Where does it come from?  
**Decision:** **Get from URL parameter or context.** Assume `canvasId` is available from routing or CanvasContext. For now, use `'main'` as default (single canvas). Multi-canvas support in PR #12.

**Q7:** Should AI have access to conversation history (context)?  
**Decision:** **Not in this PR.** AI still treats each message independently. Conversation context is future work (PR #17+).

---

## 15. Out-of-Scope Backlog

Items explicitly deferred for future PRs:

- [ ] **Real-time sync across tabs** — Use Firestore listeners (`onSnapshot`)
- [ ] **Pagination/lazy loading** — Load older messages on scroll
- [ ] **Conversation context** — AI remembers past messages
- [ ] **Message editing/deletion** — Users can modify or remove messages
- [ ] **Search/filtering** — Search through chat history
- [ ] **Export chat history** — Download as JSON/CSV
- [ ] **Message reactions** — Emoji reactions to messages
- [ ] **Offline queue** — Save messages when offline, sync when back online
- [ ] **Cleanup/archival** — Auto-delete messages older than X days
- [ ] **Multi-canvas support** — Proper canvasId routing (PR #12)
- [ ] **Rich text formatting** — Markdown, code blocks, etc.
- [ ] **Message threading** — Reply to specific messages

---

## 16. Preflight Questionnaire (Completed)

1. **What is the smallest end-to-end user outcome we must deliver in this PR?**
   → User sends message, refreshes page, message still visible.

2. **Who is the primary user and what is their critical action?**
   → Canvas users; critical action is seeing their chat history persist across sessions.

3. **Must-have vs nice-to-have: what gets cut first if time tight?**
   → Must-have: Save messages, load on mount, display history. Nice-to-have: Real-time sync, retry logic, optimistic UI.

4. **Real-time collaboration requirements (peers, <100ms sync)?**
   → None. Chat is private per user (no cross-user sync).

5. **Performance constraints (FPS, shape count, latency targets)?**
   → <500ms to load history, <200ms to save messages.

6. **Error/edge cases we must handle (validation, conflicts, offline)?**
   → Network errors (load/save failures), offline mode warning, rapid sends, missing canvasId.

7. **Data model changes needed (new fields/collections)?**
   → New Firestore collection: `chatMessages` with schema: canvasId, userId, role, content, createdAt.

8. **Service APIs required (create/update/delete/subscribe)?**
   → `saveMessage()`, `loadChatHistory()`, optional `subscribeToChatHistory()`.

9. **UI entry points and states (empty, loading, locked, error)?**
   → Entry: Canvas mount. States: empty, loading history, history loaded, save error, load error.

10. **Accessibility/keyboard expectations?**
    → No changes (chat UI already accessible from PR #9 and PR #10).

11. **Security/permissions implications?**
    → Firestore rules: Users can only read/write their own messages (scoped by userId).

12. **Dependencies or blocking integrations?**
    → Depends on PR #10 (chat functionality). Needs Firestore setup (already exists from Phase 1).

13. **Rollout strategy (flag, migration) and success metrics?**
    → Direct rollout (no flag). Success: Messages persist after refresh, no errors in console.

14. **What is explicitly out of scope for this iteration?**
    → Real-time sync across tabs, message editing/deletion, pagination, conversation context, export, search.

---

## 17. Authoring Notes

- **Keep it simple:** This is a "Simple" complexity PR (per PR brief). Don't over-engineer.
- **Focus on persistence:** The core value is "messages survive refresh" — deliver that first.
- **Reuse existing patterns:** Follow `canvasService.ts` structure for `chatService.ts`.
- **Test thoroughly:** Edge cases like rapid sends, offline mode, and race conditions are critical.
- **Performance matters:** Firestore reads cost money. Optimize queries, limit results, avoid unnecessary fetches.
- **Privacy first:** Ensure Firestore rules prevent users from seeing each other's chat.

---

**END OF PRD**

