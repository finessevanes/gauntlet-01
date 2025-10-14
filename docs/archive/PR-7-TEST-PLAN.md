# PR #7 Test Plan - Production Deployment Verification

## 🎯 Test Scope

This test plan verifies that CollabCanvas is successfully deployed to production with all features working correctly for 5+ concurrent users.

---

## 🧪 Test Environment

### Production Environment

**Deployment Platform:** Vercel  
**Frontend URL:** https://your-app.vercel.app  
**Backend:** Firebase Cloud (Auth, Firestore, RTDB)

### Test Requirements

- **Browsers:** Chrome, Firefox, Safari
- **Devices:** Desktop (mobile not required for MVP)
- **Test Accounts:** 5+ different users
- **Network:** Production internet (no emulators)

---

## ✅ Pre-Deployment Tests

### TD-1: Local Build Test

**Goal:** Verify app builds successfully for production

**Steps:**
1. Navigate to `collabcanvas/` directory
2. Run `npm run build`
3. Verify no TypeScript errors
4. Check `dist/` directory created
5. Run `npm run preview`
6. Visit http://localhost:4173

**Expected Results:**
- ✅ Build completes without errors
- ✅ `dist/` directory contains index.html and assets
- ✅ App loads in browser
- ✅ No console errors
- ✅ Can sign up and create shapes

**Pass Criteria:**
- All steps complete successfully
- No TypeScript compilation errors
- No runtime errors in console

---

### TD-2: Firebase Rules Deployment

**Goal:** Verify security rules are deployed

**Steps:**
1. Run `firebase deploy --only firestore:rules,database`
2. Go to Firebase Console → Firestore → Rules tab
3. Check rules are updated
4. Go to Realtime Database → Rules tab
5. Check rules are updated

**Expected Results:**
- ✅ Deployment succeeds
- ✅ Firestore rules match `firestore.rules` file
- ✅ RTDB rules match `database.rules.json` file
- ✅ Rules show recent update timestamp

**Pass Criteria:**
- Rules deployed successfully
- Rules visible in Firebase Console
- No deployment errors

---

### TD-3: Environment Configuration

**Goal:** Verify all required environment variables are set

**Steps:**
1. Go to Vercel Dashboard → Project → Settings
2. Navigate to Environment Variables tab
3. Verify all 7 variables are set:
   - VITE_FIREBASE_API_KEY
   - VITE_FIREBASE_AUTH_DOMAIN
   - VITE_FIREBASE_PROJECT_ID
   - VITE_FIREBASE_STORAGE_BUCKET
   - VITE_FIREBASE_MESSAGING_SENDER_ID
   - VITE_FIREBASE_APP_ID
   - VITE_FIREBASE_DATABASE_URL

**Expected Results:**
- ✅ All 7 variables present
- ✅ Values match Firebase project config
- ✅ No placeholder values like "your-project-id"

**Pass Criteria:**
- All required variables configured
- Values are production Firebase credentials

---

## 🌐 Deployment Tests

### TD-4: Vercel Deployment

**Goal:** Verify successful deployment to Vercel

**Steps:**
1. Deploy via `vercel --prod` or GitHub integration
2. Wait for deployment to complete
3. Check deployment logs for errors
4. Visit deployed URL
5. Check browser console for errors

**Expected Results:**
- ✅ Deployment succeeds
- ✅ Build completes without errors
- ✅ Public URL is accessible
- ✅ App loads correctly
- ✅ No console errors

**Pass Criteria:**
- Deployment status: Success
- URL is publicly accessible
- App renders login/signup screen

---

### TD-5: Firebase Auth Configuration

**Goal:** Verify Vercel domain is authorized in Firebase

**Steps:**
1. Go to Firebase Console → Authentication → Settings
2. Check Authorized domains tab
3. Verify Vercel domain is listed (e.g., `your-app.vercel.app`)
4. Try signing up on deployed URL
5. Check for "Unauthorized domain" errors

