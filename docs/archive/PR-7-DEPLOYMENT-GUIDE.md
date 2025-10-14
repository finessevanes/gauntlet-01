# PR #7: Deployment Guide - Vercel + Production Rules

## 🎯 Overview

This PR completes the MVP by deploying CollabCanvas to production on Vercel with full Firebase integration.

## ✅ Deployment Checklist

### Pre-Deployment Setup

- [ ] Firebase project created and configured
- [ ] Firebase Authentication enabled (Email/Password)
- [ ] Firestore database created
- [ ] Realtime Database created
- [ ] Security rules deployed to Firebase
- [ ] Vercel account created
- [ ] GitHub repository connected to Vercel (optional but recommended)

---

## 📋 Step-by-Step Deployment

### Step 1: Verify Local Build

First, ensure the app builds successfully locally:

```bash
cd collabcanvas
npm run build
```

**Expected output:**
- Build completes without errors
- `dist/` directory is created
- Console shows build size and files

**Test the production build locally:**

```bash
npm run preview
```

Visit http://localhost:4173 and verify the app works.

---

### Step 2: Configure Firebase for Production

#### 2.1: Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (or create a new one)
3. Go to **Project Settings** (gear icon) → **General**
4. Scroll to "Your apps" section
5. Click **Web app** (</> icon) or create one if it doesn't exist
6. Copy all the configuration values

#### 2.2: Enable Firebase Services

**Enable Authentication:**
1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** provider
3. Click **Save**

**Create Firestore Database:**
1. Go to **Firestore Database** → **Create database**
2. Choose **Start in production mode**
3. Select a location (e.g., us-central1)
4. Click **Enable**

**Create Realtime Database:**
1. Go to **Realtime Database** → **Create database**
2. Choose **Start in locked mode**
3. Select same location as Firestore
4. Click **Enable**

#### 2.3: Deploy Security Rules

From the `collabcanvas/` directory:

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Realtime Database rules
firebase deploy --only database
```

**Verify rules are deployed:**
- Check Firestore Rules tab in Firebase Console
- Check Realtime Database Rules tab in Firebase Console

---

### Step 3: Deploy to Vercel

#### Option A: Deploy via Vercel CLI (Recommended)

**Install Vercel CLI:**

```bash
npm i -g vercel
```

**Login to Vercel:**

```bash
vercel login
```

**Deploy from collabcanvas directory:**

```bash
cd collabcanvas
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account
- **Link to existing project?** → No
- **Project name?** → collabcanvas (or your preferred name)
- **Directory?** → ./ (current directory)
- **Override settings?** → No

This creates a preview deployment. For production:

```bash
vercel --prod
```

#### Option B: Deploy via GitHub (Alternative)

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click **Add New** → **Project**
4. Import your GitHub repository
5. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: collabcanvas
   - **Build Command**: npm run build
   - **Output Directory**: dist
6. Click **Deploy**

---

### Step 4: Configure Environment Variables on Vercel

**Via Vercel Dashboard:**

1. Go to your project on Vercel
2. Click **Settings** → **Environment Variables**
3. Add each variable from your Firebase config:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `VITE_FIREBASE_API_KEY` | Your Firebase API Key | Production |
| `VITE_FIREBASE_AUTH_DOMAIN` | your-project.firebaseapp.com | Production |
| `VITE_FIREBASE_PROJECT_ID` | your-project-id | Production |
| `VITE_FIREBASE_STORAGE_BUCKET` | your-project.appspot.com | Production |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your sender ID | Production |
| `VITE_FIREBASE_APP_ID` | Your app ID | Production |
| `VITE_FIREBASE_DATABASE_URL` | https://your-project.firebaseio.com | Production |

4. Click **Save** after adding each variable

**Via Vercel CLI:**

```bash
vercel env add VITE_FIREBASE_API_KEY
# Enter value when prompted
# Select: Production

# Repeat for all environment variables
```

**Redeploy after adding environment variables:**

```bash
vercel --prod
```

---

### Step 5: Configure Firebase Auth for Vercel Domain

