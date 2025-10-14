# PR #4: Test Plan - Shapes Create & Sync

**Date:** October 14, 2025  
**Branch:** `feature/shapes-create-and-sync`

---

## Setup Instructions

### Terminal 1: Firebase Emulators
```bash
cd /Users/finessevanes/Desktop/gauntlet-01/collabcanvas
firebase emulators:start
```

Wait for:
- ✅ Emulator UI running at http://localhost:4000
- ✅ Auth Emulator on port 9099
- ✅ Firestore Emulator on port 8080
- ✅ RTDB Emulator on port 9000

### Terminal 2: Dev Server
```bash
cd /Users/finessevanes/Desktop/gauntlet-01/collabcanvas
npm run dev
```

Wait for:
- ✅ Vite dev server running at http://localhost:5173

---

## Test Suite

### Test 1: Single User - Basic Shape Creation

**Setup:**
1. Open http://localhost:5173
2. Log in with an existing account (or create new)

**Test Steps:**
1. ✅ **Select Color:** Click Blue button in toolbar
   - Expected: Blue button shows checkmark and border
2. ✅ **Draw Rectangle:** Click and drag on canvas
   - Expected: Preview rectangle appears with dashed border, 50% opacity, blue color
3. ✅ **Release Mouse:** Release mouse button
   - Expected: Preview disappears, solid blue rectangle appears
4. ✅ **Check Console:** Open DevTools console
   - Expected: See "✅ Shape created successfully" message

**Pass Criteria:**
- ✅ Preview appears during drag
- ✅ Final shape has correct color
- ✅ No console errors

---

### Test 2: Color Selection

**Test Steps:**
1. ✅ Select **Red** → draw rectangle → should be red
2. ✅ Select **Green** → draw rectangle → should be green  
3. ✅ Select **Yellow** → draw rectangle → should be yellow
4. ✅ Select **Blue** → draw rectangle → should be blue

**Pass Criteria:**
- ✅ All 4 colors work correctly
- ✅ Active color button shows checkmark
- ✅ Shapes persist with correct colors

---

### Test 3: Negative Drags (All Directions)

**Test Steps:**
1. ✅ **Right-Down:** Click, drag right and down → shape creates
2. ✅ **Left-Down:** Click, drag left and down → shape creates correctly
3. ✅ **Right-Up:** Click, drag right and up → shape creates correctly
4. ✅ **Left-Up:** Click, drag left and up → shape creates correctly

**Pass Criteria:**
- ✅ All directions work
- ✅ Shapes always have positive width/height
- ✅ Position is correct (top-left corner)

---

### Test 4: Minimum Size Validation

**Test Steps:**
1. ✅ **Tiny click:** Click and immediately release
   - Expected: No shape created
2. ✅ **Small drag (5px):** Drag very small rectangle
   - Expected: No shape created
3. ✅ **Minimum valid (10px):** Drag exactly 10×10 rectangle
   - Expected: Shape created
4. ✅ **Large rectangle:** Drag 500×500 rectangle
   - Expected: Shape created

**Pass Criteria:**
- ✅ Shapes < 10×10 pixels are ignored
- ✅ Shapes ≥ 10×10 pixels are created
- ✅ Console shows "Shape too small, ignoring" for tiny shapes

---

### Test 5: Zoom and Pan Interaction

**Test Steps:**
1. ✅ **Zoom in (150%):** Scroll wheel to zoom
2. ✅ **Draw rectangle:** Create shape while zoomed
   - Expected: Shape position correct in canvas coordinates
3. ✅ **Pan canvas:** Drag stage to move view
4. ✅ **Draw another rectangle:** Create shape after panning
   - Expected: Shape position correct
5. ✅ **Zoom out (50%):** Zoom out
6. ✅ **Draw third rectangle:** Create shape while zoomed out
   - Expected: Shape position correct

**Pass Criteria:**
- ✅ Shapes created at correct canvas positions regardless of zoom
- ✅ Shapes don't "jump" after creation
- ✅ Coordinate transformation works correctly