**Expected Results:**
- ✅ Vercel domain in authorized domains list
- ✅ No "Unauthorized domain" errors
- ✅ Auth requests succeed

**Pass Criteria:**
- Domain properly configured
- Authentication works on deployed site

---

## 🔐 Authentication Tests

### TD-6: Sign Up Flow

**Goal:** Verify user can create account in production

**Setup:** Open deployed URL in browser

**Steps:**
1. Click "Sign Up" button
2. Enter test email: `testuser1@example.com`
3. Enter username: `TestUser1`
4. Enter password: `TestPassword123!`
5. Click "Sign Up"
6. Wait for redirect to canvas

**Expected Results:**
- ✅ Sign up form accepts input
- ✅ No validation errors
- ✅ User created in Firebase Auth
- ✅ User document created in Firestore `users` collection
- ✅ Redirects to canvas
- ✅ Username displays in navbar
- ✅ No console errors

**Pass Criteria:**
- Can create account successfully
- User data persisted in Firebase
- Redirected to canvas after signup

---

### TD-7: Login Flow

**Goal:** Verify existing user can log in

**Setup:** Use account created in TD-6

**Steps:**
1. Open deployed URL in new incognito window
2. Click "Login" button
3. Enter email: `testuser1@example.com`
4. Enter password: `TestPassword123!`
5. Click "Login"

**Expected Results:**
- ✅ Login form accepts input
- ✅ Authentication succeeds
- ✅ Redirects to canvas
- ✅ Username displays correctly
- ✅ No console errors

**Pass Criteria:**
- Can log in with existing account
- Correct user data loaded
- No authentication errors

---

### TD-8: Logout Flow

**Goal:** Verify user can log out

**Setup:** Logged in from TD-7

**Steps:**
1. Click "Logout" button in navbar
2. Wait for redirect
3. Try accessing canvas directly

**Expected Results:**
- ✅ Logout succeeds
- ✅ Redirects to login page
- ✅ Cannot access canvas without auth
- ✅ No console errors

**Pass Criteria:**
- User logged out successfully
- Auth state cleared
- Protected routes blocked

---

### TD-9: Session Persistence

**Goal:** Verify auth persists across page refresh

**Setup:** Logged in user

**Steps:**
1. Refresh browser page (F5)
2. Wait for page to reload
3. Check if still logged in
4. Verify username displays

**Expected Results:**
- ✅ User remains logged in after refresh
- ✅ Username displays correctly
- ✅ Canvas state restored
- ✅ No re-authentication required

**Pass Criteria:**
- Auth persists across refresh
- No need to log in again

---

## 🖱️ Real-Time Cursor Tests

### TD-10: Cursor Sync (2 Users)

**Goal:** Verify cursor positions sync between 2 users

**Setup:** 
- Window 1: Normal browsing mode (User A)
- Window 2: Incognito mode (User B)
- Both logged in with different accounts

**Steps:**
1. User A moves cursor on canvas
2. Observe User B's window for User A's cursor
3. User B moves cursor on canvas
4. Observe User A's window for User B's cursor
5. Both users move cursors simultaneously

**Expected Results:**
- ✅ User A's cursor appears in User B's window
- ✅ User B's cursor appears in User A's window
- ✅ Cursor positions update smoothly (20-30 FPS)
- ✅ Username labels display next to cursors
- ✅ Each cursor has unique color
- ✅ Latency <50ms
- ✅ No lag or jitter

**Pass Criteria:**
- Both cursors visible to both users
- Smooth movement at 20-30 FPS
- Latency consistently <50ms

---

### TD-11: Cursor Bounds

**Goal:** Verify cursors only visible within canvas bounds

**Setup:** 2 users logged in

**Steps:**
1. User A moves cursor onto canvas (5000×5000 area)
2. User B should see cursor
3. User A moves cursor off canvas (gray background)
4. User B should NOT see cursor
5. User A moves cursor back onto canvas
6. User B should see cursor again

**Expected Results:**
- ✅ Cursor visible when on canvas
- ✅ Cursor NOT visible when off canvas
- ✅ Cursor reappears when returning to canvas
- ✅ Smooth transitions

