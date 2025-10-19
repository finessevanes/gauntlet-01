# PRD: Chat Functionality & AI Connection — End-to-End Delivery

**Feature**: Chat Functionality & AI Connection

**Version**: 1.0

**Status**: Ready for Development

**Agent**: Delilah (Planning Agent)

**Target Release**: Phase 2 - AI Chat (CRITICAL PRIORITY)

**Links**: 
- PR Brief: `collabcanvas/docs/pr-briefs.md` (PR #10)
- TODO: `collabcanvas/docs/todos/pr-10-todo.md` (to be created after PRD approval)
- Dependencies: PR #8 (AI Backend Integration), PR #9 (Clippy-Style Chat UI Component)

---

## 1. Summary

Connect the existing Clippy-style chat UI (PR #9) to the functional AI backend (`testAI()` function from PR #8), enabling users to send messages to the AI assistant and receive responses with typing indicators, loading states, and error handling.

---

## 2. Problem & Goals

**Problem:** The chat UI exists and the AI backend works, but they're not connected. Users cannot interact with the AI assistant through the UI—the input field is disabled with a "Coming soon" message.

**Why now?** This is the critical integration that makes AI chat functional—the core differentiating feature of CollabCanvas.

**Goals:**
- [ ] G1 — Users can type messages and send them to the AI assistant
- [ ] G2 — AI responses appear in the chat UI within 5 seconds
- [ ] G3 — Loading states provide clear feedback during AI processing
- [ ] G4 — Error cases are handled gracefully with helpful Clippy messages

---

## 3. Non-Goals / Out of Scope

- [ ] **Not implementing chat persistence** — No Firestore storage for chat history yet (PR #11)
- [ ] **Not implementing conversation context** — Each message is independent (no multi-turn memory)
- [ ] **Not implementing streaming responses** — AI responses arrive all at once
- [ ] **Not implementing advanced features** — No message editing, deletion, reactions, or threading
- [ ] **Not implementing rate limiting** — Beyond what OpenAI API provides

**Important Design Decision:**
- [ ] **Chat is intentionally private per user** — Each user has their own conversation with Clippy. User A's messages do NOT appear in User B's chat. When AI creates/modifies shapes, those shapes sync across all users (via PR #3), but the conversation itself remains private.

---

## 4. Success Metrics

**User-visible:**
- Users send a message and receive AI response within 5 seconds
- Typing indicator appears <100ms when AI starts processing
- Error messages are friendly and actionable
- Input field clears after sending and re-focuses

**System:**
- AI response time: <5s (simple), <10s (complex)
- Error rate: <5% (excluding network failures)
- Input validation prevents empty messages and >500 chars

**Quality:**
- All acceptance gates pass
- 0 console errors during normal operation
- Loading states never get "stuck"

---

## 5. Users & Stories

- **As a Canvas User:** I want to type a message to Clippy and press Enter to send, see "Clippy is typing...", and receive AI responses clearly displayed
- **As a Developer:** I want to reuse the existing `testAI()` function and have clear error boundaries
- **As a Product Owner:** I want immediate user feedback (typing indicators) so users don't think the app is frozen

---

## 6. Experience Specification (UX)

### Happy Path Flow
1. User types message (e.g., "Create a blue circle")
2. User presses Enter or clicks Send
3. User message appears immediately (white bubble, right-aligned)
4. Input clears and refocuses
5. Typing indicator appears: "Clippy is typing..." with animated dots
6. AI processes request via `AIService.executeCommand()`
7. AI response appears (yellow bubble, left-aligned with Clippy avatar)
8. Typing indicator disappears
9. Canvas updates if AI created/modified shapes

### Error Flow
1. User sends message
2. Typing indicator appears
3. AI returns error or API fails
4. Error message appears in yellow bubble: "⚠️ Sorry, I couldn't process that. [specific error]"
5. User can send another message (input re-enabled)

### Error Messages
- **API Failure:** "⚠️ Oops! I'm having trouble connecting right now. Please try again in a moment."
- **Invalid Command:** "⚠️ I didn't understand that command. Try asking me to create shapes like circles, rectangles, or text!"
- **Timeout (30s):** "⚠️ That's taking longer than expected. Please try again."
- **Not Authenticated:** "⚠️ You need to be logged in to chat with Clippy."
- **Message Too Long:** "⚠️ That message is too long! Please keep it under 500 characters."

### Keyboard Shortcuts
- **`Enter`** — Send message
- **`Esc`** — Close chat panel (already in PR #9)
- **`Cmd/Ctrl + K`** — Open chat panel (already in PR #9)

### Accessibility
- Screen reader announces "Clippy is typing" and AI responses
- Error messages have `role="alert"`
- Focus remains in input field after sending
- Input: `aria-label="Message input"`
- Typing indicator: `role="status"`, `aria-live="polite"`

---

## 7. Functional Requirements

### MUST-HAVE Requirements

#### REQ-1: Enable Message Input
- Remove `disabled` attribute from input field and Send button in `ChatPanel.tsx`
- Update placeholder to: "Ask Clippy anything..."
- Remove "Coming soon" hint text
- **Gate:** Input field accepts text; Send button is clickable

#### REQ-2: Message Input Validation
- Validate message not empty (trim whitespace)
- Validate message not too long (max 500 chars)
- Disable Send button when input is empty
- Show character count warning at 450+ chars
- **Gate:** Empty/whitespace messages blocked; 500+ char messages show error

#### REQ-3: Send Message Handler
- Implement `handleSendMessage` in parent component
- Create user message object: `{id, role: 'user', content, timestamp}`
- Add to messages array immediately (optimistic UI)
- Clear input and refocus
- **Gate:** User presses Enter → message appears, input clears

#### REQ-4: AI Service Integration
- Call `AIService.executeCommand(prompt, userId)` when user sends message
- Use authenticated user ID from `useAuth()` hook
- Handle promise and catch errors
- **Gate:** User sends "Create a red circle" → AI service called successfully

#### REQ-5: Display AI Response
- Create AI message object: `{id, role: 'assistant', content: result.message, timestamp}`
- Add to messages array
- Display with yellow bubble and Clippy avatar (already styled in PR #9)
- **Gate:** AI responds with "✓ Created 1 circle" → appears in chat correctly

#### REQ-6: Typing Indicator
- Create `TypingIndicator.tsx` component
- Display when `isLoading === true`
- Text: "Clippy is typing..." with 3 animated dots
- Yellow bubble styling, Clippy avatar visible
- Render above input area, below last message
- **Gate:** Typing indicator appears within 100ms, disappears when response arrives

#### REQ-7: Loading State Management
- Add `isLoading` state to parent component
- Set `true` when calling `executeCommand()`
- Set `false` when response received or error occurs
- Disable Send button while `isLoading === true`
- **Gate:** While AI processing, Send button disabled and new messages blocked

#### REQ-8: Error Handling - API Failures
- Catch errors from `AIService.executeCommand()`
- Display error as AI message (yellow bubble with ⚠️)
- Use friendly error messages (see Section 6)
- Log to console: `console.error('AI error:', error)`
- Clear loading state after error
- **Gate:** AI service error → friendly message appears, user can send another message

#### REQ-9: Error Handling - Timeout
- Implement 30-second timeout for AI responses
- Show timeout error if AI doesn't respond
- Clear loading state after timeout
- **Gate:** AI takes >30s → timeout message appears, loading state clears

#### REQ-10: User Authentication Check
- Check user is authenticated before sending message
- Show error if no user ID available
- **Gate:** If user logged out (edge case), error message appears

### SHOULD-HAVE Requirements

- **REQ-11:** Allow user to type next message while AI is processing
- **REQ-12:** Use ✓ icon for success messages, ⚠️ for errors
- **REQ-13:** Parse error types for specific guidance (out of bounds, invalid command, etc.)

---

## 8. Data Model

### Component State (Parent Component)

```typescript
// In AppShell.tsx or new useChatAI.ts hook
const [messages, setMessages] = useState<ChatMessage[]>([]);
const [isLoading, setIsLoading] = useState<boolean>(false);
const [inputValue, setInputValue] = useState<string>('');
```

### TypeScript Interfaces (Update `types.ts`)

```typescript
// Existing - no changes
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Updated - add new props
export interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (content: string) => void; // NEW
  isLoading: boolean; // NEW
}
```

### AIService (Existing - No Changes)

```typescript
// Use existing from PR #8
interface CommandResult {
  success: boolean;
  message: string;
  toolCalls: any[];
}

async executeCommand(prompt: string, userId: string): Promise<CommandResult>
```

**Note:** Messages are local React state only (disappear on refresh). PR #11 will add Firestore persistence per-user (`userId` scoped).

---

## 9. UI Components to Create/Modify

### New Components
1. **`src/components/Chat/TypingIndicator.tsx`** — "Clippy is typing..." with animated dots
2. **`src/components/Chat/TypingIndicator.css`** — Dot animation keyframes

### Modified Components
3. **`src/components/Chat/ChatPanel.tsx`** — Remove disabled state, add `onSendMessage` and `isLoading` props, render typing indicator
4. **`src/components/Chat/types.ts`** — Update `ChatPanelProps` interface
5. **`src/components/Layout/AppShell.tsx`** — Add chat AI logic: `messages` state, `isLoading` state, `handleSendMessage` function, AI service integration, error handling
6. **Optional: `src/hooks/useChatAI.ts`** — Extract chat logic into custom hook for cleaner code

---

## 10. Test Plan & Acceptance Gates

### Happy Path (8 gates)
- [ ] User types message and presses Enter → appears immediately, input clears and refocuses
- [ ] Typing indicator appears within 100ms after sending
- [ ] Send button disabled while typing indicator showing
- [ ] AI response arrives within 5 seconds → appears with yellow bubble and Clippy avatar
- [ ] Typing indicator disappears when AI response arrives
- [ ] User types "Create a blue rectangle" → AI creates shape → Canvas updates → AI responds "✓ Created 1 rectangle"
- [ ] Multiple sequential messages work correctly
- [ ] Chat scrolls to bottom when new messages arrive

### Edge Cases (6 gates)
- [ ] Empty message → Send button disabled, nothing happens
- [ ] Whitespace-only message → Treated as empty
- [ ] 500+ char message → Error message appears
- [ ] Spam clicking Send while loading → Loading state prevents duplicates
- [ ] User closes chat panel while AI processing → Response arrives when reopened
- [ ] User presses Enter while Send disabled → Nothing happens

### Error Handling (5 gates)
- [ ] Network error → Friendly error message appears, user can send another message
- [ ] AI returns `success: false` → Error message from AIService appears
- [ ] AI timeout (>30s) → Timeout message appears, loading state clears
- [ ] User not authenticated → Error message appears
- [ ] After any error, input re-enabled and user can retry

### AI Integration (4 gates)
- [ ] "Create a red circle" → AI creates circle → Canvas updates → AI responds
- [ ] "Create 3 blue rectangles" → AI creates 3 rectangles → AI responds "✓ Created 3 elements"
- [ ] "Move the red circle to center" → AI moves circle → Canvas updates
- [ ] Invalid command → AI returns helpful error message

### Performance (3 gates)
- [ ] Typing indicator appears <100ms after sending
- [ ] User message renders instantly
- [ ] Canvas remains responsive while AI processing

### Accessibility (3 gates)
- [ ] Screen reader announces "Clippy is typing" and AI responses
- [ ] Tab key navigates between input and Send button
- [ ] Error messages announced with `role="alert"`

**Total: 29 acceptance gates**

---

## 11. Definition of Done

- [ ] `TypingIndicator.tsx` component created with animated dots
- [ ] `ChatPanel.tsx` modified (disabled state removed, send functionality added)
- [ ] `types.ts` updated with new props
- [ ] Chat AI logic implemented (AppShell or useChatAI hook)
- [ ] `AIService.executeCommand()` integrated successfully
- [ ] User can send messages and receive AI responses
- [ ] Typing indicator shows while AI processing
- [ ] Error handling works (network, timeout, invalid commands)
- [ ] All 29 acceptance gates pass
- [ ] Input validation prevents empty/too-long messages
- [ ] Keyboard shortcuts work (Enter to send)
- [ ] AI-created shapes appear on canvas in real-time
- [ ] 0 console errors during normal operation
- [ ] Loading states never get stuck
- [ ] Code reviewed and approved

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| **AI response latency** (5-15s) | Prominent typing indicator, 30s timeout with error message, log response times |
| **Rate limiting / API costs** | Disable Send while loading, monitor OpenAI dashboard, set budget alerts |
| **Generic error messages** | Parse error types, provide specific guidance, log detailed errors to console |
| **State management complexity** | Single `isLoading` flag, unique message IDs (crypto.randomUUID()), extract to custom hook |
| **User auth edge cases** | Check authentication before each send, handle logged-out state gracefully |
| **Persistence expectations** | Add hint "Messages not saved yet" in empty state, plan PR #11 immediately after |

---

## 13. Open Questions & Decisions

**Q1:** Queue multiple messages or prevent sending while loading?  
**Decision:** Prevent sending (simpler). Disable Send button while `isLoading === true`.

**Q2:** Show character count in input?  
**Decision:** Not in this PR. Show warning only at 450+ chars.

**Q3:** Add welcome message when chat opens?  
**Decision:** Yes (optional polish). Use greeting from PR #9 ChatEmptyState.

**Q4:** Support multi-line messages (Shift+Enter)?  
**Decision:** No, single-line input only. Enter sends message.

**Q5:** Parse and format AI responses (bold, colors)?  
**Decision:** No, plain text only. Rich formatting is future work.

**Q6:** What if user closes chat while AI processing?  
**Decision:** Let it continue. Response appears when panel reopens (state persists).

---

## 14. Out-of-Scope Backlog

Deferred to future PRs:
- **PR #11:** Persist chat messages to Firestore (per-user)
- **Conversation context:** AI remembers previous messages
- **Streaming responses:** Word-by-word like ChatGPT
- **Message editing/deletion**
- **Multi-line input** (Shift+Enter)
- **Rich text formatting**
- **Client-side rate limiting**
- **AI personality settings**

---

## 15. Deployment Notes

**Pre-Deploy Checklist:**
- Ensure `VITE_OPENAI_API_KEY` environment variable set in Vercel
- Verify OpenAI API key has sufficient credits
- Set up budget alerts in OpenAI dashboard ($50/month)

**Manual Validation Steps:**
1. Send "Hello Clippy" → Verify response
2. Send "Create a blue circle" → Verify canvas updates and response
3. Send invalid message → Verify error handling
4. Send 5 messages rapidly → Verify queueing/blocking works
5. Test with slow network (DevTools throttling) → Verify timeout
6. Check console for errors

---

**END OF PRD**
