# CollabCanvas MVP – Development Task List

---

## Project File Structure (TS + Service Layer)

**Note:** This app lives in `/collabcanvas` subdirectory within the `gauntlet-01` root project. All commands below should be run from the `collabcanvas/` directory unless otherwise specified.

```
gauntlet-01/                    (root project directory)
├── prd.md
├── task.md
├── architecture.md
├── package.json                (root level)
└── collabcanvas/               (React app - YOUR WORKING DIRECTORY)
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Auth/
    │   │   │   ├── Login.tsx
    │   │   │   ├── Signup.tsx
    │   │   │   └── AuthProvider.tsx
    │   │   ├── Canvas/
    │   │   │   ├── Canvas.tsx
    │   │   │   ├── ColorToolbar.tsx
    │   │   │   └── CursorLayer.tsx
    │   │   ├── Collaboration/
    │   │   │   ├── Cursor.tsx
    │   │   │   ├── PresenceList.tsx
    │   │   │   └── UserPresenceBadge.tsx
    │   │   └── Layout/
    │   │       ├── Navbar.tsx
    │   │       └── AppShell.tsx
    │   ├── contexts/
    │   │   ├── AuthContext.tsx
    │   │   └── CanvasContext.tsx
    │   ├── hooks/
    │   │   ├── useAuth.ts
    │   │   ├── useCanvas.ts
    │   │   ├── useCursors.ts
    │   │   └── usePresence.ts
    │   ├── services/
    │   │   ├── authService.ts
    │   │   ├── canvasService.ts
    │   │   ├── cursorService.ts
    │   │   └── presenceService.ts
    │   ├── utils/
    │   │   ├── constants.ts
    │   │   └── helpers.ts
    │   ├── firebase.ts
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css
    ├── tests/
    │   ├── setup.ts
    │   ├── unit/
    │   │   ├── services/
    │   │   │   ├── authService.test.ts
    │   │   │   ├── canvasService.test.ts
    │   │   │   └── presenceCursor.test.ts
    │   │   └── utils/
    │   │       └── helpers.test.ts
    │   └── integration/
    │       ├── auth-flow.test.ts
    │       ├── cursor-presence.test.ts
    │       └── shapes-locking.test.ts
    ├── .env
    ├── .env.example
    ├── .gitignore
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── firebase.json
    ├── firestore.rules
    ├── database.rules.json
    ├── .firebaserc
    └── README.md
```

---

## PR #0: Tooling & Firebase Emulators

**Branch:** `setup/emulators-and-scaffold`
**Goal:** Local-first dev with Firebase Emulators + Vite React TS scaffold

**⚠️ Working Directory:** All commands in PR #0 and beyond run from `collabcanvas/` unless specified otherwise.

### Tasks

#### 0.1: Scaffold project (React + Vite + TS)

```bash
# Run from gauntlet-01 root (one-time setup)
npm create vite@latest collabcanvas -- --template react-ts
```

Add recommended deps:
```bash
# Run from collabcanvas/ directory
cd collabcanvas
npm install firebase konva react-konva lodash react-hot-toast
```

#### 0.2: Firebase CLI + Emulators

```bash
# Install globally (run from anywhere, one-time)
npm i -g firebase-tools

# Initialize emulators (run from collabcanvas/)
cd collabcanvas
firebase init emulators
```

Configure emulators:
- Auth: 9099
- Firestore: 8080
- RTDB: 9000
- Emulator UI: 4000

Create `firebase.json` with emulator targets & `firestore.rules`, `database.rules.json` (all in `collabcanvas/`)

#### 0.3: Firebase init file

Create `src/firebase.ts`:
- Initialize app
- Connect to emulators if `import.meta.env.MODE === 'development'`

#### 0.4: Base project wiring

- Add `.env.example` (API keys)
- Add `.gitignore` (ignore `.env`, `node_modules`, `dist`)
- Verify dev server + emulator local read/write (dummy read/write test)

#### 0.5: README bootstrap

Document local dev instructions in `collabcanvas/README.md`:
```bash
# Terminal 1 (from collabcanvas/)
firebase emulators:start

# Terminal 2 (from collabcanvas/)
npm run dev
```

### PR Checklist

- [x] `firebase emulators:start` works from `collabcanvas/`; Emulator UI accessible at http://localhost:4000
- [ ] App boots at http://localhost:5173; `src/firebase.ts` talks to emulators in dev
- [ ] Dummy Firestore/RTDB read/write succeeds

---

## PR #1: Authentication (P0 – must be first)

**Branch:** `feature/authentication`
**Goal:** Email/password auth, username, color assignment, persisted session

### Tasks

#### 1.1: Firestore users collection