**Pass Criteria:**
- Cursors only render within 5000×5000 canvas bounds
- No cursors visible in gray background area

---

### TD-12: Cursor Performance (5+ Users)

**Goal:** Verify cursor sync remains smooth with 5+ concurrent users

**Setup:**
- 5 browser windows with different accounts
- All logged in simultaneously

**Steps:**
1. All 5 users move cursors on canvas
2. Observe cursor rendering in each window
3. Check Chrome DevTools → Performance Monitor
4. Monitor for FPS drops
5. Check RTDB updates in Network tab

**Expected Results:**
- ✅ All 5 cursors render smoothly
- ✅ No FPS drops below 60
- ✅ No lag or stuttering
- ✅ Cursor updates every 33-50ms
- ✅ No console errors
- ✅ No memory leaks

**Pass Criteria:**
- 60 FPS maintained with 5+ users
- Cursor latency remains <50ms
- No performance degradation

---

## 👥 Presence Tests

### TD-13: Presence List

**Goal:** Verify online user list updates correctly

**Setup:** 2 users logged in

**Steps:**
1. User A logs in
2. Check presence list shows User A
3. User B logs in
4. Check both windows show both users
5. User A logs out
6. Check User B's window updates

**Expected Results:**
- ✅ Presence list shows online users
- ✅ Updates immediately when user joins
- ✅ Updates immediately when user leaves
- ✅ Shows correct usernames
- ✅ Color dots match cursor colors

**Pass Criteria:**
- Presence list accurate and real-time
- No stale user entries

---

### TD-14: Disconnect Cleanup

**Goal:** Verify presence clears on disconnect

**Setup:** 2 users logged in

**Steps:**
1. User A is online
2. User B sees User A in presence list
3. User A closes browser (force disconnect)
4. Wait 5 seconds
5. Check User B's presence list

**Expected Results:**
- ✅ User A removed from presence list
- ✅ User A's cursor disappears
- ✅ Cleanup happens within 5 seconds
- ✅ RTDB onDisconnect() triggers

**Pass Criteria:**
- Disconnected user removed from presence
- Cleanup happens automatically

---

## 🎨 Canvas Tests

### TD-15: Pan and Zoom

**Goal:** Verify canvas interactions work smoothly

**Steps:**
1. Click and drag canvas background to pan
2. Pan in all directions
3. Use mouse wheel to zoom in
4. Use mouse wheel to zoom out
5. Check Chrome DevTools → Performance

**Expected Results:**
- ✅ Panning works smoothly
- ✅ Zoom centers on cursor position
- ✅ Zoom range: 0.1x to 3x
- ✅ 60 FPS maintained during pan
- ✅ 60 FPS maintained during zoom
- ✅ No lag or stutter

**Pass Criteria:**
- Smooth pan/zoom at 60 FPS
- Cursor-centered zooming works

---

### TD-16: Color Toolbar

**Goal:** Verify color selection works

**Steps:**
1. Observe toolbar with 4 color buttons
2. Click Red button
3. Check Red is highlighted/active
4. Click Blue button
5. Check Blue is highlighted/active
6. Repeat for Green and Yellow
7. Refresh page, check default is Blue

**Expected Results:**
- ✅ All 4 colors visible
- ✅ Selected color highlighted
- ✅ Only one color active at a time
- ✅ Default is Blue
- ✅ Selection persists during session

**Pass Criteria:**
- Color selection works
- Visual feedback clear
- Default is Blue

---

## 🔷 Shape Creation Tests

### TD-17: Create Rectangle

**Goal:** Verify rectangle creation via click-and-drag

**Steps:**
1. Toggle to Draw mode
2. Select Red color
3. Click on canvas and hold
4. Drag to create rectangle
5. Release mouse
6. Observe final rectangle

**Expected Results:**
- ✅ Preview appears while dragging
- ✅ Preview shows dashed border
- ✅ Preview is 50% opacity
- ✅ Preview color matches selected color (Red)
- ✅ Final rectangle appears on release
- ✅ Rectangle has solid fill (Red)
- ✅ Size matches drag distance

