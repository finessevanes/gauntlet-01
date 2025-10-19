# PR-10 TODO — Chat Functionality & AI Connection

**Branch**: `feature/pr-10-chat-ai-connection`  
**Source PRD**: `collabcanvas/docs/prds/pr-10-prd.md`  
**Owner (Agent)**: Building Agent (TBD)

---

## 0. Clarifying Questions & Assumptions

- **Questions:** None — PRD is comprehensive and approved
- **Assumptions (unblock coding now; confirm in PR):**
  - Chat AI logic will be implemented in `AppShell.tsx` first, can extract to custom hook (`useChatAI.ts`) if component becomes too large
  - 30-second timeout is appropriate for all AI commands (simple and complex)
  - Input validation at 500 chars is sufficient (matches typical chat UX)
  - Messages stored in local state only (Firestore persistence in PR #11)
  - Chat is private per user (no real-time sync across users)

---

## 1. Repo Prep

- [ ] Create branch `feature/pr-10-chat-ai-connection`
  - Command: `git checkout -b feature/pr-10-chat-ai-connection`
  - Test Gate: Branch created and checked out successfully

- [ ] Read PRD thoroughly
  - File: `collabcanvas/docs/prds/pr-10-prd.md`
  - Test Gate: All 10 MUST-HAVE requirements and 29 acceptance gates understood

- [ ] Verify dependencies are complete
  - PR #8: `AIService` exists and `testAI()` works in console
  - PR #9: Chat UI components exist (`ChatPanel.tsx`, `MessageBubble.tsx`, etc.)
  - Test Gate: Both dependencies confirmed functional

---

## 2. TypeScript Interface Updates

- [ ] Update `src/components/Chat/types.ts`
  - Add `onSendMessage: (content: string) => void` to `ChatPanelProps`
  - Add `isLoading: boolean` to `ChatPanelProps`
  - Test Gate: File compiles with no TypeScript errors

- [ ] Verify `ChatMessage` interface exists
  - Should have: `id`, `role`, `content`, `timestamp` fields
  - Test Gate: Interface matches PRD specification (Section 8)

---

## 3. Component: Typing Indicator

- [ ] Create `src/components/Chat/TypingIndicator.tsx`
  - Pure presentation component (no props needed)
  - Displays "Clippy is typing..." text
  - Shows Clippy avatar (32x32px)
  - Test Gate: Component renders without errors

- [ ] Add three animated dots
  - Use three `<span>` elements with class `dot`
  - Add dots after "Clippy is typing" text
  - Test Gate: Three dots visible in component

- [ ] Create `src/components/Chat/TypingIndicator.css`
  - Yellow bubble styling (same as AI messages: #FFFF99 background, 1px black border)
  - Left-aligned with Clippy avatar
  - Test Gate: Styling matches AI message bubbles

- [ ] Implement dot animation
  - Keyframe animation: fade in/out in sequence
  - Dot 1 animates 0s, Dot 2 at 0.2s, Dot 3 at 0.4s
  - Loop infinitely with 1.2s total duration
  - CSS:
    ```css
    @keyframes dotFade {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 1; }
    }
    .dot {
      animation: dotFade 1.2s infinite;
    }
    .dot:nth-child(2) { animation-delay: 0.2s; }
    .dot:nth-child(3) { animation-delay: 0.4s; }
    ```
  - Test Gate: Dots animate smoothly in sequence, loop continuously

- [ ] Add accessibility attributes
  - Add `role="status"`
  - Add `aria-live="polite"`
  - Add `aria-label="Clippy is typing"`
  - Test Gate: Screen reader announces "Clippy is typing"

---

## 4. Update ChatPanel Component

### 4.1 Remove Disabled State

- [ ] Open `src/components/Chat/ChatPanel.tsx`
  - Test Gate: File opens successfully

- [ ] Remove `disabled` attribute from input field
  - Line: `<input ... disabled />`
  - Change to: `<input ... />`
  - Test Gate: Input field is no longer disabled, accepts text

- [ ] Remove `disabled` attribute from Send button
  - Line: `<button ... disabled>`
  - Change to: `<button ... disabled={isDisabledCondition}>`
  - Test Gate: Send button is no longer always disabled

- [ ] Update input placeholder
  - Old: `"Coming soon in PR #10..."`
  - New: `"Ask Clippy anything..."`
  - Test Gate: Placeholder text updated correctly

- [ ] Remove hint text below input
  - Old: `<div className="chat-input-hint">💡 Tip: Chat functionality will be connected in PR #10</div>`
  - Remove this entire element
  - Test Gate: Hint text no longer visible

### 4.2 Add New Props

- [ ] Add props to ChatPanel component signature
  - Add: `onSendMessage: (content: string) => void`
  - Add: `isLoading: boolean`
  - Update interface import from `types.ts`
  - Test Gate: Props accessible in component, no TypeScript errors

- [ ] Add local state for input value
  - Add: `const [inputValue, setInputValue] = useState('')`
  - Test Gate: State variable declared

### 4.3 Implement Controlled Input

- [ ] Wire input field to state
  - Add `value={inputValue}` to input element
  - Add `onChange={(e) => setInputValue(e.target.value)}` to input
  - Test Gate: Typing in input updates state, displays correctly

- [ ] Implement input validation logic
  - Create function: `const isInputValid = inputValue.trim().length > 0 && inputValue.length <= 500`
  - Test Gate: Function returns true for valid input, false for empty/too-long

- [ ] Disable Send button based on validation
  - Update Send button: `disabled={!isInputValid || isLoading}`
  - Test Gate: Send button disabled when input empty, too long, or loading

- [ ] Add character count warning (450+ chars)
  - Show warning text when `inputValue.length >= 450`: "⚠️ Approaching character limit (500 max)"
  - Style: Small text, orange color, below input
  - Test Gate: Warning appears at 450 chars, disappears below 450

### 4.4 Implement Send Handler

- [ ] Create handleSubmit function
  - Validate input is not empty (trim whitespace)
  - Validate input is not too long (<=500 chars)
  - Call `onSendMessage(inputValue.trim())`
  - Clear input: `setInputValue('')`
  - Test Gate: Function defined and accessible

- [ ] Wire Send button onClick
  - Add: `onClick={handleSubmit}` to Send button
  - Test Gate: Clicking Send calls handleSubmit

- [ ] Add Enter key handler to input
  - Add `onKeyDown` handler to input field
  - Check if `e.key === 'Enter'` and not `e.shiftKey`
  - Prevent default and call `handleSubmit()`
  - Test Gate: Pressing Enter sends message (if valid)

- [ ] Prevent sending while loading
  - In handleSubmit, check if `isLoading === true` and return early
  - Test Gate: Cannot send message while AI is processing

### 4.5 Render Typing Indicator

- [ ] Import TypingIndicator component
  - Add: `import TypingIndicator from './TypingIndicator'`
  - Test Gate: Import successful, no errors

- [ ] Render typing indicator conditionally
  - In message list section, after messages but before `messageEndRef`
  - Add: `{isLoading && <TypingIndicator />}`
  - Test Gate: Typing indicator appears when `isLoading === true`, hidden when `false`

---

## 5. Implement Chat AI Logic in Parent Component

### 5.1 Setup State in AppShell

- [ ] Open `src/components/Layout/AppShell.tsx`
  - Locate where `ChatPanel` is rendered
  - Test Gate: File opens, ChatPanel usage found

- [ ] Add messages state
  - Add: `const [messages, setMessages] = useState<ChatMessage[]>([])`
  - Import `ChatMessage` type from `Chat/types`
  - Test Gate: State variable declared, type imported

- [ ] Add isLoading state
  - Add: `const [isLoading, setIsLoading] = useState(false)`
  - Test Gate: State variable declared

- [ ] Get authenticated user
  - Import: `import { useAuth } from '../../contexts/AuthContext'`
  - Add: `const { user } = useAuth()`
  - Test Gate: User object accessible

- [ ] Add welcome message on mount (optional polish)
  - Use `useEffect` to add initial greeting when messages array is empty
  - Message: `{ id: 'welcome', role: 'assistant', content: 'Hi! I\'m Clippy, your canvas assistant. How can I help you today?', timestamp: new Date() }`
  - Test Gate: Welcome message appears on first render

### 5.2 Implement handleSendMessage Function

- [ ] Create handleSendMessage function
  - Signature: `const handleSendMessage = async (content: string) => { ... }`
  - Test Gate: Function declared

- [ ] Validate user authentication
  - Check if `!user || !user.uid`
  - If true, add error message to chat: "⚠️ You need to be logged in to chat with Clippy."
  - Return early
  - Test Gate: Function checks for user authentication

- [ ] Validate message content
  - Trim content: `const trimmedContent = content.trim()`
  - Check if empty: `if (!trimmedContent) return`
  - Check if too long: `if (trimmedContent.length > 500)` → add error message
  - Test Gate: Validation logic works correctly

- [ ] Create user message object
  - Generate unique ID: `const userMessageId = crypto.randomUUID()`
  - Create message:
    ```typescript
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: trimmedContent,
      timestamp: new Date()
    }
    ```
  - Test Gate: Message object created with correct structure

- [ ] Add user message to state (optimistic UI)
  - Add: `setMessages(prev => [...prev, userMessage])`
  - Test Gate: User message appears immediately in chat

- [ ] Set loading state
  - Add: `setIsLoading(true)`
  - Test Gate: Loading state set to true

### 5.3 Call AI Service

- [ ] Import AIService
  - Add: `import { AIService } from '../../services/aiService'`
  - Test Gate: Import successful

- [ ] Create AI service instance
  - Outside function: `const aiService = new AIService()`
  - Or inside function if creating per-call
  - Test Gate: AIService instance created

- [ ] Implement 30-second timeout
  - Create timeout promise:
    ```typescript
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT')), 30000)
    })
    ```
  - Test Gate: Timeout promise created

- [ ] Call executeCommand with race
  - Wrap in try/catch block
  - Use `Promise.race([aiService.executeCommand(trimmedContent, user.uid), timeoutPromise])`
  - Test Gate: AI service called with user message and user ID

- [ ] Handle successful response
  - Get result from `executeCommand`
  - Create AI message object:
    ```typescript
    const aiMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: result.message,
      timestamp: new Date()
    }
    ```
  - Add to messages: `setMessages(prev => [...prev, aiMessage])`
  - Test Gate: AI response appears in chat

- [ ] Handle errors
  - Catch errors in try/catch block
  - Check if error message is 'TIMEOUT'
  - Create error message for chat:
    - Timeout: "⚠️ That's taking longer than expected. Please try again."
    - Network: "⚠️ Oops! I'm having trouble connecting right now. Please try again in a moment."
    - Generic: "⚠️ Something went wrong. Please try again."
  - Log to console: `console.error('AI error:', error)`
  - Add error message to chat as AI message
  - Test Gate: Errors handled gracefully, user sees friendly message

- [ ] Clear loading state (finally block)
  - Use finally block: `finally { setIsLoading(false) }`
  - Test Gate: Loading state cleared after success or error

### 5.4 Wire Chat to AppShell

- [ ] Pass props to ChatPanel
  - Update `<ChatPanel />` usage
  - Add: `messages={messages}`
  - Add: `onSendMessage={handleSendMessage}`
  - Add: `isLoading={isLoading}`
  - Test Gate: All props passed correctly

- [ ] Verify ChatPanel renders
  - Check no TypeScript errors
  - Check no console errors
  - Test Gate: ChatPanel renders with new props

---

## 6. Testing & Validation

### 6.1 Manual Testing - Happy Path

- [ ] Test sending a simple message
  - Open chat panel
  - Type "Hello Clippy"
  - Press Enter
  - Verify: User message appears immediately
  - Verify: Input clears and refocuses
  - Verify: Typing indicator appears within 100ms
  - Verify: Send button disabled while loading
  - Verify: AI response appears within 5 seconds
  - Verify: Typing indicator disappears
  - Test Gate: Gate 1.1-1.6 from PRD pass

- [ ] Test AI shape creation
  - Type "Create a blue circle"
  - Send message
  - Verify: AI creates circle on canvas
  - Verify: AI responds "✓ Created 1 circle"
  - Verify: Canvas updates in real-time
  - Test Gate: Gate 1.7 and 5.1 from PRD pass

- [ ] Test multiple sequential messages
  - Send "Create a red rectangle"
  - Wait for response
  - Send "Create a green triangle"
  - Verify: Both commands execute successfully
  - Verify: Chat displays full conversation
  - Test Gate: Gate 1.8 from PRD passes

### 6.2 Manual Testing - Edge Cases

- [ ] Test empty message
  - Try to send empty message
  - Verify: Send button disabled
  - Verify: Nothing happens
  - Test Gate: Gate 2.1 from PRD passes

- [ ] Test whitespace-only message
  - Type "   " (spaces only)
  - Verify: Send button disabled
  - Verify: Treated as empty
  - Test Gate: Gate 2.2 from PRD passes

- [ ] Test long message (500+ chars)
  - Type message over 500 characters
  - Verify: Character count warning appears at 450 chars
  - Verify: Error message if attempting to send 500+ chars
  - Test Gate: Gate 2.3 from PRD passes

- [ ] Test spam clicking Send button
  - Send a message
  - Rapidly click Send button multiple times while loading
  - Verify: Only one message sent
  - Verify: Loading state prevents duplicates
  - Test Gate: Gate 2.5 from PRD passes

- [ ] Test closing panel while AI processing
  - Send a message
  - Immediately close chat panel
  - Wait for AI to process
  - Reopen panel
  - Verify: Response visible in chat
  - Test Gate: Gate 2.6 from PRD passes

### 6.3 Manual Testing - Error Handling

- [ ] Test network error simulation
  - Disconnect network or pause in DevTools
  - Send a message
  - Verify: Friendly error message appears
  - Verify: "⚠️ Oops! I'm having trouble connecting..."
  - Verify: User can send another message after
  - Test Gate: Gate 3.1 and 3.5 from PRD pass

- [ ] Test invalid AI command
  - Send message: "Make it purple" (no shape specified)
  - Verify: AI returns error or unclear response
  - Verify: Error message displayed in chat
  - Test Gate: Gate 3.2 and 5.4 from PRD pass

- [ ] Test timeout (if possible to simulate)
  - Modify timeout to 5 seconds for testing
  - Send a complex command
  - If AI takes >5s, verify timeout message appears
  - Verify: Loading state cleared
  - Restore 30s timeout after test
  - Test Gate: Gate 3.3 from PRD passes

### 6.4 Manual Testing - Keyboard & Accessibility

- [ ] Test Enter key to send
  - Type a message
  - Press Enter
  - Verify: Message sends (same as clicking Send)
  - Test Gate: Gate 4.1 from PRD passes

- [ ] Test Enter while Send disabled
  - Leave input empty
  - Press Enter
  - Verify: Nothing happens
  - Test Gate: Gate 4.2 from PRD passes

- [ ] Test Tab navigation
  - Press Tab to navigate
  - Verify: Focus moves between input field and Send button
  - Test Gate: Gate 4.5 from PRD passes

- [ ] Test screen reader (if possible)
  - Use screen reader or inspect aria attributes
  - Verify: Typing indicator has `role="status"` and `aria-live="polite"`
  - Verify: Typing indicator announced as "Clippy is typing"
  - Verify: AI responses announced
  - Test Gate: Gate 4.3 and 4.4 from PRD pass

### 6.5 Manual Testing - AI Integration & Canvas

- [ ] Test "Create a red circle"
  - Send command
  - Verify: Red circle appears on canvas
  - Verify: Canvas updates in real-time
  - Verify: AI responds "✓ Created 1 circle"
  - Test Gate: Gate 5.1 from PRD passes

- [ ] Test "Create 3 blue rectangles"
  - Send command
  - Verify: 3 blue rectangles appear on canvas
  - Verify: AI responds "✓ Created 3 elements"
  - Test Gate: Gate 5.2 from PRD passes

- [ ] Test "Move the red circle to the center"
  - First create a red circle
  - Then send move command
  - Verify: Circle moves to center of canvas
  - Verify: AI responds "✓ Moved shape to new position"
  - Test Gate: Gate 5.3 from PRD passes

- [ ] Test multi-user collaboration (if possible)
  - Open canvas in two browser windows (different users)
  - In User A window: Send AI command to create shape
  - In User B window: Verify shape appears (real-time sync)
  - Verify: User B does NOT see User A's chat messages (private chat)
  - Test Gate: Gate 5.5 from PRD passes

### 6.6 Manual Testing - Performance

- [ ] Test typing indicator appears quickly
  - Send a message
  - Use DevTools Performance tab to measure
  - Verify: Typing indicator appears <100ms after send
  - Test Gate: Gate 6.1 from PRD passes

- [ ] Test user message renders instantly
  - Send a message
  - Verify: User message appears immediately (no delay)
  - Test Gate: Gate 6.2 from PRD passes

- [ ] Test simple AI command response time
  - Send: "Create a circle"
  - Measure time to response
  - Verify: Response arrives in <5 seconds
  - Test Gate: Gate 6.3 from PRD passes

- [ ] Test canvas remains responsive
  - Send an AI command
  - While AI is processing, try to draw manually on canvas
  - Verify: Canvas responds to interactions normally
  - Test Gate: Gate 6.5 from PRD passes

### 6.7 Manual Testing - Visual & UX

- [ ] Test typing indicator animation
  - Send a message
  - Observe typing indicator
  - Verify: 3 dots fade in/out in sequence
  - Verify: Animation is smooth (60 FPS)
  - Test Gate: Gate 7.1 from PRD passes

- [ ] Test success/error icons
  - Send successful command: Verify ✓ icon in response
  - Trigger error: Verify ⚠️ icon in error message
  - Test Gate: Gate 7.2 from PRD passes

- [ ] Test auto-scroll to bottom
  - Send multiple messages to fill chat
  - Send a new message
  - Verify: Chat scrolls to bottom when new message arrives
  - Test Gate: Gate 7.3 from PRD passes

- [ ] Test input placeholder
  - Open chat panel
  - Verify: Input shows "Ask Clippy anything..."
  - Verify: No "Coming soon" text visible
  - Test Gate: Gate 7.4 from PRD passes

- [ ] Test Send button state
  - Input empty: Verify button disabled
  - Input has text: Verify button enabled
  - While loading: Verify button disabled
  - Test Gate: Gate 7.5 from PRD passes

---

## 7. Bug Fixes & Polish

- [ ] Fix any console errors
  - Check browser console for errors
  - Fix all errors and warnings
  - Test Gate: 0 console errors during operation

- [ ] Fix any TypeScript errors
  - Run: `npm run type-check` (or `tsc --noEmit`)
  - Fix all TypeScript errors
  - Test Gate: No TypeScript errors

- [ ] Fix any linter errors
  - Run: `npm run lint`
  - Fix all ESLint warnings/errors
  - Test Gate: Linter passes

- [ ] Verify loading state never gets stuck
  - Test various error scenarios
  - Verify: Loading state always clears (success, error, or timeout)
  - Test Gate: No stuck loading states found

- [ ] Optimize performance (if needed)
  - Check for unnecessary re-renders with React DevTools Profiler
  - Memoize expensive functions if needed
  - Test Gate: No performance issues detected

---

## 8. Documentation & PR Preparation

- [ ] Add inline code comments
  - Comment complex logic (timeout handling, error parsing)
  - Document why decisions were made
  - Test Gate: Code is well-commented

- [ ] Update README (if needed)
  - Document new chat functionality
  - Add "How to use AI chat" section
  - Test Gate: README updated (or N/A if no changes needed)

- [ ] Create PR description
  - Copy structure from `agents/todo-template.md`
  - Summarize what was implemented
  - List all acceptance gates and their status
  - Add screenshots/GIFs of chat functionality
  - Link to PRD (`collabcanvas/docs/prds/pr-10-prd.md`)
  - Note any deviations from PRD
  - Test Gate: PR description is comprehensive

- [ ] Self-review checklist
  - [ ] All 10 MUST-HAVE requirements implemented
  - [ ] All 29 acceptance gates pass
  - [ ] Chat AI integration works end-to-end
  - [ ] Error handling is robust
  - [ ] No console errors
  - [ ] No TypeScript errors
  - [ ] Code is clean and well-commented
  - [ ] Manual testing complete

---

## 9. Final Verification

- [ ] Run all tests (if test suite exists)
  - Command: `npm test`
  - Verify: All tests pass
  - Test Gate: Test suite passes

- [ ] Test in different browsers
  - Chrome: Verify all functionality works
  - Firefox: Verify all functionality works
  - Safari: Verify all functionality works
  - Test Gate: Cross-browser compatibility confirmed

- [ ] Test with slow network
  - Open DevTools Network tab
  - Throttle to "Slow 3G"
  - Send AI commands
  - Verify: Timeout works correctly, UI remains responsive
  - Test Gate: Slow network handled gracefully

- [ ] Final smoke test
  - Log in to app
  - Open chat panel
  - Send 5 different commands (create shapes, move shapes, etc.)
  - Verify: All commands work correctly
  - Verify: No errors in console
  - Test Gate: Full functionality verified

---

## 10. Open PR

- [ ] Commit all changes
  - Command: `git add .`
  - Command: `git commit -m "feat: Connect chat UI to AI backend (PR #10)"`
  - Test Gate: Changes committed

- [ ] Push branch to remote
  - Command: `git push origin feature/pr-10-chat-ai-connection`
  - Test Gate: Branch pushed successfully

- [ ] Create Pull Request
  - Go to GitHub repository
  - Create PR from `feature/pr-10-chat-ai-connection` to `main`
  - Use PR description from Step 8
  - Add reviewers
  - Link to Issue #10 (if exists)
  - Test Gate: PR created and submitted for review

---

## Copyable Checklist (for PR description)

- [ ] Branch created: `feature/pr-10-chat-ai-connection`
- [ ] TypeScript interfaces updated (`types.ts`)
- [ ] TypingIndicator component created with animated dots
- [ ] ChatPanel component updated (disabled state removed, send functionality added)
- [ ] Chat AI logic implemented in AppShell (messages state, isLoading, handleSendMessage)
- [ ] AIService.executeCommand() integrated successfully
- [ ] 30-second timeout implemented
- [ ] Error handling for network, timeout, invalid commands
- [ ] Input validation (empty, 500 char limit)
- [ ] Keyboard shortcuts work (Enter to send)
- [ ] All 29 acceptance gates tested and passing
- [ ] 0 console errors
- [ ] 0 TypeScript errors
- [ ] Linter passes
- [ ] Cross-browser testing complete
- [ ] Code reviewed and ready for merge

---

**END OF TODO**

