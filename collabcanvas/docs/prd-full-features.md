Great! If you already have `testAI("prompt")` working from the console, then you've completed the backend API integration. Let me update the PRD to reflect this:

# Simplified Chat Canvas — Product Requirements

**Tagline:** Real-time collaborative canvas with AI chat assistant

**Business Model:** Free (no monetization)

**Status:** In Development (8-hour sprint)

---

## 🎯 What It Is

A collaborative MS Paint-style canvas with a working AI chat interface. Users can draw with friends in real-time and interact with an AI assistant. Focus: **performance and functionality**.

---

## 👤 User Flow

1. **Sign up** → Create account
2. **Select** → Create a new canvas or pick up from a past one
3. **Draw** → Use Paint tools on canvas
4. **Collaborate** → Share link, friends edit in real-time
5. **Chat with AI** → Ask questions, get help, request drawings

---

## 📐 Technical Specs

- **Canvas:** Standard web canvas size
- **AI Chat:** OpenAI/Anthropic API integration with persistent chat history
- **AI Backend:** Already functional - `testAI("prompt")` works from console
- **Performance:** Optimized real-time sync, debounced updates, lazy loading

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

### Performance Optimizations (CRITICAL - HOURS 1-2)
**Must fix BEFORE adding AI chat to avoid compounding issues**
- [ ] Debounce canvas updates (500ms delay - reduce Firestore writes)
- [ ] Batch Firestore writes (bulk updates instead of per-shape)
- [ ] Optimize shape rendering (canvas vs DOM)
- [ ] Reduce real-time listener frequency
- [ ] Add connection status indicator
- [ ] Add loading states
- [ ] Test performance under load (multiple users)

### Canvas Management (HOURS 2-3)
- [ ] Canvas list/gallery view (show past canvases)
- [ ] Create new canvas button
- [ ] Canvas naming
- [ ] Canvas sharing (generate shareable link)
- [ ] Delete canvas

### AI Chat UI (CRITICAL - HOURS 3-5)
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

### AI Integration (SIMPLIFIED - HOUR 6)
**Backend already works, just need persistence**
- [ ] Store chat history in Firestore (chatMessages collection)
- [ ] Load chat history on canvas open
- [ ] Display historical messages in UI
- [ ] Error handling (API failures, rate limits)

### Nice to Have (If Time Permits - HOURS 7-8)
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

### Hour 1-2: Performance Fixes (CRITICAL - DO FIRST)
**Goal: Stabilize existing features before adding new ones**
1. Implement debouncing on canvas updates (500ms delay)
2. Batch Firestore writes (bulk updates)
3. Add connection status indicator
4. Optimize shape rendering
5. Test with multiple users
6. Reduce real-time listener frequency

### Hour 2-3: Canvas Management
**Goal: Allow users to create/select canvases**
1. Create canvas gallery/list view
2. Add "New Canvas" button
3. Implement canvas selection
4. Add canvas naming
5. Add delete canvas functionality

### Hour 3-5: AI Chat UI (CORE FEATURE)
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

### Hour 6: Chat Persistence
**Goal: Save and load chat history**
1. Create Firestore chatMessages collection
2. Save user messages to Firestore
3. Save AI responses to Firestore
4. Load chat history when canvas opens
5. Display historical messages

### Hour 7-8: Polish & Testing
**Goal: Ensure demo-ready stability**
1. Test real-time collaboration under load
2. Test AI chat functionality end-to-end
3. Fix critical bugs
4. Test canvas gallery/selection
5. Performance verification
6. Add pencil tool if time permits
7. Deploy

---

## 🎯 Success Criteria (Demo Ready)

**Must Have:**
- ✅ Working canvas with basic shapes
- ✅ Real-time collaboration (stable, performant)
- ✅ Canvas gallery (create new / select past)
- ✅ **Functional Clippy-style AI chat interface**
- ✅ **AI responds to messages** (using existing `testAI()`)
- ✅ Chat history persists per canvas
- ✅ No critical performance issues
- ✅ Performance: < 100ms canvas updates, < 3s AI responses

**Nice to Have:**
- Canvas naming/management
- Pencil tool for freehand drawing
- Advanced AI features (shape generation from prompts)
- Canvas thumbnails

---

## 🔧 Performance Targets

- **Canvas updates:** < 100ms latency
- **Chat response:** < 3s for AI reply
- **Page load:** < 2s initial render
- **Firestore reads:** < 50 per session
- **Firestore writes:** Batched, debounced (max 2 writes/second)
- **Real-time listeners:** Throttled to 500ms intervals

---

## 🎨 Clippy UI Specifications

**Visual Style:**
- Speech bubble containers (rounded, with tail pointing to Clippy)
- Clippy avatar: Small icon (32x32px) next to AI messages
- Color scheme: Yellow (#FFFF99) background for AI bubbles, white for user
- Border: 1-2px solid black (retro Windows style)
- Font: System font, clean and readable

**Interaction:**
- Typing indicator: "Clippy is typing..." with animated dots
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
- **Scope:** AI chat UI + performance + canvas management only
- **No monetization:** Remove all payment logic
- **No postcard features:** Remove all mailing logic
- **Keep existing:** Don't break working collaboration features
- **Performance first:** Must stabilize before adding AI UI

---

## 🚨 Critical Path Dependencies

1. **Performance fixes MUST be completed first** - unstable base will break under AI load
2. **Canvas management before chat** - users need to select a canvas to chat about
3. **Chat UI connects to existing testAI()** - backend already done, just need frontend
4. **Testing throughout** - don't wait until Hour 8 to discover blockers

---

**Last Updated:** 2025-10-19 (8-hour sprint version - AI backend complete)