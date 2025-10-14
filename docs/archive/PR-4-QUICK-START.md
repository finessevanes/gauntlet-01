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
2. **Switch to Draw Mode:** Click the "✏️ Draw" button in the toolbar
3. **Select a color** from the color picker (Red, Blue, Green, or Yellow)
4. **Click and drag** on the canvas
5. **See the preview** with dashed border
6. **Release** to create the shape

### 4. Test Panning

1. **Switch to Pan Mode:** Click the "✋ Pan" button in the toolbar
2. **Click and drag** on the canvas to move around
3. **Use mouse wheel** to zoom in/out

---

## ✨ What's New in PR #4

### Core Features

- ✅ **Mode toggle: Pan vs Draw**
  - ✋ Pan mode (default): Click and drag to move canvas
  - ✏️ Draw mode: Click and drag to create rectangles
  - Clear visual cursor feedback (grab vs crosshair)
  - Color picker only shows in Draw mode

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
  - No conflicts between panning and drawing

### Technical Implementation

**New Files:**
- `src/services/canvasService.ts` - Firestore operations
- `src/hooks/useCanvas.ts` - Convenience hook

**Modified Files:**
- `src/contexts/CanvasContext.tsx` - Shape state + mode toggle
- `src/components/Canvas/Canvas.tsx` - Drawing logic + rendering
- `src/components/Canvas/ColorToolbar.tsx` - Mode toggle UI

---

## 🎯 Quick Test Scenarios

### Test 1: Mode Toggle (30 seconds)
1. Default is Pan mode (✋ highlighted)
2. Click and drag → canvas pans
3. Click "Draw" button → cursor changes to crosshair
4. Click "Pan" button → cursor changes to grab
5. ✅ Mode toggle works

### Test 2: Basic Shape Creation (30 seconds)
1. Click "Draw" mode
2. Select Blue color
3. Draw a rectangle
4. ✅ Shape appears solid blue

### Test 3: Multi-Color (1 minute)
1. Stay in Draw mode
2. Red → draw → red shape
3. Green → draw → green shape
4. Yellow → draw → yellow shape
5. Blue → draw → blue shape
6. ✅ All 4 colors work

### Test 4: Multi-User Sync (2 minutes)
1. Open **incognito window** → http://localhost:5173
2. Log in as different user
3. Both users switch to Draw mode
4. User A creates red shape → User B sees it
5. User B creates blue shape → User A sees it
6. ✅ Real-time sync working

### Test 5: Persistence (30 seconds)
1. Switch to Draw mode
2. Create 3 shapes
3. Refresh page (Cmd+R)
4. ✅ All shapes still there

---

## 🔍 Where to Look

### In the Browser
- **Navbar:** Shows your username + color dot
- **Toolbar:** Mode toggle (Pan/Draw) + color picker (when in Draw mode)
- **Canvas:** White 5000×5000 area with grid
- **Shapes:** Rectangles with black borders
- **Cursor:** Changes based on mode (grab/grabbing in Pan, crosshair in Draw)

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
- ✅ Make sure you're in **Draw mode** (✏️ button highlighted)
- ✅ Make sure you're clicking on background (not on a shape)
- ✅ Try zooming in if canvas is very small on screen
- ✅ Check selectedColor is set (color button highlighted)

### Can't pan the canvas?
- ✅ Make sure you're in **Pan mode** (✋ button highlighted)
- ✅ Click the "Pan" button in the toolbar to switch modes

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
1. ✅ Toggle between Pan and Draw modes
2. ✅ See correct cursor for each mode
3. ✅ Create shapes by dragging in Draw mode
4. ✅ Pan canvas in Pan mode
5. ✅ Switch between 4 colors
6. ✅ Open 2 windows and see shapes sync
7. ✅ Refresh and shapes persist

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