**Pass Criteria:**
- Rectangle created successfully
- Preview and final shape correct
- Color matches selection

---

### TD-18: Shape Sync (Multi-User)

**Goal:** Verify shapes sync across users in <100ms

**Setup:** 2 users logged in

**Steps:**
1. User A toggles to Draw mode
2. User A creates Red rectangle
3. Start timer
4. Check when shape appears in User B's window
5. Stop timer
6. User B creates Blue rectangle
7. Check when shape appears in User A's window

**Expected Results:**
- ✅ User A's shape appears for User B
- ✅ User B's shape appears for User A
- ✅ Sync latency <100ms
- ✅ Correct colors, positions, sizes
- ✅ No sync errors

**Pass Criteria:**
- Shapes sync in <100ms
- All attributes correct

---

### TD-19: Shape Persistence

**Goal:** Verify shapes persist after refresh

**Steps:**
1. Create 3 rectangles (different colors/sizes)
2. Note positions and colors
3. Refresh browser page
4. Wait for page to load
5. Check if shapes still exist

**Expected Results:**
- ✅ All 3 shapes still visible
- ✅ Correct positions maintained
- ✅ Correct colors maintained
- ✅ Correct sizes maintained
- ✅ No data loss

**Pass Criteria:**
- Shapes persist across refresh
- No data corruption

---

### TD-20: Negative Drag Handling

**Goal:** Verify rectangles create correctly when dragging left/up

**Steps:**
1. Toggle to Draw mode
2. Click at point (1000, 1000)
3. Drag LEFT to point (800, 1000)
4. Release
5. Click at point (1000, 1000)
6. Drag UP to point (1000, 800)
7. Release

**Expected Results:**
- ✅ Rectangle created for left drag
- ✅ Rectangle created for up drag
- ✅ Correct width calculated (Math.abs)
- ✅ Correct height calculated (Math.abs)
- ✅ Correct x,y positions adjusted

**Pass Criteria:**
- Negative drags handled correctly
- Rectangles appear in correct positions

---

### TD-21: Minimum Size Filter

**Goal:** Verify tiny accidental shapes are ignored

**Steps:**
1. Toggle to Draw mode
2. Click on canvas
3. Drag only 5 pixels
4. Release
5. Check if shape created
6. Click again
7. Drag 15 pixels
8. Release
9. Check if shape created

**Expected Results:**
- ✅ 5px drag does NOT create shape
- ✅ 15px drag DOES create shape
- ✅ Minimum size: 10×10px
- ✅ No console errors

**Pass Criteria:**
- Shapes <10×10px ignored
- Shapes ≥10×10px created

---

## 🔒 Locking Tests

### TD-22: Basic Lock Acquisition

**Goal:** Verify first user to click gets lock

**Setup:** 2 users logged in, 1 shape exists

**Steps:**
1. Toggle both users to Pan mode
2. User A clicks shape
3. Check User A's view
4. Check User B's view
5. User A clicks away (deselect)

**Expected Results:**
- ✅ User A sees green border (locked by me)
- ✅ User B sees red border + 🔒 icon (locked by other)
- ✅ User A can drag shape
- ✅ User B cannot interact with shape
- ✅ Lock releases when User A deselects

**Pass Criteria:**
- Lock visual states correct
- Only lock owner can interact

---

### TD-23: Lock Conflict Handling

**Goal:** Verify lock conflict shows toast

**Setup:** 2 users logged in, 1 shape exists

**Steps:**
1. Toggle both to Pan mode
2. User A clicks shape (gets lock)
3. User B tries to click same shape
4. Check User B's screen for toast

**Expected Results:**
- ✅ User A successfully locks shape
- ✅ User B sees toast notification
- ✅ Toast says "Shape locked by [User A's name]"
- ✅ User B's click ignored
- ✅ Shape remains locked by User A

