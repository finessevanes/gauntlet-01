# CollabCanvas - Quick Start Guide

## Running the Application

### Terminal 1: Firebase Emulators (Optional for testing)
```bash
cd collabcanvas
firebase emulators:start
```
- Emulator UI: http://localhost:4000
- Auth: :9099
- Firestore: :8080
- RTDB: :9000

### Terminal 2: Dev Server
```bash
cd collabcanvas
npm run dev
```
- App: http://localhost:5173

## Testing Current Features

### 1. Login/Signup
- Use any email/password (emulators accept any credentials)
- Example: test@test.com / password123

### 2. Canvas Controls
- **Mode Toggle:** Click "✋ Pan" or "✏️ Draw" buttons in toolbar
- **Pan Mode (default):** Click and drag to move canvas
- **Draw Mode:** Click and drag to create rectangles
- **Zoom:** Scroll wheel up/down
- **Color Selection:** Pick colors in Draw mode

### 3. What to Look For
✅ White canvas with gray grid (5000×5000)
✅ Mode toggle buttons visible in toolbar
✅ Pan mode: Cursor shows grab/grabbing hand
✅ Draw mode: Cursor shows crosshair, color picker visible
✅ Smooth panning when dragging in Pan mode
✅ Shape creation with preview in Draw mode
✅ Zoom centered on mouse cursor
✅ Info overlay showing zoom % and position
✅ Real-time sync of shapes across users
✅ No lag or stutter

## Current Feature Status

| PR | Feature | Status |
|----|---------|--------|
| #0 | Firebase Emulators | ✅ Complete |
| #1 | Authentication | ✅ Complete |
| #2 | Canvas + Pan/Zoom + Colors | ✅ Complete |
| #3 | Cursors + Presence | ✅ Complete |
| #4 | Shape Creation + Mode Toggle | ✅ Complete |
| #5 | Locking + Drag | ⏳ Next |

## Browser DevTools Tips

### Check Performance
1. Open DevTools (F12)
2. Performance tab → Record
3. Pan and zoom for 10 seconds
4. Stop and check FPS (target: 60)

### Check Console
- Should see no errors
- Firebase connection logs are normal

### Check Network
- WebSocket connections for emulators (when running)
- No failed requests

## Troubleshooting

### Canvas not appearing
```bash
# Check if Konva is installed
cd collabcanvas
npm list konva react-konva
```

### Dev server not starting
```bash
# Kill existing processes
lsof -ti:5173 | xargs kill -9

# Restart
npm run dev
```

### Emulators not starting
```bash
# Kill existing processes
lsof -ti:4000,8080,9000,9099 | xargs kill -9

# Restart
firebase emulators:start
```

## File Structure Reference
```
collabcanvas/
├── src/
│   ├── components/
│   │   ├── Auth/              # Login, Signup
│   │   ├── Canvas/            # Canvas, ColorToolbar [PR #2]
│   │   └── Layout/            # Navbar, AppShell [PR #2]
│   ├── contexts/
│   │   ├── AuthContext.tsx    # Auth state
│   │   └── CanvasContext.tsx  # Canvas state [PR #2]
│   ├── hooks/
│   │   └── useAuth.ts         # Auth operations
│   ├── services/
│   │   └── authService.ts     # Firebase auth
│   ├── utils/
│   │   ├── constants.ts       # Config values
│   │   └── helpers.ts         # Utility functions
│   ├── firebase.ts            # Firebase setup
│   └── App.tsx                # Main app
├── firebase.json              # Emulator config
├── firestore.rules            # Security rules
├── database.rules.json        # RTDB rules
└── package.json               # Dependencies
```

## What's Next?

### PR #5: Shape Locking + Drag to Move
- Lock shapes on first click (5-second timeout)
- Drag locked shapes to move them
- Visual indicators (green=me, red=others)
- Toast notifications for conflicts
- Uses Firestore transactions

### Testing with Multiple Users
1. Open 2+ browser windows (normal + incognito)
2. Login with different accounts
3. Switch to Draw mode and create shapes
4. Watch shapes sync in real-time
5. See cursors move across users
6. Check presence list for online users

---

**Need Help?** Check the documentation:
- `PR-4-QUICK-START.md` - PR #4 quick start guide
- `PR-4-SUMMARY.md` - Implementation details
- `PR-4-TEST-PLAN.md` - Comprehensive testing guide
- `docs/task.md` - Full task list
- `docs/prd.md` - Product requirements

