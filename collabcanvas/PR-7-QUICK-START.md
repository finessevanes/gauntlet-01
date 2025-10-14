# PR #7 Quick Start - Deploy to Production in 15 Minutes

## 🚀 Goal

Deploy CollabCanvas to Vercel with a public URL, ready for 5+ concurrent users.

---

## ⚡ 15-Minute Deployment

### Prerequisites (5 min)

**✅ Checklist:**
- [ ] Firebase project created
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore database created
- [ ] Realtime Database created
- [ ] Vercel account created
- [ ] Git repository ready

**Quick Firebase Setup:**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create project → Enable Auth (Email/Password) → Create Firestore → Create RTDB
3. Copy Firebase config from Project Settings → General → Your apps

---

### Step 1: Test Local Build (2 min)

```bash
cd collabcanvas

# Build the app
npm run build

# Test production build locally
npm run preview
```

✅ **Verify:** App loads at http://localhost:4173 with no errors

---

### Step 2: Deploy Firebase Rules (1 min)

```bash
# Deploy security rules
firebase deploy --only firestore:rules,database
```

✅ **Verify:** Check Firebase Console → Rules are deployed

---

### Step 3: Deploy to Vercel (3 min)

**Option A: Vercel CLI**

```bash
# Install Vercel CLI (one-time)
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Option B: GitHub Integration**

1. Push to GitHub
2. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
3. Click **Import Project**
4. Select your repo
5. Set **Root Directory**: `collabcanvas`
6. Click **Deploy**

✅ **Verify:** Deployment succeeds, get URL like `your-app.vercel.app`

---

### Step 4: Configure Environment Variables (3 min)

**In Vercel Dashboard:**

1. Go to your project → **Settings** → **Environment Variables**
2. Add these 7 variables (get from Firebase Project Settings):

```bash
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_DATABASE_URL
```

3. Click **Save**
4. Trigger redeploy: **Deployments** tab → Three dots → **Redeploy**

✅ **Verify:** New deployment succeeds

---

### Step 5: Configure Firebase Auth (1 min)

**Add Vercel domain to authorized domains:**

1. Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. Click **Add domain**
3. Enter: `your-app.vercel.app` (your Vercel URL without https://)
4. Click **Add**

✅ **Verify:** Domain appears in authorized domains list

---

## 🧪 Quick Test (5 min)

### Test 1: Authentication

```bash
# Open your deployed URL
# Click Sign Up
# Create account
# Verify you can log in
```

✅ **Pass:** Sign up and login work, no errors

---

### Test 2: Real-Time Cursors

```bash
# Open 2 browser windows:
# - Window 1: Normal browsing mode
# - Window 2: Incognito mode

# Log in with different accounts
# Move mouse on canvas
```

✅ **Pass:** Both users see each other's cursors moving smoothly

---

### Test 3: Shape Creation

```bash
# Toggle to Draw mode
# Click and drag on canvas to create a rectangle
# Check other browser window
```

✅ **Pass:** Shape appears in both windows within 100ms

---

### Test 4: Locking

```bash
# User 1: Click a shape to select it
# User 2: Try to click the same shape
# User 2 should see red border + lock icon
```

✅ **Pass:** Locking works, toast shows "Shape locked by [username]"

---

## ✅ Deployment Complete!

### Your App Is Live At:

```
https://your-app.vercel.app
```

### Share with team and test with 5+ users!

---

## 🐛 Quick Troubleshooting

### Issue: "Missing environment variables"

**Fix:**
```bash
# Verify all 7 variables set in Vercel dashboard
# Settings → Environment Variables
# Redeploy after adding variables
```

---

### Issue: Auth doesn't work

**Fix:**
```bash
# Add Vercel domain to Firebase authorized domains
# Firebase Console → Authentication → Settings → Authorized domains
# Add: your-app.vercel.app (no https://)
# Wait 5 minutes for propagation
```

---

### Issue: Cursors/shapes don't sync

**Fix:**
```bash
# Deploy Firebase rules
firebase deploy --only firestore:rules,database

# Verify users are logged in
# Check browser console for errors
```

---

### Issue: Build fails

**Fix:**
```bash
# Test locally first
cd collabcanvas
npm run build

# Check TypeScript errors
npx tsc --noEmit

# Fix errors, then redeploy
```

---

## 📚 Full Documentation

For detailed instructions, see:

- **[PR-7-DEPLOYMENT-GUIDE.md](./PR-7-DEPLOYMENT-GUIDE.md)** - Complete step-by-step guide
- **[PR-7-SUMMARY.md](./PR-7-SUMMARY.md)** - Full PR summary
- **[README.md](./README.md)** - Project documentation

---

## 🎯 Performance Benchmarks

After deployment, verify:

- [ ] **Cursor latency:** <50ms (smooth movement)
- [ ] **Shape sync:** <100ms (instant appearance)
- [ ] **FPS:** 60 FPS during pan/zoom
- [ ] **Concurrent users:** 5+ users without lag
- [ ] **Load time:** <3 seconds initial load

Use Chrome DevTools → Performance to measure.

---

## 🎉 Next Steps

1. **Update README** with your live URL
2. **Share** with team for testing
3. **Monitor** Firebase Console for usage
4. **Gather** user feedback
5. **Plan** post-MVP features

---

**Status:** ✅ **MVP COMPLETE - LIVE IN PRODUCTION!**

---

**Built with ⚡ by the CollabCanvas Team**

