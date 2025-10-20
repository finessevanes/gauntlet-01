# PR-11 TODO — Chat Persistence & History

**Branch**: `feature/pr-11-chat-persistence`  
**Source PRD**: `collabcanvas/docs/prds/pr-11-prd.md`  
**Owner (Agent)**: Delilah (Planning Agent)  
**Complexity**: Simple  
**Estimated Time**: 1-2 hours

---

## 0. Clarifying Questions & Assumptions

### Questions:
- Q: Where does `canvasId` come from in the current implementation?
- Q: Is Firestore already initialized and configured in the project?
- Q: Should we use a single "main" canvas or support multiple canvas IDs?

### Assumptions (unblock coding now; confirm in PR):
- Assumption 1: For now, use `'main'` as default canvasId (single canvas) until PR #12 implements multi-canvas support
- Assumption 2: Firestore is already configured in `src/firebase.ts` from Phase 1
- Assumption 3: User authentication is working (userId available from AuthContext)
- Assumption 4: Chat messages are private per user (no cross-user sync)

---

## 1. Repo Prep

- [ ] Create branch `feature/pr-11-chat-persistence`
  - Command: `git checkout -b feature/pr-11-chat-persistence`
  - Test Gate: Branch created successfully

- [ ] Confirm Firestore emulator running
  - Command: `npm run emulators` (if not already running)
  - Test Gate: Firestore emulator accessible at localhost:8080

- [ ] Read PRD thoroughly
  - File: `collabcanvas/docs/prds/pr-11-prd.md`
  - Test Gate: Understand all 10 MUST-HAVE requirements

---

## 2. Data Model & Firestore Setup

### 2.1 Define TypeScript Interfaces

- [ ] Add `ChatMessageInput` interface to `src/components/Chat/types.ts`
  - Add interface:
    ```typescript
    export interface ChatMessageInput {
      canvasId: string;
      userId: string;
      role: 'user' | 'assistant';
      content: string;
    }
    ```
  - Test Gate: TypeScript compiles without errors

- [ ] Add internal `ChatMessageDocument` interface (in chatService.ts)
  - Add interface matching Firestore schema:
    ```typescript
    interface ChatMessageDocument {
      id: string;
      canvasId: string;
      userId: string;
      role: 'user' | 'assistant';
      content: string;
      createdAt: Timestamp;
    }
    ```
  - Test Gate: Interface matches PRD Section 8

### 2.2 Update Firestore Security Rules

- [ ] Add security rules for `chatMessages` collection
  - File: `firestore.rules`
  - Add rules block:
    ```javascript
    match /chatMessages/{messageId} {
      allow read: if request.auth != null 
        && resource.data.userId == request.auth.uid;
      
      allow create: if request.auth != null 
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.canvasId is string
        && request.resource.data.role in ['user', 'assistant']
        && request.resource.data.content is string;
      
      allow update, delete: if false;
    }
    ```
  - Test Gate: Rules file has no syntax errors

- [ ] Test security rules in Firestore emulator
  - Open Firestore Emulator UI at http://localhost:4000
  - Manually create a test message document
  - Test Gate: Rules allow authenticated user to read their own messages

### 2.3 Create Firestore Composite Index

