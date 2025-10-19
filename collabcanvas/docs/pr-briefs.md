# CollabCanvas PR Briefs

**Document Purpose:** This document provides high-level briefs for all planned PRs (Pull Requests) for the CollabCanvas project. Each brief serves as a starting point for Planning Agents to create detailed PRDs (Product Requirements Documents).

**Last Updated:** 2025-10-19

---

## Critical Path Overview

The implementation follows a phased approach with clear dependencies:

**Phase 1 (Foundation):** Performance optimizations must be completed before adding new features to ensure system stability under load.

**Phase 2 (Canvas Management):** Provides users with the ability to manage multiple canvases, creating the foundation for workspace organization.

**Phase 3 (Core Feature):** AI chat integration - the primary deliverable connecting the existing testAI() backend to a Clippy-style user interface.

**Phase 4 (Enhancement):** Nice-to-have features that add polish and advanced functionality.

---

## PR #1: Debouncing & Batching Firestore Operations

**Brief:** Implement debouncing and batching mechanisms for all Firestore write operations to dramatically reduce database writes and improve performance. Currently, every shape modification triggers an immediate Firestore write, causing performance degradation with multiple concurrent users. This PR will introduce a 500ms debounce delay for canvas updates and batch multiple shape changes into single Firestore transactions. This is the most critical performance fix and must be completed before adding AI chat functionality to prevent compounding performance issues under increased load.

**Dependencies:** None

**Complexity:** Complex

**Phase:** 1

---

## PR #2: Shape Rendering Optimization

**Brief:** Optimize the shape rendering pipeline to reduce CPU/GPU overhead and improve frame rates during collaborative editing sessions. This includes implementing efficient canvas redraw strategies, potentially switching from DOM-based rendering to pure canvas operations for better performance, and reducing unnecessary re-renders when shapes update. The optimization should target sub-100ms latency for canvas updates even with dozens of shapes on screen. Performance profiling should be conducted to identify and eliminate rendering bottlenecks.

**Dependencies:** PR #1

**Complexity:** Medium

**Phase:** 1

---

## PR #3: Connection Status & Monitoring

**Brief:** Add real-time connection status indicators and monitoring to provide users with visibility into their collaboration session health. This includes a visual indicator showing connection state (connected, disconnected, reconnecting), throttling real-time listeners to 500ms intervals to reduce bandwidth consumption, and implementing loading states for async operations. Users should clearly understand when they're offline or experiencing connectivity issues, preventing confusion during collaboration sessions. This completes the performance foundation trifecta.

**Dependencies:** PR #1

**Complexity:** Simple

**Phase:** 1

---

## PR #4: Canvas Gallery View

**Brief:** Create a canvas gallery/list view that displays all canvases owned by or shared with the current user. This serves as the home screen after login, replacing direct navigation to a single canvas. The gallery should show canvas names, last modified timestamps, and provide quick access to open any canvas. This is the foundation for multi-canvas workflows and is required before implementing canvas CRUD operations. The UI should be clean and efficient, prioritizing fast load times over visual complexity.

**Dependencies:** None

**Complexity:** Medium

**Phase:** 2

---

## PR #5: Canvas CRUD Operations

**Brief:** Implement full Create, Read, Update, Delete operations for canvases, along with sharing functionality. Users should be able to create new canvases with custom names, rename existing canvases, delete canvases they own, and generate shareable links for collaboration. This PR extends the database schema to support canvas metadata (name, owner, collaborators, shareLink) and updates the Firestore security rules to enforce proper permissions. Canvas sharing should generate unique URLs that allow access without additional authentication steps for collaborators.

**Dependencies:** PR #4

**Complexity:** Medium

**Phase:** 2

---

## PR #6: Clippy-Style Chat UI Component

