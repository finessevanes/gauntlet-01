# Google Authentication Testing Guide

## 🚨 Critical Issue: Firebase Emulators Don't Support Google OAuth

**Firebase Auth Emulator does NOT support Google Sign-In popup authentication.** This is a known Firebase limitation. You must test Google auth against production Firebase.

---

## ✅ Quick Start: Test Google Auth Now

### Step 1: Enable Google Sign-In in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/project/collab-canvas-e0bc3/authentication/providers)
2. Click **Authentication** → **Sign-in method**
3. Find **Google** in the providers list
4. Click on Google and enable it
5. Set your support email (required)
6. Save

### Step 2: Update Environment Variable

Your `.env` file has been updated. Restart your dev server:

```bash
cd /Users/finessevanes/Desktop/gauntlet-01/collabcanvas

# Stop the current dev server (Ctrl+C)

# Start fresh
npm run dev
```

**Current setting in `.env`:**
```bash
VITE_USE_EMULATORS=false  # Production Firebase (Google auth works ✅)
```

### Step 3: Test Google Sign-In

1. Open your app: http://localhost:5173
2. Click **Sign up** or **Log in**
3. Click **Continue with Google** button
4. You should see Google's OAuth popup
5. Sign in with your Google account
6. Check Firebase Console → Authentication → Users

You should see:
- Your Google email in the Identifier column
- **Google icon** in the Providers column (not email icon)
- User created successfully

---

## 🔄 Switching Between Modes

### Use Production Firebase (for Google Auth)
```bash
# In .env file:
VITE_USE_EMULATORS=false
```
- ✅ Google Sign-In works
- ✅ Email/Password works
- ⚠️ Uses production Firestore (real data)
- ⚠️ Uses production Realtime Database (real data)

### Use Firebase Emulators (for local dev)
```bash
# In .env file:
VITE_USE_EMULATORS=true
```
- ❌ Google Sign-In **does NOT work**
- ✅ Email/Password works
- ✅ Local Firestore (no cloud data)
- ✅ Local Realtime Database (no cloud data)

**Always restart your dev server after changing this setting!**

---

## 🐛 Troubleshooting

### "Popup closed by user" Error
- This is normal if you cancel the Google popup
- The error is silently handled (no toast shown)

### "Popup blocked" Error
- Your browser is blocking popups
- Allow popups for localhost:5173

### "This domain is not authorized" Error
- Go to Firebase Console → Authentication → Settings
- Add `localhost` and `127.0.0.1` to authorized domains
- Add your Vercel deployment URL when deploying

### Google Button Appears But Nothing Happens
- Check browser console for errors
- Make sure `VITE_USE_EMULATORS=false` in `.env`
- Restart dev server
- Check that Google is enabled in Firebase Console

### User Shows Email Provider Instead of Google
- This means you're connected to the emulator
- Set `VITE_USE_EMULATORS=false`
- Restart dev server
- Clear emulator data: `npm run emulator:clear` (if needed)

---

## 📊 What You Should See

### In Firebase Console (Production)
When Google auth works correctly, you'll see:

| Identifier | Providers | Created | Signed In | User UID |
|------------|-----------|---------|-----------|----------|
| your@gmail.com | 🔵 Google | Oct 14 | Oct 14 | abc123... |

**NOT this (emulator):**

| Identifier | Providers | Created | Signed In | User UID |
|------------|-----------|---------|-----------|----------|
| your@gmail.com | ✉️ Email | Oct 14 | Oct 14 | abc123... |

### In Browser Console
You should see:
```
🚀 Running in production mode - using Firebase Cloud services
```

**NOT this:**
```
🔧 Running in development mode - connecting to Firebase Emulators
✅ Connected to Auth Emulator (port 9099)
```

---

## 🎯 Testing Checklist

- [ ] Google provider enabled in Firebase Console
- [ ] `VITE_USE_EMULATORS=false` in `.env`
- [ ] Dev server restarted
- [ ] Google button visible on login/signup pages
- [ ] Clicking button opens Google OAuth popup
- [ ] Can select Google account in popup
- [ ] Successfully redirected after auth
- [ ] User shows Google provider icon in Firebase Console
- [ ] User profile created in Firestore `users` collection
- [ ] Username extracted from Google displayName
- [ ] Toast shows "Welcome back!" or success message

---

## 📝 Notes

1. **Data Safety:** When `VITE_USE_EMULATORS=false`, you're working with production data. Be careful!

2. **Hybrid Approach:** You can't mix emulator and production services. It's all or nothing.

3. **Deployment:** When deploying to Vercel, emulators are automatically disabled (production mode).

4. **Future:** Consider adding a toggle button in dev UI to switch modes without editing `.env`.

---

**Last Updated:** October 14, 2025  
**Related:** PR-8-IMPLEMENTATION-STATUS.md, PR-8-TEST-PLAN.md

