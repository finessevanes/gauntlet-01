# CollabCanvas MVP - Product Requirements Document

## Project Overview

A real-time collaborative design canvas that enables multiple users to simultaneously create, manipulate, and view simple shapes with live cursor tracking and presence awareness. This MVP focuses exclusively on bulletproof multiplayer infrastructure with minimal feature complexity, architected to support AI agent integration in Phase 2.

**Timeline:** 24 hours to MVP checkpoint  
**Success Criteria:** Solid collaborative foundation with production-ready architecture

---

## User Stories

### As a Designer (Primary User)

- I want to create an account and log in so that I can have a persistent identity in the canvas
- I want to see a large, pannable/zoomable workspace so that I can work comfortably
- I want to click and drag to create rectangles of any size so that I can start designing
- I want to choose from basic colors (red, blue, green, yellow) before drawing
- I want to drag shapes around the canvas so that I can position elements where I need them
- I want to see other users' cursors with their names so that I know who's working where
- I want changes I make to appear instantly for all other users so that we can collaborate in real-time
- I want to see who else is currently online so that I know who I'm collaborating with
- I want my work to persist when I disconnect so that I don't lose progress
- I want to be able to grab a shape quickly if I click it first, even if another user clicks at the same time

### As a Collaborative Team Member

- I want to see shapes being created and moved by others in real-time so that I can coordinate my work
- I want to work simultaneously with teammates without conflicts breaking the canvas
- I want to refresh my browser mid-session and return to the same canvas state
- I want to see clearly when another user has grabbed a shape before me so I don't try to edit it

---

## MVP Feature Requirements

### 1. Authentication (P0 - Critical) - MUST BE FIRST

- User signup/login (email + password)
- Optional: Google Sign-In (if time permits)
- Each user has a displayable username/name
- Authentication state persists across sessions
- Store user data in Firestore `users` collection
- Assign unique cursor color on signup

**Why First:** We need authenticated users before we can track cursors, presence, or shape ownership.

### 2. Real-Time Cursor Sync (P0 - Critical) - BEFORE SHAPES

#### Multiplayer Cursors

- Show all connected users' cursor positions in real-time
- Display username label next to each cursor
- Each cursor has a unique color (assigned per user)
- Update frequency: 20-30 FPS (33-50ms) via RTDB
- Store in RTDB: `/sessions/main/users/{userId}/cursor`
- **Canvas bounds only:** Cursors only visible within 5000×5000 canvas area (not in gray background)

#### Presence Awareness

- Show list of currently connected users
- Visual indicator (e.g., colored dots) for online status
- Auto-update when users join/leave
- Use RTDB `onDisconnect()` for automatic cleanup
- Store in RTDB: `/sessions/main/users/{userId}/presence`

**Why Second:** Proving cursor sync works validates our entire real-time infrastructure before we add shape complexity.

### 3. Canvas Core (P0 - Critical)

#### Pan and Zoom

- Click-and-drag panning (or spacebar + drag)
- Mouse wheel zoom with cursor-centered zooming
- Workspace size: 5000x5000px

#### Simple Color Toolbar

- 4 color buttons in toolbar/header: Red, Blue, Green, Yellow
- Selected color is highlighted/active
- Default: Blue (`#3b82f6`)

**Color Options:**
- Red: `#ef4444`
- Blue: `#3b82f6`
- Green: `#10b981`
- Yellow: `#f59e0b`

#### Rectangle Creation with Click-and-Drag

1. User clicks on canvas background (mousedown) → records start position
2. User drags (mousemove) → shows preview rectangle dynamically growing
3. Preview shows dashed border and semi-transparent fill in selected color
4. User releases (mouseup) → creates final rectangle with:
   - Position: where user started dragging
   - Width: `Math.abs(endX - startX)`
   - Height: `Math.abs(endY - startY)`
   - Color: currently selected color from toolbar
5. Handle negative drags (user drags left or up)
6. Minimum size: 10x10px (prevent accidental tiny rectangles from clicks)

#### Basic Interactions

- Click to select shape (show selection border)
- Drag to move selected shape
- No resize handles or rotation for MVP
- No multi-select for MVP
- No delete function for MVP

### 4. Real-Time Shape Sync with Simple Locking (P0 - Critical)

#### Live Object Sync

- Shape creation broadcasts to all users instantly
- Shape movement/updates sync across all clients
- Target latency: <100ms
- Store in Firestore: `canvases/main/shapes/{shapeId}` (individual documents)

#### Simple Shape Locking

**The Goal:** First user to click a shape gets to control it. Other users see it's locked and cannot interact.

