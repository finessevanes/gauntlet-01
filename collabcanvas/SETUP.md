# Setup & Troubleshooting Guide

Complete guide to setting up CollabCanvas development environment and resolving common issues.

---

## 📋 Prerequisites

- **Node.js:** v18 or higher
- **npm:** v9 or higher
- **Java Runtime Environment (JRE):** For Firebase Emulators
- **Git:** For version control

**Check your versions:**
```bash
node --version   # Should be v18+
npm --version    # Should be v9+
java -version    # Should be 11+
```

---

## 🚀 Initial Setup

### 1. Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd gauntlet-01/collabcanvas

# Install dependencies
npm install
```

### 2. Firebase Emulators Setup

**Install Firebase CLI (if not already installed):**
```bash
npm install -g firebase-tools
```

**Verify installation:**
```bash
firebase --version   # Should be v12+
```

**The project is already configured** - `firebase.json` and emulator config exist.

### 3. Environment Variables

Firebase emulators work with dummy values for local development.

**No `.env` file needed for local development!** The app automatically detects emulators.

### 4. Start Development

**Option A: All-in-One (Recommended)**
```bash
./start-dev.sh
```
This starts emulators + dev server in background.

**Option B: Manual (Two Terminals)**

Terminal 1 - Emulators:
```bash
cd collabcanvas
firebase emulators:start
```

Terminal 2 - Dev Server:
```bash
cd collabcanvas
npm run dev
```

### 5. Verify Setup

- **Emulator UI:** http://localhost:4000
- **App:** http://localhost:5173
- **Check services:** `./check-services.sh`

---

## 🔧 Firebase Emulators

### What's Running

When you run `firebase emulators:start`, these services start:

| Service | Port | Purpose |
|---------|------|---------|
| Authentication | 9099 | User signup/login |
| Firestore | 8080 | Persistent data (shapes, locks) |
| Realtime Database | 9000 | Ephemeral data (cursors, presence) |
| Emulator UI | 4000 | Inspect/manage data |

### Emulator UI Features

Visit http://localhost:4000 to:
- View authenticated users
- Inspect Firestore collections
- Monitor Realtime Database data
- Clear data between tests
- Export/import emulator state

### Important Emulator Behaviors

**Data Persistence:**
- Emulator data is **ephemeral** by default (cleared on restart)
- Use `--export-on-exit` flag to persist data between sessions

**Network:**
- Emulators run locally - **no internet required** for development
- **No Firebase costs** incurred during local development

**Security Rules:**
- `firestore.rules` and `database.rules.json` are enforced in emulators
- Test rules locally before deploying

---

## 🧪 Testing Multi-User Scenarios

### Open Multiple Browsers

1. **Incognito Window** (Chrome/Edge: `Cmd+Shift+N` or `Ctrl+Shift+N`)
   - Navigate to http://localhost:5173
   - Sign up as "Alice"

2. **Normal Window**
   - Navigate to http://localhost:5173
   - Sign up as "Bob"

3. **Different Browser** (Optional)
   - Firefox, Safari, etc.
   - Navigate to http://localhost:5173
   - Sign up as "Carol"

### Why Different Browsers?

- Each browser/window maintains separate auth state
- Simulates multiple users in real-time
- Essential for testing cursors, presence, locks

---

## 🐛 Common Issues & Solutions

### Issue 1: "Port Already in Use"

**Symptoms:**
- Error: `Port 5173 is already in use`
- Or similar for ports 4000, 8080, 9000, 9099

**Solution:**
```bash
# Find process on port (example: 5173)
lsof -ti:5173

# Kill process
lsof -ti:5173 | xargs kill -9

# Or let Vite find another port (check terminal output)
```

---

### Issue 2: "Emulators Won't Start"

**Symptoms:**
- `firebase emulators:start` fails
- Error about Java not found

**Solutions:**

**Check Java installation:**
```bash
java -version
```

If not installed:
```bash
# macOS
brew install openjdk@11

# Ubuntu/Debian
sudo apt-get install openjdk-11-jre

# Windows
# Download from https://adoptium.net/
```

**Check port conflicts:**
```bash
# Check if emulator ports are free
lsof -ti:4000,8080,9000,9099
```

**Clear Firebase cache:**
```bash
rm -rf ~/.cache/firebase/emulators
firebase emulators:start
```

---

### Issue 3: "Invalid Semver Error"

**Symptoms:**
- Dev server starts but app won't load
- Console error: `Uncaught Error: Invalid argument not valid semver ('' received)`
- White screen in browser

**Solution:**
```bash
cd collabcanvas
rm -rf node_modules package-lock.json
npm install
npm run dev