- [ ] Add composite index to `firestore.indexes.json`
  - File: `firestore.indexes.json` (create if doesn't exist)
  - Add index:
    ```json
    {
      "indexes": [
        {
          "collectionGroup": "chatMessages",
          "queryScope": "COLLECTION",
          "fields": [
            { "fieldPath": "canvasId", "order": "ASCENDING" },
            { "fieldPath": "userId", "order": "ASCENDING" },
            { "fieldPath": "createdAt", "order": "ASCENDING" }
          ]
        }
      ]
    }
    ```
  - Test Gate: Index file is valid JSON

---

## 3. Service Layer (deterministic contracts)

### 3.1 Create ChatService Module

- [ ] Create `src/services/chatService.ts`
  - Create new file
  - Import Firestore dependencies:
    ```typescript
    import { 
      collection, 
      addDoc, 
      query, 
      where, 
      orderBy, 
      limit, 
      getDocs,
      serverTimestamp,
      Timestamp 
    } from 'firebase/firestore';
    import { db } from '../firebase';
    import type { ChatMessage, ChatMessageInput } from '../components/Chat/types';
    ```
  - Test Gate: File created, imports resolve

### 3.2 Implement saveMessage Method

- [ ] Add `saveMessage()` method to chatService
  - Method signature:
    ```typescript
    export async function saveMessage(message: ChatMessageInput): Promise<string>
    ```
  - Implementation steps:
    1. Validate input (non-empty content, valid canvasId, userId)
    2. Create Firestore document with `serverTimestamp()`
    3. Use `addDoc()` to save to `chatMessages` collection
    4. Return document ID
    5. Add error handling with try/catch
  - Test Gate: Method compiles without errors

- [ ] Add input validation to `saveMessage()`
  - Check: `userId` is not empty
  - Check: `canvasId` is not empty
  - Check: `content` is not empty (after trim)
  - Check: `content` length <= 10,000 chars
  - Check: `role` is 'user' or 'assistant'
  - Throw descriptive errors for validation failures
  - Test Gate: Validation throws correct errors

- [ ] Add error handling to `saveMessage()`
  - Wrap Firestore call in try/catch
  - Log errors: `console.error('Failed to save message:', error)`
  - Re-throw error for parent to handle
  - Test Gate: Errors logged and propagated correctly

### 3.3 Implement loadChatHistory Method

- [ ] Add `loadChatHistory()` method to chatService
  - Method signature:
    ```typescript
    export async function loadChatHistory(
      canvasId: string, 
      userId: string
    ): Promise<ChatMessage[]>
    ```
  - Implementation steps:
    1. Validate canvasId and userId are not empty
    2. Build Firestore query with where + orderBy + limit
    3. Execute query with `getDocs()`
    4. Map Firestore documents to ChatMessage interface
    5. Convert Firestore Timestamps to JavaScript Dates
    6. Return array of messages
  - Test Gate: Method compiles without errors

- [ ] Build Firestore query in `loadChatHistory()`
  - Create query:
    ```typescript
    const messagesRef = collection(db, 'chatMessages');
    const q = query(
      messagesRef,
      where('canvasId', '==', canvasId),
      where('userId', '==', userId),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
    ```
  - Test Gate: Query structure matches PRD requirements

- [ ] Map Firestore documents to ChatMessage interface
  - Convert document data:
    ```typescript
    const messages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      role: doc.data().role,
      content: doc.data().content,
      timestamp: doc.data().createdAt?.toDate() || new Date()
    }));
    ```
  - Handle missing timestamps gracefully (fallback to `new Date()`)
  - Test Gate: Mapping returns correct ChatMessage structure

- [ ] Add error handling to `loadChatHistory()`
  - Wrap query in try/catch
  - Log errors: `console.error('Failed to load chat history:', error)`
  - Return empty array `[]` on error (don't crash)
  - Test Gate: Errors logged, empty array returned on failure

### 3.4 Optional: Implement subscribeToChatHistory Method

- [ ] (OPTIONAL) Add `subscribeToChatHistory()` method
  - Method signature:
    ```typescript
    export function subscribeToChatHistory(
      canvasId: string,
      userId: string,
      callback: (messages: ChatMessage[]) => void
    ): () => void
    ```
  - Use `onSnapshot()` instead of `getDocs()`
  - Return unsubscribe function
  - Test Gate: Real-time updates work across tabs (optional)

---

## 4. Integration with AppShell

### 4.1 Import ChatService

- [ ] Import chatService in `src/components/Layout/AppShell.tsx`
  - Add import:
    ```typescript
    import { saveMessage, loadChatHistory } from '../../services/chatService';
    ```
  - Import `ChatMessageInput` type if needed
  - Test Gate: Imports resolve correctly

### 4.2 Load Chat History on Mount

- [ ] Add `useEffect` to load chat history when component mounts
  - Add state for loading: `const [isChatLoading, setIsChatLoading] = useState(false);`
  - Add useEffect:
    ```typescript
    useEffect(() => {
      if (user?.uid) {
        loadHistory();
      }
    }, [user?.uid]);
    ```
  - Test Gate: useEffect triggers on mount

- [ ] Implement `loadHistory()` helper function
  - Function:
    ```typescript
    const loadHistory = async () => {
      setIsChatLoading(true);
      try {
        const canvasId = 'main'; // TODO: Get from routing in PR #12
        const history = await loadChatHistory(canvasId, user!.uid);
        setClippyMessages(history);
      } catch (error) {
        console.error('Failed to load chat history:', error);
        // Show error message in chat (optional)
      } finally {
        setIsChatLoading(false);
      }
    };
    ```
  - Test Gate: Function loads messages and updates state

### 4.3 Save User Messages

- [ ] Modify `handleSendMessage` to save user messages
  - Find existing `handleSendMessage` function in AppShell
  - Add save call after adding message to local state:
    ```typescript
    const handleSendMessage = async (content: string) => {
      // Existing: Create user message object
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: content,
        timestamp: new Date()
      };
      
      // Existing: Add to local state
      setClippyMessages(prev => [...prev, userMessage]);
      
      // NEW: Save to Firestore
      try {
        await saveMessage({
          canvasId: 'main',
          userId: user!.uid,
          role: 'user',
          content: content
        });
      } catch (error) {
        console.error('Failed to save user message:', error);
        // Show toast notification (optional)
      }
      
      // Existing: Call AI service...
    };
    ```
  - Test Gate: User message saves to Firestore after sending

### 4.4 Save AI Responses

- [ ] Save AI responses after receiving from AIService
  - After `AIService.executeCommand()` returns, save AI response:
    ```typescript
    // Existing: Create AI message object
    const aiMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: result.message,
      timestamp: new Date()
    };
    
    // Existing: Add to local state
    setClippyMessages(prev => [...prev, aiMessage]);
    
    // NEW: Save to Firestore
    try {
      await saveMessage({
        canvasId: 'main',
        userId: user!.uid,
        role: 'assistant',
        content: result.message
      });
    } catch (error) {
      console.error('Failed to save AI response:', error);
    }
    ```
  - Test Gate: AI response saves to Firestore after displaying

### 4.5 Handle Loading States

- [ ] Pass loading state to FloatingClippy
  - Update FloatingClippy props to include loading state (already exists)
  - Ensure `isLoading` reflects both AI processing AND history loading
  - Test Gate: Loading indicator shows during history load (optional)

- [ ] Handle error states in UI
  - If `loadChatHistory()` fails, show error message in chat
  - Option 1: Add error message to messages array (Clippy says error)
  - Option 2: Show toast notification with error
  - Test Gate: User sees friendly error message on load failure

---

## 5. Testing

### 5.1 Manual Testing - Happy Path

- [ ] Test: User sends first message
  - Steps:
    1. Open canvas (no history)
    2. Send message to Clippy
    3. Check Firestore Emulator UI - message document exists
  - Test Gate: Message saved with correct structure (canvasId, userId, role, content, createdAt)

- [ ] Test: User refreshes page
  - Steps:
    1. Send 3 messages to Clippy
    2. Refresh page (hard refresh)
    3. Verify all 3 messages appear in chat
  - Test Gate: Chat history loads and displays correctly

- [ ] Test: AI response persists
  - Steps:
    1. Send message that triggers AI response
    2. Verify AI response appears in chat
    3. Refresh page
    4. Verify AI response still visible
  - Test Gate: Both user and AI messages persist

- [ ] Test: Messages in chronological order
  - Steps:
    1. Send 5 messages over 30 seconds
    2. Refresh page
    3. Verify messages appear in same order
  - Test Gate: Messages sorted by timestamp (oldest → newest)

### 5.2 Manual Testing - Edge Cases

- [ ] Test: New user (no history)
  - Steps:
    1. Create new user account
    2. Open canvas
    3. Verify empty state appears (no errors)
  - Test Gate: No console errors, empty state works

- [ ] Test: Multiple canvases (simulate)
  - Steps:
    1. Send messages with canvasId: 'canvas1'
    2. Send messages with canvasId: 'canvas2'
    3. Load history for 'canvas1'
    4. Verify only 'canvas1' messages appear
  - Test Gate: Messages filtered by canvasId correctly

- [ ] Test: Multiple users (simulate)
  - Steps:
    1. User A sends messages
    2. User B opens same canvas
    3. Verify User B doesn't see User A's messages
  - Test Gate: Chat is private per user (userId filter works)

- [ ] Test: Rapid message sending
  - Steps:
    1. Send 5 messages rapidly (1 second apart)
    2. Check Firestore - 5 documents created
    3. Refresh page - all 5 messages visible
  - Test Gate: No duplicate or lost messages

- [ ] Test: Very long message
  - Steps:
    1. Send message with 1000 characters
    2. Verify saves successfully
    3. Refresh - message still intact
  - Test Gate: Long messages save and load correctly

### 5.3 Manual Testing - Error Handling

- [ ] Test: Network error during load
  - Steps:
    1. Disable network (Chrome DevTools offline mode)
    2. Refresh page
    3. Verify error handling (no crash)
    4. Re-enable network
    5. Send message - verify recovery works
  - Test Gate: Error message shown, user can recover

- [ ] Test: Network error during save
  - Steps:
    1. Send message
    2. Disable network before save completes
    3. Verify message stays in UI (optimistic update)
    4. Verify error logged to console
    5. Re-enable network - next message saves successfully
  - Test Gate: Save errors handled gracefully

- [ ] Test: Invalid userId (simulate)
  - Steps:
    1. Temporarily set userId to empty string in code
    2. Try to send message
    3. Verify validation error thrown
  - Test Gate: Validation catches invalid inputs

### 5.4 Performance Testing

- [ ] Test: Load time with 50 messages
  - Steps:
    1. Manually create 50 messages in Firestore
    2. Measure load time (Chrome DevTools Network tab)
    3. Verify loads in <500ms
  - Test Gate: Performance target met (<500ms)

- [ ] Test: Save time measurement
  - Steps:
    1. Send message
    2. Measure time from click to Firestore write (Network tab)
    3. Verify saves in <200ms
  - Test Gate: Save latency target met (<200ms)

- [ ] Test: No unnecessary queries
  - Steps:
    1. Open canvas
    2. Check Network tab for Firestore requests
    3. Verify only ONE query on mount (no duplicates)
  - Test Gate: Efficient queries (no redundant fetches)

### 5.5 Unit Tests (Optional but Recommended)

- [ ] Write unit test for `saveMessage()`
  - File: `tests/unit/services/chatService.test.ts`
  - Test cases:
    - Valid message saves successfully
    - Empty content throws error
    - Empty userId throws error
    - Empty canvasId throws error
    - Content >10,000 chars throws error
  - Test Gate: All test cases pass

- [ ] Write unit test for `loadChatHistory()`
  - Test cases:
    - Returns array of messages
    - Returns empty array when no messages
    - Filters by canvasId correctly
    - Filters by userId correctly
    - Orders by createdAt ascending
    - Limits to 100 messages
  - Test Gate: All test cases pass

### 5.6 Integration Test

- [ ] Write integration test for full persistence flow
  - File: `tests/integration/chat-persistence.test.tsx`
  - Test flow:
    1. Render AppShell with authenticated user
    2. Send message via FloatingClippy
    3. Wait for Firestore save
    4. Unmount and remount component
    5. Verify message reappears
  - Test Gate: Integration test passes

---

## 6. Firestore Rules Testing

- [ ] Test rules: User can read own messages
  - Use Firestore Emulator Rules Playground
  - Simulate read as userId: 'user1' for message with userId: 'user1'
  - Test Gate: Read allowed

- [ ] Test rules: User cannot read other's messages
  - Simulate read as userId: 'user2' for message with userId: 'user1'
  - Test Gate: Read denied (permission error)

- [ ] Test rules: User can create messages for themselves
  - Simulate create with userId matching auth.uid
  - Test Gate: Create allowed

- [ ] Test rules: User cannot create messages for others
  - Simulate create with userId different from auth.uid
  - Test Gate: Create denied

- [ ] Test rules: Updates and deletes disabled
  - Simulate update/delete operations
  - Test Gate: Both denied (messages are immutable)

---

## 7. Documentation & Polish

- [ ] Add inline comments to chatService.ts
  - Comment on query structure
  - Comment on timestamp conversion
  - Comment on error handling strategy
  - Test Gate: Code is well-documented

- [ ] Update README (if needed)
  - Document Firestore collection schema
  - Document security rules
  - Document service methods
  - Test Gate: README updated (if applicable)

- [ ] Add console logs for debugging (development only)
  - Log when history loads: `console.log('Loaded X messages from Firestore')`
  - Log when messages save: `console.log('Saved message to Firestore:', messageId)`
  - Use conditional logging: `if (import.meta.env.DEV)`
  - Test Gate: Logs help with debugging

---

## 8. Final Verification

- [ ] Verify all 36 acceptance gates from PRD Section 11
  - Review PRD Test Plan
  - Check off each gate manually
  - Test Gate: All gates pass

- [ ] Verify Definition of Done from PRD Section 12
  - Review PRD Section 12 checklist
  - Confirm each item completed
  - Test Gate: All items checked

- [ ] Code review self-check
  - No console errors or warnings
  - No TypeScript errors
  - No linter errors
  - Clean code (no debug statements)
  - Test Gate: Code is clean and production-ready

- [ ] Test in production-like environment
  - Deploy to staging (if available)
  - Test with real Firebase (not emulator)
  - Verify Firestore rules work in production
  - Test Gate: Works in production environment

---

## 9. PR Preparation

- [ ] Write PR description
  - Use structure from PRD Section 12
  - Include:
    - Goal and scope (from PRD Section 1)
    - Files changed with rationale
    - Test steps (happy path, edge cases, performance)
    - Known limitations (if any)
    - Links: PRD, TODO
  - Test Gate: PR description is comprehensive

- [ ] Create PR on GitHub
  - Title: "PR #11: Chat Persistence & History"
  - Description: Copy from above
  - Reviewers: Assign team members
  - Labels: Add appropriate labels
  - Test Gate: PR created successfully

- [ ] Link PR to this TODO
  - Add PR link to top of this document
  - Test Gate: TODO updated with PR link

---

## Copyable Checklist (for PR description)

```markdown
## PR #11: Chat Persistence & History

### Summary
Implements persistent chat history storage in Firestore, allowing users to see previous conversations with Clippy when returning to a canvas.

### Changes
- ✅ Created `chatService.ts` with `saveMessage()` and `loadChatHistory()` methods
- ✅ Added Firestore collection `chatMessages` with security rules
- ✅ Integrated chat persistence in `AppShell.tsx`
- ✅ Added `ChatMessageInput` interface to `types.ts`
- ✅ Messages auto-save to Firestore on send
- ✅ Messages auto-load from Firestore on canvas open

### Test Steps
1. **Happy Path**: Send message → Refresh page → Message persists
2. **Multiple Messages**: Send 5 messages → Refresh → All 5 visible
3. **AI Responses**: Ask Clippy question → Response persists after refresh
4. **New User**: Create account → Open canvas → Empty state works
5. **Performance**: Load history <500ms, save messages <200ms

### Known Limitations
- Chat is private per user (not synced across collaborators)
- Limited to 100 most recent messages
- Offline messages not queued (future enhancement)

### Links
- PRD: `collabcanvas/docs/prds/pr-11-prd.md`
- TODO: `collabcanvas/docs/todos/pr-11-todo.md`

### Checklist
- [ ] ChatService implemented + tested
- [ ] Firestore rules deployed
- [ ] AppShell integration complete
- [ ] All 36 acceptance gates pass
- [ ] Manual testing completed
- [ ] Performance targets met
- [ ] No console errors
- [ ] Code reviewed
```

---

## Definition of Done

### Service Layer
- [ ] `chatService.ts` created with complete implementation
- [ ] `saveMessage()` method works correctly
- [ ] `loadChatHistory()` method works correctly
- [ ] Input validation implemented
- [ ] Error handling implemented
- [ ] Unit tests written (optional but recommended)

### Data Model
- [ ] Firestore collection `chatMessages` created
- [ ] Document schema matches PRD specification
- [ ] Security rules updated and tested
- [ ] Composite index created (if needed)

### Integration
- [ ] AppShell loads chat history on mount
- [ ] User messages save to Firestore automatically
- [ ] AI responses save to Firestore automatically
- [ ] Loading states handled correctly
- [ ] Error states handled gracefully

### Testing
- [ ] All happy path tests pass
- [ ] All edge case tests pass
- [ ] All error handling tests pass
- [ ] Performance targets met (<500ms load, <200ms save)
- [ ] Firestore rules tests pass
- [ ] No console errors or warnings

### Quality
- [ ] All 36 acceptance gates from PRD pass
- [ ] All Definition of Done items from PRD checked
- [ ] Code is clean, well-commented, documented
- [ ] TypeScript types are correct
- [ ] No linter errors

### Deployment
- [ ] Works in Firestore emulator
- [ ] Works in production Firebase (if deployed)
- [ ] Security rules deployed
- [ ] PR created and reviewed
- [ ] All tests pass in CI/CD (if applicable)

---

**Total Tasks: 78 checkboxes**

**Estimated Time: 1-2 hours** (Simple complexity as per PR brief)

**Critical Path:**
1. Setup (5 min) → 2. Data Model (10 min) → 3. Service Layer (30 min) → 4. Integration (20 min) → 5. Testing (30 min) → 6. PR (5 min)

**Blockers:** None (all dependencies from PR #10 are complete)

---

**END OF TODO**