**Pass Criteria:**
- Toast appears for lock conflict
- Correct username in message

---

### TD-24: Lock Release on Drag End

**Goal:** Verify lock auto-releases after drag

**Setup:** 2 users logged in, 1 shape exists

**Steps:**
1. Toggle to Pan mode
2. User A clicks shape (lock acquired)
3. User A drags shape to new position
4. User A releases mouse (drag end)
5. Wait 100ms
6. Check lock status
7. User B tries to click shape

**Expected Results:**
- ✅ Lock acquired on click
- ✅ Shape moves smoothly during drag
- ✅ Lock releases on drag end
- ✅ User B can now click shape
- ✅ Position syncs to User B

**Pass Criteria:**
- Lock releases after drag
- Other users can immediately interact

---

### TD-25: Lock Timeout (5 Seconds)

**Goal:** Verify lock auto-releases after 5s inactivity

**Setup:** 2 users logged in, 1 shape exists

**Steps:**
1. Toggle to Pan mode
2. User A clicks shape (lock acquired)
3. User A does nothing for 6 seconds
4. Check lock status after 6 seconds
5. User B tries to click shape

**Expected Results:**
- ✅ Lock acquired at time 0
- ✅ Lock held for ~5 seconds
- ✅ Lock auto-releases after ~5 seconds
- ✅ Border returns to normal
- ✅ User B can now click shape

**Pass Criteria:**
- Lock releases after 5s
- Timeout works correctly

---

### TD-26: Lock Release on Disconnect

**Goal:** Verify locks clear when user disconnects

**Setup:** 2 users logged in, 1 shape exists

**Steps:**
1. Toggle to Pan mode
2. User A clicks shape (lock acquired)
3. User A closes browser (force disconnect)
4. Wait 5 seconds
5. Check User B's view
6. User B tries to click shape

**Expected Results:**
- ✅ User A locks shape
- ✅ User A's presence clears on disconnect
- ✅ Lock releases within 5 seconds
- ✅ User B sees normal border
- ✅ User B can click shape

**Pass Criteria:**
- Locks clear on disconnect
- No stuck locks

---

## 🚀 Performance Tests

### TP-1: FPS During Pan/Zoom

**Goal:** Verify 60 FPS maintained during interactions

**Steps:**
1. Open Chrome DevTools → Performance
2. Click Record
3. Pan canvas for 5 seconds
4. Zoom in/out for 5 seconds
5. Stop recording
6. Check frame rate graph

**Expected Results:**
- ✅ Frame rate solid 60 FPS
- ✅ No dropped frames
- ✅ No lag or stutter
- ✅ Smooth animations

**Pass Criteria:**
- 60 FPS maintained consistently
- No performance warnings

---

### TP-2: Load Test (5+ Users)

**Goal:** Verify performance with 5+ concurrent users

**Setup:** 
- 5+ browser windows
- Different accounts in each
- All logged in

**Steps:**
1. All users move cursors simultaneously
2. All users create shapes
3. All users pan/zoom
4. Monitor performance in each window
5. Check for lag, FPS drops, errors

**Expected Results:**
- ✅ All cursors render smoothly
- ✅ All shapes sync quickly
- ✅ 60 FPS maintained in all windows
- ✅ No console errors
- ✅ No memory leaks
- ✅ No connection issues

**Pass Criteria:**
- 5+ users without degradation
- All features work smoothly

---

### TP-3: Shape Capacity (50+ Shapes)

**Goal:** Verify performance with many shapes

**Steps:**
1. Create 50 rectangles on canvas
2. Pan around canvas
3. Zoom in/out
4. Check Chrome DevTools → Performance
5. Monitor frame rate

**Expected Results:**
- ✅ 50 shapes render correctly
- ✅ 60 FPS during pan
- ✅ 60 FPS during zoom
- ✅ No lag or stutter
- ✅ All shapes interactive

**Pass Criteria:**
- 60 FPS with 50+ shapes
- No performance degradation

---

### TP-4: Network Latency

**Goal:** Measure real-world sync latency

