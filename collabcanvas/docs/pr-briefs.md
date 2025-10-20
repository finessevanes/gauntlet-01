# PR Briefs - CollabCanvas

This document provides high-level briefs for all planned Pull Requests. These briefs serve as starting points for Planning Agents to create detailed PRDs.

---

## Phase 1: Foundation (Completed)

### PR #1: Authentication System

**Brief:** Implement Firebase Authentication with email/password signup and login functionality. This PR establishes the authentication foundation for the application, including signup form with password validation, login form, authentication context provider, and protected routes. The implementation ensures secure user management and session handling across the application.

**Dependencies:** None

**Complexity:** Medium

**Phase:** 1

---

### PR #2: Canvas Core & Shape Tools

**Brief:** Build the fundamental canvas rendering system and basic shape tools (rectangle, circle, triangle). This PR creates the core canvas infrastructure using Konva.js (react-konva library built on HTML5 Canvas), implements shape creation with mouse interactions, and establishes the shape data model in Firestore. Shapes are persistently stored and support properties including position, size, color, rotation, and z-index. The implementation includes real-time synchronization, drag-and-drop interactions, and comprehensive shape manipulation capabilities.

**Dependencies:** PR #1

**Complexity:** Complex

**Phase:** 1

---

### PR #3: Real-Time Collaboration

**Brief:** Implement real-time collaboration features using Firebase Firestore listeners to sync canvas changes across multiple users. This PR adds the ability for multiple users to draw on the same canvas simultaneously, with changes propagating in real-time. Includes presence detection, collaborative editing, and conflict resolution for concurrent shape modifications.

**Dependencies:** PR #1, PR #2

**Complexity:** Complex

**Phase:** 1

---

### PR #4: Shape Manipulation

**Brief:** Add comprehensive shape manipulation capabilities including move, resize, rotate, and delete operations. This PR implements mouse interactions for selecting shapes, dragging to move, corner handles for resizing, rotation controls, and keyboard shortcuts for deletion. All manipulation actions should sync in real-time across collaborators and persist to Firestore.

**Dependencies:** PR #2, PR #3

**Complexity:** Medium

**Phase:** 1

---

### PR #5: Color Palette & Styling

**Brief:** Implement a comprehensive color palette system allowing users to customize shape colors. This PR adds a color picker UI, predefined color swatches, color application to shapes (fill and stroke), and color persistence. The interface should be intuitive and accessible, with visual feedback for the currently selected color.

**Dependencies:** PR #2

**Complexity:** Simple

**Phase:** 1

---

### PR #6: Live Cursors

**Brief:** Add real-time cursor tracking to show where collaborators are pointing on the canvas. This PR implements cursor position broadcasting using Firestore presence, displays remote user cursors with user identifiers, handles cursor enter/leave events, and throttles cursor updates for performance. Cursors should have smooth animations and distinct colors per user.

**Dependencies:** PR #3

**Complexity:** Medium

**Phase:** 1

---

### PR #7: Text Tool

**Brief:** Implement a text shape tool allowing users to add and edit text on the canvas. This PR adds text creation with click-to-place interaction, inline text editing with a proper text input overlay, text styling options (font size, color), and text persistence. Text should be treated as a shape type that supports all standard manipulation operations.

**Dependencies:** PR #2, PR #4

**Complexity:** Medium

**Phase:** 1

---

### PR #8: AI Backend Integration

**Brief:** Set up the backend AI integration with OpenAI/Anthropic API, creating the `testAI()` function accessible from the browser console. This PR establishes the API endpoint, handles API authentication, implements error handling and rate limiting, and creates a service layer for AI interactions. The function should be fully functional and tested from the console before UI integration.

**Dependencies:** PR #1

**Complexity:** Medium

**Phase:** 1

---

## Phase 2: AI Chat (CRITICAL PRIORITY)

### PR #9: Clippy-Style Chat UI Component