# Hard refresh browser
# Chrome/Edge: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
# Firefox: Cmd+Shift+Delete → Clear cache
```

**Root Cause:** Firebase SDK version conflict with cached build artifacts.

**Prevention:** Clear browser cache when updating dependencies.

---

### Issue 4: "Can't Connect to Emulators"

**Symptoms:**
- App loads but auth/database operations fail
- Console errors about connection refused
- "Firebase not initialized" errors

**Solutions:**

**1. Verify emulators are running:**
```bash
# Check emulator UI
open http://localhost:4000

# Or use check script
./check-services.sh
```

**2. Check Firebase initialization:**
```typescript
// In src/firebase.ts
// Verify emulator connection code is present:
if (location.hostname === 'localhost') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(firestore, 'localhost', 8080);
  connectDatabaseEmulator(database, 'localhost', 9000);
}
```

**3. Restart everything:**
```bash
# Kill all Firebase processes
pkill -f firebase

# Restart emulators
cd collabcanvas
firebase emulators:start

# In another terminal, restart dev server
npm run dev
```

---

### Issue 5: "Canvas Not Appearing"

**Symptoms:**
- White screen
- No canvas visible
- Console errors about Konva

**Solutions:**

**Verify Konva is installed:**
```bash
npm list konva react-konva
```

If missing:
```bash
npm install konva@^10.0.2 react-konva@^19.0.10
```

**Check React DevTools:**
- Open DevTools (F12)
- Go to Components tab
- Look for: `CanvasProvider > AppShell > Canvas`

**Clear browser cache:**
```bash
# Chrome DevTools
# Right-click refresh button → Empty Cache and Hard Reload
```

---

### Issue 6: "Cursors Not Appearing"

**Symptoms:**
- Can't see other users' cursors
- Presence list not updating

**Solutions:**

**1. Verify RTDB emulator is running:**
- Visit http://localhost:4000
- Check "Realtime Database" tab
- Should see `/sessions/main/users/` path

**2. Check console for errors:**
- Look for RTDB connection errors
- Look for permission denied errors

**3. Verify RTDB rules:**
```bash
# Check database.rules.json exists
cat database.rules.json

# Should allow authenticated users to read/write their own data
```

**4. Test with Firebase Emulator UI:**
- Go to http://localhost:4000
- Go to Realtime Database tab
- Manually write to `/sessions/main/users/test`
- If it works, rules are correct

---

### Issue 7: "Authentication Fails"

**Symptoms:**
- Can't sign up or log in
- Auth errors in console
- "User not found" errors

**Solutions:**

**1. Verify Auth emulator:**
```bash
# Should see this when emulators start:
# ✔ Auth Emulator running on http://localhost:9099
```

**2. Check emulator UI:**
- Go to http://localhost:4000
- Go to Authentication tab
- Try creating a user manually

**3. Clear emulator data:**
```bash
# Stop emulators (Ctrl+C)
# Restart fresh
firebase emulators:start
```

**4. Check auth initialization:**
```typescript
// In src/firebase.ts
// Verify auth is initialized before components render
```

---

### Issue 8: "Build Errors"

**Symptoms:**
- `npm run build` fails
- TypeScript errors
- Vite build errors

**Solutions:**

**Clear build cache:**
```bash
rm -rf dist .vite
npm run build
```

**Check TypeScript:**
```bash
npx tsc --noEmit
```

**Check for type errors:**
```bash
# Common issues:
# - Missing type definitions
# - Import paths wrong
# - Unused variables (if lint is strict)
```

**Install missing types:**
```bash
npm install --save-dev @types/node @types/react @types/react-dom @types/lodash
```

---

### Issue 9: "Slow Performance / Low FPS"

**Symptoms:**
- Laggy pan/zoom
- Choppy cursor movement
- FPS drops below 60

**Solutions:**

**Check browser:**
- Update to latest version
- Enable hardware acceleration (Settings → System)
- Close other tabs/applications

**Check render performance:**
```javascript
// Open DevTools (F12) → Performance
// Record interaction → Check for long tasks
```

**Verify throttling is working:**
```typescript
// In useCursors.ts
// Should throttle to 33ms (30 FPS)
const throttledUpdate = throttle(updateCursor, 33);
```

**Reduce concurrent users:**
- Test with 2-3 users first
- Scale up to 5+ once baseline is good

---

### Issue 10: "Linter Errors"

**Symptoms:**
- Red squiggles in editor
- `npm run lint` fails
- Build fails due to lint errors

**Solutions:**

**Run linter:**
```bash
npm run lint
```

**Auto-fix:**
```bash
npm run lint -- --fix
```

**Common issues:**
- Unused imports (remove them)
- `console.log` statements (use proper logger or remove)
- Missing return types (add TypeScript types)

**Disable for specific line (use sparingly):**
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
```

---

## 🔄 Clearing Data

### Clear Emulator Data

**Option 1: Restart emulators** (clears everything)
```bash
# Stop (Ctrl+C)
firebase emulators:start
```

