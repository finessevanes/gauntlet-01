# PR #3: Quick Start & Testing Guide

## 🚀 Quick Start

### 1. Start Firebase Emulators

**Terminal 1:**
```bash
cd /Users/finessevanes/Desktop/gauntlet-01/collabcanvas
firebase emulators:start
```

**Wait for:**
```
✔ All emulators ready!
┌─────────────────────────────────────────────────────────────┐
│ ✔  All emulators ready! It is now safe to connect your app. │
│ i  View Emulator UI at http://127.0.0.1:4000                │
└─────────────────────────────────────────────────────────────┘
```

### 2. Start Development Server

**Terminal 2:**
```bash
cd /Users/finessevanes/Desktop/gauntlet-01/collabcanvas
npm run dev
```

**Access:** http://localhost:5173

---

## 🧪 Simple Test (2 Users)

### Browser 1 (Incognito Window)
1. Open incognito: `http://localhost:5173`
2. Sign up:
   - Email: `alice@test.com`
   - Password: `password123`
   - Username: `Alice`
3. Move mouse around canvas

### Browser 2 (Normal Window)
1. Open normal: `http://localhost:5173`
2. Sign up:
   - Email: `bob@test.com`
   - Password: `password123`
   - Username: `Bob`
3. Move mouse around canvas

### ✅ What You Should See

**In Browser 1 (Alice):**
- Alice's mouse cursor (your actual cursor)
- Bob's cursor moving in real-time (colored circle + name)
- Presence list top-right showing: "Online Users: 2"
- Bob's name in presence list with colored dot

**In Browser 2 (Bob):**
- Bob's mouse cursor (your actual cursor)
- Alice's cursor moving in real-time (colored circle + name)
- Presence list top-right showing: "Online Users: 2"
- Alice's name in presence list with colored dot

---

## 🎯 Key Features to Test

### 1. Real-Time Cursor Movement
- ✅ Move mouse in one browser → see cursor in other browser
- ✅ Smooth movement (30 FPS)
- ✅ Latency <50ms

### 2. Cursor Appearance/Disappearance
- ✅ Move mouse off canvas → cursor disappears
- ✅ Move mouse back on canvas → cursor reappears

### 3. Pan & Zoom
- ✅ Drag canvas to pan
- ✅ Scroll wheel to zoom
- ✅ Cursors still track correctly

### 4. Presence List
- ✅ Shows count of online users
- ✅ Lists all users with names and colors
- ✅ Updates when users join/leave

### 5. Disconnect Handling
- ✅ Close one browser → other browser shows user offline within ~5s
- ✅ Cursor automatically removed

---

## 🔍 Debugging Tools

### Firebase Emulator UI
**URL:** http://localhost:4000

**Navigate to:**
1. **Authentication** → See registered users
2. **Realtime Database** → See cursor/presence data structure:
   ```
   sessions/main/users/
     ├── {userId1}/cursor
     ├── {userId1}/presence
     └── ...
   ```

### Browser DevTools

**Console Tab:**
- Check for errors
- Look for Firebase connection logs

**Network Tab:**
- Filter by "firebaseio.com" or "localhost:9000"
- Verify RTDB requests are happening
- Check latency of requests (<50ms)

**Performance Tab:**
- Record canvas interactions
- Verify 60 FPS maintained

---

## 📊 Expected RTDB Data Structure

```json
{
  "sessions": {
    "main": {
      "users": {
        "user_abc_123": {
          "cursor": {
            "x": 450,
            "y": 300,
            "username": "Alice",
            "color": "#ef4444",
            "timestamp": 1697654321000
          },
          "presence": {
            "online": true,
            "lastSeen": 1697654321000,
            "username": "Alice",
            "color": "#ef4444"
          }
        },
        "user_def_456": {
          "cursor": { ... },
          "presence": { ... }
        }
      }
    }
  }
}
```

---

## ⚡ Performance Expectations

| Metric | Target | How to Verify |
|--------|--------|---------------|
| Cursor Latency | <50ms | Move mouse, observe other browser |
| Cursor FPS | 20-30 FPS | Smooth movement, no jank |
| Canvas FPS | 60 FPS | DevTools Performance tab |
| Presence Join | <100ms | Time from login to presence update |
| Presence Leave | ~5s | Time from disconnect to offline |

---

## 🐛 Common Issues

### Issue: "Firebase Emulator connection failed"
**Solution:**
1. Ensure emulators are running (Terminal 1)
2. Check http://localhost:4000 loads
3. Restart emulators if needed

### Issue: "Cannot read property 'uid' of null"
**Solution:**
1. Ensure you're logged in
2. Check AuthContext is wrapping app
3. Verify Firebase Auth emulator is running (port 9099)

### Issue: Cursors not appearing
**Solution:**
1. Open Emulator UI → Realtime Database
2. Verify cursor data is being written
3. Check browser console for errors
4. Verify both users are authenticated

### Issue: High latency (>100ms)
**Solution:**
1. Check if running on emulators (not production)
2. Verify throttle is set to 33ms
3. Check Network tab for slow requests

---

## 🎬 Demo Scenario

### Scenario: Collaborative Design Session

**Setup:**
1. Start emulators and dev server
2. Open 3 browser windows
3. Create users: Alice, Bob, Charlie

**Demo Flow:**

1. **Alice** logs in
   - See presence shows 1 user
   - Move mouse around

2. **Bob** logs in
   - See presence updates to 2 users
   - Both see each other's cursors
   - Move mouse in different areas

3. **Charlie** logs in
   - See presence updates to 3 users
   - All see each other's cursors
   - Unique colors for each

4. **Test Pan/Zoom**
   - Alice pans canvas
   - Bob zooms in
   - Verify cursors still track correctly

5. **Test Disconnect**
   - Close Charlie's browser
   - Alice and Bob see Charlie go offline
   - Online count updates to 2

6. **Test Reconnect**
   - Reopen Charlie's browser
   - Login again
   - Verify seamless reconnection

---

## ✅ Sign-Off Checklist

Before marking PR as complete, verify:

- [ ] Emulators start without errors
- [ ] Dev server starts without errors
- [ ] Can create two users
- [ ] Cursors appear and move smoothly
- [ ] Presence list shows correct count
- [ ] Pan/zoom doesn't break cursor tracking
- [ ] Disconnect removes user from presence
- [ ] No console errors
- [ ] Canvas maintains 60 FPS
- [ ] RTDB rules work correctly

---

## 📞 Need Help?

**Check:**
1. PR-3-SUMMARY.md - Full implementation details
2. PR-3-TEST-PLAN.md - Comprehensive test cases
3. Browser console - Error messages
4. Emulator UI (http://localhost:4000) - Data structure

**Common Commands:**
```bash
# Restart emulators
# Ctrl+C in Terminal 1, then:
firebase emulators:start

# Restart dev server
# Ctrl+C in Terminal 2, then:
npm run dev

# Clear RTDB data (in Emulator UI)
# Go to Realtime Database tab → Delete all data

# Check emulator logs
# Terminal 1 output shows RTDB read/write operations
```

---

**Happy Testing! 🎉**

