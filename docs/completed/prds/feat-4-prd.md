# PRD: Delete & Duplicate Shape

**Feature:** Delete & Duplicate Canvas Shapes
**Status:** Ready for Development

-----

## Overview

Implement core canvas manipulation features: deleting and duplicating shapes. This includes extending the `CanvasService` with new methods and creating a **Controls Panel** UI that appears when a user has a shape locked, providing quick access to these actions. This work is part of a larger Phase 2 effort to transform the MVP into a **production-ready collaborative design tool with AI assistance**, adding essential canvas manipulation features.

-----

## Goals


1.  **Shape Deletion** - Allow users to permanently remove a shape from the canvas.
2.  **Shape Duplication** - Allow users to quickly create a copy of an existing shape.
3.  **Real-Time Consistency** - Ensure collaborators see the delete/duplicate actions in \<100ms.

-----

## User Stories


### As a User

  - I want to see a copy icon and delete trash can icon to become 'active' appear when I lock a shape so I can quickly access actions.
  - I want to delete a shape I no longer need.
  - I want to duplicate a shape so I can create copies easily without manually recreating them.

-----

## Data Model


### Canvas Restructuring

**Path:** `canvases/main/shapes/{shapeId}`

*The implementation shows an update to the shape fields upon duplication:*

```typescript
// Fields used/updated on duplication:
{
  // ... existing fields ...
  id: string,                 // The new auto-generated ID
  x: number,                  // New X position (original + 20, with wrap-around)
  y: number,                  // New Y position (original + 20, with wrap-around)
  createdBy: string,          // The duplicating user's ID
  createdAt: Timestamp,
  lockedBy: null,             // The duplicate is unlocked
  lockedAt: null,             // The duplicate is unlocked
  updatedAt: Timestamp
}
```

-----

## API Specification

### CanvasService.ts Updates

```typescript
// Delete a shape
deleteShape(shapeId: string): Promise<void>

// Duplicate a shape, returning the new shape's ID
duplicateShape(shapeId: string, userId: string): Promise<string>
```

### API Implementation Detail (Deviation)

```typescript
async deleteShape(shapeId: string): Promise<void> {
  const shapeRef = doc(firestore, `canvases/main/shapes/${shapeId}`);
  await deleteDoc(shapeRef);
}

async duplicateShape(shapeId: string, userId: string): Promise<string> {
  const shapeDoc = await getDoc(doc(firestore, `canvases/main/shapes/${shapeId}`));
  if (!shapeDoc.exists()) throw new Error('Shape not found');
  
  const original = shapeDoc.data();
  const duplicateRef = doc(collection(firestore, 'canvases/main/shapes'));
  
  const newX = original.x + 20 > 4980 ? 50 : original.x + 20;
  const newY = original.y + 20 > 4980 ? 50 : original.y + 20;
  
  await setDoc(duplicateRef, {
    ...original,
    id: duplicateRef.id,
    x: newX,
    y: newY,
    createdBy: userId,
    createdAt: serverTimestamp(),
    lockedBy: null,
    lockedAt: null,
    updatedAt: serverTimestamp()
  });
  
  return duplicateRef.id;
}
```

-----

## UI Components

### 1\. Controls Panel

**Trigger:** Appears when a shape is **locked by the current user**.

**Features:**

  - Buttons: **[🗑️ Delete]** and **[📋 Duplicate]**.
  - **For text shapes**.
  - **Position:** In the cuurrent toolbox.

### 2\. Canvas.tsx Updates

  - Implement logic to display the **Controls Panel** based on shape lock status.
  - Integrate the `CanvasService.deleteShape` and `CanvasService.duplicateShape` functions into the button click handlers.

-----

## Success Criteria

1.  ✅ **Real-Time Visibility:** User A deletes/duplicates a shape, and **User B sees the change in \<100ms**.

-----

## Notes for Development

**Duplication Logic:**

  - When duplicating, the new shape should be offset by **$20$ pixels** on both the **x** and **y** axis.
  - A boundary check must be performed: if the new coordinate is greater than **$4980$**, wrap the new coordinate to **$50$**.
  - The duplicated shape should be created **unlocked** (i.e., `lockedBy: null` and `lockedAt: null`).

-----