**Brief:** Create the visual chat interface component with Clippy-style design, including speech bubble messages, Clippy avatar icon, and message display area. This PR focuses purely on the UI/UX without backend integration - building the chat panel (side or bottom), implementing speech bubble styled message containers with proper tails, adding the Clippy icon/avatar (32x32px), styling user vs AI message distinction (yellow #FFFF99 for AI, white for user), and creating empty states with Clippy greeting. The design should feel retro and playful, reminiscent of the original Microsoft Office Assistant.

**Dependencies:** PR #1, PR #2

**Complexity:** Medium

**Phase:** 2

---

### PR #10: Chat Functionality & AI Connection

**Brief:** Connect the chat UI to the existing `testAI()` function, making the chat interface fully functional. This PR implements the message input field with send functionality, wires the input to call `testAI()` function, displays AI responses in the chat UI, adds typing indicators ("Clippy is thinking..." with animated dots), implements loading states during API calls, and creates error handling UI (Clippy looking confused with error messages). This is the critical PR that makes AI chat work end-to-end in the application.

**Dependencies:** PR #8, PR #9

**Complexity:** Medium

**Phase:** 2

---

### PR #11: Chat Persistence & History

**Brief:** Implement persistent chat history storage in Firestore, allowing users to see previous conversations when returning to a canvas. This PR creates the chatMessages collection in Firestore with proper schema (canvasId, userId, role, content, createdAt), saves user messages to Firestore automatically, saves AI responses to Firestore, loads historical chat messages when a canvas is opened, displays messages in chronological order, and handles edge cases like offline mode and sync conflicts. Chat history should be canvas-specific and survive page refreshes.

**Dependencies:** PR #10

**Complexity:** Simple

**Phase:** 2

---

## Phase 3: Canvas Management

### PR #12: Canvas Gallery & List View

**Brief:** Create a canvas gallery interface where users can view all their past canvases and select which one to work on. This PR implements a landing page/modal showing canvas list, displays canvas metadata (name, last modified date, collaborators), allows clicking to open a canvas, shows loading states during canvas data fetching, and handles empty state (no canvases yet). The gallery should be the default view when users log in, allowing them to choose between creating new or opening existing canvases.

**Dependencies:** PR #1, PR #2

**Complexity:** Medium

**Phase:** 3

---

### PR #13: Create New Canvas & Naming

**Brief:** Add functionality to create new blank canvases and name/rename existing canvases. This PR implements "Create New Canvas" button in the gallery, canvas creation with default naming, canvas naming modal/interface, canvas rename functionality, canvas name validation, and updates canvas metadata in Firestore. Users should be able to organize their canvases with meaningful names for easy identification.

**Dependencies:** PR #12

**Complexity:** Simple

**Phase:** 3

---

### PR #14: Canvas Sharing & Collaboration Setup

**Brief:** Implement canvas sharing functionality allowing users to generate shareable links and collaborate with others. This PR creates shareable link generation (unique URLs per canvas), implements link copying to clipboard, adds collaborator management (tracking who has access), handles permissions for canvas access, updates collaborators array in Firestore, and creates UI for sharing settings. When a user opens a shared link, they should automatically gain access to view and edit the canvas in real-time.

**Dependencies:** PR #3, PR #12

**Complexity:** Medium

**Phase:** 3

---

### PR #15: Canvas Deletion

**Brief:** Add the ability to delete canvases users no longer need, with proper safeguards and cleanup. This PR implements delete button in canvas gallery/settings, adds confirmation modal to prevent accidental deletion, handles deletion of canvas document from Firestore, cascades deletion to related data (shapes, chat messages, presence data), updates UI after successful deletion, and implements proper error handling. Only canvas owners should be able to delete canvases, and all associated data should be cleaned up to avoid orphaned records.

**Dependencies:** PR #12

**Complexity:** Simple

**Phase:** 3

---

## Phase 4: Polish & Nice-to-Have

### PR #16: Pencil Tool (Free-form Drawing)

**Brief:** Implement a pencil/brush tool for free-form drawing on the canvas, complementing the existing geometric shapes. This PR adds pencil tool to the tool palette, implements smooth line drawing with mouse/touch tracking, handles path smoothing for better visual quality, stores path data efficiently in Firestore, syncs free-form drawings in real-time across collaborators, and supports color selection for pencil strokes. The pencil tool should feel responsive and natural, suitable for sketching and annotations.

**Dependencies:** PR #2, PR #3, PR #5

**Complexity:** Medium

**Phase:** 4

---

### PR #17: Advanced AI Features (Shape Generation)

**Brief:** Enhance AI capabilities to generate shapes on the canvas based on natural language prompts from users. This PR extends the AI chat functionality to parse shape generation requests (e.g., "draw a red circle in the center"), implements shape creation from AI prompts with appropriate parameters, adds special UI for shape generation confirmations, handles complex multi-shape generations, updates chat UI to show shape creation actions, and provides feedback when shapes are created. This makes the AI assistant more interactive and useful for canvas creation.

**Additional Requirements:**
- Create a login form with username and password fields
- Build a navigation bar with 4 menu items
- Make a card layout with title, image, and description
- Should be able to draw a penis, boobs, smiley faces, dogs, or cats

**Dependencies:** PR #10, PR #11, PR #2

**Complexity:** Complex

**Phase:** 4

---

### PR #18: Canvas Thumbnails

**Brief:** Generate and display visual thumbnails of canvases in the gallery view, making it easier to identify canvases at a glance. This PR implements canvas thumbnail generation (snapshot of current canvas state), stores thumbnails in Firebase Storage or as data URLs, displays thumbnails in the canvas gallery/list, updates thumbnails when canvases are modified, handles thumbnail loading and caching for performance, and adds fallback UI for canvases without thumbnails. Thumbnails should be generated automatically and provide a quick visual preview.

**Dependencies:** PR #12

**Complexity:** Medium

**Phase:** 4

---

### PR #19: Canvas Search & Filtering

**Brief:** Add search and filtering capabilities to the canvas gallery, helping users find specific canvases quickly when they have many. This PR implements search input in the gallery interface, filters canvases by name (real-time search), adds sorting options (by date modified, date created, name), implements filter tags (e.g., by collaborator, by date range), handles empty search results gracefully, and optimizes search performance for large canvas lists. This improves usability as users accumulate more canvases over time.

**Dependencies:** PR #12

**Complexity:** Simple

**Phase:** 4

---

### PR #20: Performance Optimization & Polish

**Brief:** Comprehensive performance optimization pass and UI/UX polish to ensure the application is demo-ready and production-quality. This PR includes optimizing canvas rendering for large numbers of shapes, implementing lazy loading for chat history and canvas data, adding smooth transitions and animations, fixing any visual glitches or layout issues, improving error messages and user feedback, optimizing real-time sync to reduce bandwidth, adding keyboard shortcuts documentation, and conducting end-to-end testing across all features. This PR ensures everything works smoothly and feels professional.

**Dependencies:** All previous PRs

**Complexity:** Complex

**Phase:** 4

---

## Implementation Notes

### Phase Priorities

- **Phase 1:** Foundation features (COMPLETED) - Basic canvas and collaboration infrastructure
- **Phase 2:** AI Chat (CRITICAL) - The core unique feature that must be demo-ready
- **Phase 3:** Canvas Management - Essential for usability but secondary to AI chat
- **Phase 4:** Nice-to-Have - Features that enhance the product but aren't critical for initial demo

### Complexity Definitions

- **Simple:** Straightforward implementation, minimal edge cases, 1-2 hours
- **Medium:** Moderate complexity, some edge cases, 2-4 hours
- **Complex:** Significant technical challenges, many edge cases, 4+ hours

### Critical Path

The fastest path to a working demo follows:
1. Ensure Phase 1 is complete (already done)
2. Complete PR #9 → PR #10 → PR #11 (AI Chat functional)
3. Complete PR #12 → PR #13 (Basic canvas management)
4. Test and deploy
5. Add Phase 4 features as time permits

---

## Summary Statistics

- **Total PRs:** 20
- **Phase 1 (Foundation):** 8 PRs
- **Phase 2 (AI Chat - Critical):** 3 PRs
- **Phase 3 (Canvas Management):** 4 PRs
- **Phase 4 (Polish & Nice-to-Have):** 5 PRs

**Current Status:** Phase 1 complete (PRs #1-8), beginning Phase 2 (AI Chat implementation)