**How it works:**

1. **User A clicks shape**
   - Immediately writes to Firestore: `lockedBy: "userA_id"`, `lockedAt: serverTimestamp()`
   - Locally shows shape as selected (green border)

2. **User B clicks same shape shortly after**
   - Before User B's click reaches their UI, Firestore listener receives User A's lock
   - User B sees shape is already locked (red border + lock icon)
   - Click interaction is ignored (shape not draggable)

3. **Edge Case:** If User A and User B click within ~50ms (very rare)
   - Both writes reach Firestore
   - Last-write-wins means one will overwrite the other
   - Acceptable for MVP - this happens <1% of the time with 2-5 users
   - Can be upgraded to Firestore transactions post-MVP if needed

#### Lock Release

Lock releases when user:
- Clicks away (deselects shape)
- Finishes dragging (onDragEnd)
- Disconnects (handled by presence cleanup)
- Auto-release after 5 seconds of inactivity

#### Visual States

- **Unlocked shape:** User-defined color fill, white border on hover
- **Locked by me:** User-defined color fill, green border (3px), draggable
- **Locked by other:** User-defined color fill, red border (3px) + lock icon 🔒, 50% opacity, no interaction
- **Preview (while drawing):** Dashed border, 50% opacity, in selected color

#### Error Handling

- Toast notifications for simple errors (e.g., "Shape locked by [username]")
- Use `react-hot-toast` or similar library (lightweight, fast to implement)

### 5. Deployment (P0 - Critical)

- Publicly accessible URL
- Supports 5+ concurrent users minimum (performance tested)
- Must be testable by evaluators
- Single shared canvas for all users
- Target: 60 FPS rendering, 500+ shapes support

---

## Tech Stack

### Frontend Framework

- React with TypeScript and Vite

### Canvas Rendering

- Konva.js with react-konva
- Target: 60 FPS during all interactions

### State Management

- React Context with custom hooks pattern

### Backend & Sync

- **Firebase Realtime Database (RTDB):** Cursors, Presence (high-frequency, ephemeral data)
- **Firebase Firestore:** Shapes, Locks (structured, persistent data)
- **Firebase Authentication:** User management

### Architecture Pattern

**Service Layer Pattern:**

```
UI Components
    ↓
React Context (AuthContext, CanvasContext)
    ↓
Custom Hooks (useAuth, useCanvas, useCursors, usePresence)
    ↓
Service Layer (AuthService, CanvasService, CursorService, PresenceService)
    ↓
Firebase (Auth, Firestore, RTDB)
```

**Why Service Layer:**
- Clean separation of concerns
- Testable with Firebase Emulators
- AI-ready: AI agent will call same service methods in Phase 2
- Consistent API for human + AI interactions

### Deployment

- Vercel (frontend hosting)

### Additional Libraries

- `lodash` - throttle function (cursor updates)
- `react-hot-toast` - error notifications
- `react-konva` - Konva React bindings
- `konva` - Canvas rendering

### Testing Infrastructure

- Firebase Emulators: Auth, Firestore, RTDB
- Vitest + React Testing Library: Unit tests
- Integration tests for multi-user scenarios

---

## Data Models

### Firestore Collections

#### `users` Collection

```json
{
  "uid": "user_abc",
  "username": "Alice",
  "email": "alice@example.com",
  "cursorColor": "#ef4444",  // Assigned on signup
  "createdAt": "timestamp"
}
```

#### `canvases/main/shapes` Collection (Individual Documents)

```json
{
  "id": "shape_123",
  "type": "rectangle",
  "x": 100,                    // Start position from drag
  "y": 200,                    // Start position from drag
  "width": 150,                // Calculated from drag distance
  "height": 100,               // Calculated from drag distance
  "color": "#3b82f6",          // From toolbar selection
  "createdBy": "user_abc",
  "createdAt": "timestamp",
  "lockedBy": "user_abc | null",
  "lockedAt": "timestamp | null",
  "updatedAt": "timestamp"
}
```

**Why Individual Documents:**
- Scales to 500+ objects (Sunday requirement)
- Better query performance
- No 1MB document size limit issues
- Easier concurrent editing (no array conflicts)

### RTDB Paths

#### `/sessions/main/users/{userId}` Path

```json
{
  "cursor": {
    "x": 450,
    "y": 300,
    "username": "Alice",
    "color": "#ef4444",
    "timestamp": "timestamp"
  },
  "presence": {
    "online": true,
    "lastSeen": "timestamp",
    "username": "Alice"
  }
}
```

