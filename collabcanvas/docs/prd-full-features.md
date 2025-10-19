# Simplified Chat Canvas — Product Requirements

**Tagline:** Real-time collaborative canvas with AI chat assistant

**Business Model:** Free (no monetization)

**Status:** In Development (8-hour sprint)

---

## 🎯 What It Is

A collaborative MS Paint-style canvas with a working AI chat interface. Users can draw with friends in real-time and interact with an AI assistant. Focus: **getting AI chat working first**.

---

## 👤 User Flow

1. **Sign up** → Create account
2. **Select** → Create a new canvas or pick up from a past one
3. **Draw** → Use Paint tools on canvas
4. **Chat with AI** → Ask questions, get help, request drawings
5. **Collaborate** → Share link, friends edit in real-time

---

## 📐 Technical Specs

- **Canvas:** Standard web canvas size
- **AI Chat:** OpenAI/Anthropic API integration with persistent chat history
- **AI Backend:** Already functional - `testAI("prompt")` works from console
- **Real-time sync:** Existing collaboration features maintained

---

## 🎨 Design Notes

**AI Chat Interface:** Microsoft Word Office Assistant Clippy vibes
- Reference image: `collabcanvas/docs/images/clippy.jpg`
- Speech bubble style messages (not flat modern chat)
- Playful, friendly tone in AI responses
- Small Clippy icon/avatar next to AI messages
- Yellow/white color scheme reminiscent of the original
- User/AI message distinction
- Typing indicators
- Message history

---

## ✅ Feature Checklist (8-Hour Priority)

### Infrastructure (Already Working)
- [x] User authentication (signup/login)
- [x] Canvas persistence (Firestore)
- [x] Real-time collaboration
- [x] Shape tools (rectangle, circle, triangle, text)
- [x] Shape manipulation (move, resize, rotate, delete)
- [x] Color palette
- [x] Live cursors
- [x] AI API endpoint (`testAI()` function working)
- [x] AI message sending capability

### AI Chat UI (CRITICAL - HOURS 1-4)
**Connect existing `testAI()` function to user interface**
- [ ] Chat UI component (side or bottom panel)
- [ ] Speech bubble style message display
- [ ] Clippy icon/avatar for AI messages
- [ ] Message input field
- [ ] User vs AI message distinction (styling)
- [ ] Typing indicators
- [ ] Loading states
- [ ] Error handling UI
- [ ] Wire up input field to call `testAI()` function
- [ ] Display AI responses in UI

### AI Integration (SIMPLIFIED - HOUR 5)
**Backend already works, just need persistence**
- [ ] Store chat history in Firestore (chatMessages collection)
- [ ] Load chat history on canvas open
- [ ] Display historical messages in UI
- [ ] Error handling (API failures, rate limits)

### Canvas Management (HOURS 6-7)
- [ ] Canvas list/gallery view (show past canvases)
- [ ] Create new canvas button
- [ ] Canvas naming
- [ ] Canvas sharing (generate shareable link)
- [ ] Delete canvas

### Nice to Have (If Time Permits - HOUR 8)
- [ ] Pencil tool (free-form drawing)
- [ ] Advanced AI features (shape generation from prompts)
- [ ] Canvas thumbnails in gallery
- [ ] Search/filter canvases

---

## 📊 Database Schema

```typescript
// users collection (SIMPLIFIED)
{
  id: string,
  email: string,
  createdAt: Timestamp,
}

// canvases collection (SIMPLIFIED)
{
  id: string,
  userId: string, // owner
  name: string,
  shareLink: string,
  collaborators: [userId],
  createdAt: Timestamp,
  updatedAt: Timestamp,
}

// chatMessages collection (NEW)
{
  id: string,
  canvasId: string, // link chat to canvas
  userId: string,
  role: 'user' | 'assistant',
  content: string,
  createdAt: Timestamp,
}
```

---

## 🚀 8-Hour Implementation Plan (REVISED)

### Hour 1-4: AI Chat UI (CORE FEATURE - START HERE)
**Goal: Build Clippy-style chat interface and connect to existing testAI()**
1. Create chat panel component (side/bottom)
2. Design speech bubble messages
3. Add Clippy icon/avatar
4. Implement message input field
5. Style user vs AI messages
6. Wire input to `testAI()` function
7. Add typing/loading indicators
8. Add error states
9. Display AI responses in UI
10. Test end-to-end flow

### Hour 5: Chat Persistence
**Goal: Save and load chat history**
1. Create Firestore chatMessages collection
2. Save user messages to Firestore
3. Save AI responses to Firestore
4. Load chat history when canvas opens
5. Display historical messages

### Hour 6-7: Canvas Management
**Goal: Allow users to create/select canvases**
1. Create canvas gallery/list view
2. Add "New Canvas" button
3. Implement canvas selection
4. Add canvas naming
5. Generate shareable links
6. Add delete canvas functionality

### Hour 8: Polish & Testing
**Goal: Ensure demo-ready stability**
1. Test AI chat functionality end-to-end
2. Test canvas gallery/selection
3. Fix critical bugs
4. Test real-time collaboration
5. Add pencil tool if time permits
6. Deploy

---

## 🎯 Success Criteria (Demo Ready)

**Must Have:**
- ✅ Working canvas with basic shapes
- ✅ Real-time collaboration (working as-is)
- ✅ **Functional Clippy-style AI chat interface**
- ✅ **AI responds to messages** (using existing `testAI()`)
- ✅ Chat history persists per canvas
- ✅ Canvas gallery (create new / select past)

**Nice to Have:**
- Canvas naming/management
- Pencil tool for freehand drawing
- Advanced AI features (shape generation from prompts)
- Canvas thumbnails

---

## 🎨 Clippy UI Specifications

**Visual Style:**
- Speech bubble containers (rounded, with tail pointing to Clippy)
- Clippy avatar: Small icon (32x32px) next to AI messages
- Color scheme: Yellow (#FFFF99) background for AI bubbles, white for user
- Border: 1-2px solid black (retro Windows style)
- Font: System font, clean and readable

**Interaction:**
- Typing indicator: "Clippy is thinking..." with animated dots
- Error state: Clippy looking confused with error message
- Empty state: Clippy greeting message on first load

**Tone:**
- Friendly, helpful, slightly playful
- Avoid overly formal language
- Use encouraging phrases ("Great question!", "Let me help with that!")

---

## 🔌 AI Integration Details

**Existing Implementation:**
- `testAI("prompt")` function available in browser console
- Backend API already configured and working
- Returns AI responses successfully

**What's Needed:**
1. Connect UI input field to `testAI()` function
2. Display responses in chat UI
3. Save messages to Firestore for persistence
4. Load historical messages on canvas open

---

## ⚠️ Key Constraints

- **Time:** 8 hours total (effectively 6 hours due to existing AI backend)
- **Scope:** AI chat UI first, then canvas management
- **No monetization:** Remove all payment logic
- **No postcard features:** Remove all mailing logic
- **Keep existing:** Don't break working collaboration features
- **AI chat is priority #1**

---

## 🚨 Critical Path Dependencies

1. **AI Chat UI first** - this is the main feature to demo
2. **Chat persistence second** - make the chat useful
3. **Canvas management third** - needed but lower priority
4. **Testing throughout** - don't wait until Hour 8 to discover blockers

---