**Steps:**
1. Open Chrome DevTools → Network
2. Filter by "firebaseio.com" and "firestore"
3. User A creates shape
4. Note timestamp in Network tab
5. Check when shape appears in User B's window
6. Calculate latency
7. Repeat 5 times, calculate average

**Expected Results:**
- ✅ Cursor updates: 33-50ms intervals
- ✅ Shape sync: <100ms latency
- ✅ Presence updates: <100ms
- ✅ Lock updates: <100ms
- ✅ Consistent performance

**Pass Criteria:**
- Cursor latency: <50ms
- Shape sync: <100ms
- Consistent across tests

---

### TP-5: Memory Leak Test

**Goal:** Verify no memory leaks during extended session

**Steps:**
1. Open Chrome DevTools → Performance Monitor
2. Watch "JS heap size" metric
3. Use app normally for 10 minutes:
   - Pan/zoom
   - Create shapes
   - Move cursors
   - Lock/unlock shapes
4. Check if heap size grows continuously

**Expected Results:**
- ✅ Heap size stabilizes after initial load
- ✅ No continuous growth
- ✅ Garbage collection works
- ✅ No memory warnings

**Pass Criteria:**
- Memory usage stable
- No leaks detected

---

## 🔐 Security Tests

### TS-1: Unauthenticated Access

**Goal:** Verify app requires authentication

**Steps:**
1. Open deployed URL in incognito mode
2. Try to access canvas directly via URL
3. Try to manipulate URL parameters
4. Check if redirected to login

**Expected Results:**
- ✅ Redirects to login page
- ✅ Cannot access canvas without auth
- ✅ No canvas data exposed
- ✅ Protected routes blocked

**Pass Criteria:**
- Authentication required for all features
- No data leakage

---

### TS-2: Firestore Security Rules

**Goal:** Verify Firestore rules prevent unauthorized access

**Steps:**
1. Open browser DevTools → Console
2. Try to write to another user's document:
   ```javascript
   firebase.firestore().collection('users').doc('other-user-id').set({test: 'hack'})
   ```
3. Check for permission denied error
4. Try to create shape with wrong createdBy:
   ```javascript
   firebase.firestore().collection('canvases/main/shapes').add({createdBy: 'other-user-id'})
   ```
5. Check for permission denied error

**Expected Results:**
- ✅ Cannot write to other user's document
- ✅ Cannot fake createdBy field
- ✅ Permission denied errors in console
- ✅ Rules enforced correctly

**Pass Criteria:**
- Firestore rules prevent unauthorized writes
- Only valid operations succeed

---

### TS-3: RTDB Security Rules

**Goal:** Verify RTDB rules prevent unauthorized writes

**Steps:**
1. Open browser DevTools → Console
2. Try to write to another user's cursor node:
   ```javascript
   firebase.database().ref('/sessions/main/users/other-user-id/cursor').set({x: 0, y: 0})
   ```
3. Check for permission denied error

**Expected Results:**
- ✅ Cannot write to other user's RTDB node
- ✅ Permission denied error
- ✅ Can only write to own node
- ✅ Rules enforced correctly

**Pass Criteria:**
- RTDB rules prevent unauthorized writes
- Per-user node restrictions work

---

## 📊 Test Summary Template

### Test Execution Results

