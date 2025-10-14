# PR #3: Cursor Sync + Presence - Test Plan

## Prerequisites

1. Firebase Emulators running
2. Dev server running
3. Two or more browser windows (use incognito for separate sessions)

---

## Test Cases

### Test 1: Basic Cursor Sync ✅

**Objective:** Verify cursors appear and move smoothly

**Steps:**
1. Open Browser A (Incognito)
2. Sign up/login as User A
3. Open Browser B (Normal)
4. Sign up/login as User B
5. Move mouse on canvas in Browser A
6. Move mouse on canvas in Browser B

**Expected Results:**
- ✅ Browser A sees User B's cursor with username label
- ✅ Browser B sees User A's cursor with username label
- ✅ Cursors move smoothly at ~30 FPS
- ✅ No lag or stuttering
- ✅ Cursor colors match user's assigned colors
- ✅ Labels are readable

---

### Test 2: Cursor Appearance/Disappearance ✅

**Objective:** Verify cursors show/hide correctly within canvas bounds

**Steps:**
1. With two users connected (from Test 1)
2. In Browser A, move mouse over the white 5000×5000 canvas area
3. Move mouse into the gray background area (outside canvas bounds)
4. Move mouse back into the white canvas area
5. Move mouse completely off the browser window

**Expected Results:**
- ✅ Cursor appears when mouse enters canvas bounds (5000×5000 white area)
- ✅ Cursor disappears when mouse moves to gray background (outside bounds)
- ✅ Cursor reappears when mouse returns to white canvas area
- ✅ Cursor disappears when mouse leaves browser window entirely
- ✅ Other user sees these changes in real-time
- ✅ Cursors are NEVER visible in gray background area

---

### Test 3: Presence List - Join ✅

**Objective:** Verify presence list updates on join

**Steps:**
1. Open Browser A, login as User A
2. Check presence list (top-right corner)
3. Open Browser B, login as User B
4. Check presence list in both browsers

**Expected Results:**
- ✅ Browser A initially shows 1 user online (self)
- ✅ After User B joins, Browser A shows 2 users online
- ✅ Browser A presence list shows User B with correct color dot
- ✅ Browser B shows 2 users online
- ✅ Browser B presence list shows User A with correct color dot
- ✅ Updates happen within <100ms

---

### Test 4: Presence List - Leave ✅

**Objective:** Verify presence list updates on disconnect

**Steps:**
1. With two users connected (from Test 3)
2. Close Browser B (simulate disconnect)
3. Wait 5-10 seconds
4. Check presence list in Browser A

**Expected Results:**
- ✅ User B disappears from presence list within ~5 seconds
- ✅ Online count decrements to 1
- ✅ No errors in console

---

### Test 5: Pan/Zoom with Cursors ✅

**Objective:** Verify cursors track correctly with viewport changes

**Steps:**
1. With two users connected
2. In Browser A, pan canvas by dragging
3. Zoom in/out with mouse wheel
4. User B moves their cursor
5. Observe User B's cursor position in Browser A

**Expected Results:**
- ✅ Cursor position remains accurate after panning
- ✅ Cursor position remains accurate after zooming
- ✅ Cursor scales correctly with zoom level
- ✅ No coordinate drift or offset

---

### Test 6: Multiple Users (3-5) ✅

**Objective:** Verify system handles multiple concurrent users

**Steps:**
1. Open 3-5 browser windows (use different browsers/incognito)
2. Login as different users in each
3. Move cursors simultaneously in all windows
4. Check presence list in all windows

**Expected Results:**
- ✅ All cursors visible in all windows
- ✅ All users shown in presence list
- ✅ No performance degradation
- ✅ Canvas maintains 60 FPS
- ✅ Cursor updates remain smooth
- ✅ Unique colors for each user

---

### Test 7: Rapid Mouse Movement ✅

**Objective:** Verify throttling works correctly

**Steps:**
1. With two users connected
2. In Browser A, move mouse very rapidly across canvas
3. Observe cursor in Browser B

**Expected Results:**
- ✅ Cursor movement is smooth (not choppy)
- ✅ Cursor follows general path (minor lag acceptable)
- ✅ No cursor "jumping" or teleporting
- ✅ ~30 FPS update rate maintained

---

### Test 8: Reconnection ✅

**Objective:** Verify users can reconnect successfully

**Steps:**
1. Login as User A in Browser A
2. Refresh Browser A
3. Login again as User A
4. Check presence list in other browser

**Expected Results:**
- ✅ User A reappears in presence list
- ✅ Cursor works immediately after reconnection
- ✅ No duplicate entries in presence list
- ✅ Previous cursor data cleaned up

