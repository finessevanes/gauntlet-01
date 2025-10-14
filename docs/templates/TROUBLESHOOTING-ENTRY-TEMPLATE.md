# Troubleshooting Entry Template

<!-- Copy this format when adding to TROUBLESHOOTING.md -->

---

### [Error Name - Make It Searchable]

**Symptoms:** 
<!-- What you see - be specific with error messages -->
- [Symptom 1]
- [Error message if any]
- [Console output if any]

**Solutions:**
```bash
# Step-by-step fix with exact commands
cd collabcanvas
[command 1]
[command 2]
```

**Check:**
<!-- How to verify it's fixed -->
- [Verification step 1]

**Root Cause:**
<!-- Optional: Technical explanation of WHY this happens -->
[Explanation]

**Prevention:**
<!-- Optional: How to avoid this in the future -->
[Prevention tips]

---

## Example Entry:

---

### Invalid Semver Error on Startup

**Symptoms:** 
- Dev server starts but app won't load in browser
- Console error: `Uncaught Error: Invalid argument not valid semver ('' received)`
- React app shows white screen

**Solutions:**
```bash
# Clean install dependencies
cd collabcanvas
rm -rf node_modules package-lock.json
npm install
npm run dev

# Hard refresh browser
# Chrome/Edge: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
# Firefox: Cmd+Shift+Delete (Mac) or Ctrl+Shift+Delete (Windows)
```

**Check:**
- Navigate to http://localhost:5173
- App loads successfully
- No console errors

**Root Cause:**
Firebase SDK version conflict with cached build artifacts. Old build contained empty version string that failed semver validation.

**Prevention:**
- Clear browser cache when updating dependencies
- Run clean install after pulling dependency changes
- Delete `node_modules` if seeing version-related errors

---

