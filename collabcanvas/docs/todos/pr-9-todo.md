# PR-9 TODO — Clippy-Style Chat UI Component

**Branch**: `feature/pr-9-clippy-chat-ui`  
**Source PRD**: `collabcanvas/docs/prds/pr-9-prd.md`  
**Owner (Agent)**: Building Agent (TBD)

---

## 0. Clarifying Questions & Assumptions

- **Questions:** None — PRD is comprehensive and approved
- **Assumptions (unblock coding now; confirm in PR):**
  - Bottom drawer position for chat panel (can be adjusted to right-side if needed)
  - Using `clippy.jpg` for avatar (will create SVG fallback if image quality is poor)
  - Mock data structure matches future Firestore schema for easy integration in PR #10
  - Panel z-index: 1000, FAB z-index: 1001 (no conflicts with existing UI)

---

## 1. Repo Prep

- [ ] Create branch `feature/pr-9-clippy-chat-ui`
  - Command: `git checkout -b feature/pr-9-clippy-chat-ui`
  - Test Gate: Branch created and checked out successfully

- [ ] Read PRD thoroughly
  - File: `collabcanvas/docs/prds/pr-9-prd.md`
  - Test Gate: All 13 functional requirements understood

- [ ] Review design reference
  - File: `collabcanvas/docs/images/clippy.jpg`
  - Test Gate: Clippy aesthetic and color scheme (#FFFF99) confirmed

---

## 2. Setup Component Structure

- [ ] Create `src/components/Chat/` directory
  - Command: `mkdir -p src/components/Chat`
  - Test Gate: Directory exists

- [ ] Create TypeScript interfaces file
  - File: `src/components/Chat/types.ts`
  - Define `ChatMessage` interface:
    ```typescript
    export interface ChatMessage {
      id: string;
      role: 'user' | 'assistant';
      content: string;
      timestamp: Date;
    }
    ```
  - Test Gate: File created with no linter errors

- [ ] Create CSS file for chat styling
  - File: `src/components/Chat/ChatPanel.css`
  - Add empty file with header comment
  - Test Gate: File created

---

## 3. Component 1: Clippy Avatar

- [ ] Create `ClippyAvatar.tsx` component
  - File: `src/components/Chat/ClippyAvatar.tsx`
  - Props: `size: 'small' | 'large'`
  - Small = 32x32px, Large = 64x64px
  - Test Gate: Component renders without errors

- [ ] Implement image rendering
  - Use `clippy.jpg` from `docs/images/clippy.jpg`
  - Add `alt` text: "Clippy assistant"
  - Test Gate: Image displays at correct size (32x32 and 64x64)

- [ ] Add styling
  - Border-radius: 50% (circular avatar)
  - Border: 1px solid #000
  - Test Gate: Avatar appears circular with border

- [ ] Create SVG fallback (if needed)
  - If `clippy.jpg` quality is poor, create simple SVG paperclip icon
  - Test Gate: SVG displays correctly as fallback

---

## 4. Component 2: Message Bubble

- [ ] Create `MessageBubble.tsx` component
  - File: `src/components/Chat/MessageBubble.tsx`
  - Props: `message: ChatMessage`
  - Test Gate: Component renders without errors

- [ ] Implement conditional styling
  - AI messages: left-aligned, yellow background (#FFFF99)
  - User messages: right-aligned, white background (#FFFFFF)
  - Test Gate: Messages render with correct alignment and colors

- [ ] Add speech bubble tail (CSS pseudo-element)
  - Use `:after` pseudo-element
  - AI bubble: tail pointing left
  - User bubble: tail pointing right
  - CSS triangle using borders:
    ```css
    .bubble-ai::after {
      content: '';
      position: absolute;
      left: -10px;
      top: 10px;
      width: 0;
      height: 0;
      border-top: 10px solid transparent;
      border-bottom: 10px solid transparent;
      border-right: 10px solid #FFFF99;
    }
    ```
  - Test Gate: Tails render correctly pointing in the right direction

- [ ] Add border and padding
  - Border: 1px solid #000 (AI), 1px solid #CCC (user)
  - Border-radius: 12px
  - Padding: 12px 16px
  - Test Gate: Bubbles have proper spacing and rounded corners

- [ ] Integrate ClippyAvatar for AI messages
  - Render `<ClippyAvatar size="small" />` to the left of AI messages
  - Position avatar top-aligned with bubble
  - Test Gate: Clippy avatar appears next to AI messages only

- [ ] Add timestamp display
  - Format: "2:34 PM" (small, gray text below bubble)
  - Test Gate: Timestamps display correctly

---

## 5. Component 3: Empty State

- [ ] Create `ChatEmptyState.tsx` component
  - File: `src/components/Chat/ChatEmptyState.tsx`
  - Test Gate: Component renders without errors

- [ ] Add large Clippy avatar
  - Render `<ClippyAvatar size="large" />`
  - Center-align avatar
  - Test Gate: 64x64px Clippy avatar is centered

- [ ] Add greeting text
  - Text: "👋 Hi! I'm Clippy, your canvas assistant. Ask me anything!"
  - Font size: 18px
  - Center-align text
  - Test Gate: Greeting text displays below avatar

- [ ] Add subtle bounce animation (optional polish)
  - CSS keyframe animation on avatar
  - Duration: 1s, ease-out
  - Test Gate: Avatar bounces gently on first appearance

- [ ] Style container
  - Padding: 40px
  - Center all content vertically and horizontally
  - Test Gate: Empty state is centered in panel

---

## 6. Component 4: Chat Panel (Main Component)

- [ ] Create `ChatPanel.tsx` component
  - File: `src/components/Chat/ChatPanel.tsx`
  - Props: `isOpen: boolean`, `onClose: () => void`, `messages: ChatMessage[]`
  - Test Gate: Component renders without errors

- [ ] Implement panel container
  - Fixed position (bottom drawer)
  - Width: 400px, Height: 500px
  - Background: #F5F5F5
  - Test Gate: Panel container renders at bottom of screen

- [ ] Add slide-in/out animations
  - Closed: `transform: translateY(100%)` (off-screen)
  - Open: `transform: translateY(0)`
  - Transition: 250ms ease-out (opening), 250ms ease-in (closing)
  - Test Gate: Panel slides in/out smoothly when `isOpen` prop changes

- [ ] Create panel header
  - Title: "Chat with Clippy" (bold, 16px)
  - Close button (X icon) in top-right
  - Border-bottom: 1px solid #CCC
  - Padding: 16px
  - Test Gate: Header displays with title and close button

- [ ] Wire close button
  - onClick triggers `onClose` prop
  - Test Gate: Clicking X calls `onClose` callback

- [ ] Create message list area
  - Scrollable container (overflow-y: auto)
  - Flex-grow: 1 (fills available space)
  - Padding: 16px
  - Test Gate: Message area scrolls when content overflows

- [ ] Implement conditional rendering
  - If `messages.length === 0`: render `<ChatEmptyState />`
  - If `messages.length > 0`: render message list
  - Test Gate: Empty state shows when no messages, list shows when messages exist

- [ ] Map and render messages
  - Map over `messages` array
  - Render `<MessageBubble>` for each message
  - Test Gate: All messages in array render correctly

- [ ] Implement auto-scroll to bottom
  - Use `useEffect` to scroll to bottom when `messages` changes
  - Use `scrollIntoView({ behavior: 'smooth' })`
  - Test Gate: Panel auto-scrolls to latest message

- [ ] Add smart scroll behavior
  - Only auto-scroll if user is already at bottom
  - Don't interrupt manual scrolling upward
  - Test Gate: Auto-scroll doesn't interrupt user reading old messages

- [ ] Create input area (disabled)
  - Input field with placeholder: "Coming soon in PR #10..."
  - Disabled attribute: `disabled={true}`
  - Send button (disabled)
  - Border-top: 1px solid #CCC
  - Padding: 16px
  - Test Gate: Input and button render but are disabled

- [ ] Add tooltip to input
  - Tooltip: "Chat functionality will be connected in the next PR"
  - Trigger: hover over input or button
  - Test Gate: Tooltip appears on hover

- [ ] Import and apply CSS
  - Import `./ChatPanel.css`
  - Apply all styles defined in Section 7
  - Test Gate: Panel matches design specs (colors, borders, spacing)

---

## 7. Component 5: Chat Trigger Button (FAB)

- [ ] Create `ChatTriggerButton.tsx` component
  - File: `src/components/Chat/ChatTriggerButton.tsx`
  - Props: `onClick: () => void`
  - Test Gate: Component renders without errors

- [ ] Implement floating button
  - Fixed position: bottom-right corner
  - Position: `bottom: 24px, right: 24px`
  - Width/Height: 56px (circular)
  - Background: #0078D4 (blue accent)
  - Test Gate: Button appears in bottom-right corner

- [ ] Add Clippy icon
  - Use chat bubble icon or small Clippy image
  - Icon size: 24x24px
  - Center icon in button
  - Test Gate: Icon is visible and centered

- [ ] Wire onClick handler
  - onClick triggers `onClick` prop
  - Test Gate: Clicking button calls `onClick` callback

- [ ] Add hover effects
  - Hover: slight scale (1.05x), darker blue
  - Transition: 200ms ease
  - Test Gate: Button scales and darkens on hover

- [ ] Add shadow
  - Box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3)
  - Test Gate: Button has visible elevation shadow

- [ ] Add accessibility
  - aria-label: "Open chat with Clippy"
  - role: "button"
  - Test Gate: Screen reader announces button correctly

---

## 8. CSS Styling (ChatPanel.css)

- [ ] Add speech bubble styles
  - `.message-bubble-ai` and `.message-bubble-user` classes
  - Background colors: #FFFF99 (AI), #FFFFFF (user)
  - Borders: 1px solid #000 (AI), 1px solid #CCC (user)
  - Border-radius: 12px
  - Padding: 12px 16px
  - Test Gate: Bubbles styled correctly

- [ ] Add speech bubble tail styles
  - `.message-bubble-ai::after` and `.message-bubble-user::after`
  - CSS triangles using border tricks
  - Position: absolute, left/right offset
  - Test Gate: Tails appear and point correctly

- [ ] Add panel animation keyframes
  - `@keyframes slideIn` and `@keyframes slideOut`
  - Transform from translateY(100%) to translateY(0)
  - Test Gate: Animations defined and functional

- [ ] Add retro styling
  - Subtle gradients (optional)
  - Windows 95-style borders (inset/outset effects)
  - Test Gate: Retro aesthetic achieved

- [ ] Add empty state animation
  - `@keyframes bounce` for Clippy avatar
  - Transform: translateY(-10px) at 50%
  - Test Gate: Bounce animation plays on empty state

- [ ] Add responsive adjustments
  - Media query for smaller screens (< 768px)
  - Panel width: 100% on mobile
  - Test Gate: Panel adapts to narrow viewports

---

## 9. Integration with AppShell

- [ ] Open `AppShell.tsx`
  - File: `src/components/Layout/AppShell.tsx`
  - Test Gate: File opened

- [ ] Add state for chat panel
  - `const [isChatOpen, setIsChatOpen] = useState(false);`
  - Test Gate: State added with no errors

- [ ] Create mock messages array
  - Define 3-5 mock messages with mix of user/AI
  - Example:
    ```typescript
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
      {
        id: '3',
        role: 'assistant',
        content: 'Of course! I can help you create shapes, organize them, and more. What would you like to do?',
        timestamp: new Date(),
      },
    ];
    ```
  - Test Gate: Mock data compiles with no type errors

- [ ] Import chat components
  - Import `ChatPanel` and `ChatTriggerButton`
  - Test Gate: Imports resolve correctly

- [ ] Render ChatTriggerButton
  - Add `<ChatTriggerButton onClick={() => setIsChatOpen(true)} />`
  - Position outside main canvas area
  - Test Gate: FAB renders in bottom-right corner

- [ ] Render ChatPanel
  - Add `<ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} messages={mockMessages} />`
  - Position with z-index above canvas
  - Test Gate: Panel renders and responds to `isOpen` state

- [ ] Test open/close flow
  - Click FAB → panel opens
  - Click X → panel closes
  - Test Gate: Panel opens and closes smoothly

---

## 10. Keyboard Shortcuts

- [ ] Add keyboard shortcut hook
  - Option 1: Create `useKeyboardShortcuts` hook in chat component
  - Option 2: Extend existing `useKeyboardShortcuts.ts` hook
  - Test Gate: Hook is created or extended

- [ ] Implement Esc to close
  - Listen for `keydown` event, check for `event.key === 'Escape'`
  - Only trigger when `isChatOpen === true`
  - Call `setIsChatOpen(false)`
  - Test Gate: Pressing Esc closes panel

- [ ] Implement Enter to send (placeholder)
  - Listen for Enter key in input field
  - Since input is disabled, add comment: "// TODO: Wire to AI service in PR #10"
  - Test Gate: Enter handler is defined but does nothing (input disabled)

- [ ] Add keyboard shortcuts to accessibility docs
  - Add comment in code: "Keyboard shortcuts: Esc to close, Enter to send (coming in PR #10)"
  - Test Gate: Shortcuts documented in code

---

## 11. Accessibility Implementation

- [ ] Add ARIA attributes to ChatPanel
  - `role="dialog"`
  - `aria-label="Chat with Clippy"`
  - `aria-modal="true"`
  - Test Gate: Attributes added

- [ ] Add ARIA attributes to message list
  - `role="log"`
  - `aria-live="polite"`
  - Test Gate: Attributes added

- [ ] Add ARIA labels to messages
  - AI messages: `aria-label="Clippy says: [content]"`
  - User messages: `aria-label="You said: [content]"`
  - Test Gate: Screen reader announces messages correctly

- [ ] Add ARIA label to close button
  - `aria-label="Close chat"`
  - Test Gate: Screen reader announces "Close chat"

- [ ] Add ARIA label to FAB
  - `aria-label="Open chat with Clippy"`
  - Test Gate: Screen reader announces button purpose

- [ ] Implement focus management
  - When panel opens, focus moves to input field
  - When panel closes, focus returns to FAB
  - Use `useRef` and `.focus()` method
  - Test Gate: Focus moves correctly on open/close

- [ ] Test tab navigation
  - Tab order: Close button → Input field → Send button
  - Test Gate: Tab key navigates correctly through panel

---

## 12. Testing & Validation

### a) Component Tests (Unit)

- [ ] Test ClippyAvatar rendering
  - Renders with small and large sizes
  - Test Gate: Both sizes render correctly

- [ ] Test MessageBubble rendering
  - Renders AI message (left-aligned, yellow)
  - Renders user message (right-aligned, white)
  - Test Gate: Both message types render with correct styles

- [ ] Test ChatEmptyState rendering
  - Displays large Clippy and greeting text
  - Test Gate: Empty state renders correctly

- [ ] Test ChatPanel with empty messages
  - Renders empty state when `messages={[]}`
  - Test Gate: Empty state appears

- [ ] Test ChatPanel with messages
  - Renders message list when `messages={mockMessages}`
  - Auto-scrolls to bottom
  - Test Gate: All messages display and scroll works

- [ ] Test ChatTriggerButton
  - Calls onClick when clicked
  - Test Gate: onClick callback fires

### b) Integration Tests

- [ ] Test open/close flow
  - Click FAB → panel opens with animation
  - Click X → panel closes with animation
  - Test Gate: Full open/close cycle works

- [ ] Test rapid clicking
  - Click FAB multiple times quickly
  - No animation glitches or state issues
  - Test Gate: Panel handles rapid clicks gracefully

- [ ] Test with 100+ messages
  - Create mock array with 100 messages
  - Panel scrolls smoothly
  - No performance degradation
  - Test Gate: Handles large message count

- [ ] Test message rendering
  - Pass mock messages with varied lengths
  - Short message: "Hi"
  - Long message: 500 characters
  - Test Gate: Bubbles expand correctly without breaking layout

- [ ] Test keyboard shortcuts
  - Open panel, press Esc → panel closes
  - Tab through panel → focus moves correctly
  - Test Gate: Keyboard navigation works

### c) Visual Tests

- [ ] Test color scheme
  - AI bubbles: #FFFF99 (yellow)
  - User bubbles: #FFFFFF (white)
  - Panel background: #F5F5F5 (light gray)
  - Test Gate: Colors match design specs

- [ ] Test speech bubble tails
  - AI tails point left
  - User tails point right
  - Tails align with bubbles
  - Test Gate: Tails render correctly

- [ ] Test Clippy avatar positioning
  - Avatar is left of AI messages
  - Avatar is top-aligned with bubble
  - Test Gate: Avatar positioning is correct

- [ ] Test panel positioning
  - Panel doesn't obstruct canvas when closed
  - Panel overlays canvas when open
  - FAB is always visible
  - Test Gate: Z-index and positioning work correctly

- [ ] Compare to reference image
  - Open `collabcanvas/docs/images/clippy.jpg`
  - Validate aesthetic matches
  - Test Gate: Design captures Clippy nostalgia

### d) Performance Tests

- [ ] Test animation performance
  - Open Chrome DevTools Performance tab
  - Record panel open/close animations
  - Check frame rate: should be 60 FPS
  - Test Gate: Animations run at 60 FPS

- [ ] Test scroll performance
  - Create 100 messages, scroll through list
  - Check for jank or stuttering
  - Test Gate: Smooth scrolling at 60 FPS

- [ ] Check for console errors
  - Open browser console
  - Open/close panel, interact with UI
  - Test Gate: 0 errors, 0 warnings

- [ ] Check for unnecessary re-renders
  - Use React DevTools Profiler
  - Open/close panel, add messages
  - Test Gate: Components re-render only when needed

---

## 13. Polish & Edge Cases

- [ ] Handle long messages
  - Test with 1000+ character message
  - Bubble should wrap text, expand vertically
  - Test Gate: Long messages don't break layout

- [ ] Handle empty message content
  - Test with `content: ""`
  - Should render empty bubble or skip rendering
  - Test Gate: Empty messages handled gracefully

- [ ] Handle special characters
  - Test with emoji, newlines, HTML tags
  - Should display raw text (no XSS vulnerabilities)
  - Test Gate: Special characters display safely

- [ ] Test panel resize
  - Open panel, resize browser window
  - Panel should adapt to new size
  - Test Gate: Panel responsive to viewport changes

- [ ] Add loading skeleton (optional)
  - While mock messages are "loading", show skeleton UI
  - Test Gate: Skeleton appears briefly on mount

- [ ] Add tooltips
  - Hover tooltips on disabled input/button
  - Tooltip text: "Chat functionality will be connected in the next PR"
  - Test Gate: Tooltips appear on hover

---

## 14. Documentation

- [ ] Add inline code comments
  - Explain animation logic
  - Explain auto-scroll behavior
  - Explain speech bubble tail CSS
  - Test Gate: Key sections have helpful comments

- [ ] Document component props
  - Add JSDoc comments to all component interfaces
  - Example:
    ```typescript
    /**
     * Chat panel component with Clippy-style UI
     * @param isOpen - Whether the panel is visible
     * @param onClose - Callback when close button is clicked
     * @param messages - Array of chat messages to display
     */
    ```
  - Test Gate: All props documented

- [ ] Update README (if needed)
  - Add note about chat UI (PR #9)
  - Link to PRD
  - Test Gate: README mentions chat feature

- [ ] Create PR description
  - Use structure from TODO template (Section 8)
  - Goal: Create Clippy-style chat UI (no backend yet)
  - Files changed: 6 new components, AppShell.tsx modified
  - Test steps: Open panel, view messages, close panel, test keyboard shortcuts
  - Known limitations: Input disabled, no backend integration
  - Links: PRD, TODO, design reference
  - Test Gate: PR description is comprehensive

---

## 15. Linting & Final Checks

- [ ] Run ESLint
  - Command: `npm run lint`
  - Test Gate: 0 errors, 0 warnings

- [ ] Run TypeScript compiler
  - Command: `npx tsc --noEmit`
  - Test Gate: 0 type errors

- [ ] Format code
  - Command: `npm run format` (if available) or use Prettier
  - Test Gate: All files formatted consistently

- [ ] Check imports
  - Remove unused imports
  - Verify all imports resolve
  - Test Gate: No import errors

- [ ] Check for console.log statements
  - Search for `console.log` in new files
  - Remove or comment out debug logs
  - Test Gate: No debug logs left in code

---

## 16. Pre-Commit Checklist

- [ ] All 25 acceptance gates from PRD pass
- [ ] Component renders with 0 console errors
- [ ] Panel animations are smooth (60 FPS)
- [ ] Empty state displays correctly
- [ ] Mock messages render with correct styling
- [ ] Keyboard shortcuts work (Esc to close)
- [ ] Accessibility attributes added (ARIA labels, roles)
- [ ] Visual design matches Clippy aesthetic
- [ ] Input field disabled with tooltip
- [ ] FAB always visible in bottom-right
- [ ] Z-index hierarchy correct (panel above canvas, below tooltips)
- [ ] Code is well-commented
- [ ] No linter errors
- [ ] Ready for PR #10 backend integration

---

## 17. Create Pull Request

- [ ] Commit all changes
  - Command: `git add .`
  - Command: `git commit -m "feat: Add Clippy-style chat UI component (PR #9)"`
  - Test Gate: Commit successful

- [ ] Push branch to remote
  - Command: `git push origin feature/pr-9-clippy-chat-ui`
  - Test Gate: Branch pushed successfully

- [ ] Open pull request on GitHub
  - Title: "PR #9: Clippy-Style Chat UI Component"
  - Description: Use template from Section 14
  - Test Gate: PR created

- [ ] Link PRD and TODO in PR description
  - Link: `collabcanvas/docs/prds/pr-9-prd.md`
  - Link: `collabcanvas/docs/todos/pr-9-todo.md`
  - Test Gate: Links added

- [ ] Request review
  - Tag reviewers
  - Test Gate: Review requested

---

## Copyable Checklist (for PR description)

```markdown
## PR #9: Clippy-Style Chat UI Component

### Goal
Create a retro Clippy-style chat UI component with speech bubble messages, Clippy avatar, and empty state. **No backend integration** — pure UI layer ready for PR #10.

### Files Changed
- ✅ Created `src/components/Chat/ChatPanel.tsx`
- ✅ Created `src/components/Chat/MessageBubble.tsx`
- ✅ Created `src/components/Chat/ClippyAvatar.tsx`
- ✅ Created `src/components/Chat/ChatEmptyState.tsx`
- ✅ Created `src/components/Chat/ChatTriggerButton.tsx`
- ✅ Created `src/components/Chat/ChatPanel.css`
- ✅ Created `src/components/Chat/types.ts`
- ✅ Modified `src/components/Layout/AppShell.tsx`

### Test Steps
- [ ] Click FAB in bottom-right corner → Chat panel opens
- [ ] Panel displays empty state with Clippy greeting
- [ ] Pass mock messages → Messages render with correct styling
- [ ] AI messages: yellow bubbles, left-aligned, with Clippy avatar
- [ ] User messages: white bubbles, right-aligned
- [ ] Speech bubble tails point correctly (left for AI, right for user)
- [ ] Click X button → Panel closes smoothly
- [ ] Press Esc → Panel closes
- [ ] Tab navigation works through panel elements
- [ ] Input field is disabled with tooltip
- [ ] Test with 100 messages → Smooth scrolling
- [ ] Check Chrome DevTools → 60 FPS animations, 0 console errors

### Known Limitations
- Input field is disabled (backend integration in PR #10)
- No message persistence (Firestore integration in PR #11)
- No real-time sync across users yet

### Links
- PRD: `collabcanvas/docs/prds/pr-9-prd.md`
- TODO: `collabcanvas/docs/todos/pr-9-todo.md`
- Design Reference: `collabcanvas/docs/images/clippy.jpg`
```

---

**END OF TODO**

