# PR #8: Google OAuth Authentication - Quick Start

## Prerequisites
- Firebase emulators and Node.js installed
- **Google provider enabled in Firebase Console** (see setup below)

## Setup Firebase Console (One-Time)

**Enable Google Auth:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Authentication → Sign-in method
4. Click **Google** → Toggle **Enable**
5. Select support email → **Save**

## Local Development

```bash
# Terminal 1
cd collabcanvas && firebase emulators:start

# Terminal 2
cd collabcanvas && npm run dev
```

## Test Google Sign-In

**New User Signup:**
1. Go to `http://localhost:5173`
2. Click **"Continue with Google"** button (top of form)
3. Select Google account in popup
4. Should redirect to canvas

**Existing User Login:**
1. Log out (if already signed in)
2. Click **"Continue with Google"**
3. Select same Google account
4. Should see "Welcome back!" toast

**Test Cancellation:**
1. Click **"Continue with Google"**
2. Close popup without selecting account
3. Should remain on login page (no error toast)

## Test Multi-User (Mixed Auth)

**Browser 1 (Incognito):**
1. Go to `http://localhost:5173`
2. Sign in with Google as "Alice"
3. Move cursor on canvas

**Browser 2 (Normal):**
1. Go to `http://localhost:5173`
2. Use email/password signup as "Bob"
3. Move cursor on canvas

## Expected Results

- ✅ Google Sign-In button appears on login and signup pages
- ✅ Button has Google logo with "Continue with Google" text
- ✅ "OR" divider separates Google from email/password
- ✅ New users create account and redirect to canvas in <2 seconds
- ✅ Existing users log in without creating duplicate profiles
- ✅ Username extracted from Google displayName (or email prefix)
- ✅ User profile created in Firestore with same schema as email/password users
- ✅ Both auth methods work in multi-user collaboration
- ✅ Presence list shows all users (auth method is invisible)
- ✅ Cursors sync correctly regardless of auth method
- ✅ Closing popup doesn't show error toast
- ✅ Email/password auth still works (no regression)

## Verify in Firebase Emulator UI

1. Open `http://localhost:4000`
2. Navigate to **Firestore** tab
3. Check `/users/{userId}` document:
   ```json
   {
     "uid": "google_user_id",
     "username": "John Doe",
     "email": "john@gmail.com",
     "cursorColor": "#3b82f6",
     "createdAt": "2025-10-14T..."
   }
   ```
4. Same schema as email/password users ✅

## Troubleshooting

**Popup doesn't open:**
- Check browser popup blocker (allow popups for localhost)
- Check Firebase Console: Google provider enabled

**"Unauthorized domain" error:**
- Ensure localhost is authorized in Firebase Console
- Check OAuth redirect URIs

**Profile not created:**
- Check Firestore emulator logs
- Verify Firestore rules allow user writes

**Email/password broke:**
- Unlikely (separate code paths)
- Test email/password signup independently