---

### Test 6: Drawing vs Panning (Mode Toggle)

**Test Steps:**
1. ✅ **Default Pan Mode:** On load, toolbar shows "✋ Pan" button highlighted
   - Expected: Cursor shows open hand (grab)
2. ✅ **Test panning:** Click and drag anywhere
   - Expected: Canvas pans, cursor changes to grabbing hand
3. ✅ **Switch to Draw Mode:** Click "✏️ Draw" button in toolbar
   - Expected: Draw button highlighted, color picker appears, cursor shows crosshair
4. ✅ **Draw shape:** Click and drag
   - Expected: Preview shows, stage doesn't move
5. ✅ **Verify no pan:** While in Draw mode, canvas should not pan
6. ✅ **Switch back to Pan Mode:** Click "✋ Pan" button
   - Expected: Pan button highlighted, color picker hides, cursor shows grab
7. ✅ **Test panning again:** Click and drag
   - Expected: Canvas pans normally

**Pass Criteria:**
- ✅ Mode toggle buttons work correctly
- ✅ Pan mode: canvas pans, cursor shows grab/grabbing
- ✅ Draw mode: shapes create, cursor shows crosshair
- ✅ Color picker only visible in Draw mode
- ✅ Clear visual indication of current mode
- ✅ No conflict between modes

---

### Test 7: Multi-User Real-Time Sync