**Brief:** Build the visual chat interface with Clippy-inspired design aesthetics, including speech bubble message containers, a Clippy avatar icon, and distinct styling for user vs AI messages. The UI should feature a side or bottom panel layout, yellow (#FFFF99) background for AI messages with retro Windows-style borders, and playful but functional interactions. Include typing indicators ("Clippy is typing..."), loading states, error states (Clippy looking confused), and an empty state with a greeting message. The component should be fully styled and functional but not yet connected to the AI backend - that's handled in PR #7.

**Dependencies:** None (but Phase 1 performance work should be completed first)

**Complexity:** Complex

**Phase:** 3

---

## PR #7: Connect testAI() to Chat UI

**Brief:** Wire the existing testAI() function to the Clippy chat UI built in PR #6, creating a functional end-to-end chat experience. When users type messages and hit send, the input should call testAI() with the message content and display the AI's response in the chat interface. Handle loading states during API calls, display errors gracefully if the AI service fails, and ensure the interaction feels responsive and natural. Since the backend API is already functional, this PR focuses purely on the frontend-to-backend connection and real-time UI updates.

**Dependencies:** PR #6

**Complexity:** Medium

**Phase:** 3

---

## PR #8: Chat Persistence & History

**Brief:** Implement Firestore persistence for chat messages, allowing chat history to be saved and loaded per canvas. Create a new chatMessages collection with fields for canvasId, userId, role (user/assistant), content, and timestamp. When users send messages or receive AI responses, save them to Firestore. When a canvas opens, load and display all historical chat messages in chronological order. This ensures chat context persists across sessions and is visible to all collaborators on a canvas. Include proper error handling for database operations and optimize queries to minimize read costs.

**Dependencies:** PR #7

**Complexity:** Complex

**Phase:** 3

---

## PR #9: Pencil Tool for Free-Form Drawing

**Brief:** Add a pencil tool that allows users to draw free-form lines and sketches on the canvas, complementing the existing geometric shape tools (rectangle, circle, triangle). The pencil tool should capture mouse/touch input and render smooth paths, store the drawing data efficiently in Firestore as a series of points or SVG paths, and sync drawings in real-time to collaborators. This is a standalone enhancement that doesn't depend on AI or canvas management features, making it a good candidate for parallel development or later implementation if time permits.

**Dependencies:** None

**Complexity:** Simple

**Phase:** 4

---

## PR #10: AI Shape Generation from Prompts

**Brief:** Enable advanced AI functionality where users can request shape creation through natural language prompts (e.g., "draw a red circle in the top-left corner"). The AI should parse the intent, determine shape properties (type, color, position, size), and programmatically add shapes to the canvas. This requires extending the testAI() integration to support structured responses that the frontend can interpret as drawing commands. Include error handling for ambiguous or impossible requests, and provide helpful feedback when the AI cannot fulfill a drawing request. This feature showcases the power of combining AI with the collaborative canvas.

**Dependencies:** PR #8

**Complexity:** Complex

**Phase:** 4

---

## PR #11: Canvas Thumbnails & Search

**Brief:** Add visual thumbnails to the canvas gallery view and implement search/filter functionality to help users find canvases quickly. Thumbnails should be auto-generated by capturing a snapshot of each canvas (e.g., using canvas.toDataURL()) and stored as small preview images. The search feature should filter canvases by name, with potential for future expansion to filter by date, collaborators, or tags. This enhancement significantly improves UX for users with many canvases, making the gallery more visual and navigable. Performance should remain fast even with hundreds of canvases through pagination or virtual scrolling.

**Dependencies:** PR #5

**Complexity:** Medium

**Phase:** 4

---

## Implementation Guidelines

1. **Sequential vs Parallel:** PRs within the same phase can be developed in parallel if they have no dependencies. For example, PR #2 and PR #3 can be developed simultaneously after PR #1 is complete.

2. **Testing Requirements:** Each PR should include comprehensive testing to ensure no regressions in existing functionality. Performance PRs (1-3) require load testing with multiple concurrent users.

3. **Documentation:** Update relevant documentation (architecture.md, README.md) when implementing features that change user workflows or technical architecture.

4. **Phase Gates:** Do not proceed to the next phase until all PRs in the current phase are complete and tested. Phase 1 is particularly critical - the performance foundation must be solid before adding AI features.

---

**Total PRs:** 11  
**Estimated Timeline:** 8-hour sprint (Phases 1-3), with Phase 4 as stretch goals or future work

