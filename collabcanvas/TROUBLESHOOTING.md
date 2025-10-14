# Troubleshooting Guide - CollabCanvas

## Current Issue: Semver Error (FIXED)

### Error Message:
```
Uncaught Error: Invalid argument not valid semver ('' received)
at activateBackend (backendManager.js:1:13128)
```

### Solution Applied:
```bash
cd collabcanvas
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Next Steps:
1. **Hard refresh your browser** - Clear cache:
   - Chrome/Edge: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - Firefox: `Cmd+Shift+Delete` (Mac) or `Ctrl+Shift+Delete` (Windows)
2. Navigate to http://localhost:5173 (or the port shown in terminal)
3. Login again
4. Test pan/zoom functionality

---

## Common Issues

### 1. "I can't see other users' cursors"

**Expected!** This is PR #2, cursor tracking comes in PR #3.

**What works now:**
- Your own mouse movements
- Pan/zoom controls
- Color selection

**What's coming in PR #3:**
- Real-time cursor sync
- Presence awareness
- Multi-user collaboration

See `PR-2-vs-PR-3.md` for details.

---

### 2. Canvas Not Appearing

**Symptoms:** White screen, no canvas

**Solutions:**
```bash
# Check console for errors (F12)
# Verify Konva is installed:
npm list konva react-konva

# If missing, reinstall:
npm install konva@^10.0.2 react-konva@^19.0.10

# Clear browser cache and hard refresh
```

---

### 3. Pan/Zoom Not Working

**Symptoms:** Can't drag canvas or zoom

**Check:**
- [ ] Is cursor inside the canvas area?
- [ ] Did you click on a shape by accident? (none exist yet)
- [ ] Any console errors?

**Solutions:**
```bash
# Check Canvas component is rendering:
# Open React DevTools
# Look for: CanvasProvider > AppShell > Canvas

# Restart dev server:
npm run dev
```

---

### 4. Colors Not Switching

**Symptoms:** Clicking colors doesn't update selection

**Check:**
- [ ] Is checkmark moving to clicked color?
- [ ] Is CanvasContext providing state?

**Solutions:**
```bash
# Check React DevTools > Components
# Find CanvasProvider
# Verify selectedColor state exists

# Check console for context errors
```

---

### 5. Dev Server Port Conflicts

**Symptoms:** "Port 5173 is in use"

**Solutions:**
```bash
# Find and kill process on port 5173:
lsof -ti:5173 | xargs kill -9

# Or let Vite find another port (5174, 5175, etc.)
# Update URL in browser accordingly
```

---

### 6. Firebase Emulator Issues

**Symptoms:** Can't login, auth errors

**Solutions:**
```bash
# Terminal 1: Start emulators
cd collabcanvas
firebase emulators:start

# Terminal 2: Start dev server
cd collabcanvas
npm run dev

# Check Emulator UI: http://localhost:4000
# Verify Auth, Firestore, RTDB are running
```

---

### 7. TypeScript Errors

**Symptoms:** Red underlines, type errors

**Solutions:**
```bash
# Run TypeScript check:
npx tsc --noEmit

# Check for missing types:
npm install --save-dev @types/node @types/react @types/react-dom @types/lodash

# Restart IDE/Editor
```

---

### 8. Build Errors

**Symptoms:** `npm run build` fails

**Solutions:**
```bash
# Clear build cache:
rm -rf dist .vite

# Try building again:
npm run build

# Check for TypeScript errors:
npx tsc --noEmit

# Check for linter errors:
npm run lint
```

---

## Performance Issues

### Laggy Pan/Zoom

**Check:**
- [ ] Browser hardware acceleration enabled
- [ ] Close other tabs/applications
- [ ] Check CPU usage (Activity Monitor/Task Manager)
- [ ] Update browser to latest version

**Expected Performance:**
- Pan: Instant response (<16ms)
- Zoom: Smooth, 60 FPS
- No jank or stuttering

---

## Browser Compatibility

### Recommended Browsers:
- ✅ Chrome 100+ (best performance)
- ✅ Firefox 100+
- ✅ Safari 15+
- ✅ Edge 100+

### Not Supported:
- ❌ Internet Explorer
- ❌ Very old browser versions

---

## Debug Checklist

When reporting issues, provide:
- [ ] Browser and version
- [ ] Console errors (F12 → Console tab)
- [ ] Network errors (F12 → Network tab)
- [ ] Screenshot of issue
- [ ] Steps to reproduce
- [ ] Which PR/feature you're testing

---

## Quick Reset

When all else fails:
```bash
# Full reset:
cd collabcanvas

# 1. Clean install
rm -rf node_modules package-lock.json
npm install

# 2. Clear browser completely
# Chrome: Settings → Privacy → Clear browsing data → All time
# Or use Incognito mode

# 3. Restart everything
# Terminal 1:
firebase emulators:start

# Terminal 2:
npm run dev

# 4. Fresh browser window
# Navigate to http://localhost:5173
```

---

## Getting Help

### Check Documentation:
1. `PR-2-SUMMARY.md` - Implementation details
2. `PR-2-TEST-PLAN.md` - Testing guide
3. `PR-2-vs-PR-3.md` - Feature breakdown
4. `docs/task.md` - Full requirements
5. `docs/prd.md` - Product specs

### Still stuck?
- Check console for specific error messages
- Review recent code changes
- Test in different browser
- Use Incognito mode to rule out extensions

---

## Current Status (PR #2)

### ✅ Working:
- Canvas renders (5000×5000)
- Pan via drag
- Zoom via wheel (cursor-centered)
- Color toolbar (4 colors)
- Auth flow
- No console errors (after fix)

### ⏳ Coming Next (PR #3):
- Real-time cursors
- Presence list
- Multi-user testing

### 📋 Future:
- Shape creation (PR #4)
- Locking + drag (PR #5)
- Testing + polish (PR #6)
- Deployment (PR #7)

