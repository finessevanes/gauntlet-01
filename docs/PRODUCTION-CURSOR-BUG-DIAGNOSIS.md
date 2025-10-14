# Production Cursor Bug - Diagnostic Guide

## Issue Summary
- **Symptoms:** In production (deployed), users cannot see:
  - Other users' cursors
  - Other users' names
  - Other users in presence list
- **Works in:** Local development with emulators
- **Fails in:** Vercel deployment

## Root Cause Analysis

### Primary Suspects

#### 1. Missing/Incorrect `VITE_FIREBASE_DATABASE_URL` in Vercel ⚠️ MOST LIKELY
**Why this matters:**
- RTDB requires a specific database URL (e.g., `https://your-project-default-rtdb.firebaseio.com`)
- This is separate from Firestore and Auth
- Vite environment variables must be prefixed with `VITE_`
- Environment variables are built into the bundle at build time

**How to check:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Look for `VITE_FIREBASE_DATABASE_URL`
3. Verify the format matches: `https://YOUR_PROJECT_ID-default-rtdb.REGION.firebasedatabase.app`
   - US Central: `https://PROJECT-default-rtdb.firebaseio.com`
   - Other regions: `https://PROJECT-default-rtdb.europe-west1.firebasedatabase.app`

**Expected format:**
```
VITE_FIREBASE_DATABASE_URL=https://collabcanvas-xxxxx-default-rtdb.firebaseio.com
```

#### 2. Firebase RTDB Not Enabled in Production Project
**How to check:**
1. Go to Firebase Console → Your Project
2. Navigate to "Realtime Database" in left sidebar
3. Verify database exists and is not in "locked" mode
4. Check if data is being written (go to Data tab)

#### 3. RTDB Security Rules Not Deployed
**How to check:**
1. Firebase Console → Realtime Database → Rules tab
2. Verify rules match your `database.rules.json`:
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

**How to deploy rules:**
```bash
cd collabcanvas
firebase deploy --only database
```

#### 4. Browser Console Errors (Silent Failures)
**How to check:**
1. Open deployed app in browser
2. Open DevTools → Console tab
3. Look for errors related to:
   - "database" or "RTDB"
   - "PERMISSION_DENIED"
   - "Invalid database URL"

## Step-by-Step Diagnosis (Do This First)

### Step 1: Check Browser Console in Production
1. Open your deployed app: `https://your-app.vercel.app`
2. Open DevTools (F12 or Right-click → Inspect)
3. Go to Console tab
4. Look for the log: `🔧 Firebase config loaded:`
5. **Check if `databaseURL` is present and correct**
6. Look for any RTDB-related errors

### Step 2: Verify Vercel Environment Variables
1. Go to Vercel Dashboard
2. Your Project → Settings → Environment Variables
3. **Verify ALL these are set:**
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_DATABASE_URL` ← **CRITICAL**

### Step 3: Get Your Correct Database URL
1. Go to Firebase Console
2. Project Settings (gear icon) → General tab
3. Scroll to "Your apps" section
4. Look at the `databaseURL` field in the config snippet
5. Copy the exact URL

### Step 4: Test RTDB Connection
After fixing environment variables, test by:
1. Open browser console on deployed app
2. Try to manually write to RTDB:
```javascript
// In browser console
import { ref, set } from 'firebase/database';
import { database } from './firebase';

const testRef = ref(database, 'test/connection');
set(testRef, { timestamp: Date.now(), test: 'hello' })
  .then(() => console.log('✅ RTDB write successful'))
  .catch(err => console.error('❌ RTDB write failed:', err));
```

## Most Likely Fix

### Fix 1: Add/Update Database URL in Vercel

1. **Get your database URL from Firebase:**
   - Firebase Console → Project Settings → General
   - Copy the `databaseURL` from your web app config

2. **Add to Vercel:**
   - Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add new variable:
     - Name: `VITE_FIREBASE_DATABASE_URL`
     - Value: `https://your-project-default-rtdb.firebaseio.com`
     - Environment: Production, Preview, Development (check all)

3. **Redeploy:**
   - Vercel will automatically redeploy after adding env vars
   - OR manually trigger: `git commit --allow-empty -m "Trigger redeploy" && git push`

### Fix 2: Deploy RTDB Rules

```bash
cd collabcanvas
firebase deploy --only database
```

### Fix 3: Verify RTDB is Enabled
1. Firebase Console → Realtime Database
2. If you see "Create Database", click it and choose:
   - Location: us-central1 (or your region)
   - Start in production mode (we'll use security rules)

## Testing After Fix

### Test 1: Single User Test
1. Open deployed app
2. Check browser console for:
   - ✅ No RTDB errors
   - ✅ `🔧 Firebase config loaded:` shows correct `projectId`
3. Move your mouse on canvas
4. Check Firebase Console → Realtime Database → Data
5. Should see: `/sessions/main/users/YOUR_USER_ID/cursor`

### Test 2: Multi-User Test
1. Open deployed app in Browser 1 (e.g., Chrome)
2. Open deployed app in Browser 2 (e.g., Firefox or Incognito)
3. Login as different users
4. Move mouse in Browser 1 → Should see cursor in Browser 2
5. Check presence list shows both users

## If Still Not Working

### Enable Debug Logging
Add to `src/firebase.ts`:
```typescript
console.log('🔍 Full Firebase config:', firebaseConfig);
console.log('🔍 Database instance:', database);
console.log('🔍 Database URL:', database.app.options.databaseURL);
```

### Check Network Tab
1. DevTools → Network tab
2. Filter by "firebaseio.com"
3. Look for WebSocket connections to RTDB
4. Check for 403 (permissions) or 404 (wrong URL) errors

## Quick Reference: Database URL Formats

| Region | Format |
|--------|--------|
| US Central | `https://PROJECT-default-rtdb.firebaseio.com` |
| Europe West | `https://PROJECT-default-rtdb.europe-west1.firebasedatabase.app` |
| Asia Southeast | `https://PROJECT-default-rtdb.asia-southeast1.firebasedatabase.app` |

## Common Mistakes

1. ❌ Forgetting `VITE_` prefix in Vercel env vars
2. ❌ Using Firestore URL instead of RTDB URL
3. ❌ Not redeploying after adding env vars
4. ❌ RTDB rules not deployed (`firebase deploy --only database`)
5. ❌ RTDB not enabled in Firebase Console
6. ❌ Wrong region in database URL

## Next Steps

1. ✅ Check browser console in production (Step 1)
2. ✅ Verify `VITE_FIREBASE_DATABASE_URL` in Vercel (Step 2)
3. ✅ Get correct URL from Firebase Console (Step 3)
4. ✅ Update Vercel env var and redeploy (Fix 1)
5. ✅ Deploy RTDB rules (Fix 2)
6. ✅ Test with 2 browsers (Test 2)

---

**Most Likely Solution:** Add `VITE_FIREBASE_DATABASE_URL` to Vercel environment variables and redeploy.

