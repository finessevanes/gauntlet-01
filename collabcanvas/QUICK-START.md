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

## Testing PR #2 Features

### 1. Login/Signup
- Use any email/password (emulators accept any credentials)
- Example: test@test.com / password123

### 2. Canvas Controls
- **Pan:** Click and drag on the canvas
- **Zoom:** Scroll wheel up/down
- **Color Selection:** Click colored buttons in toolbar

### 3. What to Look For
✅ White canvas with gray grid (5000×5000)
✅ Blue color selected by default
✅ Smooth panning when dragging
✅ Zoom centered on mouse cursor
✅ Info overlay showing zoom % and position
✅ No lag or stutter

## Current Feature Status

| PR | Feature | Status |
|----|---------|--------|
| #0 | Firebase Emulators | ✅ Complete |
| #1 | Authentication | ✅ Complete |
| #2 | Canvas + Pan/Zoom + Colors | ✅ Complete |
| #3 | Cursors + Presence | ⏳ Next |
| #4 | Shape Creation | ⏳ Planned |
| #5 | Locking + Drag | ⏳ Planned |

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

### PR #3: Real-Time Cursors + Presence
- See other users' cursors in real-time
- Online user list
- Uses Firebase Realtime Database
- 20-30 FPS cursor updates

### Testing with Multiple Users
1. Open 2+ browser windows
2. Login with different accounts
3. Watch cursors move in real-time
4. See presence list update

---

**Need Help?** Check the documentation:
- `PR-2-SUMMARY.md` - Implementation details
- `PR-2-TEST-PLAN.md` - Comprehensive testing guide
- `docs/task.md` - Full task list
- `docs/prd.md` - Product requirements

