# PRD: Clippy-Style Chat UI Component — End-to-End Delivery

**Feature**: Clippy-Style Chat UI Component

**Version**: 1.0

**Status**: Ready for Development

**Agent**: Delilah (Planning Agent)

**Target Release**: Phase 2 - AI Chat (CRITICAL PRIORITY)

**Links**: 
- PR Brief: `collabcanvas/docs/pr-briefs.md` (PR #9)
- TODO: `collabcanvas/docs/todos/pr-9-todo.md` (to be created after PRD approval)
- Design Reference: `collabcanvas/docs/images/clippy.jpg`

---

## 1. Summary

Create a retro Clippy-style chat UI component with speech bubble messages, a Clippy avatar, and distinct styling for user vs AI messages. This PR focuses purely on the visual interface and component structure without backend integration—building the presentation layer that will be wired to the existing `testAI()` function in PR #10.

---

## 2. Problem & Goals

**Problem:** The AI backend (`testAI()` function) is already functional, but users have no visual interface to interact with it. We need a friendly, accessible chat UI that captures the nostalgic Clippy aesthetic while being modern and usable.

**Why now?** AI chat is the core differentiating feature of CollabCanvas. Phase 1 is complete, and Phase 2's critical path requires a working chat interface before we can connect the backend (PR #10) and add persistence (PR #11).

**Goals:**
- [ ] G1 — Users can visually see what a conversation with Clippy looks like (message history display)
- [ ] G2 — The UI is immediately recognizable as "Clippy-inspired" with speech bubbles and yellow/white color scheme
- [ ] G3 — The component is structured for easy integration with AI backend in PR #10

---

## 3. Non-Goals / Out of Scope

To avoid scope creep and maintain focus on UI only:

- [ ] **Not implementing backend integration** — No calls to `testAI()` or any AI service (PR #10)
- [ ] **Not implementing message persistence** — No Firestore reads/writes for chat history (PR #11)
- [ ] **Not implementing real-time sync** — Chat messages won't sync across users yet
- [ ] **Not implementing advanced features** — No message editing, deletion, reactions, or markdown rendering
- [ ] **Not implementing voice/video** — Text-only chat interface
- [ ] **Not implementing mobile optimization** — Desktop-first design (responsive design is future work)

---

## 4. Success Metrics

**User-visible:**
- Users can open/close the chat panel with smooth animations (<300ms)
- Empty state displays immediately on first load
- Message bubbles are visually distinct (user vs AI)
- Clippy avatar is visible and charming (32x32px)

**System:**
- Component renders with 0 console errors
- Panel animations maintain 60 FPS
- Component re-renders are optimized (no unnecessary re-renders)

**Quality:**
- All acceptance gates pass (defined in Section 11)
- Design matches Clippy aesthetic (validated against reference image)
- Component is accessible (keyboard navigation works)

---

## 5. Users & Stories

### As a Canvas User:
- I want to **see a chat panel** so I can access the AI assistant
- I want to **open and close the chat panel** so I can focus on canvas or chat as needed
- I want to **see Clippy's avatar** so I feel like I'm interacting with a friendly assistant
- I want to **distinguish my messages from Clippy's** so I can easily follow the conversation
- I want to **see a greeting message** when I first open chat so I know how to get started

### As a Collaborator:
- I want the **chat UI to not obstruct my canvas work** so I can draw and chat simultaneously

### As a Developer (PR #10):
- I want **clear component props** so I can wire in message state and send handlers
- I want **a message array structure** so I can pass real data from the AI service

---

## 6. Experience Specification (UX)

### Entry Points and Flows

**Opening Chat:**
1. User clicks a "Chat with Clippy" button (location: bottom-right corner floating button OR button in toolbar)
2. Chat panel slides in from the bottom (drawer-style) or right side
3. Animation: smooth slide-in with easing, duration ~250ms
4. If first time opening: empty state with Clippy greeting visible

**Closing Chat:**
1. User clicks close button (X icon in panel header)
2. Panel slides out with same animation
3. Floating button remains visible for re-opening

**Message Display:**
1. Messages appear in chronological order (oldest at top, newest at bottom)
2. Auto-scroll to bottom when new messages arrive
3. User messages aligned right, AI messages aligned left
4. Speech bubble tails point toward the sender (user: right, AI: left with Clippy avatar)

### Visual Behavior

**Chat Panel Layout:**
```
┌─────────────────────────────────────┐
│ 💬 Chat with Clippy            [X] │ ← Header
├─────────────────────────────────────┤
│                                     │
│  📎 [Clippy]                        │
│  ┌──────────────────┐               │ ← AI message (yellow bubble)
│  │ Hi! I'm Clippy!  │               │
│  │ How can I help?  │               │
│  └──────────────────┘               │
│                                     │
│               ┌────────────────┐    │ ← User message (white bubble)
│               │ Hello Clippy!  │ 👤 │
│               └────────────────┘    │
│                                     │
│ ▼ (scroll area)                     │
├─────────────────────────────────────┤
│ Type a message...           [Send] │ ← Input (disabled for this PR)
└─────────────────────────────────────┘
```

**Colors & Styling:**
- **AI message bubbles:** Background `#FFFF99` (yellow), 1px solid black border, border-radius 12px
- **User message bubbles:** Background `#FFFFFF` (white), 1px solid `#CCCCCC` (gray), border-radius 12px
- **Speech bubble tails:** CSS triangular pseudo-element (`:after`) pointing left for AI, right for user
- **Panel background:** Light gray `#F5F5F5` (subtle texture if possible)
- **Header:** White background, 1px bottom border, "Chat with Clippy" title in bold
- **Font:** System font (Segoe UI, Arial, sans-serif), readable size 14-16px

**Clippy Avatar:**
- 32x32px icon image (use `clippy.jpg` or create a simple SVG clippy)
- Positioned to the left of AI message bubbles
- Top-aligned with the first line of the message

**Empty State:**
- Displayed when no messages exist yet
- Clippy avatar (larger, 64x64px) centered
- Greeting text: "👋 Hi! I'm Clippy, your canvas assistant. Ask me anything!"
- Subtle animation: gentle bounce on first appearance (optional polish)

### Loading/Disabled/Locked States

**Input Field (for this PR):**
- Input field is **disabled** with placeholder text: "Coming soon in PR #10..."
- Send button is **disabled** and grayed out
- Tooltip on hover: "Chat functionality will be connected in the next PR"

**Panel States:**
- **Closed:** Panel is hidden off-screen (CSS transform)
- **Opening:** Transition animation in progress
- **Open:** Panel is fully visible
- **Closing:** Transition animation in progress

### Accessibility

- **Keyboard shortcuts:**
  - `Esc` to close chat panel when open
  - `Tab` to navigate between close button and input field
  - `Enter` to send message to AI
- **Screen reader:**
  - Panel has `role="dialog"` and `aria-label="Chat with Clippy"`
  - Messages have `role="log"` for announcements
  - AI messages: `aria-label="Clippy says: [message content]"`
  - User messages: `aria-label="You said: [message content]"`
- **Focus management:**
  - When panel opens, focus moves to input field (even if disabled)
  - When panel closes, focus returns to trigger button

### Performance

- **60 FPS during animations** (slide-in/out transitions)
- **Instant rendering** of empty state (<50ms)
- **Smooth auto-scroll** when new messages appear (60 FPS)
- **No layout thrashing** (use CSS transforms for animations, not top/left)

---

## 7. Functional Requirements (Must/Should)

### MUST-HAVE Requirements

#### REQ-1: Chat Panel Component
- **MUST** create a new React component `ChatPanel.tsx` in `src/components/Chat/`
- **MUST** support open/closed states via props: `isOpen: boolean`
- **MUST** render conditionally based on `isOpen` state
- **Acceptance Gate:** Component renders without errors when `isOpen={true}` and `isOpen={false}`

#### REQ-2: Panel Positioning
- **MUST** position as a drawer (fixed position, bottom or right side of screen)
- **MUST** not obstruct the main canvas area when closed
- **MUST** overlay the canvas when open (z-index management)
- **Acceptance Gate:** Panel appears above canvas but below tooltips; does not interfere with shape interactions when closed

#### REQ-3: Open/Close Animations
- **MUST** implement smooth slide-in animation when opening (250ms duration, ease-out)
- **MUST** implement smooth slide-out animation when closing (250ms duration, ease-in)
- **MUST** use CSS transforms (translateY or translateX) for performance
- **Acceptance Gate:** Animations run at 60 FPS with no jank (verified in Chrome DevTools Performance tab)

#### REQ-4: Message Display
- **MUST** accept a `messages` prop with structure:
  ```typescript
  {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }[]
  ```
- **MUST** render each message as a speech bubble component
- **MUST** distinguish user messages (right-aligned, white) from AI messages (left-aligned, yellow)
- **MUST** auto-scroll to the bottom when messages array changes
- **Acceptance Gate:** Passing an array of 5 mock messages renders all 5 with correct styling and scroll position at bottom

#### REQ-5: Speech Bubble Styling
- **MUST** style AI messages with yellow background (#FFFF99) and black border
- **MUST** style user messages with white background and gray border
- **MUST** add speech bubble "tails" using CSS pseudo-elements (`:after`)
- **MUST** render tails pointing left for AI messages, right for user messages
- **Acceptance Gate:** Visual inspection confirms speech bubble appearance matches Clippy aesthetic

#### REQ-6: Clippy Avatar
- **MUST** display Clippy avatar (32x32px) next to AI messages
- **MUST** position avatar to the left of AI message bubble, top-aligned
- **MUST** use the image from `collabcanvas/docs/images/clippy.jpg` or create a simple SVG
- **Acceptance Gate:** Clippy avatar is visible and properly aligned with AI messages

#### REQ-7: Empty State
- **MUST** display an empty state when `messages` array is empty
- **MUST** show larger Clippy avatar (64x64px) and greeting text
- **MUST** use friendly copy: "👋 Hi! I'm Clippy, your canvas assistant. Ask me anything!"
- **Acceptance Gate:** Empty state renders when `messages={[]}` and disappears when messages are added

#### REQ-8: Panel Header
- **MUST** include a header with title "Chat with Clippy"
- **MUST** include a close button (X icon) in the top-right corner
- **MUST** trigger `onClose` callback when close button is clicked
- **Acceptance Gate:** Clicking close button calls `onClose` prop function

#### REQ-9: Message Input Field (Disabled)
- **MUST** include an input field at the bottom of the panel
- **MUST** disable the input field with placeholder: "Coming soon in PR #10..."
- **MUST** include a disabled "Send" button next to the input
- **MUST** add a tooltip on hover: "Chat functionality will be connected in the next PR"
- **Acceptance Gate:** Input field and button are rendered but disabled; tooltip appears on hover

#### REQ-10: Trigger Button
- **MUST** create a floating action button (FAB) to open chat
- **MUST** position FAB in the bottom-right corner of the screen
- **MUST** display Clippy icon or chat bubble icon on the button
- **MUST** trigger `onOpen` callback when clicked
- **Acceptance Gate:** Clicking FAB opens the chat panel; FAB is always visible when panel is closed

### SHOULD-HAVE Requirements

#### REQ-11: Keyboard Shortcuts
- **SHOULD** support `Cmd/Ctrl + K` to open chat panel
- **SHOULD** support `Esc` to close chat panel when open
- **Acceptance Gate:** Keyboard shortcuts work as expected

#### REQ-12: Smooth Scroll Behavior
- **SHOULD** animate scroll to bottom when new messages appear (smooth scroll)
- **SHOULD** only auto-scroll if user is already at the bottom (don't interrupt manual scrolling)
- **Acceptance Gate:** Auto-scroll works smoothly without interrupting user reading older messages

#### REQ-13: Retro Visual Polish
- **SHOULD** add subtle retro styling (slight gradients, shadows, Windows 95-inspired borders)
- **SHOULD** add a gentle bounce animation to Clippy avatar in empty state
- **Acceptance Gate:** Visual inspection confirms retro aesthetic

---

## 8. Data Model

### Component Props Interface

**ChatPanel Component:**
```typescript
interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
```

**ChatTriggerButton Component:**
```typescript
interface ChatTriggerButtonProps {
  onClick: () => void;
}
```

### State Management

**Parent Component (likely `AppShell.tsx` or `Canvas.tsx`):**
```typescript
const [isChatOpen, setIsChatOpen] = useState(false);
const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

// For this PR, use mock data:
const mockMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'Hi! I\'m Clippy, your canvas assistant. How can I help you today?',
    timestamp: new Date(),
  },
  {
    id: '2',
    role: 'user',
    content: 'Hello Clippy! Can you help me with my canvas?',
    timestamp: new Date(),
  },
];
```

**No Firestore Schema Yet** — Data persistence is deferred to PR #11.

---

## 9. API / Service Contracts

**No service methods needed for this PR** — UI only.

PR #10 will add:
```typescript
// Future service methods (NOT in this PR)
sendMessage(content: string): Promise<string>
getAIResponse(prompt: string): Promise<string>
```

---

## 10. UI Components to Create/Modify

### New Components to Create

1. **`src/components/Chat/ChatPanel.tsx`** — Main chat panel container
   - Renders panel header, message list, input field
   - Manages panel open/close animations
   - Props: `isOpen`, `onClose`, `messages`

2. **`src/components/Chat/MessageBubble.tsx`** — Individual message bubble
   - Renders speech bubble with tail
   - Conditional styling based on `role` (user vs assistant)
   - Props: `message: ChatMessage`

3. **`src/components/Chat/ClippyAvatar.tsx`** — Clippy avatar icon
   - Displays Clippy image (32x32px or 64x64px)
   - Props: `size: 'small' | 'large'`

4. **`src/components/Chat/ChatEmptyState.tsx`** — Empty state component
   - Displays when no messages exist
   - Shows large Clippy avatar and greeting text

5. **`src/components/Chat/ChatTriggerButton.tsx`** — Floating action button
   - Opens chat panel when clicked
   - Positioned bottom-right corner
   - Props: `onClick: () => void`

6. **`src/components/Chat/ChatPanel.css`** — Styling for chat components
   - Speech bubble styles with tails
   - Animation keyframes
   - Retro color scheme and borders

### Components to Modify

7. **`src/components/Layout/AppShell.tsx`** — Integrate chat UI
   - Add state: `isChatOpen`, `chatMessages` (with mock data)
   - Import and render `<ChatPanel>` and `<ChatTriggerButton>`
   - Wire up open/close handlers

---

## 11. Test Plan & Acceptance Gates

### Happy Path

- [ ] **Gate 1.1:** User clicks "Chat with Clippy" FAB → Chat panel slides in from bottom/right with smooth animation (250ms, 60 FPS)
- [ ] **Gate 1.2:** Panel displays empty state with large Clippy avatar and greeting text when `messages={[]}`
- [ ] **Gate 1.3:** User clicks close button (X) → Panel slides out smoothly and FAB remains visible
- [ ] **Gate 1.4:** Mock messages are passed to `ChatPanel` → All messages render with correct styling (yellow for AI, white for user)
- [ ] **Gate 1.5:** AI messages display Clippy avatar (32x32px) to the left, top-aligned
- [ ] **Gate 1.6:** Speech bubble tails render correctly (left-pointing for AI, right-pointing for user)
- [ ] **Gate 1.7:** Message list auto-scrolls to bottom when messages array changes
- [ ] **Gate 1.8:** Input field is disabled with placeholder "Coming soon in PR #10..."
- [ ] **Gate 1.9:** Send button is disabled and shows tooltip on hover

### Edge Cases

- [ ] **Gate 2.1:** Panel is opened and closed rapidly (spam clicking) → No animation glitches or state inconsistencies
- [ ] **Gate 2.2:** Very long message content → Bubble expands vertically without breaking layout
- [ ] **Gate 2.3:** 100+ mock messages → Panel scrolls smoothly, no performance degradation
- [ ] **Gate 2.4:** Panel is open when canvas is resized → Panel adapts to new viewport size without breaking

### Keyboard & Accessibility

- [ ] **Gate 3.1:** Press `Cmd/Ctrl + K` → Chat panel opens
- [ ] **Gate 3.2:** Press `Esc` when panel is open → Chat panel closes
- [ ] **Gate 3.3:** Tab navigation → Focus moves correctly through close button and input field
- [ ] **Gate 3.4:** Screen reader announces messages with correct labels ("Clippy says:", "You said:")
- [ ] **Gate 3.5:** Panel has `role="dialog"` and `aria-label="Chat with Clippy"`

### Visual & UX Polish

- [ ] **Gate 4.1:** Design matches Clippy aesthetic (validated against `clippy.jpg` reference)
- [ ] **Gate 4.2:** Colors are correct (AI: #FFFF99, User: #FFFFFF)
- [ ] **Gate 4.3:** Panel does not obstruct canvas or toolbar when closed
- [ ] **Gate 4.4:** FAB is always accessible (not hidden behind other UI elements)
- [ ] **Gate 4.5:** Retro styling is applied (borders, subtle shadows, Windows 95 vibes)

### Performance

- [ ] **Gate 5.1:** Panel animations run at 60 FPS (verified in Chrome DevTools)
- [ ] **Gate 5.2:** Component renders with 0 console errors or warnings
- [ ] **Gate 5.3:** No unnecessary re-renders (verified with React DevTools Profiler)

---

## 12. Definition of Done (End-to-End)

- [ ] All 6 chat components created (`ChatPanel.tsx`, `MessageBubble.tsx`, `ClippyAvatar.tsx`, `ChatEmptyState.tsx`, `ChatTriggerButton.tsx`, `ChatPanel.css`)
- [ ] `AppShell.tsx` modified to integrate chat UI with mock data
- [ ] All 25 acceptance gates pass (Sections 11.1-11.5)
- [ ] Panel animations are smooth (60 FPS)
- [ ] Empty state and message display work correctly
- [ ] Keyboard shortcuts (`Cmd+K`, `Esc`) functional
- [ ] Accessibility attributes added (`role`, `aria-label`, etc.)
- [ ] Visual design matches Clippy aesthetic (yellow bubbles, speech tails, avatar)
- [ ] Input field is disabled with tooltip (ready for PR #10)
- [ ] 0 linter errors, 0 console warnings
- [ ] Code reviewed and approved

---

## 13. Risks & Mitigations

### Risk 1: Animation Performance
**Risk:** Slide-in/out animations may be janky on lower-end devices or large panels.
**Mitigation:** Use CSS `transform` (GPU-accelerated) instead of `top/left` properties. Test on throttled CPU in Chrome DevTools. Keep panel content lightweight.

### Risk 2: Speech Bubble Tails Positioning
**Risk:** CSS pseudo-elements (`:after`) for speech bubble tails may misalign across different message lengths or fonts.
**Mitigation:** Use absolute positioning with `top` offset to align tails consistently. Test with various message lengths. Provide fallback to simple rounded bubbles if tails are too complex.

### Risk 3: Z-Index Conflicts
**Risk:** Chat panel may appear behind other UI elements (tooltips, modals) or overlap canvas interactions.
**Mitigation:** Establish clear z-index hierarchy in constants file. Panel: z-index 1000, FAB: z-index 1001, tooltips: z-index 1100. Test panel alongside other UI elements.

### Risk 4: Keyboard Shortcut Conflicts
**Risk:** `Cmd/Ctrl + K` may conflict with existing canvas shortcuts.
**Mitigation:** Review existing shortcuts in `useKeyboardShortcuts.ts`. If conflict exists, use `Cmd/Ctrl + /` instead. Document shortcut in UI (tooltip on FAB).

### Risk 5: Empty State Confusion
**Risk:** Users may not understand that chat is non-functional yet (input disabled).
**Mitigation:** Clear messaging in empty state and input placeholder: "Coming soon in PR #10..." Add tooltip on hover. Consider adding a banner: "Chat UI preview — full functionality coming soon!"

---

## 14. Rollout & Telemetry

**Feature Flag:** No feature flag needed for this PR (UI-only, no backend).

**Metrics (Future):**
- Track chat panel open rate
- Track message send attempts (will be 0 for this PR since input is disabled)

**Manual Validation Steps Post-Deploy:**
1. Open chat panel → Verify empty state appears
2. Pass mock messages → Verify all messages render correctly
3. Close panel → Verify smooth animation and FAB remains
4. Test keyboard shortcuts (`Cmd+K`, `Esc`)
5. Test on different screen sizes (1920x1080, 1366x768, 1440x900)

---

## 15. Open Questions

**Q1:** Should the chat panel be a bottom drawer or a right-side panel?
**Decision:** Start with **bottom drawer** (similar to mobile chat UIs). Can be changed to right-side panel based on user feedback.

**Q2:** Should we use the actual `clippy.jpg` image or create an SVG icon?
**Decision:** Try `clippy.jpg` first (32x32px resized). If image quality is poor, create a simple SVG clippy face (paperclip with eyes).

**Q3:** Should the FAB be always visible or hidden when canvas is in drawing mode?
**Decision:** **Always visible** — users should be able to access Clippy at any time.

**Q4:** What is the default state of the chat panel (open or closed)?
**Decision:** **Closed by default** — users opt-in to open chat. Remember state in localStorage for future sessions (out of scope for this PR).

---

## 16. Appendix: Out-of-Scope Backlog

Items explicitly deferred for future PRs:

- [ ] **PR #10:** Wire chat UI to `testAI()` function (send messages, receive responses)
- [ ] **PR #11:** Persist chat history to Firestore (save/load messages)
- [ ] **Real-time sync:** Chat messages sync across multiple users in same canvas
- [ ] **Message editing/deletion:** Users can edit or delete their messages
- [ ] **Rich text formatting:** Markdown rendering, code blocks, etc.
- [ ] **Typing indicators:** Show "Clippy is thinking..." animation
- [ ] **Message reactions:** Emoji reactions to messages
- [ ] **Mobile responsive design:** Chat panel adapts to mobile screens
- [ ] **Dark mode:** Dark theme for chat panel
- [ ] **Conversation history:** View past conversations from other canvases
- [ ] **AI suggestions:** Proactive Clippy suggestions based on canvas activity

---

## Preflight Questionnaire (Completed)

1. **What is the smallest end-to-end user outcome we must deliver in this PR?**
   → Users can open a visually complete chat panel with mock messages and see the Clippy aesthetic.

2. **Who is the primary user and what is their critical action?**
   → Canvas users; critical action is opening/closing the chat panel and seeing the UI.

3. **Must-have vs nice-to-have: what gets cut first if time tight?**
   → Must-have: Panel, messages, empty state, basic styling. Nice-to-have: Retro polish, bounce animation, keyboard shortcuts.

4. **Real-time collaboration requirements (peers, <100ms sync)?**
   → None for this PR (UI only).

5. **Performance constraints (FPS, shape count, latency targets)?**
   → 60 FPS animations, instant empty state render (<50ms).

6. **Error/edge cases we must handle (validation, conflicts, offline)?**
   → Rapid open/close clicks, very long messages, 100+ messages.

7. **Data model changes needed (new fields/collections)?**
   → None (using local state with mock data).

8. **Service APIs required (create/update/delete/subscribe)?**
   → None (no backend calls in this PR).

9. **UI entry points and states (empty, loading, locked, error)?**
   → Entry: FAB button. States: closed, opening, open, closing, empty, with-messages.

10. **Accessibility/keyboard expectations?**
    → Keyboard shortcuts (`Cmd+K`, `Esc`), screen reader support, focus management.

11. **Security/permissions implications?**
    → None (no data writes).

12. **Dependencies or blocking integrations?**
    → Depends on PR #1 (Auth context for user info) and PR #2 (Canvas layout for positioning).

13. **Rollout strategy (flag, migration) and success metrics?**
    → Direct rollout (no flag), manual validation post-deploy.

14. **What is explicitly out of scope for this iteration?**
    → Backend integration (PR #10), persistence (PR #11), real-time sync, rich text, typing indicators.

---

## Authoring Notes

- The chat UI is the **most visible part** of the AI feature — first impressions matter.
- Prioritize **visual polish** and **Clippy nostalgia** to make this memorable.
- Keep components **modular and reusable** — PR #10 will wire in real data with minimal changes.
- Test animations on various screen sizes and frame rates.
- Reference `clippy.jpg` frequently to match the aesthetic.

---

**END OF PRD**

