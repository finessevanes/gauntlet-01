# PR #4: Quick Start Guide

**Feature:** Shapes – Click-and-Drag Create + Sync (Firestore)

---

## 🚀 Quick Start (2 minutes)

### 1. Start the Development Environment

```bash
# Terminal 1: Start Firebase Emulators
cd /Users/finessevanes/Desktop/gauntlet-01/collabcanvas
firebase emulators:start

# Terminal 2: Start Dev Server (in a new terminal)
cd /Users/finessevanes/Desktop/gauntlet-01/collabcanvas
npm run dev
```

### 2. Open the App

- **URL:** http://localhost:5173
- **Emulator UI:** http://localhost:4000

### 3. Test Shape Creation

1. **Log in** with an existing account
2. **Select a color** from the toolbar (Red, Blue, Green, or Yellow)
3. **Click and drag** on the canvas
4. **See the preview** with dashed border
5. **Release** to create the shape

---

## ✨ What's New in PR #4

### Core Features

- ✅ **Click-and-drag rectangle creation**
  - Visual preview while dragging
  - Dashed border, 50% opacity
  
- ✅ **Real-time Firestore sync**
  - Shapes appear across all users <100ms
  - Automatic persistence
  
- ✅ **Smart size validation**
  - Minimum 10×10 pixels
  - Ignores accidental tiny clicks
  
- ✅ **Works with zoom/pan**
  - Correct coordinate transformation
  - Drawing disables stage panning

### Technical Implementation

**New Files:**
- `src/services/canvasService.ts` - Firestore operations
- `src/hooks/useCanvas.ts` - Convenience hook

**Modified Files:**
- `src/contexts/CanvasContext.tsx` - Shape state management
- `src/components/Canvas/Canvas.tsx` - Drawing logic + rendering

---

## 🎯 Quick Test Scenarios

### Test 1: Basic Creation (30 seconds)
1. Select Blue
2. Draw a rectangle
3. ✅ Shape appears solid blue

### Test 2: Multi-Color (1 minute)
1. Red → draw → red shape
2. Green → draw → green shape
3. Yellow → draw → yellow shape
4. Blue → draw → blue shape
5. ✅ All 4 colors work

### Test 3: Multi-User Sync (2 minutes)
1. Open **incognito window** → http://localhost:5173
2. Log in as different user
3. User A creates red shape → User B sees it
4. User B creates blue shape → User A sees it
5. ✅ Real-time sync working

### Test 4: Persistence (30 seconds)
1. Create 3 shapes
2. Refresh page (Cmd+R)
3. ✅ All shapes still there

---

## 🔍 Where to Look

### In the Browser
- **Navbar:** Shows your username + color dot
- **Toolbar:** 4 color buttons below navbar
- **Canvas:** White 5000×5000 area with grid
- **Shapes:** Rectangles with black borders

### In Firestore Emulator UI
1. Open http://localhost:4000
2. Click "Firestore" tab
3. Navigate: `canvases` → `main` → `shapes`
4. See all created shapes as documents

### In DevTools Console
- `🔄 Setting up shape subscription...` on load
- `✅ Shape created: <id>` on create
- `📊 Received X shape(s) from Firestore` on sync
- `🔚 Cleaning up shape subscription` on logout

---

## 🐛 Troubleshooting

### Shapes not appearing?
- ✅ Check emulators running: `firebase emulators:start`
- ✅ Check console for errors
- ✅ Verify logged in (username in navbar)
- ✅ Check Firestore emulator UI for documents

### Preview not showing?
- ✅ Make sure you're clicking on background (not on a shape)
- ✅ Try zooming in if canvas is very small on screen
- ✅ Check selectedColor is set (toolbar button highlighted)

### Multi-user sync not working?
- ✅ Make sure both windows logged in as **different users**
- ✅ Check both windows connected to same emulator (localhost:8080)
- ✅ Refresh both windows
- ✅ Check Firestore emulator UI - shapes should be there

### Build errors?
```bash
cd /Users/finessevanes/Desktop/gauntlet-01/collabcanvas
npm run build
```
- ✅ Should complete with no errors
- ✅ Warning about chunk size is OK (expected with Konva)

---

## 📋 PR Checklist Status

- ✅ Create rectangles via click-drag; ignore <10px
- ✅ Other users see shape in <100ms
- ✅ Preview appears while dragging; finalizes on mouseup
- ✅ Shapes survive refresh
- ✅ Handles negative drags
- ✅ Coordinate transformation for zoom/pan
- ✅ No linter errors
- ✅ Build succeeds
- ✅ All TypeScript types correct
- ✅ Firestore rules in place

---

## 🎉 Success!

If you can:
1. ✅ Create shapes by dragging
2. ✅ See preview while dragging
3. ✅ Switch between 4 colors
4. ✅ Open 2 windows and see shapes sync
5. ✅ Refresh and shapes persist

**Then PR #4 is working perfectly! 🎊**

---

## 🔜 Next Steps (PR #5)

PR #5 will add:
- 🔒 Shape locking (first-click wins)
- 🎯 Drag to move shapes
- ⏱️ 5-second lock timeout
- 🟢 Green border (locked by me)
- 🔴 Red border + 🔒 icon (locked by other)
- 🔔 Toast notifications

The foundation for locking is already in place in `CanvasService`.

---

## 📚 Documentation

- **Full Summary:** `PR-4-SUMMARY.md`
- **Test Plan:** `PR-4-TEST-PLAN.md`
- **Architecture:** `../docs/architecture.md`
- **Task Details:** `../docs/task.md` (Section: PR #4)

---

**Questions?** Check console logs for debugging info!

