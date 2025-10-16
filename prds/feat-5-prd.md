# PRD: Additional Shape Types: Circle and Triangle

**Feature:** New Shapes: Circle and Triangle Support

-----

## Overview

This feature introduces **Circle** and **Triangle** shape creation tools to the canvas. Users will be able to select the new tools and use a **drag-to-create** gesture to draw the shapes. Both new shapes must support standard canvas interactions including movement, rotation, resizing, and real-time collaboration.

-----

## Goals

1.  **New Shape Creation** - Users can create Circle and Triangle shapes using new toolbar buttons and a drag-to-create gesture.
2.  **Full Interactivity** - New shapes support existing canvas features: move, rotate, delete, duplicate, and real-time collaboration.
3.  **Konva Rendering** - Both shapes render correctly using the Konva library.
4.  **Intuitive Resizing** - Implement a proportional, radius-based resize for **Circles** and a standard 8-handle resize for **Triangles**.

-----

## User Stories

### As a User

  - I want to see a **Circle** button in the toolbar so I can easily select the new shape tool.
  - I want to see a **Triangle** button in the toolbar so I can easily select the new shape tool.
  - I want to **drag my mouse** to create a circle from its center point.
  - I want to **drag my mouse** to create a triangle by defining its bounding box.
  - I want to see a preview of the circle/triangle while I'm dragging it.
  - I want to be able to **resize a circle** and have the radius change proportionally.
  - I want to be able to **resize a triangle** using corner and edge handles to adjust its width and height.

### As a Collaborator

  - I want to see Circles and Triangles that my teammates create in **real-time** ($<100\text{ms}$).

-----

## Data Model

### 1\. Shape Document Updates

The existing shape collection requires updates to support the new types: `circle` and `triangle`.

**Circle Shape Data**

```typescript
{
  id: "shape_123",
  type: "circle",     // NEW
  x: number,          // Center X
  y: number,          // Center Y
  radius: number,     // Radius in pixels
  color: string,
  rotation: number,
  // ... standard fields
}
```

**Triangle Shape Data**

```typescript
{
  id: "shape_456",
  type: "triangle",   // NEW
  x: number,          // Top vertex X
  y: number,          // Top vertex Y (used as top-center of bounding box for Konva)
  width: number,      // Base width
  height: number,     // Height from top to base
  color: string,
  rotation: number,
  // ... standard fields
}
```

-----

## API Specification

### canvasService.ts Updates

The following new methods will be added to handle the specific creation and manipulation of the new shapes:

```typescript
// Create a new circle shape
createCircle(circleData: { x: number, y: number, radius: number, color: string }): Promise<string>

// Resize a circle by changing its radius
resizeCircle(shapeId: string, radius: number): Promise<void>

// Create a new triangle shape
createTriangle(triangleData: { x: number, y: number, width: number, height: number, color: string }): Promise<string>

// Triangle will use the existing standard resizeShape(shapeId, width, height) method
// No new resize method needed for triangle
```

-----

## UI Components

### 1\. Toolbar.tsx Updates

**Layout:**
The new buttons will be placed between the existing **Rectangle** and **Text** tools.
`[Rectangle] [Circle] [Triangle] [Text] | [Red] [Blue] [Green] [Yellow]`

**Features:**

  - Add a new **Circle** button.
  - Add a new **Triangle** button.
  - Clicking a button sets the new active tool in `CanvasContext`.
  - Buttons must be styled consistently with existing toolbar items.

### 2\. Canvas.tsx Updates

**New Creation Flow Logic:**

| Shape | Creation Gesture | Calculation | Minimum Size Enforcement |
| :--- | :--- | :--- | :--- |
| **Circle** | **Drag-from-Center:** Mousedown records center $(x,y)$. Drag calculates radius. | Radius: $\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}$ | $\text{radius} \ge 5\text{px}$ |
| **Triangle**| **Drag-Bounding-Box:** Drag defines width and height. | Top: $(x + \text{width}/2, y)$; Bottom-left: $(x, y + \text{height})$; Bottom-right: $(x + \text{width}, y + \text{height})$ | $\text{width} \ge 10\text{px}$ and $\text{height} \ge 10\text{px}$ |

**Rendering:**

  - **Circle:** Use Konva's `<Circle>` component. Set $\text{x}, \text{y}$ (center), $\text{radius}, \text{fill}, \text{rotation}$.
  - **Triangle:** Use Konva's `<Line>` component with a closed path. Calculate the 3 points from the shape's stored $\text{x}, \text{y}, \text{width}, \text{height}$.

### 3\. Resize Handles

  - **Circle:** Show $\mathbf{4}$ handles (top, bottom, left, right). All handles must update the $\text{radius}$ proportionally. A tooltip should display the current radius value.
  - **Triangle:** Use the standard $\mathbf{8}$ Konva resize handles. Corner handles should scale proportionally. Edge handles should adjust only one dimension (width or height).

-----

## State Management

### CanvasContext Updates

  - The context must be updated to track the **active tool** (e.g., `"circle"` or `"triangle"`) when the new toolbar buttons are clicked.

-----

## Testing Scenarios

### Scenario 1: Circle Creation & Resizing

1.  User clicks the **Circle** toolbar button.
2.  User clicks on the canvas and drags, seeing a dashed preview circle.
3.  User drags a small circle ($\text{radius} < 5\text{px}$) and releases; a toast message appears, and the circle is **not** created.
4.  User drags a valid circle ($\text{radius} > 5\text{px}$) and releases; the circle is created in Firestore.
5.  User locks the circle and sees the $\mathbf{4}$ resize handles.
6.  User drags a handle; the circle resizes **proportionally**, and the radius tooltip updates.

### Scenario 2: Triangle Creation & Resizing

1.  User clicks the **Triangle** toolbar button.
2.  User drags on the canvas, seeing a dashed preview triangle.
3.  User drags a valid triangle ($\ge 10\text{x}10\text{px}$) and releases; the triangle is created with the correct vertex calculations.
4.  User locks the triangle and sees the $\mathbf{8}$ resize handles.
5.  User drags a corner handle; the triangle scales **proportionally**.
6.  User drags a side handle; only the **single dimension** (width or height) changes.

### Scenario 3: Real-time Collaboration

1.  User A creates a **Circle**.
2.  User B, on a different browser, sees the Circle render correctly within $<100\text{ms}$.
3.  User B moves/rotates the Circle.
4.  User A sees the change in real-time.

-----

## Out of Scope (Post-MVP)

*Out of scope was not specified in the bad PRD. All requested features are in scope for this iteration.*

-----

## Notes for Development

**Git Branch:** `feature/pr-5-circle-triangle-shapes`

**Key Implementation Points:**

1.  **Triangle Point Calculation:** Ensure the three Konva points are calculated correctly from the bounding box $(\text{x}, \text{y}, \text{width}, \text{height})$:
      * Top: $(x + \text{width}/2, y)$
      * Bottom-left: $(x, y + \text{height})$
      * Bottom-right: $(x + \text{width}, y + \text{height})$
2.  **Test Gates:** Follow the listed **Test Gates** in the original document to ensure successful integration at each task step (e.g., check console for Firestore updates after calling `createCircle`).

-----
