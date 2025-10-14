# Production Debugging Checklist

## Issue
- ✅ Redeployed with correct `VITE_FIREBASE_DATABASE_URL` environment variable
- ❌ Still can't see other users online
- ❌ NavbarPresence (online users display) not showing in title bar

## Understanding the "Missing Dashboard"
The "dashboard" you're referring to is the **NavbarPresence** component in the title bar (next to the logout button). It only appears when `onlineCount > 0`, so if no users are detected as online, it won't show at all.

## What We Just Added
I've added comprehensive logging to help identify the exact issue. The logs will show:
- 🔧 Firebase configuration and database URL being used
- 📡 Presence subscription setup
- 📥 Data being received from RTDB
- ❌ Any errors with detailed error codes and messages

## Step-by-Step Debugging Process

### Step 1: Deploy and Check Build
```bash
cd /Users/finessevanes/Desktop/gauntlet-01/collabcanvas
git add .
git commit -m "Add comprehensive RTDB debugging"
git push
```

Wait for Vercel to redeploy (usually 1-2 minutes).

### Step 2: Open Production App and Browser Console
1. Open your production app URL in a browser
2. Open DevTools: `F12` or `Right-click → Inspect`
3. Go to the **Console** tab
4. Clear the console (`Cmd+K` on Mac, `Ctrl+L` on Windows)

### Step 3: Login and Check Logs

Look for these specific log messages in order:

#### ✅ Expected Logs (Good Signs)
```
🔧 Firebase config loaded: { projectId: "...", authDomain: "...", databaseURL: "https://..." }
🚀 Running in production mode - using Firebase Cloud services
🔍 Database URL being used: https://YOUR-PROJECT-default-rtdb.firebaseio.com
📡 [usePresence] Setting up presence subscription
📡 [Presence] Subscribing to presence updates at: /sessions/main/users
🔧 [usePresence] Setting up presence for: { userId: "...", username: "...", color: "..." }
📡 [Presence] Setting user online: { userId: "...", username: "...", color: "..." }
✅ [Presence] Successfully set user online
📡 [Presence] Setting up disconnect handler for: ...
✅ [Presence] Disconnect handler set up successfully
✅ [usePresence] Presence setup complete
📥 [Presence] Received presence data: { ... }
✅ [Presence] Processed presence map: { ... }
📥 [usePresence] Received presence update: { ... }
```

#### ❌ Problem Indicators

**Problem 1: Wrong Database URL**
```
🔍 Database URL being used: http://127.0.0.1:9000
```
**Solution:** The environment variable isn't being loaded correctly. See "Fix Wrong Database URL" below.

**Problem 2: Permission Denied**
```
❌ [Presence] Error subscribing to presence: FirebaseError: PERMISSION_DENIED
❌ [Presence] Error code: PERMISSION_DENIED
```
**Solution:** RTDB security rules need to be deployed. See "Fix Permission Denied" below.

**Problem 3: Invalid Database URL**
```
❌ [Presence] Failed to set user online: FirebaseError: Invalid database URL
```
**Solution:** The `VITE_FIREBASE_DATABASE_URL` is malformed. See "Fix Invalid URL" below.

**Problem 4: No Data Received**
```
📡 [Presence] Subscribing to presence updates at: /sessions/main/users
📥 [Presence] Received presence data: null
⚠️ [Presence] No presence data found
```
**Solution:** RTDB is connected but no data. This is expected for the first user. Open a second browser/incognito window.

### Step 4: Multi-User Test

1. **Browser 1:** Login as User A
2. **Browser 2:** Open incognito/different browser, login as User B
3. **Expected behavior:**
   - Both users should see online count badge in title bar
   - User A should see User B's name in online users
   - User B should see User A's name in online users
   - Moving mouse should show each other's cursors

### Step 5: Check Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Realtime Database** → **Data**
4. You should see:
   ```
   sessions/
     main/
       users/
         <userId1>/
           presence: { online: true, username: "...", color: "...", lastSeen: ... }
           cursor: { x: ..., y: ..., username: "...", color: "...", timestamp: ... }
         <userId2>/
           presence: { ... }
           cursor: { ... }
   ```