| Test ID | Test Name | Status | Notes |
|---------|-----------|--------|-------|
| TD-1 | Local Build | ⬜ | |
| TD-2 | Firebase Rules | ⬜ | |
| TD-3 | Environment Config | ⬜ | |
| TD-4 | Vercel Deployment | ⬜ | |
| TD-5 | Firebase Auth Config | ⬜ | |
| TD-6 | Sign Up Flow | ⬜ | |
| TD-7 | Login Flow | ⬜ | |
| TD-8 | Logout Flow | ⬜ | |
| TD-9 | Session Persistence | ⬜ | |
| TD-10 | Cursor Sync (2 Users) | ⬜ | |
| TD-11 | Cursor Bounds | ⬜ | |
| TD-12 | Cursor Performance (5+ Users) | ⬜ | |
| TD-13 | Presence List | ⬜ | |
| TD-14 | Disconnect Cleanup | ⬜ | |
| TD-15 | Pan and Zoom | ⬜ | |
| TD-16 | Color Toolbar | ⬜ | |
| TD-17 | Create Rectangle | ⬜ | |
| TD-18 | Shape Sync | ⬜ | |
| TD-19 | Shape Persistence | ⬜ | |
| TD-20 | Negative Drag | ⬜ | |
| TD-21 | Minimum Size Filter | ⬜ | |
| TD-22 | Basic Lock | ⬜ | |
| TD-23 | Lock Conflict | ⬜ | |
| TD-24 | Lock Release (Drag End) | ⬜ | |
| TD-25 | Lock Timeout | ⬜ | |
| TD-26 | Lock Release (Disconnect) | ⬜ | |
| TP-1 | FPS During Pan/Zoom | ⬜ | |
| TP-2 | Load Test (5+ Users) | ⬜ | |
| TP-3 | Shape Capacity (50+) | ⬜ | |
| TP-4 | Network Latency | ⬜ | |
| TP-5 | Memory Leak | ⬜ | |
| TS-1 | Unauthenticated Access | ⬜ | |
| TS-2 | Firestore Rules | ⬜ | |
| TS-3 | RTDB Rules | ⬜ | |

**Legend:**
- ⬜ Not tested
- ✅ Passed
- ❌ Failed
- ⚠️ Passed with issues

---

## 🐛 Bug Report Template

If any test fails, use this template:

```
**Bug ID:** BUG-PR7-XXX
**Test ID:** TD-XX
**Severity:** Critical / High / Medium / Low
**Status:** Open / In Progress / Fixed

**Description:**
[Brief description of the issue]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Environment:**
- Browser: [Chrome/Firefox/Safari]
- OS: [macOS/Windows/Linux]
- Deployed URL: [URL]

**Screenshots/Logs:**
[Attach console errors, screenshots]

**Potential Fix:**
[Optional: Suggested solution]
```

---

## ✅ Acceptance Criteria

### Must Pass (MVP Gate)

- [ ] All Pre-Deployment tests pass (TD-1 to TD-5)
- [ ] All Authentication tests pass (TD-6 to TD-9)
- [ ] All Cursor tests pass (TD-10 to TD-12)
- [ ] All Presence tests pass (TD-13 to TD-14)
- [ ] All Canvas tests pass (TD-15 to TD-16)
- [ ] All Shape tests pass (TD-17 to TD-21)
- [ ] All Locking tests pass (TD-22 to TD-26)
- [ ] All Performance tests meet targets (TP-1 to TP-5)
- [ ] All Security tests pass (TS-1 to TS-3)

### Performance Benchmarks (Required)

- [ ] **60 FPS** during all interactions
- [ ] **<50ms** cursor latency
- [ ] **<100ms** shape sync latency
- [ ] **5+ users** without degradation
- [ ] **50+ shapes** without performance issues

### Zero Tolerance (Blockers)

- [ ] **No console errors** in production
- [ ] **No data loss** during normal operations
- [ ] **No stuck locks** that never release
- [ ] **No auth bypass** vulnerabilities
- [ ] **No security rule violations**

---

## 📚 Additional Resources

- [PR-7-DEPLOYMENT-GUIDE.md](./PR-7-DEPLOYMENT-GUIDE.md) - Full deployment instructions
- [PR-7-QUICK-START.md](./PR-7-QUICK-START.md) - Quick deployment guide
- [PR-7-SUMMARY.md](./PR-7-SUMMARY.md) - PR summary
- [README.md](./README.md) - Project documentation

---

**Test Execution Date:** [To be filled]  
**Tester:** [To be filled]  
**Deployed URL:** [To be filled]  
**Test Duration:** [To be filled]  
**Overall Status:** ⬜ Pass / ⬜ Fail

---

**Built with ⚡ by the CollabCanvas Team**