**Fields:** `uid`, `username`, `email`, `cursorColor`, `createdAt`

#### 1.2: AuthService

Implement:
- `signup(email, password, username)`
- `login(email, password)`
- `logout()`
- `getCurrentUser()`, `onAuthStateChanged(cb)`

On signup: create Firestore `users/{uid}` with random color

#### 1.3: Context + Hook

- `AuthContext` exposes `{ user, loading, signup, login, logout }`
- `useAuth()` wraps context

#### 1.4: UI

- `Signup.tsx` (email, password, username) → redirects to canvas
- `Login.tsx` (email, password) + link to signup
- `Navbar.tsx` shows username + Logout

#### 1.5: Route guard

- If not authed → show Login/Signup
- If authed → show Canvas/AppShell

### PR Checklist

- [x] Can sign up/log in/log out
- [x] Username stored & displayed
- [x] Cursor color assigned once on signup
- [x] Auth persists on refresh

---

## PR #2: Canvas Shell + Pan/Zoom + Color Toolbar (P0)

**Branch:** `feature/canvas-core`
**Goal:** 5000×5000 stage with Konva, pan/zoom, 4-color toolbar

### Tasks

#### 2.1: Constants

- `CANVAS_W=5000`, `CANVAS_H=5000`
- Default color = Blue `#3b82f6`
- Palette:
  - Red `#ef4444`
  - Blue `#3b82f6`
  - Green `#10b981`
  - Yellow `#f59e0b`

#### 2.2: Canvas component

- Konva Stage + Layer
- Panning (drag stage)
- Wheel-zoom (cursor-centered; min 0.1, max 3)

#### 2.3: ColorToolbar

- 4 buttons
- Highlight active
- Updates selected color via context/state

#### 2.4: AppShell

Layout with Navbar, presence area placeholder, Canvas area

### PR Checklist

- [ ] Stage renders at 5000×5000
- [ ] Pan via drag; zoom via wheel centers on cursor
- [ ] Toolbar selects among 4 colors; default Blue
- [ ] 60 FPS during pan/zoom

---

## PR #3: Cursor Sync + Presence (RTDB, P0)

**Branch:** `feature/realtime-cursors-presence`
**Goal:** Real-time cursors (20–30 FPS), presence list, disconnect cleanup

### Tasks

#### 3.1: RTDB paths

`/sessions/main/users/{userId}/cursor` and `/presence` (per PRD combined under user node)

#### 3.2: Services

**cursorService:**
- `updateCursorPosition(userId, x, y, username, color)`
- `subscribeToCursors(cb)`, `removeCursor(userId)`

**presenceService:**
- `setOnline(userId, username)`
- `setOffline(userId)`
- `subscribeToPresence(cb)`
- `setupDisconnectHandler(userId)`

#### 3.3: Hooks + UI

- `useCursors`: track mouse over canvas, throttle 33–50ms with lodash.throttle, convert to canvas coords, enforce 5000×5000 bounds
- `CursorLayer` renders all other users' cursors with name labels
- `usePresence` + `PresenceList.tsx` shows online users; color dots match cursor color

#### 3.4: Lifecycle

- On auth ready: mark online + setup onDisconnect
- Cleanup on unmount/logout

### PR Checklist

- [ ] Two browsers show each other's cursors within <50ms
- [ ] Cursors only visible within 5000×5000 canvas bounds
- [ ] Presence list updates immediately on join/leave
- [ ] Smooth cursor motion, no jank with 5 users

---

## PR #4: Shapes – Click-and-Drag Create + Sync (Firestore)

**Branch:** `feature/shapes-create-and-sync`
**Goal:** Rectangle creation by drag with preview; real-time sync across users

### Tasks

#### 4.1: Data model

`canvases/main/shapes/{shapeId}` documents:
- `id`, `type='rectangle'`
- `x`, `y`, `width`, `height`, `color`
- `createdBy`, `createdAt`
- `lockedBy`, `lockedAt`, `updatedAt`

#### 4.2: CanvasService

Implement:
- `createShape(shapeData)`
- `updateShape(shapeId, updates)`
- `subscribeToShapes(cb)`
- `getShapes()`

#### 4.3: Canvas drawing logic

- **mousedown** on background → start point
- **mousemove** → preview rect (dashed, 50% opacity, selected color)
- **mouseup** → if ≥10×10 create shape; handle negative drags (min/abs + adjust x/y)
- Ensure create doesn't conflict with panning

#### 4.4: Render shapes

- Map Firestore shapes to `<Rect>`
- Color from document
- Shapes persist across refresh

### PR Checklist