If you don't see this data, the writes are failing.

## Common Issues and Fixes

### Fix 1: Wrong Database URL (Most Common)

**Symptoms:**
- Database URL shows `http://127.0.0.1:9000`
- No data appears in Firebase Console
- No errors in console

**Root Cause:** Vercel is using the wrong environment variable or it's not being loaded into the build.

**Solution:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Settings → Environment Variables
4. Find `VITE_FIREBASE_DATABASE_URL`
5. **Verify the value is:**
   - Format: `https://YOUR-PROJECT-default-rtdb.firebaseio.com` (US Central)
   - OR: `https://YOUR-PROJECT-default-rtdb.REGION.firebasedatabase.app` (other regions)
6. **Check it's applied to all environments:**
   - ✅ Production
   - ✅ Preview
   - ✅ Development
7. **Trigger a new deployment:**
   ```bash
   git commit --allow-empty -m "Force redeploy with correct env vars"
   git push
   ```

### Fix 2: Permission Denied

**Symptoms:**
```
❌ [Presence] Error code: PERMISSION_DENIED
```

**Root Cause:** RTDB security rules haven't been deployed to production.

**Solution:**
```bash
cd /Users/finessevanes/Desktop/gauntlet-01/collabcanvas
firebase deploy --only database
```

Verify in Firebase Console → Realtime Database → Rules:
```json
{
  "rules": {
    "sessions": {
      "main": {
        "users": {
          "$userId": {
            ".read": "auth != null",
            ".write": "auth != null && auth.uid == $userId"
          }
        }
      }
    }
  }
}
```

### Fix 3: Invalid Database URL

**Symptoms:**
```
❌ Failed to set user online: Invalid database URL
```

**Root Cause:** The URL format is incorrect.

**Solution:**
1. Get the correct URL from Firebase Console:
   - Firebase Console → Project Settings → General
   - Scroll to "Your apps"
   - Find the web app config
   - Copy the `databaseURL` value exactly
2. Update in Vercel with the exact value

### Fix 4: RTDB Not Enabled

**Symptoms:**
- No "Realtime Database" option in Firebase Console left sidebar
- Or, see "Create Database" button

**Solution:**
1. Firebase Console → Realtime Database
2. Click "Create Database"
3. Choose location (should match your project region)
4. Start in **production mode**
5. Deploy rules: `firebase deploy --only database`

## Verification Steps

### ✅ Checklist
- [ ] Database URL in console shows `https://...firebaseio.com` (NOT `http://127.0.0.1:9000`)
- [ ] No `PERMISSION_DENIED` errors in console
- [ ] See `✅ [Presence] Successfully set user online` message
- [ ] See `✅ [usePresence] Presence setup complete` message
- [ ] Data appears in Firebase Console → Realtime Database → Data
- [ ] Two users in different browsers can see each other's online status
- [ ] NavbarPresence component appears in title bar with online count
- [ ] Cursors are visible when moving mouse

## Quick Environment Variable Check

Run this in your terminal to see what Vercel has deployed:

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login
vercel login

# List environment variables
vercel env ls
```

Look for `VITE_FIREBASE_DATABASE_URL` and verify it's set for Production.

## Emergency: Verify Locally First

If production still doesn't work, verify locally first:

```bash
cd /Users/finessevanes/Desktop/gauntlet-01/collabcanvas
npm run dev
```

Open two browsers:
1. Chrome: `http://localhost:5173`
2. Firefox or Incognito: `http://localhost:5173`

If it works locally but not in production, it's definitely an environment variable issue in Vercel.

## What to Share for Help

If you still have issues, share these from the production console:
1. The first log: `🔧 Firebase config loaded: { ... }`
2. The database URL log: `🔍 Database URL being used: ...`
3. Any error messages with `❌`
4. Screenshot of Vercel environment variables (hide sensitive values)
5. Screenshot of Firebase Console → Realtime Database → Data

## Next Steps

1. Push these debugging changes to trigger a redeploy
2. Open production app and check the console logs
3. Share what you see in the console
4. We'll identify the exact issue and fix it