**Add Vercel domain to authorized domains:**

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain**
5. Add your Vercel deployment URL (e.g., `collabcanvas.vercel.app`)
6. Click **Add**

**Your Vercel URL format:**
- Production: `your-project-name.vercel.app`
- Preview: `your-project-name-hash.vercel.app`

⚠️ **Important:** Add both your production domain and any preview domains you want to test.

---

### Step 6: Verify Deployment

**Test the following on your deployed URL:**

#### Authentication Test
- [ ] Sign up with new account works
- [ ] Login with existing account works
- [ ] Logout works
- [ ] Auth persists on page refresh
- [ ] No console errors related to Firebase Auth

#### Real-Time Features Test
- [ ] Open 2 browser windows (or incognito + normal)
- [ ] Both users can see each other's cursors moving
- [ ] Cursor updates are smooth (<50ms latency)
- [ ] Presence list shows both users
- [ ] When one user disconnects, presence updates immediately

#### Canvas Features Test
- [ ] Can pan the canvas (drag or spacebar)
- [ ] Can zoom in/out (mouse wheel)
- [ ] Color toolbar works (all 4 colors)
- [ ] Can create rectangles by clicking and dragging
- [ ] Other users see shapes appear in real-time (<100ms)
- [ ] Shapes persist after page refresh

#### Locking Features Test
- [ ] User A can select and drag a shape
- [ ] User B sees the shape as locked (red border)
- [ ] User B cannot interact with locked shape
- [ ] Lock releases when User A deselects or finishes dragging
- [ ] Toast notifications appear for lock conflicts

#### Performance Test
- [ ] Open 5+ browser windows with different accounts
- [ ] Create 50+ shapes
- [ ] Verify cursor updates remain smooth
- [ ] Verify shape creation/movement remains responsive
- [ ] Check browser dev tools: 60 FPS maintained
- [ ] No memory leaks during extended session

---

## 🚨 Troubleshooting

### Issue: "Missing environment variables" error

**Solution:**
1. Check that all environment variables are set in Vercel dashboard
2. Verify variable names match exactly (case-sensitive)
3. Redeploy after adding variables: `vercel --prod`

### Issue: Firebase Auth error on deployed site

**Solution:**
1. Verify Vercel domain is added to Firebase authorized domains
2. Check Firebase Console → Authentication → Settings → Authorized domains
3. Wait 5 minutes for DNS propagation
4. Clear browser cache and try again

### Issue: Firestore/RTDB connection errors

**Solution:**
1. Check that databases are created in Firebase Console
2. Verify security rules are deployed: `firebase deploy --only firestore:rules,database`
3. Check browser console for specific error messages
4. Ensure `MODE` is not 'development' in production build

### Issue: Build fails on Vercel

**Solution:**
1. Check build logs in Vercel dashboard
2. Verify `package.json` has correct build script
3. Test build locally: `npm run build`
4. Check TypeScript errors: `npx tsc --noEmit`
5. Ensure all dependencies are in `package.json` (not just devDependencies)

### Issue: Cursors not syncing in production

**Solution:**
1. Check Realtime Database rules are deployed
2. Verify RTDB URL in environment variables
3. Check browser console for RTDB connection errors
4. Ensure users are authenticated before cursor updates start

### Issue: Shapes not appearing in production

**Solution:**
1. Check Firestore rules are deployed
2. Verify Firestore is created and active in Firebase Console
3. Check browser console for Firestore permission errors
4. Test with Firebase Console → Firestore → manually create a shape document

---

## 📊 Performance Benchmarks

### Target Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Cursor Latency | <50ms | Compare timestamps in RTDB |
| Shape Sync | <100ms | Time from create to appear |
| FPS During Pan | 60 FPS | Chrome DevTools Performance tab |
| FPS During Zoom | 60 FPS | Chrome DevTools Performance tab |
| Concurrent Users | 5+ | Test with multiple browsers |
| Shape Capacity | 500+ | Create shapes, monitor performance |

### How to Test Performance