---

### Test 9: Network Interruption Simulation ✅

**Objective:** Verify disconnect handler cleanup

**Steps:**
1. With two users connected
2. In Browser B, open Developer Tools → Network tab
3. Set throttling to "Offline"
4. Wait 10 seconds
5. Check Browser A's presence list

**Expected Results:**
- ✅ User B marked offline within 5-10 seconds
- ✅ User B's cursor removed from canvas
- ✅ No stuck presence records
- ✅ Clean disconnect detected

---

### Test 10: Stress Test - Cursor Spam ✅

**Objective:** Verify system handles rapid cursor updates

**Steps:**
1. With 3-5 users connected
2. All users move mouse rapidly and continuously for 30 seconds
3. Monitor browser performance
4. Check for any errors

**Expected Results:**
- ✅ No browser crashes
- ✅ No console errors
- ✅ Canvas maintains acceptable FPS (>30 FPS)
- ✅ Cursors remain responsive
- ✅ No memory leaks (check DevTools Memory tab)

---

### Test 11: Edge Case - Same Position ✅

**Objective:** Verify cursors render correctly when overlapping

**Steps:**
1. With two users connected
2. Move both cursors to same approximate position
3. Observe rendering

**Expected Results:**
- ✅ Both cursors visible (may overlap)
- ✅ Both labels visible (may overlap)
- ✅ No rendering glitches
- ✅ Cursors distinguishable by color

---

### Test 12: Logout Behavior ✅

**Objective:** Verify presence cleared on manual logout

**Steps:**
1. Login as User A in Browser A
2. Click "Logout" button
3. Check presence list in other browser

**Expected Results:**
- ✅ User A removed from presence immediately
- ✅ User A's cursor removed from canvas
- ✅ Clean logout recorded in RTDB

---

## Performance Benchmarks

### Cursor Update Latency
- **Target:** <50ms
- **Measurement:** Use browser DevTools Network tab to observe RTDB writes
- **Pass Criteria:** Avg latency <50ms

### Presence Update Latency
- **Target:** <100ms for join, ~5s for disconnect
- **Measurement:** Time from login to presence list update
- **Pass Criteria:** Meets target latency

### Canvas FPS
- **Target:** 60 FPS
- **Measurement:** Browser DevTools Performance tab
- **Pass Criteria:** Maintains 60 FPS with 5 users

---

## Browser Compatibility

Test in:
- ✅ Chrome (primary)
- ✅ Firefox
- ✅ Safari
- ✅ Edge

---

## Firebase Emulator Verification

### Check RTDB Structure

1. Open Emulator UI: `http://localhost:4000`
2. Navigate to Realtime Database tab
3. Verify structure:

```json
{
  "sessions": {
    "main": {
      "users": {
        "user_id_1": {
          "cursor": { "x": 100, "y": 200, "username": "Alice", "color": "#ef4444", "timestamp": 1234567890 },
          "presence": { "online": true, "lastSeen": 1234567890, "username": "Alice", "color": "#ef4444" }
        },
        "user_id_2": { ... }
      }
    }
  }
}
```

### Check Auto-Cleanup

1. Connect as user
2. Close browser forcefully (kill process)
3. Wait 5-10 seconds
4. Check RTDB in Emulator UI
5. Verify `presence.online` = false
6. Verify `cursor` node removed

---

## Common Issues & Debugging

### Issue: Cursors not appearing
**Debug:**
- Check browser console for errors
- Verify RTDB emulator is running
- Check Network tab for failed requests
- Verify user is authenticated

### Issue: Cursors jumping/teleporting
**Debug:**
- Verify throttle function is working
- Check if coordinate transformation is correct
- Test at different zoom levels

### Issue: Presence not updating
**Debug:**
- Check RTDB rules allow read/write
- Verify onDisconnect handler is set up
- Check Network tab for RTDB connection
- Verify user profile has username and color

### Issue: Performance degradation
**Debug:**
- Check number of concurrent users
- Monitor Network tab bandwidth usage
- Check for memory leaks in DevTools
- Verify throttling is working (should limit to 30 FPS)

---

## Sign-Off Criteria

All test cases must pass:
- ✅ Cursors sync smoothly (<50ms latency)
- ✅ Presence updates correctly (join/leave)
- ✅ Auto-disconnect cleanup works
- ✅ Pan/zoom maintains cursor accuracy
- ✅ 5+ users work without issues
- ✅ No console errors
- ✅ 60 FPS maintained

---

**Last Updated:** October 2024  
**Tester:** [Your Name]  
**Status:** Ready for Testing

