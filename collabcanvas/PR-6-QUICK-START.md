# PR #6: Rules, Testing, and Polish - Quick Start

## 🚀 Quick Start Guide

This guide helps you run tests, verify security rules, and validate the polish enhancements added in PR #6.

---

## Prerequisites

Ensure you have completed PR #0-5 setup:

```bash
cd collabcanvas
npm install
```

---

## Running Tests

### 1. Run All Tests (One-Time)

```bash
npm run test:run
```

**Expected Output**:
```
✓ tests/integration/auth-flow.test.ts (13 tests)
✓ tests/unit/services/authService.test.ts (2 tests)
✓ tests/unit/services/presenceCursor.test.ts (8 tests)
✓ tests/unit/services/canvasService.test.ts (7 tests)
✓ tests/integration/cursor-presence.test.ts (18 tests)
✓ tests/integration/shapes-locking.test.ts (29 tests)
✓ tests/unit/utils/helpers.test.ts (6 tests)

Test Files  7 passed (7)
     Tests  83 passed (83)
  Duration  1.47s
```

### 2. Run Tests in Watch Mode (Development)

```bash
npm run test
```

- Tests re-run automatically when you change files
- Great for TDD (Test-Driven Development)
- Press `q` to quit

### 3. Run Tests with UI

```bash
npm run test:ui
```

- Opens browser-based test UI
- Visual test results
- Filter and search tests
- View test details and coverage

### 4. Run Tests with Coverage

```bash
npm run test:coverage
```

- Generates coverage report
- Shows which lines are tested
- Creates `coverage/` directory with HTML report

### 5. Run Specific Test File

```bash
npm run test tests/unit/utils/helpers.test.ts
```

---

## Verifying Security Rules

### 1. Check Firestore Rules

```bash
cat firestore.rules
```

**Verify**:
- ✅ Users can only write their own profile
- ✅ Shapes validate `createdBy` on creation
- ✅ All authenticated users can read/update shapes

### 2. Check RTDB Rules

```bash
cat database.rules.json
```

**Verify**:
- ✅ Users can only write to their own cursor/presence node
- ✅ All authenticated users can read cursor/presence data

### 3. Test Rules with Emulators

```bash
# Terminal 1: Start emulators
firebase emulators:start

# Terminal 2: Start dev server
npm run dev

# Terminal 3: Run tests
npm run test:run
```

---

## Testing Error Boundary

The ErrorBoundary component catches React errors and prevents crashes.

### Manual Test

1. **Start the app**:
   ```bash
   npm run dev
   ```

2. **Trigger an error** (optional dev test):
   - Temporarily throw an error in a component
   - Verify ErrorBoundary catches it
   - See user-friendly error UI

3. **Test retry functionality**:
   - Click "Try Again" button
   - Click "Reload Page" button
   - Verify both work correctly

---

## Verifying Loading States

### 1. Auth Loading State

**Location**: `src/App.tsx`

**Test**:
1. Open app in incognito mode
2. Should see loading spinner while checking auth
3. Should transition smoothly to login screen

**Expected**:
```
Loading...
↓
Login/Signup Screen
```

### 2. Shapes Loading State

**Location**: `src/contexts/CanvasContext.tsx`

**Test**:
1. Log in to app
2. Canvas should wait for shapes to load
3. Shapes appear smoothly (not all at once with flash)

**Expected**:
```
Canvas renders
↓
Shapes loading from Firestore
↓
Shapes appear smoothly
```

---

## Console Output Verification

### Expected Console Messages

**Good Logs** (with emojis):
```
🔧 Firebase config loaded
✅ Shape created: shape-123
🔒 Shape locked: shape-123 by: user-abc
🔓 Shape unlocked: shape-123
📊 Received 5 shape(s) from Firestore
🧪 Test suite starting...
✅ Test suite completed
```

**No Error Messages**:
- ❌ No unhandled promise rejections
- ❌ No undefined variable errors
- ❌ No missing dependency warnings

### Check Console

```bash
# Start dev server
npm run dev

# Open http://localhost:5173
# Open browser DevTools (F12)
# Check Console tab
# Verify: Clean output with only structured logs
```

---

## Testing Multi-User Scenarios

### Setup

```bash
# Terminal 1: Emulators
firebase emulators:start

# Terminal 2: Dev Server
npm run dev
```

### Test Cases

#### 1. Two Users See Each Other
1. Open `http://localhost:5173` in Chrome
2. Sign up as User A
3. Open `http://localhost:5173` in Firefox (or Incognito)
4. Sign up as User B
5. **Verify**: Both users see each other in presence list
6. **Verify**: Both users see each other's cursors

#### 2. Shape Creation Sync
1. User A creates a blue rectangle
2. **Verify**: User B sees it appear within <100ms
3. User B creates a red rectangle
4. **Verify**: User A sees it appear within <100ms

#### 3. Locking Mechanism
1. User A clicks a shape (not drag)
2. **Verify**: User A sees green border
3. **Verify**: User B sees red border + lock icon
4. User B tries to click the shape
5. **Verify**: User B sees toast: "Shape locked by [User A]"
6. User A clicks background (deselect)
7. **Verify**: User B can now lock the shape