- [ ] Create rectangles via click-drag; ignore <10px
- [ ] Other users see shape in <100ms
- [ ] Preview appears while dragging; finalizes on mouseup
- [ ] Shapes survive refresh

> **Note:** Delete/resize/rotate explicitly out of scope (per PRD)

---

## PR #5: Simple Locking + Drag Move

**Branch:** `feature/shapes-locking-and-drag`
**Goal:** First-click wins lock (soft, 5s timeout), move shape, clear lock on deselect/drag-end/disconnect

### Tasks

#### 5.1: Locking in CanvasService

`lockShape(shapeId, userId)` logic per PRD:
- If `lockedBy` exists and not me and `lockedAt` < 5s → fail
- Else set `{lockedBy:userId, lockedAt:serverTimestamp()}`

`unlockShape(shapeId)`

#### 5.2: Select & move

- Click on shape → attempt lock
- If locked-by-me: green border, `draggable=true`
- If locked-by-other: red border + lock icon, 50% opacity, no interaction
- On drag end: persist `{x,y}`, then unlock
- Deselect (click background) → unlock
- Auto-timeout unlock after 5s inactivity (client-side check + honor remote changes)

#### 5.3: Toaster feedback

On lock fail → toast: "Shape locked by [username]"

### PR Checklist

- [ ] A locks → green border; B sees red + lock icon and cannot interact
- [ ] Unlock on deselect/drag-end; timeout after ~5s
- [ ] <100ms movement sync for other users
- [ ] No stuck locks after refresh/disconnect

---

## PR #6: Rules, Testing, Polish

**Branch:** `fix/rules-tests-polish`
**Goal:** Secure reads/writes, emulator tests, UI/UX seams smoothed

### Tasks

#### 6.1: Security rules

- **Firestore** (`firestore.rules`) exactly as in PRD:
  - Users write only own doc
  - Shapes readable/writable by authed
  - Validate `createdBy` on create
- **RTDB** (`database.rules.json`) with per-user node write restriction

#### 6.2: Tests (Vitest + RTL)

**Unit tests:**
- Services (auth, canvas CRUD, presence/cursor)

**Integration tests:**
- Auth flow
- Cursor + presence
- Create/move/lock

Emulator test harness in `tests/setup.ts`

#### 6.3: Polish

- Loading states (auth, shapes initial load)
- Error boundaries or simple error toasts
- No console errors; consistent spacing; responsive button states

### PR Checklist

- [ ] Rules deployed to emulators & pass smoke tests
- [ ] All target tests green locally
- [ ] No console errors; clean UX

---

## PR #7: Deployment (Vercel) + Prod Rules

**Branch:** `deploy/vercel-prod`
**Goal:** Public URL, Firebase auth configured for domain, prod tests

### Tasks

#### 7.1: Build & deploy

```bash
npm run build
vercel --prod
```

(or GitHub connect)

Add Vercel domain to Firebase Auth authorized domains

#### 7.2: Env & config

- Update `.env.example` with required Firebase keys
- Ensure `src/firebase.ts` uses prod config in non-dev

#### 7.3: Final testing

- 5+ users sanity test on deployed URL
- Verify cursors <50ms, shapes <100ms, locks OK

### PR Checklist

- [ ] Public URL live, auth works
- [ ] Real-time cursors/presence work
- [ ] Shapes create/move/lock work across users
- [ ] README updated with live link + deploy steps

---

## MVP Completion Checklist

### Required

- [ ] Auth (email/password), username, color assignment
- [ ] RTDB cursors (20–30 FPS, <50ms) + presence with onDisconnect
- [ ] 5000×5000 canvas; pan/zoom (cursor-centered)
- [ ] Color toolbar (Red/Blue/Green/Yellow; default Blue)
- [ ] Click-and-drag rectangle creation with preview (min 10×10)
- [ ] Firestore shape sync (<100ms)
- [ ] Simple locking (first-click wins, 5s timeout, green/red borders, lock icon)
- [ ] Drag move (persist to Firestore)
- [ ] Deployed public URL (Vercel); 5+ users sanity check
- [ ] 60 FPS interactions (target)

### Performance Targets

- Cursors smooth at 20–30 FPS
- Shape ops <100ms round trip
- 5+ concurrent users without noticeable degradation

### Explicitly NOT in MVP (push to Post-MVP)

- Delete shapes, resize/rotate, multi-select, style editing
- Undo/redo, advanced color picker, mobile, multiple canvases
- Transactions for locks (documented limitation)
- AI agent (Phase 2)

---

## Post-MVP Staging

**Create issues, not PRs now:**

- Firestore transactions for lock acquisition
- Delete/resize/rotate/multi-select
- Full color picker & stroke styles
- AI Agent (function tools calling CanvasService)
- Workspace management