**Why RTDB for Cursors/Presence:**
- <50ms latency (vs Firestore's ~200ms)
- Optimized for high-frequency updates (20-30 FPS)
- Built-in `onDisconnect()` for automatic cleanup
- Reduces Firestore costs (cursors don't need persistence)

---

## Build Sequence (Priority Order)

### Phase 0: Development Setup (30 min)

#### Firebase Emulators Setup

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Initialize emulators: `firebase init emulators`
3. Configure ports:
   - Auth: 9099
   - Firestore: 8080
   - Realtime Database: 9000
4. Create `firebase.json` with emulator config
5. Add emulator connection logic to Firebase initialization
6. Test basic read/write to emulators

#### Project Structure

**⚠️ Important:** This app lives in the `collabcanvas/` subdirectory within the `gauntlet-01` root project. All development commands should be run from `collabcanvas/` directory.

```
gauntlet-01/                  (root project)
├── prd.md
├── task.md
├── architecture.md
└── collabcanvas/             (YOUR WORKING DIRECTORY)
    ├── src/
    │   ├── components/      # UI components
    │   ├── contexts/        # React contexts
    │   ├── hooks/           # Custom hooks
    │   ├── services/        # Service layer
    │   │   ├── authService.ts
    │   │   ├── canvasService.ts
    │   │   ├── cursorService.ts
    │   │   └── presenceService.ts
    │   ├── utils/           # Helper functions
    │   └── firebase.ts      # Firebase initialization
    ├── firebase.json
    ├── firestore.rules
    ├── database.rules.json
    └── package.json
```

**Gate:** Emulators running from `collabcanvas/`, can read/write test data locally.

---

### Phase 1: Authentication (1-2 hours)

#### Firebase Setup (30 min)

- Create Firebase project (or use existing)
- Enable Authentication (Email/Password + Google optional)
- Enable Firestore
- Enable Realtime Database
- Set up security rules (see below)
- Install Firebase SDK

#### Auth Service Layer (30 min)

Create `services/authService.ts`:

```typescript
class AuthService {
  async signup(email: string, password: string, username: string)
  async login(email: string, password: string)
  async logout()
  async getCurrentUser()
  onAuthStateChanged(callback)
}
```

#### Auth UI (1 hour)

- Simple login/signup form
- Store username in Firestore `users` collection
- Assign random cursor color on signup
- Persist auth state
- Basic loading states
- Logout button

#### Custom Hook

```typescript
// hooks/useAuth.ts
const useAuth = () => {
  const authService = new AuthService();
  // Wraps authService methods
  // Manages React state
}
```

**Gate:** User can sign up, log in, logout, and stay logged in across refreshes.

---

### Phase 2: Cursor Sync (2-3 hours)

#### Empty Canvas (30 min)

- React + Konva setup
- Empty Stage with pan (drag stage) and zoom (wheel)
- 5000x5000px workspace
- Basic UI: logout button, username display

#### Cursor Service Layer (30 min)

Create `services/cursorService.ts`:

```typescript
class CursorService {
  async updateCursorPosition(userId: string, x: number, y: number, username: string, color: string)
  subscribeToCursors(callback: (cursors: Cursor[]) => void)
  unsubscribe()
}
```

#### Cursor Position Tracking (1 hour)

- Track local mouse position on canvas
- Throttle updates to 33-50ms (20-30 FPS) using lodash
- Write to RTDB: `/sessions/main/users/{userId}/cursor`
- Use cursor color from user profile

**Implementation:**

```typescript
const throttledUpdateCursor = throttle((x, y) => {
  cursorService.updateCursorPosition(userId, x, y, username, color);
}, 33); // 30 FPS
```

#### Render Other Users' Cursors (1 hour)

- Listen to RTDB `/sessions/main/users` path
- Render SVG cursor or simple circle with username label
- Show/hide based on RTDB updates
- Position cursors at x,y coordinates
- Filter out own cursor

#### Presence Service Layer (30 min)

Create `services/presenceService.ts`:

```typescript
class PresenceService {
  async setOnline(userId: string, username: string)
  async setOffline(userId: string)
  subscribeToPresence(callback: (users: PresenceUser[]) => void)
  setupDisconnectHandler(userId: string) // Uses RTDB onDisconnect()
}
```

#### Presence System (30 min)

- Write to RTDB `/sessions/main/users/{userId}/presence` on login
- Set up `onDisconnect()` handler to auto-cleanup
- Listen to presence changes
- Show online user list in sidebar/header

**Gate:** Open 2 browser windows → see both cursors moving in real-time with <50ms lag. Presence updates when users join/leave.

---

### Phase 3: Shape Creation & Sync (3-4 hours)

#### Color Toolbar (30 min)

- Add simple toolbar with 4 color buttons
- Colors: Red (`#ef4444`), Blue (`#3b82f6`), Green (`#10b981`), Yellow (`#f59e0b`)
- Track selected color in React state
- Highlight active color button
- Default: Blue

#### Canvas Service Layer (1 hour)

Create `services/canvasService.ts`:

```typescript
class CanvasService {
  async createShape(shape: ShapeData)
  async updateShape(shapeId: string, updates: Partial<ShapeData>)
  async lockShape(shapeId: string, userId: string)
  async unlockShape(shapeId: string)
  subscribeToShapes(callback: (shapes: Shape[]) => void)
  async getShapes(): Promise<Shape[]>
}
```

**Why Service Layer Here:**
- AI agent will call these same methods in Phase 2
- Clean interface: `canvasService.createShape({type, x, y, width, height, color})`
- Easy to test with emulators
- Consistent API for human and AI interactions

#### Create Rectangle with Click-and-Drag (2 hours)

1. **Detect drag start:** mousedown on canvas background (not on shape)
2. **Track drag:**
   - Record start position (startX, startY)
   - On mousemove, calculate current position (currentX, currentY)
   - Calculate width: `Math.abs(currentX - startX)`
   - Calculate height: `Math.abs(currentY - startY)`
3. **Show preview rectangle:**
   - Render Konva Rect with dashed stroke
   - Fill with selected color at 50% opacity
   - Update dimensions in real-time as user drags
4. **Finalize on mouseup:**
   - If width < 10 or height < 10, ignore
   - Call `canvasService.createShape()` with shape data
5. **Edge cases:**
   - User drags left (negative width) → use `Math.abs()` and adjust x
   - User drags up (negative height) → use `Math.abs()` and adjust y
   - Don't interfere with canvas pan

#### Real-Time Shape Sync (1 hour)

- Use `canvasService.subscribeToShapes()` listener
- Update React Context when shapes added/changed/removed
- Render all shapes via Konva `<Rect>` with user-defined width, height, color
- Handle initial fetch + real-time updates
- All users see new shapes appear instantly (<100ms)

#### Shape Dragging (30 min)

- Enable draggable on Konva Rect (conditionally based on lock)
- On drag end, call `canvasService.updateShape(shapeId, {x, y})`
- Other users see movement via listener
- Smooth drag experience (no lag)

**Gate:** User A selects color, clicks on canvas, drags to create shape → User B sees preview then final shape with correct size/color instantly. User A drags shape → User B sees movement.

---

### Phase 4: Simple Shape Locking (2 hours)

#### Lock Logic in Canvas Service

```typescript
// In canvasService.ts
async lockShape(shapeId: string, userId: string): Promise<boolean> {
  const shapeRef = doc(firestore, `canvases/main/shapes/${shapeId}`);
  const shapeDoc = await getDoc(shapeRef);
  
  // Check if already locked
  if (shapeDoc.exists()) {
    const data = shapeDoc.data();
    const now = Date.now();
    const lockAge = now - (data.lockedAt?.toMillis() || 0);
    
    // If locked by someone else and lock is fresh (<5s), fail
    if (data.lockedBy && data.lockedBy !== userId && lockAge < 5000) {
      return false; // Lock acquisition failed
    }
  }
  
  // Acquire lock
  await updateDoc(shapeRef, {
    lockedBy: userId,
    lockedAt: serverTimestamp()
  });
  
  return true;
}
```

#### Lock on Select (1 hour)

- Click shape (not drag) → check current lock status
- Call `canvasService.lockShape(shapeId, userId)`
- If lock acquired:
  - Update local state (show green border)
- If lock failed:
  - Show toast: "Shape locked by [username]"
  - Do not select shape
- Listen to lock changes via Firestore
- Handle lock acquisition failures

#### Lock Visual Indicators (1 hour)

Render different stroke colors based on lock status:
- **Green:** locked by me
- **Red:** locked by other
- **White on hover:** unlocked

Additional features:
- Add lock icon (emoji 🔒 or SVG) for locked-by-other
- Set opacity to 0.5 for locked-by-other
- Disable draggable for locked-by-other
- Release lock on deselect (click background) or drag end
- Implement lock timeout check (5 seconds)

**Gate:**
- User A clicks shape → gets green border, can drag
- User B sees red border + lock icon, cannot interact
- User A clicks away → lock releases → User B can now grab it

---

### Phase 5: Testing & Polish (2-3 hours)

#### Multi-Browser Testing (1 hour)

- Test with 2-3 users simultaneously
- Test creating shapes with different sizes/colors
- Test drag preview shows correctly for all users
- Test refresh mid-edit (state persistence)
- Test disconnect/reconnect (presence updates)
- Test rapid shape creation
- Test simultaneous lock attempts
- Test with Firebase Emulators first
- Test performance: 60 FPS, 5+ users

#### Bug Fixes & Polish (1 hour)

- Fix any sync lag issues
- Handle edge cases (expired locks, disconnects, negative drags)
- Add loading states for auth and canvas
- Clean up UI styling
- Add toast for lock failures
- Verify preview rectangle doesn't interfere with pan
- Verify no console errors
- Run unit tests for services

#### Deployment (1 hour)

1. Build React app: `npm run build`
2. Deploy to Vercel (connect GitHub repo)
3. Update Firebase config for production URLs
4. Update Firebase security rules for production
5. Test deployed version with 2+ users
6. Verify public accessibility
7. Test performance on deployed app (5+ users, 500+ shapes)

**Total Estimate:** 13-17 hours (leaves 7-11 hours buffer)

---

## Testing Checklist

### Authentication ✅

- [ ] User can sign up with email/password
- [ ] User can log in with existing account
- [ ] (Optional) User can sign in with Google
- [ ] Auth state persists across page refresh
- [ ] Username displays correctly in UI
- [ ] Cursor color is assigned on signup
- [ ] User can logout
- [ ] Error messages show for invalid credentials

### Cursor Sync ✅

- [ ] Two users in separate browsers both see empty canvas
- [ ] User A moves cursor → User B sees cursor move at 20-30 FPS
- [ ] User B moves cursor → User A sees cursor with name label
- [ ] Both cursors have different colors
- [ ] Cursors disappear when user moves off canvas (5000×5000 bounds)
- [ ] Cursors NOT visible in gray background area outside canvas
- [ ] Presence list shows both users online
- [ ] User A disconnects → User B sees them go offline immediately (RTDB onDisconnect)
- [ ] Cursor latency is <50ms

### Canvas Basics ✅

- [ ] Canvas is 5000x5000px
- [ ] Pan works (drag canvas background)
- [ ] Zoom works (mouse wheel)
- [ ] Zoom is centered on cursor position
- [ ] Canvas maintains 60 FPS during interactions

### Color Toolbar ✅

- [ ] Toolbar displays 4 color buttons (Red, Blue, Green, Yellow)
- [ ] Clicking a color button selects that color
- [ ] Selected color is visually highlighted
- [ ] Default color is Blue on load

### Shape Creation with Click-and-Drag ✅

- [ ] User clicks and holds on canvas background → drag starts
- [ ] While dragging, preview rectangle appears and grows dynamically
- [ ] Preview rectangle shows selected color with dashed border
- [ ] User releases mouse → final rectangle is created
- [ ] Rectangle size matches drag distance (width and height)
- [ ] Rectangle color matches selected toolbar color
- [ ] Negative drag test: User drags left or up → rectangle still creates correctly
- [ ] Minimum size test: Tiny drags (<10px) are ignored
- [ ] User A creates shape → User B sees preview then final shape in <100ms
- [ ] Multiple shapes with different sizes/colors can exist simultaneously
- [ ] Shapes persist across refresh with correct attributes

### Shape Movement ✅

- [ ] User A drags unlocked shape → it moves smoothly at 60 FPS
- [ ] User A releases → User B sees new position in <100ms
- [ ] Dragging feels responsive (no lag)
- [ ] Dragging shape doesn't trigger shape creation

### Shape Locking ✅

- [ ] Basic Lock Test: User A clicks shape (not drag)
- [ ] User A sees green border (locked by me)
- [ ] User A can drag shape
- [ ] User B sees red border + lock icon (locked by User A)
- [ ] User B cannot click or drag the shape
- [ ] User B gets toast notification if they try to click
- [ ] Lock Release Test: User A clicks canvas background (deselect)
- [ ] Lock releases (shape returns to normal)
- [ ] User B can now click and lock the shape
- [ ] Drag Release Test: User A drags shape and releases
- [ ] Lock auto-releases on drag end
- [ ] User B can immediately lock it
- [ ] Timeout Test: User A locks shape, waits 6+ seconds
- [ ] Lock auto-releases (User B can click it)
- [ ] Disconnect Test: User A locks shape, closes browser
- [ ] Lock releases within 5 seconds
- [ ] User B can acquire lock

### Persistence ✅

- [ ] All users disconnect → reconnect later → canvas state persists
- [ ] Shapes created in session 1 → still visible in session 2 with correct size/color
- [ ] Lock state clears on page refresh (no stuck locks)
- [ ] RTDB cursor/presence clears on disconnect (ephemeral data)

### Performance ✅

- [ ] Canvas maintains 60 FPS with 50+ shapes
- [ ] Canvas maintains 60 FPS with 500+ shapes
- [ ] 5+ concurrent users without FPS degradation
- [ ] Cursor updates consistently at 20-30 FPS
- [ ] Shape sync latency consistently <100ms
- [ ] No memory leaks during extended sessions

### Deployment ✅

- [ ] Deployed URL is publicly accessible (no auth wall)
- [ ] Works with 5+ simultaneous users on deployed version
- [ ] No console errors in production build
- [ ] Performance is acceptable on deployed app
- [ ] Firebase security rules are production-ready

### Service Layer Testing ✅

- [ ] AuthService methods work with emulators
- [ ] CanvasService CRUD operations work correctly
- [ ] CursorService updates at target FPS
- [ ] PresenceService onDisconnect works
- [ ] Services can be mocked for unit testing

---

## Firebase Security Rules

### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - users can only write their own document
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Main canvas shapes - individual documents
    match /canvases/main/shapes/{shapeId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
                       request.resource.data.createdBy == request.auth.uid;
      allow update: if request.auth != null;
      allow delete: if request.auth != null;
    }
  }
}
```

### Realtime Database Rules

```json
{
  "rules": {
    "sessions": {
      "main": {
        "users": {
          "$userId": {
            ".read": "auth != null",
            ".write": "auth != null && auth.uid == $userId"
          }
        }
      }
    }
  }
}
```

---

## Click-and-Drag Implementation Details

### Key Konva Events

```typescript
const [isDrawing, setIsDrawing] = useState(false);
const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
const [previewRect, setPreviewRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
const [selectedColor, setSelectedColor] = useState('#3b82f6'); // Blue default

const canvasService = new CanvasService(); // Service instance

// Start drawing
const handleMouseDown = (e: any) => {
  const stage = e.target.getStage();
  const pointerPosition = stage.getPointerPosition();
  
  // Only start drawing if clicked on background (not a shape)
  if (e.target === stage) {
    setIsDrawing(true);
    setDrawStart(pointerPosition);
  }
};

// Update preview
const handleMouseMove = (e: any) => {
  if (!isDrawing || !drawStart) return;
  
  const stage = e.target.getStage();
  const pointerPosition = stage.getPointerPosition();
  
  // Calculate dimensions (handle negative drags)
  const x = Math.min(drawStart.x, pointerPosition.x);
  const y = Math.min(drawStart.y, pointerPosition.y);
  const width = Math.abs(pointerPosition.x - drawStart.x);
  const height = Math.abs(pointerPosition.y - drawStart.y);
  
  setPreviewRect({ x, y, width, height });
};

// Finalize shape
const handleMouseUp = async () => {
  if (!isDrawing || !previewRect) {
    setIsDrawing(false);
    return;
  }
  
  // Ignore tiny accidental shapes
  if (previewRect.width < 10 || previewRect.height < 10) {
    setIsDrawing(false);
    setPreviewRect(null);
    return;
  }
  
  // Save via CanvasService ⚡ UPDATED
  await canvasService.createShape({
    type: 'rectangle',
    x: previewRect.x,
    y: previewRect.y,
    width: previewRect.width,
    height: previewRect.height,
    color: selectedColor,
    createdBy: currentUser.uid,
    createdAt: Date.now(),
    lockedBy: null,
    lockedAt: null
  });
  
  // Clear preview
  setIsDrawing(false);
  setPreviewRect(null);
  setDrawStart(null);
};

// Render preview
{previewRect && (
  <Rect
    x={previewRect.x}
    y={previewRect.y}
    width={previewRect.width}
    height={previewRect.height}
    fill={selectedColor}
    opacity={0.5}
    stroke={selectedColor}
    strokeWidth={2}
    dash={[10, 5]}  // Dashed border
  />
)}
```

---

## Explicitly Out of Scope for MVP

### Features NOT Required ❌

- Multiple shape types (only rectangles)
- Resize handles or rotation
- Multi-select (shift-click, drag-to-select)
- Layer management/z-index controls
- Copy/paste, duplicate
- Delete shapes
- Undo/redo
- Editing shape properties after creation
- Advanced color picker (hex input, gradients) - basic 4 colors only
- Shape stroke/borders (except selection indicators)
- Export/save as image
- Keyboard shortcuts
- Mobile responsiveness
- Any AI features (Phase 2 - Sunday)
- Multiple canvases or workspaces

### Technical NOT Required ❌

- Firestore transactions (post-MVP enhancement)
- Optimistic UI updates (nice to have)
- Comprehensive error handling (basic toast is fine)
- Database migrations
- Analytics or monitoring
- User profiles or avatars
- Email verification

---

## Known Limitations & Future Enhancements

### MVP Limitations

#### Race Condition (~50ms window): If two users click a shape within ~50ms, wrong user might win lock

- **Impact:** Low (rare with 2-5 users)
- **Future fix:** Upgrade to Firestore transactions (+2 hours)

#### No Shape Delete: Users can create shapes but not delete them

- **Impact:** Medium (canvas can get cluttered during testing)
- **Mitigation:** Manually clear Firestore collection between tests if needed

#### No Shape Editing After Creation: Once created, size/color cannot be changed

- **Impact:** Low (sufficient for MVP)
- **Future fix:** Add edit modal or properties panel (+2 hours)

#### Basic Color Palette: Only 4 colors available

- **Impact:** Low (sufficient for MVP testing)
- **Future fix:** Add full color picker (+1 hour)

#### Single Shared Canvas: All users edit one global canvas

- **Impact:** Low for MVP testing
- **Future fix:** Add workspace/project management

#### Basic Error Handling: Only toast notificationsß

- **Impact:** Low (sufficient for MVP)

---



---

## Development Workflow

### Local Development with Emulators

**⚠️ All commands run from `collabcanvas/` directory:**

```bash
# Change to app directory first
cd collabcanvas

# Terminal 1: Start Firebase Emulators
firebase emulators:start

# Terminal 2: Start React dev server
npm run dev

# Emulator UI available at: http://localhost:4000
# React app available at: http://localhost:5173
```

**Benefits:**
- No Firebase costs during development
- Faster iteration (no network latency)
- Can clear data instantly between tests
- Test concurrent users with multiple browser windows
- Safe to test edge cases (corrupted data, rapid operations)

### Testing Multi-User Scenarios

```bash
# Open multiple browser windows
# Incognito Mode: http://localhost:5173 (User A)
# Normal Mode: http://localhost:5173 (User B)
# Different Browser: http://localhost:5173 (User C)

# Test scenarios:
1. Create shapes simultaneously
2. Lock same shape within 50ms
3. Disconnect/reconnect during edits
4. Refresh browser mid-drag
5. Create 100+ shapes rapidly
```

### Deployment Workflow

**⚠️ All commands run from `collabcanvas/` directory:**

```bash
# Change to app directory first
cd collabcanvas

# 1. Build production bundle
npm run build

# 2. Test production build locally
npm run preview

# 3. Deploy to Vercel
vercel --prod

# 4. Update Firebase config for production domain
# (Add Vercel domain to Firebase authorized domains)

# 5. Test deployed app with multiple users
# (Share Vercel URL, test with 5+ concurrent users)
```

---

## Key Architectural Decisions

### 1. Why Hybrid Database? ⚡

**Decision:** RTDB for cursors/presence, Firestore for shapes

**Rationale:**
- Cursors need <50ms latency, 20-30 FPS updates
- Firestore average latency: ~200ms (too slow)
- RTDB optimized for real-time, high-frequency updates
- Firestore better for structured data with queries
- Separate concerns by data characteristics

**Trade-offs:**
- ✅ Best performance for each data type
- ✅ Scales to 5+ users + AI agent
- ⚠️ Slightly more complex setup (2 databases)
- ⚠️ Need to manage 2 sets of security rules

### 2. Why Service Layer? ⚡

**Decision:** Explicit service classes wrapping Firebase

**Rationale:**
- AI agent needs consistent APIs in Phase 2
- Easier to test with emulators (mock services)
- Clean separation of concerns
- Single source of truth for data operations

**Trade-offs:**
- ✅ AI-ready architecture (no refactoring)
- ✅ Testable and maintainable
- ⚠️ +1 hour initial setup time
- ✅ Saves 4+ hours in Phase 2 (no refactoring)

### 3. Why Individual Shape Documents? ⚡

**Decision:** Each shape is its own Firestore document

**Rationale:**
- Sunday requires 500+ shapes support
- Single document with array hits 1MB limit (~100-200 shapes)
- Better query performance (can filter by createdBy, color, etc.)
- No array update conflicts during concurrent edits

**Trade-offs:**
- ✅ Scales to 500+ shapes
- ✅ Better concurrent editing
- ⚠️ Slightly higher Firestore read costs
- ✅ Required for Sunday requirements

### 4. Why Vercel for Deployment?

**Decision:** Vercel instead of Firebase Hosting

**Rationale:**
- Faster deployment (GitHub integration)
- Better DX for React/Vite apps
- Automatic HTTPS and CDN
- No real benefit from Firebase Hosting here

**Trade-offs:**
- ✅ Faster deployment workflow
- ✅ Better for React apps
- ⚠️ Need to configure Firebase auth for Vercel domain
- ✅ Assignment explicitly allows Vercel

### 5. Why Konva.js?

**Decision:** Konva.js over HTML5 Canvas or SVG

**Rationale:**
- React bindings (react-konva)
- Built-in event handling
- Easy transformations (drag, scale)
- Good performance (60 FPS with 500+ shapes)
- Simpler than Three.js or PixiJS for 2D

**Trade-offs:**
- ✅ Fast implementation (saves 2-3 hours)
- ✅ Good performance for requirements
- ✅ Easy to add AI-generated shapes
- ⚠️ Not as performant as PixiJS for 10,000+ objects (not needed)

---

## Risk Mitigation

### High-Risk Areas

#### Cursor Sync Performance

- **Risk:** Latency >50ms, choppy cursor movement
- **Mitigation:** RTDB instead of Firestore, throttle to 20-30 FPS
- **Fallback:** Reduce update frequency to 15 FPS if needed

#### Shape Locking Race Conditions

- **Risk:** Two users lock same shape within 50ms
- **Mitigation:** Document as known limitation, acceptable for MVP
- **Fallback:** Add toast notification, implement transactions post-MVP

#### Firebase Costs During Testing

- **Risk:** High costs from rapid Firestore writes during development
- **Mitigation:** Use Firebase Emulators for all local development
- **Fallback:** Set up Firebase budget alerts

#### Performance with 500+ Shapes

- **Risk:** FPS drops below 60 with many shapes
- **Mitigation:** Individual shape documents, Konva performance optimization
- **Fallback:** Implement virtualization (only render visible shapes)

#### Deployment Issues

- **Risk:** Firebase auth doesn't work on Vercel domain
- **Mitigation:** Add Vercel domain to Firebase authorized domains early
- **Fallback:** Use Firebase Hosting if Vercel issues persist

---

## Success Metrics

### MVP Gate (24 Hours) - MUST PASS

- [ ] Deployed and publicly accessible
- [ ] 2+ users can connect simultaneously
- [ ] Cursor sync <50ms with name labels
- [ ] Presence awareness (online user list)
- [ ] Can create rectangles with click-and-drag
- [ ] Shapes sync across users <100ms
- [ ] Can drag shapes to move them
- [ ] Simple locking works (green/red borders)
- [ ] 60 FPS during interactions
- [ ] No critical bugs in core flow


---

## Final Checklist Before Starting

### Setup Checklist

**⚠️ Remember:** All npm/firebase commands run from `collabcanvas/` directory

- [ ] Firebase project created
- [ ] Email/Password auth enabled in Firebase Console
- [ ] (Optional) Google Sign-In enabled
- [ ] Firestore database created
- [ ] Realtime Database created
- [ ] Firebase CLI installed: `npm install -g firebase-tools` (global, run from anywhere)
- [ ] Firebase emulators initialized from `collabcanvas/`: `firebase init emulators`
- [ ] React + Vite project scaffolded in `collabcanvas/`
- [ ] Firebase SDK installed from `collabcanvas/`: `npm install firebase`
- [ ] Konva installed from `collabcanvas/`: `npm install konva react-konva`
- [ ] Additional libraries from `collabcanvas/`: `npm install lodash react-hot-toast`
- [ ] Vercel account created and linked to GitHub

### Architecture Checklist

- [ ] Understand hybrid database pattern (RTDB + Firestore)
- [ ] Understand service layer pattern (Context → Hooks → Services)
- [ ] Understand why individual shape documents (scalability)
- [ ] Understand AI integration strategy (same services)

### Development Checklist

- [ ] Start with Phase 0 (emulators)
- [ ] Build Phase 1-4 sequentially (don't skip)
- [ ] Test with emulators before deploying
- [ ] Deploy early (by Phase 3 or 4)
- [ ] Test deployed version with multiple users
- [ ] Run through complete testing checklist