#### 4. Lock Timeout
1. User A locks a shape
2. Wait 6 seconds (do nothing)
3. **Verify**: Lock auto-releases
4. User B can now lock the shape

#### 5. Disconnect Cleanup
1. User A locks a shape
2. User A closes browser
3. **Verify**: User B sees presence list update (User A offline)
4. **Verify**: Lock releases automatically
5. User B can lock the shape

---

## Performance Validation

### 1. Cursor FPS Test

**Target**: 20-30 FPS (33-50ms updates)

**Test**:
1. Open two browsers
2. Move cursor rapidly in one browser
3. Watch cursor in other browser
4. **Verify**: Smooth movement, no jank

**Check Console**:
```
Cursor updates should be ~33ms apart
```

### 2. Shape Sync Latency

**Target**: <100ms

**Test**:
1. User A creates shape
2. Note timestamp in console
3. User B receives shape
4. Note timestamp in console
5. **Verify**: Difference <100ms

### 3. Lock Acquisition

**Target**: <100ms

**Test**:
1. User A clicks shape
2. Note timestamp
3. User B sees red border
4. Note timestamp
5. **Verify**: Difference <100ms

---

## Test File Structure

```
tests/
├── setup.ts                          # Global test setup
├── unit/
│   ├── services/
│   │   ├── authService.test.ts       # 2 tests
│   │   ├── canvasService.test.ts     # 7 tests
│   │   └── presenceCursor.test.ts    # 8 tests
│   └── utils/
│       └── helpers.test.ts           # 6 tests
└── integration/
    ├── auth-flow.test.ts             # 13 tests
    ├── cursor-presence.test.ts       # 18 tests
    └── shapes-locking.test.ts        # 29 tests
```

**Total**: 83 tests

---

## Common Issues & Solutions

### Issue: Tests fail with Firebase errors

**Solution**:
```bash
# Make sure emulators are NOT running during tests
# Tests use mock data, not actual Firebase

# If emulators are running, stop them:
# Ctrl+C in emulator terminal

# Then run tests:
npm run test:run
```

### Issue: "Module not found" errors

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm run test:run
```

### Issue: Tests timeout

**Solution**:
```bash
# Increase timeout in vitest config
# Or run specific test file:
npm run test tests/unit/utils/helpers.test.ts
```

### Issue: ErrorBoundary not catching errors

**Solution**:
- Verify ErrorBoundary wraps the component tree in App.tsx
- Check that error is thrown in render, not in event handler
- Event handler errors need try-catch, not ErrorBoundary

---

## Verification Checklist

### Security Rules ✅
- [ ] Firestore rules match PRD
- [ ] RTDB rules match PRD
- [ ] Rules tested with emulators

### Tests ✅
- [ ] All 83 tests passing
- [ ] Unit tests cover services and utils
- [ ] Integration tests cover multi-user scenarios
- [ ] Performance tests validate targets

### Polish ✅
- [ ] ErrorBoundary added to App.tsx
- [ ] Auth loading spinner works
- [ ] Shapes loading state works
- [ ] No console errors
- [ ] Structured logging with emojis

### Manual Testing ✅
- [ ] Two users see each other
- [ ] Shapes sync <100ms
- [ ] Locking works correctly
- [ ] Lock timeout (5s) works
- [ ] Disconnect cleanup works

---

## Next Steps

### Ready for PR #7: Deployment

Once all tests pass and manual verification is complete:

1. **Build for production**:
   ```bash
   npm run build
   ```

2. **Test production build locally**:
   ```bash
   npm run preview
   ```

3. **Deploy to Vercel** (PR #7):
   ```bash
   vercel --prod
   ```

4. **Configure Firebase for production domain**

5. **Test with 5+ concurrent users**

---

## Quick Reference

### Test Commands
```bash
npm run test           # Watch mode
npm run test:run       # One-time run
npm run test:ui        # UI mode
npm run test:coverage  # With coverage
```

### Dev Commands
```bash
npm run dev            # Start dev server
npm run build          # Build for production
npm run preview        # Preview production build
npm run emulators      # Start Firebase emulators
```

### File Locations
```bash
tests/                 # All test files
src/components/ErrorBoundary.tsx
firestore.rules
database.rules.json
vite.config.ts         # Vitest config
```

---

## Support

### Documentation
- **Full Summary**: `PR-6-SUMMARY.md`
- **Test Plan**: `PR-6-TEST-PLAN.md`
- **This Guide**: `PR-6-QUICK-START.md`

### Test Results
- Run `npm run test:run` to see current status
- All 83 tests should pass
- Duration should be <2 seconds

---

## Success Criteria

✅ **All tests passing** (83/83)  
✅ **Security rules validated**  
✅ **ErrorBoundary working**  
✅ **Loading states verified**  
✅ **Clean console output**  
✅ **Multi-user scenarios work**  

**Status**: PR #6 Complete! Ready for PR #7 Deployment! 🚀

