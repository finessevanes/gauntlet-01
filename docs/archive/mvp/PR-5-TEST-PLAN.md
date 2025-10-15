# PR #5: Shape Locking + Drag Move - Test Plan

**Branch:** `feature/shapes-locking-and-drag`  
**Testing Date:** October 14, 2025

---

## Test Environment Setup

### Prerequisites:
1. Firebase emulators running on localhost
2. Two browser instances (or regular + incognito)
3. Two test users created (User A and User B)

### Start Commands:
```bash
# Terminal 1 - Start Firebase Emulators
cd collabcanvas
firebase emulators:start

# Terminal 2 - Start Dev Server
cd collabcanvas
npm run dev
```

### Access:
- Dev Server: http://localhost:5173
- Emulator UI: http://localhost:4000

---

## Test Suite 1: Basic Locking

### Test 1.1: Lock Acquisition (Success)
**Steps:**
1. User A: Create a rectangle shape
2. User A: Click on the shape (not drag)
3. **Expected:** Shape shows green border (3px, #10b981)
4. **Expected:** Four green corner handles appear
5. **Expected:** Console log: "✅ Successfully locked shape: [shapeId]"

**Pass Criteria:**
- Green visual indicators appear immediately
- Shape is selected (border + handles visible)
- No errors in console

---

### Test 1.2: Lock Visual for Other Users
**Steps:**
1. User A: Lock a shape (green border)
2. User B: Observe the same shape
3. **Expected:** Shape shows red border (3px, #ef4444)
4. **Expected:** Shape opacity reduced to 50%
5. **Expected:** Lock icon (🔒) appears in center of shape

**Pass Criteria:**
- Red border visible on User B's screen
- Lock icon clearly visible
- Shape appears dimmed (50% opacity)

---

### Test 1.3: Lock Denial (Failure)
**Steps:**
1. User A: Lock a shape
2. User B: Click on the same shape
3. **Expected:** Toast notification appears at top-center
4. **Expected:** Toast message: "Shape locked by [User A's username]"
5. **Expected:** Toast disappears after 2 seconds
6. **Expected:** Shape remains red with lock icon

**Pass Criteria:**
- Toast appears immediately on click
- Username is correct
- Shape remains non-interactive
- Console log: "🔒 Shape [shapeId] is locked by [userId]"

---

## Test Suite 2: Drag & Move

### Test 2.1: Drag Locked Shape
**Steps:**
1. User A: Lock a shape (click)
2. User A: Click and drag shape to new position
3. **Expected:** Shape moves smoothly during drag
4. **Expected:** Green border remains during drag
5. **Expected:** Position updates in real-time for User A

**Pass Criteria:**
- Smooth 60 FPS dragging
- No jitter or lag
- Shape stays within canvas bounds
- Console log: "🎯 Shape drag started: [shapeId]"

---

### Test 2.2: Drag End & Position Sync
**Steps:**
1. User A: Drag shape to new position and release
2. **Expected:** Console log: "🎯 Shape drag ended: [shapeId] New position: [x, y]"
3. **Expected:** Console log: "✅ Shape position updated in Firestore"
4. **Expected:** Shape unlocks (green border disappears)
5. User B: Observe shape position
6. **Expected:** Shape appears at new position within <100ms

**Pass Criteria:**
- Position persists after release
- Shape unlocks automatically
- Other users see new position quickly (<100ms)
- No console errors

---

### Test 2.3: Cannot Drag Locked Shape (Other User)
**Steps:**
1. User A: Lock a shape
2. User B: Attempt to drag the shape (red border)
3. **Expected:** Shape does not move
4. **Expected:** Shape remains locked by User A

**Pass Criteria:**
- Shape is non-interactive for User B
- Dragging has no effect
- Red border and lock icon remain

---

## Test Suite 3: Deselection

### Test 3.1: Deselect on Background Click
**Steps:**
1. User A: Lock a shape (green border)
2. User A: Click on canvas background (not on any shape)
3. **Expected:** Console log: "🔓 Deselecting and unlocking shape: [shapeId]"
4. **Expected:** Console log: "🔓 Shape unlocked: [shapeId]"
5. **Expected:** Green border and handles disappear
6. User B: Observe shape
7. **Expected:** Red border and lock icon disappear

**Pass Criteria:**
- Shape unlocks immediately
- Visual indicators removed for both users
- Other users can now click and lock

---

### Test 3.2: Deselect Before Locking Another
**Steps:**
1. User A: Lock Shape 1 (green border)
2. User A: Click Shape 2
3. **Expected:** Shape 1 unlocks automatically
4. **Expected:** Shape 2 locks (green border)
5. **Expected:** Only one shape locked at a time

**Pass Criteria:**
- Previous shape unlocks before new lock
- No double-locks
- Smooth transition between shapes

---

## Test Suite 4: Auto-Timeout

### Test 4.1: 5-Second Timeout
**Steps:**
1. User A: Lock a shape (green border)
2. Wait 5 seconds without any interaction
3. **Expected:** After ~5 seconds, console log: "⏰ Auto-unlocking shape due to 5s timeout: [shapeId]"
4. **Expected:** Console log: "🔓 Shape unlocked: [shapeId]"
5. **Expected:** Green border disappears
6. User B: Click the shape
7. **Expected:** Shape locks for User B (green border on B's screen)

**Pass Criteria:**
- Timeout triggers at approximately 5000ms
- Shape unlocks automatically
- Other users can lock immediately after timeout
- No stuck locks

---

### Test 4.2: Timeout Reset on Interaction [TESTED UP TO HERE: MOVING FORWARD]
**Steps:**
1. User A: Lock a shape
2. Wait 3 seconds
3. User A: Click on the shape again (refresh lock)
4. Wait 3 seconds
5. **Expected:** Shape remains locked (timeout resets)
6. Wait 5 more seconds (8 total from initial lock)
7. **Expected:** Shape unlocks after 5s from last interaction

**Pass Criteria:**
- Clicking shape resets timeout
- Timeout countdown restarts on interaction
- Shape unlocks 5s after last touch

---

### Test 4.3: Timeout Cancel on Drag
**Steps:**
1. User A: Lock a shape
2. Wait 4 seconds
3. User A: Start dragging shape
4. **Expected:** Timeout is cancelled
5. User A: Continue dragging for 2 more seconds
6. **Expected:** Shape remains locked during drag
7. User A: Release drag
8. **Expected:** Shape unlocks on drag end (not timeout)

**Pass Criteria:**
- Drag cancels timeout timer
- No timeout during active drag
- Shape unlocks immediately on drag end

---

## Test Suite 5: Disconnect & Edge Cases

### Test 5.1: Disconnect While Locked
**Steps:**
1. User A: Lock a shape (green border)
2. User A: Close browser tab/window
3. Wait 5-6 seconds
4. User B: Click on the shape
5. **Expected:** Shape locks for User B (was unlocked by timeout)

**Pass Criteria:**
- Disconnected user's lock expires after 5s
- Other users can steal expired lock
- No stuck locks after disconnect

---

### Test 5.2: Refresh While Locked
**Steps:**
1. User A: Lock a shape
2. User A: Refresh page (F5 or Cmd+R)
3. **Expected:** Lock is cleared on refresh
4. User B: Can immediately lock the shape

**Pass Criteria:**
- Locks don't persist across refresh
- Clean state after refresh
- Other users can lock immediately

---

### Test 5.3: Multiple Shapes
**Steps:**
1. Create 5+ shapes on canvas
2. User A: Lock Shape 1
3. User B: Lock Shape 2
4. User A: Lock Shape 3 (unlocks Shape 1)
5. **Expected:** Each user can lock one shape at a time
6. **Expected:** Different users can lock different shapes simultaneously

**Pass Criteria:**
- One lock per user maximum
- Multiple locks across users allowed
- No interference between user locks

---

### Test 5.4: Lock After Timeout Steal
**Steps:**
1. User A: Lock a shape
2. Wait 6 seconds (timeout)
3. User B: Click shape immediately after timeout
4. **Expected:** Lock stolen by User B
5. **Expected:** Console log: "⏰ Lock timeout ([duration]ms), stealing lock from [User A]"
6. User A: Click shape again
7. **Expected:** Lock denied toast appears for User A

**Pass Criteria:**
- Expired locks can be stolen
- Steal happens automatically on next lock attempt
- Original user cannot re-lock immediately

---

## Test Suite 6: Visual Indicators

### Test 6.1: Border Colors
**Verify:**
- Unlocked shape: Black border (#000000), 1px
- Locked by me: Green border (#10b981), 3px
- Locked by other: Red border (#ef4444), 3px

**Pass Criteria:**
- All border colors match exactly
- Border widths correct

---

### Test 6.2: Lock Icon
**Steps:**
1. User A: Lock a shape
2. User B: Observe shape
3. **Expected:** Lock icon 🔒 centered on shape
4. **Expected:** Red background box behind icon
5. **Expected:** Icon is 20px font size

**Pass Criteria:**
- Icon clearly visible
- Centered on shape
- Background box visible

---

### Test 6.3: Corner Handles
**Steps:**
1. User A: Lock a shape
2. **Expected:** Four green squares (8x8px) at corners
3. **Expected:** Handles positioned at:
   - Top-left: (-4, -4)
   - Top-right: (width-4, -4)
   - Bottom-left: (-4, height-4)
   - Bottom-right: (width-4, height-4)

**Pass Criteria:**
- All four handles visible
- Green color (#10b981)
- Correctly positioned at corners

---

### Test 6.4: Opacity Changes
**Steps:**
1. User A: Lock a shape
2. User B: Observe shape
3. **Expected:** Shape opacity is 50% for User B
4. User A: Release lock
5. **Expected:** Opacity returns to 100% for both users

**Pass Criteria:**
- Locked shapes dimmed for non-owners
- Opacity restored on unlock

---

## Test Suite 7: Performance

### Test 7.1: Lock Acquisition Speed
**Steps:**
1. Click unlocked shape
2. Measure time to green border appearance
3. **Expected:** <50ms visual feedback

**Pass Criteria:**
- Instant visual feedback
- No noticeable delay

---

### Test 7.2: Position Sync Speed
**Steps:**
1. User A: Drag shape to new position
2. Measure time for User B to see update
3. **Expected:** <100ms sync time

**Pass Criteria:**
- Position updates quickly
- Smooth sync across users

---

### Test 7.3: Toast Notification Speed
**Steps:**
1. User B: Click shape locked by User A
2. Measure toast appearance time
3. **Expected:** <50ms toast display

**Pass Criteria:**
- Toast appears immediately
- No delay in feedback

---

### Test 7.4: Multiple Locks (Load Test)
**Steps:**
1. Create 20+ shapes
2. Lock/unlock shapes rapidly
3. **Expected:** No lag or jitter
4. **Expected:** Maintain 60 FPS

**Pass Criteria:**
- Smooth interactions with many shapes
- No performance degradation
- Console shows no errors

---

## Test Suite 8: Integration

### Test 8.1: Draw Mode vs Pan Mode
**Steps:**
1. Switch to Draw mode (toolbar)
2. Click on shape
3. **Expected:** No lock attempt (draw mode active)
4. Switch to Pan mode
5. Click on shape
6. **Expected:** Shape locks (pan mode)

**Pass Criteria:**
- Shapes only lockable in Pan mode
- Mode switching works correctly

---

### Test 8.2: Locking + Pan/Zoom
**Steps:**
1. Lock a shape
2. Zoom in/out with mouse wheel
3. Pan canvas by dragging background
4. **Expected:** Shape remains locked
5. **Expected:** Green border scales with zoom
6. **Expected:** Timeout still active

**Pass Criteria:**
- Lock persists during pan/zoom
- Visual indicators scale correctly
- Timeout not affected by viewport changes

---

### Test 8.3: Create Shape While Locked
**Steps:**
1. User A: Lock Shape 1
2. User A: Switch to Draw mode
3. User A: Create new Shape 2
4. **Expected:** Shape 1 unlocks before creating Shape 2
5. **Expected:** Both shapes visible

**Pass Criteria:**
- Previous lock released before draw
- No conflicts between lock and draw

---

## Bug Tracking

### Found Issues:
| ID | Description | Severity | Status | Notes |
|----|-------------|----------|--------|-------|
| - | - | - | - | - |

---

## Sign-Off

### Tester: ________________  
### Date: ________________  
### Pass Rate: _____%  
### Overall Status: [ ] Pass [ ] Fail [ ] Partial

---

## Notes & Observations:

_Add any additional observations, performance notes, or edge cases discovered during testing._

---

**All tests must pass before merging to main.**