**Cursor Latency:**
1. Open browser DevTools → Network tab
2. Filter by "firebaseio.com"
3. Move cursor and observe request timing
4. Should see updates every 33-50ms

**FPS Monitoring:**
1. Open Chrome DevTools → Performance tab
2. Click Record
3. Pan/zoom the canvas for 10 seconds
4. Stop recording
5. Check frame rate graph (should be solid 60 FPS)

**Load Testing:**
1. Open 5+ browser windows (different browsers + incognito)
2. Sign in with different accounts in each
3. Create shapes simultaneously
4. Move cursors around
5. Monitor for lag, dropped frames, or sync delays

---

## 📁 Files Modified/Created in PR #7

### New Files
- ✅ `.env.example` - Template for environment variables
- ✅ `vercel.json` - Vercel deployment configuration
- ✅ `.firebaserc` - Firebase project configuration
- ✅ `PR-7-DEPLOYMENT-GUIDE.md` - This file

### Modified Files
- ✅ `README.md` - Updated with deployment instructions and live URL
- ✅ `firebase.ts` - Already configured for dev/prod modes (no changes needed)
- ✅ `firestore.rules` - Already production-ready (verified)
- ✅ `database.rules.json` - Already production-ready (verified)

---

## 🎉 Post-Deployment

### Update README with Live URL

Once deployed, update `README.md` with:

```markdown
## 🌐 Live Demo

**Production URL:** https://your-app.vercel.app

Try it out with multiple browser windows to see real-time collaboration in action!
```

### Share with Team

1. Share the Vercel URL with your team
2. Ask 5+ people to test simultaneously
3. Gather feedback on performance and UX
4. Monitor Firebase Console for usage/errors

### Monitor Production

**Firebase Console:**
- Monitor Authentication users
- Check Firestore usage
- Check RTDB usage
- Review security rules logs

**Vercel Dashboard:**
- Monitor deployment status
- Check build logs
- Review analytics (if enabled)
- Monitor function invocations

---

## 🔐 Security Checklist

- [ ] `.env` file is in `.gitignore` (never committed)
- [ ] Environment variables set in Vercel (not in code)
- [ ] Firebase security rules deployed and tested
- [ ] Vercel domain added to Firebase authorized domains
- [ ] No API keys or secrets in public code
- [ ] HTTPS enforced (Vercel default)
- [ ] CORS properly configured (Firebase handles this)

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Firebase Hosting with Vercel](https://firebase.google.com/docs/hosting)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)

---

## ✅ PR #7 Acceptance Criteria

- [x] `.env.example` created with all required variables
- [x] `vercel.json` configuration created
- [x] Firebase security rules are production-ready
- [x] App builds successfully (`npm run build`)
- [ ] Deployed to Vercel with public URL
- [ ] Firebase Auth configured for Vercel domain
- [ ] All environment variables set in Vercel
- [ ] Authentication works on deployed site
- [ ] Real-time cursors work on deployed site
- [ ] Shape creation/sync works on deployed site
- [ ] Locking works on deployed site
- [ ] Performance targets met (60 FPS, <50ms cursors, <100ms shapes)
- [ ] Tested with 5+ concurrent users
- [ ] README updated with live URL
- [ ] No console errors in production
- [ ] No Firebase security rule violations

---

## 🚀 Next Steps (Post-MVP)

After successful deployment:

1. **Monitoring & Analytics**
   - Set up Firebase Analytics
   - Add Vercel Analytics
   - Monitor error logs

2. **Performance Optimization**
   - Implement shape virtualization (render only visible shapes)
   - Add lazy loading for large canvases
   - Optimize cursor update throttling

3. **Feature Enhancements** (Post-MVP Backlog)
   - Delete shapes
   - Resize/rotate shapes
   - Multi-select
   - Undo/redo
   - Full color picker
   - Mobile responsiveness

4. **AI Agent Integration** (Phase 2 - Sunday)
   - AI agent using same service layer
   - Voice/text commands to create shapes
   - Intelligent layout suggestions

---

**Built with ⚡ by the CollabCanvas Team**

*Last Updated: PR #7 - Deployment*

