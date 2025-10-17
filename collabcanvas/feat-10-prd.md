# PRD: Collaborative Comments

**Feature:** Collaborative Comments and Threading
**Status:** Ready for Development
**Estimated Effort:** 16-24 hours

-----

## Overview

Implement a real-time, threaded comment system allowing users to add feedback directly onto **specific canvas shapes**. This MVP focuses on providing contextual, asynchronous discussion threads tied to design elements, with the ability to manage and resolve feedback.

-----

## Goals

1.  **Contextual Feedback** - Users can add and view comments tied directly to a selected shape.
2.  **Real-Time Collaboration** - Comments, replies, and status changes sync instantly across all collaborators.
3.  **Thread Management** - Users can reply to comments and mark comment threads as resolved.
4.  **Clear UX Indication** - Shapes with active comments must have a clear visual indicator and count.

-----

## User Stories

### As a Collaborator

  - I want to see a **visual indicator** on a shape when a new comment has been added so I don't miss feedback.
  - I want to click a shape's comment icon to **open a panel** and view all comments for that shape.
  - I want to **add a new comment** to a selected shape from the controls panel.
  - I want to be able to **reply** to an existing comment to continue a conversation thread.
  - I want to **delete only my own** comments to clean up my feedback.
  - I want all comments and replies to **appear in real-time** without refreshing the page.

### As a Comment Author / Project Owner

  - I want to be able to **mark a comment as resolved** so I can track completed feedback.
  - I want resolved comments to be **hidden by default**, but I want a **toggle** to view them.

-----

## Data Model

### 1\. Comments Collection

**Path:** `/projects/{projectId}/canvases/main/comments/{commentId}`

```typescript
{
  id: "comment_123",
  shapeId: "shape_456",   // The shape the comment is attached to
  userId: "user_abc",     // UID of the author
  username: "Alice",
  text: "This needs to be bigger",
  x: 100,                 // Out of Scope for MVP visual implementation
  y: 200,                 // Out of Scope for MVP visual implementation
  createdAt: timestamp,
  resolved: false,
  replies: [              // Array of reply objects
    {
      userId: "user_xyz",
      username: "Bob",
      text: "Agreed, making it 50px wider.",
      createdAt: timestamp
    },
    // ... more replies
  ]
}
```

-----

## API Specification

### canvasService.ts Updates

The following methods will be added to `src/services/canvasService.ts`.

```typescript
// Create comment
addComment(projectId: string, shapeId: string, text: string, userId: string, username: string): Promise<string>

// Mark comment as resolved (Author or Project Owner only)
resolveComment(projectId: string, commentId: string): Promise<void>

// Add a reply to an existing comment
addReply(projectId: string, commentId: string, userId: string, username: string, text: string): Promise<void>

// Listen for real-time comment updates for the current project
subscribeToComments(projectId: string, callback: Function): Unsubscribe

// Remove an entire comment thread (Author only)
deleteComment(projectId: string, commentId: string): Promise<void>
```

-----

## UI Components

### 1\. ShapeCommentIndicator

**Location:** Top-right corner of the commented shape on the canvas.

**Features:**

  - Shows a **💬 icon** when a shape has one or more *unresolved* comments.
  - Includes a **count badge** displaying the number of unresolved comments (e.g., "💬 3").
  - Icon **pulses/animates** briefly when a new comment is added in real-time.

### 2\. CommentPanel.tsx

**Trigger:** Clicking the **ShapeCommentIndicator** on a shape.

**Features:**

  - **Floating Panel:** Opens near the shape.
  - **Rendering:**
      - Each entry shows: **username**, **timestamp**, and comment **text**.
      - **Replies** are visually indented and have a distinct background color.
      - **Resolved comments** are rendered with strikethrough text and a green checkmark.
  - **Functionality:**
      - "Reply" button under each comment opens an inline reply input.
      - "✓ Resolve" button visible only to the comment author or project owner.
      - **"Delete" button** visible only to the comment author.
      - **"Show resolved (X)" toggle** at the bottom reveals/hides resolved comments.

### 3\. ControlsPanel.tsx Updates

**Location:** Main canvas control panel (where shape properties are managed).

**Add:**

  - A **"💬 Add Comment" button** that appears when a single shape is selected, which focuses the comment creation input in the panel.

-----

## Testing Scenarios

### Scenario 1: Basic Comment Flow

1.  User A selects a shape and adds a new comment.
2.  **Validation:** A new comment appears in the `CommentPanel.tsx`, and the **ShapeCommentIndicator** updates to "💬 1".

### Scenario 2: Deletion Authorization (NEW)

1.  User A creates a comment.
2.  User A clicks "Delete" on their comment. **Validation:** The comment is successfully deleted.
3.  User B (a collaborator) attempts to delete User A's comment. **Validation:** The delete button is **hidden/disabled** for User B, and the API call (if attempted) fails with an authorization error.

### Scenario 3: Real-time Sync

1.  User A and User B are both viewing the same canvas.
2.  User A adds a comment to a shape.
3.  **Validation:** User B instantly sees the **ShapeCommentIndicator** update, the icon pulses, and the new comment appears instantly in the `CommentPanel.tsx`.

### Scenario 4: Resolution Authorization

1.  User C is a project member but not the comment author, nor the project owner.
2.  **Validation:** User C cannot see the "✓ Resolve" button on User A's comment.
3.  User A (the author) or the Project Owner can see and use the "✓ Resolve" button.

-----

## Error Handling

### API Service Errors

```typescript
// Authorization failure for resolution/deletion
throw new Error("Only the comment author or project owner can resolve this thread");
throw new Error("Only the comment author can delete this comment");
```

### UI Error Display

  - **Toast notifications** for all API failures.
  - **Button states:** The "Delete" and "Resolve" buttons must be disabled or hidden based on user permissions.

-----

## Success Criteria

The feature is complete when:

1.  ✅ Users can add comments and replies tied to a selected shape.
2.  ✅ **Only authors can delete their own comments.**
3.  ✅ A real-time listener updates the comment panel and badge for all collaborators.
4.  ✅ Shapes display the correct **unresolved** comment count badge.
5.  ✅ Users (author/owner) can mark comments as resolved.
6.  ✅ Resolved comments are hidden by default and displayed with a toggle.
7.  ❌ **[DE-SCOPED]** No visual implementation of `x` and `y` pin positions exists. All comments are associated with `shapeId` only.

-----

## Out of Scope (Post-MVP)

  - **Arbitrary Pinning:** Using the `x` and `y` coordinates to place a comment pin anywhere on the canvas (visual implementation).
  - **Mentions:** `@user` functionality.
  - **Search/Filter:** Filtering comments by user, shape, or status.
  - **Attachments:** Adding images or files to a comment thread.