**Setup:**
1. Open **TWO browser windows:**
   - Window A: Normal browsing (http://localhost:5173)
   - Window B: Incognito mode (http://localhost:5173)
2. Log in as different users in each

**Test Steps:**
1. ✅ **User A creates red rectangle:**
   - Window A: Select red, draw rectangle
   - Window B: Watch for shape to appear
   - Expected: Shape appears in Window B within <100ms
2. ✅ **User B creates blue rectangle:**
   - Window B: Select blue, draw rectangle
   - Window A: Watch for shape to appear
   - Expected: Shape appears in Window A within <100ms
3. ✅ **Simultaneous creation:**
   - Both users create shapes at the same time
   - Expected: Both shapes appear in both windows

**Pass Criteria:**
- ✅ Shapes sync within <100ms
- ✅ Both users see all shapes
- ✅ Colors are correct for each shape
- ✅ No shapes "missing" or duplicated

---

### Test 8: Persistence Across Refresh

**Test Steps:**
1. ✅ **Create 5 shapes:** Different colors and sizes
2. ✅ **Refresh page:** Press Cmd+R (Mac) or Ctrl+R (Windows)
3. ✅ **Wait for load:** Canvas loads
   - Expected: All 5 shapes still visible
4. ✅ **Check Firestore:** Open http://localhost:4000
   - Navigate to Firestore tab
   - Check `canvases/main/shapes` collection
   - Expected: See 5 documents

**Pass Criteria:**
- ✅ All shapes persist after refresh
- ✅ Shapes have correct positions, sizes, colors
- ✅ Firestore documents exist

---

### Test 9: Shape Data Validation

**Test Steps:**
1. ✅ **Create a shape:** Any color and size
2. ✅ **Open Emulator UI:** http://localhost:4000
3. ✅ **Navigate to Firestore:**
   - Click "Firestore" tab
   - Open `canvases` → `main` → `shapes`
   - Click on any shape document
4. ✅ **Verify fields:**
   ```
   ✅ id: <string>
   ✅ type: "rectangle"
   ✅ x: <number>
   ✅ y: <number>
   ✅ width: <number> (>= 10)
   ✅ height: <number> (>= 10)
   ✅ color: <hex string>
   ✅ createdBy: <userId string>
   ✅ createdAt: <Timestamp>
   ✅ updatedAt: <Timestamp>
   ✅ lockedBy: null
   ✅ lockedAt: null
   ```

**Pass Criteria:**
- ✅ All required fields present
- ✅ Timestamps are valid
- ✅ createdBy matches current user's uid

---

### Test 10: Performance - Many Shapes

**Test Steps:**
1. ✅ **Create 20 shapes:** Various colors and sizes
2. ✅ **Check FPS:** Open DevTools → Performance tab
   - Expected: ~60 FPS during pan/zoom
3. ✅ **Create 20 more shapes:** Total 40 shapes
   - Expected: Still smooth at ~60 FPS
4. ✅ **Pan and zoom:** Test stage interactions
   - Expected: No lag or jank

**Pass Criteria:**
- ✅ Canvas maintains 60 FPS with 40+ shapes
- ✅ No visible lag during creation
- ✅ Smooth pan and zoom

---

### Test 11: Console Logs (Debug)

**Expected Console Output:**

**On Login:**
```
🔄 Setting up shape subscription...
📊 Received X shape(s) from Firestore
```

**On Shape Creation:**
```
✅ Shape created: <shapeId>
📊 Received X shape(s) from Firestore
✅ Shape created successfully
```

**On Page Refresh:**
```
🔄 Setting up shape subscription...
📊 Received X shape(s) from Firestore
```

**On Logout:**
```
🔚 Cleaning up shape subscription
```

**Pass Criteria:**
- ✅ No error messages in console
- ✅ All operations logged clearly
- ✅ Subscription cleanup happens on logout

---

### Test 12: Error Handling

**Test Steps:**
1. ✅ **Stop Firestore Emulator:**
   - Kill Terminal 1 (emulators)
2. ✅ **Try to create shape:**
   - Expected: Error in console, but no crash
3. ✅ **Restart emulators:**
   - Start Terminal 1 again
4. ✅ **Wait for reconnection:**
   - Expected: Shapes load automatically

**Pass Criteria:**
- ✅ App doesn't crash when Firestore unavailable
- ✅ Automatic reconnection works
- ✅ User sees error message (console) but UI stable

---

## Success Criteria Summary

### Core Functionality
- ✅ Click-and-drag creates rectangles with preview
- ✅ 4 colors selectable from toolbar
- ✅ Shapes sync across users in <100ms
- ✅ Shapes persist across refresh
- ✅ Minimum size validation (10×10)

### Edge Cases
- ✅ Negative drags (all 4 directions)
- ✅ Zoom and pan coordinate transformation
- ✅ Drawing doesn't interfere with stage panning
- ✅ Tiny clicks don't create shapes

### Performance
- ✅ 60 FPS with 40+ shapes
- ✅ <100ms sync latency
- ✅ No memory leaks

### Code Quality
- ✅ No console errors
- ✅ Clean TypeScript types
- ✅ Proper cleanup on unmount
- ✅ Build succeeds without errors

---

## Known Issues / Expected Behavior

1. **Mode toggle required:** Users must switch between Pan and Draw modes - this is intentional UX design
2. **Default is Pan mode:** Users start in Pan mode and must click "Draw" to create shapes
3. **Last-write-wins for concurrent edits:** Simple MVP approach, will be improved in PR #5
4. **No shape deletion yet:** Out of scope for PR #4
5. **Basic error handling:** Only console logs for now, toasts coming in PR #5

---

## Regression Testing

### Verify Previous Features Still Work

- ✅ **PR #1 (Auth):**
  - Can still log in/out
  - Username displayed in navbar
  - Cursor color assigned

- ✅ **PR #2 (Canvas):**
  - Pan and zoom still work
  - Color toolbar still functional
  - Canvas bounds visible

- ✅ **PR #3 (Cursors):**
  - Cursors still sync in real-time
  - Presence list shows online users
  - Cursors disappear on disconnect

---

## Ready for PR Review

After completing all tests above, PR #4 is ready to merge if:

- ✅ All 12 tests pass
- ✅ No console errors
- ✅ Build succeeds
- ✅ Previous features still work (regression tests)
- ✅ Multi-user sync < 100ms
- ✅ 60 FPS with 40+ shapes

**Test completed by:** _____________  
**Date:** _____________  
**Result:** ✅ PASS / ❌ FAIL  
**Notes:** _____________