**Option 2: Use Emulator UI**
- Go to http://localhost:4000
- Navigate to Firestore or RTDB
- Manually delete collections/paths

**Option 3: Programmatic clear**
```typescript
// In your code or test setup
import { deleteApp } from 'firebase/app';
import { clearFirestoreData } from '@firebase/testing';

// Clear Firestore
await clearFirestoreData({ projectId: 'demo-project' });
```

### Clear Browser Data

**Chrome:**
1. DevTools (F12)
2. Application tab
3. Clear storage
4. Or: Settings → Privacy → Clear browsing data

**All Browsers:**
- Use Incognito/Private mode for clean state

---

## 🚀 Performance Optimization

### Development Mode

**Expected Performance:**
- Canvas rendering: **60 FPS**
- Cursor updates: **20-30 FPS** (throttled)
- Shape sync: **<100ms latency**
- Cursor sync: **<50ms latency**

### If Performance is Slow

**1. Check browser performance:**
```
DevTools → Performance tab → Record → Analyze
Look for:
- Long tasks (>50ms)
- Layout thrashing
- Memory leaks
```

**2. Reduce shapes:**
- Start with <50 shapes
- Test with 100 shapes
- Scale to 500+ only when baseline is good

**3. Optimize rendering:**
- Konva uses canvas (hardware accelerated)
- Check `listening={false}` on non-interactive layers
- Use `perfectDrawEnabled={false}` for better performance

---

## 📊 Monitoring & Debugging

### Check Services Script

```bash
./check-services.sh
```

Shows status of:
- Firebase emulators
- Dev server
- Port availability

### Firebase Emulator Logs

**Firestore:**
- Logs appear in terminal running emulators
- Check `firestore-debug.log` file

**Realtime Database:**
- Logs appear in terminal
- Check `database-debug.log` file

### Browser DevTools

**Console (F12):**
- Firebase connection errors
- React errors
- Network errors

**Network Tab:**
- Check Firestore/RTDB requests
- Look for 403 (permission denied)
- Look for 404 (wrong path)

**React DevTools:**
- Install extension
- Check component state
- Check context values

---

## 🔐 Security Rules Testing

### Test Firestore Rules Locally

```bash
# Rules are in firestore.rules
# They're enforced in emulators

# Test by trying operations that should fail
# Example: try to update another user's document
```

### Test RTDB Rules Locally

```bash
# Rules are in database.rules.json
# They're enforced in emulators

# Test by trying to write to another user's cursor path
```

### Common Rule Issues

**"Permission denied" errors:**
- Check if user is authenticated
- Check if userId matches auth.uid
- Check rule conditions

**Rules too permissive:**
- Review before deploying to production
- Test with multiple users

---

## 🎯 Production Deployment Setup

### Environment Variables for Production

Create `.env` file (not committed to git):

```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

### Deploy Firebase Rules

```bash
# Deploy security rules to production
firebase deploy --only firestore:rules,database
```

### Build for Production

```bash
npm run build

# Test production build locally
npm run preview
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd collabcanvas
vercel --prod
```

See full deployment guide in `docs/archive/PR-7-DEPLOYMENT-GUIDE.md`.

---

## 🆘 Still Stuck?

### Check Documentation

1. `README.md` - Project overview
2. `GOTCHAS.md` - Known issues and gotchas
3. `ARCHITECTURE.md` - Technical details
4. `docs/archive/` - Historical context
5. `TROUBLESHOOTING.md` - This file

### Debug Checklist

- [ ] Emulators running? (http://localhost:4000)
- [ ] Dev server running? (http://localhost:5173)
- [ ] Console errors? (F12 → Console)
- [ ] Network errors? (F12 → Network)
- [ ] Tried restarting everything?
- [ ] Tried clearing browser cache?
- [ ] Tried clearing node_modules?

### Search Archive

```bash
# Search for error message
grep -r "your error message" docs/archive/

# Search for feature
grep -r "cursor\|presence\|lock" docs/archive/
```

### Nuclear Option (Full Reset)

```bash
cd collabcanvas

# 1. Clean install
rm -rf node_modules package-lock.json
npm install

# 2. Clear browser completely
# Chrome: Settings → Privacy → Clear browsing data → All time

# 3. Clear Firebase cache
rm -rf ~/.cache/firebase/emulators

# 4. Restart everything
# Terminal 1:
firebase emulators:start

# Terminal 2:
npm run dev

# 5. Fresh browser window (Incognito)
# Navigate to http://localhost:5173
```

---

## 📚 Additional Resources

- [Firebase Emulators Docs](https://firebase.google.com/docs/emulator-suite)
- [Vite Troubleshooting](https://vitejs.dev/guide/troubleshooting.html)
- [Konva Performance Tips](https://konvajs.org/docs/performance/All_Performance_Tips.html)

---

Built for CollabCanvas MVP (October 2025)  
Last updated: October 14, 2025

