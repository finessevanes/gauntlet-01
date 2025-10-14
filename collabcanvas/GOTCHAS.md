# Gotchas & Lessons Learned

Critical insights, edge cases, and lessons learned during CollabCanvas MVP development. **Read this before making changes to save hours of debugging.**

---

## 🎯 Most Important Gotchas

### 1. Canvas Bounds Enforcement for Cursors

**Issue:** Cursors were appearing in the gray background area outside the canvas, causing confusion.

**Symptoms:**
- Cursors visible everywhere on screen
- Cursor positions not aligning with canvas
- Strange cursor behavior when panning

**Root Cause:**
By default, Konva tracks mouse everywhere in the stage, including outside the defined canvas area (5000×5000).

**Solution:**
Only send cursor updates when within canvas bounds:

```typescript
// In useCursors.ts
const handleMouseMove = (e: any) => {
  const stage = e.target.getStage();
  const pointerPosition = stage.getPointerPosition();
  const transform = stage.getAbsoluteTransform().copy();
  transform.invert();
  const canvasPos = transform.point(pointerPosition);
  
  // CRITICAL: Check bounds before sending update
  const CANVAS_WIDTH = 5000;
  const CANVAS_HEIGHT = 5000;
  
  if (
    canvasPos.x >= 0 && 
    canvasPos.x <= CANVAS_WIDTH && 
    canvasPos.y >= 0 && 
    canvasPos.y <= CANVAS_HEIGHT
  ) {
    // Only update if within bounds
    cursorService.updateCursorPosition(userId, canvasPos.x, canvasPos.y, username, color);
  } else {
    // Remove cursor when outside
    cursorService.removeCursor(userId);
  }
};
```

**Prevention:**
- Always check canvas bounds for cursor updates
- Use constants for canvas dimensions
- Test cursor behavior at edges

**Impact:** High - Solved major UX confusion

---

### 2. Coordinate Transformation with Pan/Zoom

**Issue:** Cursor positions and click events were wrong when canvas was panned or zoomed.

**Symptoms:**
- Cursors appear in wrong position
- Clicking shapes doesn't select them
- Shapes created in wrong location
- Gets worse as you pan/zoom more

**Root Cause:**
Mouse events give screen coordinates, but canvas is transformed (panned/zoomed). Need to transform coordinates back to canvas space.

**Solution:**
Use Konva's transform matrix to convert coordinates:

```typescript
// Get screen coordinates
const pointerPosition = stage.getPointerPosition();

// Get inverse transform (accounts for pan and zoom)
const transform = stage.getAbsoluteTransform().copy();
transform.invert();

// Convert to canvas coordinates
const canvasPosition = transform.point(pointerPosition);

// Now canvasPosition.x and canvasPosition.y are correct!
```

**Critical Pattern:**
```typescript
// ❌ WRONG: Using screen coordinates directly
const x = e.clientX;
const y = e.clientY;

// ✅ CORRECT: Transform to canvas coordinates
const stage = e.target.getStage();
const pointer = stage.getPointerPosition();
const transform = stage.getAbsoluteTransform().copy();
transform.invert();
const canvasPos = transform.point(pointer);
```

**Where This Matters:**
- Cursor position updates
- Shape creation (click-and-drag)
- Shape selection (click detection)
- Any canvas interaction

**Prevention:**
- Always use `stage.getAbsoluteTransform()` for coordinate conversion
- Never use raw `e.clientX/clientY` for canvas interactions
- Test at different zoom levels and pan positions

**Impact:** Critical - Nothing works correctly without this

---

### 3. RTDB onDisconnect Pattern

**Issue:** Users who closed their browser left "ghost" cursors and stayed "online" forever.

**Symptoms:**
- Cursors remain after user closes browser
- Presence list shows users as online when they're not
- Stale data accumulates in RTDB

**Root Cause:**
RTDB doesn't automatically clean up data when client disconnects. Need to use `onDisconnect()` API.

**Solution:**
Set up disconnect handlers on login:

```typescript
// In presenceService.ts
async setOnline(userId: string, username: string, color: string) {
  const presenceRef = ref(database, `/sessions/main/users/${userId}/presence`);
  
  // Set online
  await set(presenceRef, {
    online: true,
    lastSeen: Date.now(),
    username,
    color
  });
  
  // CRITICAL: Set up auto-cleanup on disconnect
  await onDisconnect(presenceRef).set({
    online: false,
    lastSeen: Date.now(),
    username,
    color
  });
}
```

**Pattern for Cursor Cleanup:**
```typescript
const cursorRef = ref(database, `/sessions/main/users/${userId}/cursor`);
await onDisconnect(cursorRef).remove(); // Remove cursor on disconnect
```

**Gotcha:** Cancel disconnect handlers on manual logout:
```typescript
async cancelDisconnectHandler(userId: string) {
  const presenceRef = ref(database, `/sessions/main/users/${userId}/presence`);
  await onDisconnect(presenceRef).cancel();
}
```

**Prevention:**
- Always set `onDisconnect()` when writing to RTDB
- Test by closing browser (not just logout)
- Check RTDB Emulator UI to verify cleanup

**Impact:** High - Critical for multiplayer experience

---

### 4. Throttling Cursor Updates

**Issue:** Sending cursor updates on every mouse move (60+ times/sec) overwhelmed RTDB and caused lag.

**Symptoms:**
- High RTDB write count
- Lag in cursor movement
- Firebase quota warnings
- Poor performance with 3+ users

**Root Cause:**
Mouse move events fire 60-100 times per second, but RTDB and network can't handle that many writes efficiently.

**Solution:**
Throttle cursor updates to 30 FPS (33ms interval):

```typescript
import { throttle } from 'lodash';

// In useCursors.ts
const throttledUpdate = useRef(
  throttle((x: number, y: number) => {
    cursorService.updateCursorPosition(userId, x, y, username, color);
  }, 33) // 30 FPS - sweet spot
);
```

**Critical:** Store throttled function in `useRef` to persist across renders and properly clean up:

```typescript
useEffect(() => {
  return () => {
    // Cleanup: Cancel pending throttled calls
    throttledUpdate.current.cancel();
  };
}, []);
```

**Why 30 FPS?**
- Human eye can't distinguish >30 FPS for cursor movement
- Reduces RTDB writes by 50-80%
- Smooth enough for good UX
- Low enough for network efficiency

**Don't Throttle:**
- Click events (need immediate response)
- Drag end events (need precise final position)
- Lock acquisition (need immediate response)

**Prevention:**
- Always throttle high-frequency updates
- Use `useRef` for throttled functions in React
- Test with multiple users to verify smooth movement

**Impact:** High - Prevents performance degradation

---

## 🔥 Firebase / Sync Issues

### 5. Invalid Semver Error on Startup

**Issue:** App loads white screen with console error about invalid semver.

**Symptoms:**
- Dev server starts successfully
- Browser shows white screen
- Console error: `Uncaught Error: Invalid argument not valid semver ('' received)`
- Error in `backendManager.js` or Firebase SDK

**Root Cause:**
Firebase SDK version conflict with cached build artifacts. Old build had empty version string that failed validation.

**Solution:**
```bash
# Clean install dependencies
cd collabcanvas
rm -rf node_modules package-lock.json
npm install
npm run dev

# Hard refresh browser (clear cache)
# Chrome/Edge: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

**Prevention:**
- Clear browser cache when updating Firebase SDK
- Run clean install after pulling dependency changes
- Add `node_modules/` to `.gitignore`

**Impact:** Medium - Blocks development until fixed

---

### 6. Firestore Listener Memory Leaks

**Issue:** App slows down over time, memory usage increases, eventually crashes.

**Symptoms:**
- App works fine initially
- Gets slower after 5-10 minutes
- Browser tab memory grows continuously
- Multiple browser tabs crash

**Root Cause:**
Firestore `onSnapshot` listeners not being unsubscribed when component unmounts.

**Solution:**
Always return unsubscribe function from useEffect:

```typescript
useEffect(() => {
  // Subscribe to Firestore
  const unsubscribe = onSnapshot(
    collection(firestore, 'canvases/main/shapes'),
    (snapshot) => {
      // Handle updates
    }
  );
  
  // CRITICAL: Unsubscribe on cleanup
  return () => {
    unsubscribe();
  };
}, []);
```

**Same Pattern for RTDB:**
```typescript
useEffect(() => {
  const dbRef = ref(database, '/sessions/main/users');
  const unsubscribe = onValue(dbRef, (snapshot) => {
    // Handle updates
  });
  
  return () => {
    off(dbRef, 'value', unsubscribe);
  };
}, []);
```

**Prevention:**
- Always unsubscribe from listeners in cleanup
- Use React DevTools to check for component leaks
- Monitor memory usage during development

**Impact:** Critical - Causes crashes if not fixed

---

### 7. Lock Race Conditions

**Issue:** Two users click shape simultaneously, both think they have the lock.

**Symptoms:**
- Both users see green border (locked by me)
- Both users can drag the shape
- Conflicting position updates
- Shape "jumps" between positions

**Root Cause:**
Non-transactional lock acquisition. If two users click within ~50ms, both writes succeed (last write wins).

**Current Solution (MVP):**
Documented as known limitation. Acceptable because:
- Rare with 2-5 users (<1% of lock attempts)
- Window is only ~50ms
- UX is still reasonable (one user "wins")

**Proper Solution (Post-MVP):**
Use Firestore transactions:

```typescript
async lockShape(shapeId: string, userId: string): Promise<boolean> {
  const shapeRef = doc(firestore, `canvases/main/shapes/${shapeId}`);
  
  try {
    await runTransaction(firestore, async (transaction) => {
      const shapeDoc = await transaction.get(shapeRef);
      
      if (!shapeDoc.exists()) {
        throw new Error('Shape does not exist');
      }
      
      const data = shapeDoc.data();
      const now = Date.now();
      const lockAge = data.lockedAt ? now - data.lockedAt.toMillis() : Infinity;
      
      // Check if locked by someone else within 5s
      if (data.lockedBy && data.lockedBy !== userId && lockAge < 5000) {
        throw new Error('Shape already locked');
      }
      
      // Acquire lock
      transaction.update(shapeRef, {
        lockedBy: userId,
        lockedAt: serverTimestamp()
      });
    });
    
    return true;
  } catch (error) {
    return false;
  }
}
```

**Trade-offs:**
- MVP: Fast implementation, rare edge case
- Transactions: Atomic but +2 hours implementation, slightly higher latency

**Prevention:**
- Document race conditions clearly
- Consider transactions for production if lock contention is high
- Add logging to measure actual race condition frequency

**Impact:** Low for MVP (rare), but worth fixing post-MVP

---

### 8. ServerTimestamp vs Client Timestamp

**Issue:** Lock timeouts not working correctly, locks expired too early or too late.

**Symptoms:**
- Locks expire before 5 seconds
- Locks persist beyond 5 seconds
- Inconsistent timeout behavior

**Root Cause:**
Client and server clocks can differ by seconds. Using `Date.now()` on client leads to incorrect age calculations.

**Solution:**
Always use `serverTimestamp()` for Firestore:

```typescript
// ❌ WRONG: Client timestamp
await updateDoc(shapeRef, {
  lockedAt: Date.now() // Client clock
});

// ✅ CORRECT: Server timestamp
await updateDoc(shapeRef, {
  lockedAt: serverTimestamp() // Server clock
});
```

**Pattern for Age Calculation:**
```typescript
// When checking lock age
const shapeDoc = await getDoc(shapeRef);
const data = shapeDoc.data();

if (data.lockedAt) {
  const lockAge = Date.now() - data.lockedAt.toMillis(); // toMillis() gives server time
  
  if (lockAge < 5000) {
    // Lock is fresh
  }
}
```

**Prevention:**
- Use `serverTimestamp()` for all persistent timestamps
- Use `Date.now()` only for local UI timing
- Test with system clock changes to verify

**Impact:** Medium - Affects lock reliability

---

## 🎨 Canvas / Rendering Issues

### 9. Negative Drag Values (Click-and-Drag)

**Issue:** When user drags left or up (negative direction), shapes appear in wrong position or don't appear.

**Symptoms:**
- Dragging right/down works fine
- Dragging left/up creates no shape or weirdly positioned shape
- Preview rectangle flickers or disappears

**Root Cause:**
Konva expects positive width/height values. Negative drags produce negative dimensions.

**Solution:**
Use `Math.abs()` and adjust position:

```typescript
const handleMouseUp = () => {
  const startX = drawStart.x;
  const startY = drawStart.y;
  const endX = currentPointer.x;
  const endY = currentPointer.y;
  
  // Calculate actual position (top-left corner)
  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  
  // Calculate dimensions (always positive)
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);
  
  canvasService.createShape({ x, y, width, height, ... });
};
```

**Pattern:**
- Use `Math.min()` for position (top-left corner)
- Use `Math.abs()` for dimensions (width/height)
- Test all 4 drag directions: ↗ ↖ ↙ ↘

**Prevention:**
- Always handle negative drags
- Test drag in all directions during development
- Add minimum size check (prevent 1px×1px shapes from accidental clicks)

**Impact:** High - Core feature doesn't work without this

---

### 10. Konva Layer Listening Performance

**Issue:** Canvas FPS drops with 5+ users, especially when moving mouse.

**Symptoms:**
- Smooth with 1-2 users
- Laggy with 5+ users
- FPS drops from 60 to 30-40
- Mouse movement feels sluggish

**Root Cause:**
By default, Konva layers listen for events. CursorLayer doesn't need to listen (cursors are display-only) but was processing events anyway.

**Solution:**
Disable listening on display-only layers:

```typescript
// In CursorLayer.tsx
<Layer listening={false}>
  {Object.entries(cursors).map(([userId, cursor]) => (
    <Cursor key={userId} {...cursor} />
  ))}
</Layer>
```

**Other Performance Tips:**
```typescript
// Disable perfect drawing (faster rendering)
<Rect perfectDrawEnabled={false} />

// Disable shadow when not needed
<Rect shadowEnabled={false} />

// Cache complex shapes
<Group cache={true}>
  {/* Complex shapes */}
</Group>
```

**Prevention:**
- Set `listening={false}` on non-interactive layers
- Use `perfectDrawEnabled={false}` for simple shapes
- Profile with DevTools to find bottlenecks

**Impact:** Medium - Improves performance with many users

---

### 11. Shape Selection Z-Index Issues

**Issue:** Clicking on overlapping shapes selects wrong shape.

**Symptoms:**
- Click on top shape, bottom shape gets selected
- Can't select shape that's underneath another
- Selection feels random

**Root Cause:**
Konva selects shapes based on event propagation order, not visual z-index.

**Solution:**
Event handlers already work correctly if shapes are in correct layer order. To control selection explicitly:

```typescript
// In Canvas.tsx
const handleShapeClick = (e: any) => {
  e.cancelBubble = true; // Stop propagation
  const shapeId = e.target.attrs.id;
  // Handle selection
};
```

**For Complex Scenarios:**
```typescript
// Get all shapes at click position, select topmost
const stage = e.target.getStage();
const pos = stage.getPointerPosition();
const shapes = stage.getIntersection(pos);
// shapes is topmost shape
```

**Prevention:**
- Test with overlapping shapes
- Use `e.cancelBubble = true` to prevent propagation
- Consider disabling multi-layer selection for MVP

**Impact:** Low for MVP (few overlapping shapes)

---

## 🧪 Testing Issues

### 12. Multi-Browser Testing Authentication

**Issue:** Can't test multi-user scenarios because all browsers share login state.

**Symptoms:**
- Signing in on one browser signs in on others
- Can't have multiple users simultaneously
- Presence list always shows same user

**Root Cause:**
Browsers share cookies/storage for same domain. Need isolation.

**Solution:**
Use different browser profiles/modes:

1. **Incognito Window** (Chrome/Edge: `Cmd+Shift+N`)
   - Completely isolated storage
   - Perfect for User A

2. **Normal Window**
   - Regular browsing session
   - Perfect for User B

3. **Different Browser** (Firefox, Safari)
   - Separate browser, separate storage
   - Perfect for User C

**Advanced:**
Create Chrome profiles (Settings → Users → Add user) for permanent test users.

**Prevention:**
- Always use incognito for multi-user testing
- Document this in testing guides
- Consider multi-profile setup for frequent testing

**Impact:** Critical - Can't test multiplayer without this

---

### 13. Emulator Data Persistence Between Tests

**Issue:** Previous test data interferes with current test, causing false failures.

**Symptoms:**
- Tests pass in isolation but fail together
- Unexpected users in presence list
- Shapes from previous tests exist
- "User already exists" errors

**Root Cause:**
Firebase emulators persist data during session. Need to clear between tests.

**Solution:**
Restart emulators to clear data:

```bash
# Stop emulators (Ctrl+C)
firebase emulators:start
```

**Or use Emulator UI:**
- Go to http://localhost:4000
- Navigate to Firestore or RTDB
- Delete collections/paths manually

**For Automated Tests:**
```typescript
// In test setup
import { clearFirestoreData } from '@firebase/testing';

beforeEach(async () => {
  await clearFirestoreData({ projectId: 'demo-project' });
});
```

**Prevention:**
- Clear emulator data between test sessions
- Use unique user IDs in tests (timestamps)
- Document data cleanup in test plans

**Impact:** Medium - Causes confusing test failures

---

## 🔧 Build / Dependency Issues

### 14. TypeScript Strict Mode Errors

**Issue:** Build fails with TypeScript errors about implicit any types.

**Symptoms:**
- `npm run build` fails
- Errors like "Parameter implicitly has 'any' type"
- Linter shows red underlines

**Root Cause:**
Project uses TypeScript strict mode. All types must be explicit.

**Solution:**
Add type annotations:

```typescript
// ❌ WRONG: Implicit any
function handleClick(e) {
  // ...
}

// ✅ CORRECT: Explicit type
function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
  // ...
}

// ❌ WRONG: Implicit any in array
const users = [];

// ✅ CORRECT: Explicit type
const users: User[] = [];
```

**Common Konva Event Types:**
```typescript
import type { KonvaEventObject } from 'konva/lib/Node';

const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
  // ...
};
```

**Prevention:**
- Enable TypeScript checking in editor
- Run `npx tsc --noEmit` before committing
- Use `any` sparingly and document why

**Impact:** Medium - Blocks builds until fixed

---

### 15. Lodash Imports

**Issue:** Import errors or bundle size issues with lodash.

**Symptoms:**
- `import { throttle } from 'lodash'` doesn't work
- Huge bundle size
- Build warnings about tree-shaking

**Solution:**
Use per-method imports:

```typescript
// ❌ WRONG: Imports entire library
import { throttle } from 'lodash';

// ✅ CORRECT: Imports only what you need
import throttle from 'lodash/throttle';
```

**Or install specific package:**
```bash
npm install lodash.throttle
```

```typescript
import throttle from 'lodash.throttle';
```

**Prevention:**
- Use per-method imports for lodash
- Check bundle size with `npm run build -- --report`
- Consider native alternatives for simple utilities

**Impact:** Low - Bundle size optimization

---

## 🚀 Deployment Issues

### 16. Firebase Auth Authorized Domains

**Issue:** Authentication works locally but fails in production.

**Symptoms:**
- Signup/login works on localhost
- Fails on Vercel domain
- Error: "auth/unauthorized-domain"

**Root Cause:**
Firebase Auth only allows requests from authorized domains. Vercel domain not added.

**Solution:**
Add Vercel domain to Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Click **Add domain**
5. Add your Vercel domain (e.g., `your-app.vercel.app`)
6. Save

**Prevention:**
- Add domains immediately after deployment
- Document in deployment guide
- Test production auth before announcing launch

**Impact:** Critical - Blocks all authentication in production

---

### 17. Environment Variables in Vercel

**Issue:** App loads but Firebase connection fails in production.

**Symptoms:**
- Build succeeds
- App loads with blank screen
- Console error: "Firebase config is invalid"
- Environment variables undefined

**Root Cause:**
Environment variables not set in Vercel dashboard.

**Solution:**
Set environment variables in Vercel:

1. Go to Vercel Dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add all `VITE_FIREBASE_*` variables
5. Redeploy

**Critical:** Use `VITE_` prefix for client-side variables in Vite.

**Prevention:**
- Set environment variables before first deploy
- Document required variables in README
- Use `.env.example` as reference

**Impact:** Critical - App doesn't work without Firebase config

---

## 📝 Code Quality Issues

### 18. React Hook Dependencies

**Issue:** Warnings about missing dependencies in useEffect.

**Symptoms:**
- Linter warnings
- Stale closure bugs
- Unexpected behavior after prop/state changes

**Root Cause:**
Hook depends on values not listed in dependency array.

**Solution:**
Add all dependencies or use functional updates:

```typescript
// ❌ WRONG: Missing dependency
useEffect(() => {
  doSomethingWith(userId);
}, []); // userId is missing!

// ✅ CORRECT: Include dependency
useEffect(() => {
  doSomethingWith(userId);
}, [userId]);

// ✅ CORRECT: Functional update
const increment = () => {
  setCount(prevCount => prevCount + 1); // No dependency needed
};
```

**For Functions in Dependencies:**
```typescript
// Wrap in useCallback to stabilize reference
const handleClick = useCallback(() => {
  doSomethingWith(userId);
}, [userId]);

useEffect(() => {
  // handleClick is stable now
}, [handleClick]);
```

**Prevention:**
- Enable exhaustive-deps lint rule
- Review all useEffect dependencies
- Use `useCallback` for function dependencies

**Impact:** Medium - Causes subtle bugs

---

## 🎓 General Lessons Learned

### 19. Test Plans Before Code

**Lesson:** Writing test plan before implementation caught 60-80% of edge cases before coding.

**Example:** PR #3 test plan revealed:
- Canvas bounds issue (cursors in gray area)
- Coordinate transformation with pan/zoom
- Disconnect cleanup requirement

**Result:** Zero bugs in production, all tests passed first try.

**Pattern:**
1. Write test plan with explicit scenarios
2. Review test plan for completeness
3. Implement to pass test plan
4. Run tests

**Impact:** Saved 2-4 hours per PR

---

### 20. Document Gotchas Immediately

**Lesson:** Documenting bugs immediately after fixing saves hours later.

**Example:** Semver bug hit 3 times during development. First time: 1 hour debugging. Documented solution. Second time: 30 seconds to fix (searched docs). Third time: Didn't happen (prevention documented).

**Pattern:**
1. Hit bug
2. Fix bug
3. **Immediately** document in GOTCHAS.md or TROUBLESHOOTING.md
4. Include: symptoms, root cause, solution, prevention

**Impact:** Saved 3-4 hours total

---

### 21. Multi-Browser Testing Early

**Lesson:** Testing with multiple browsers from start catches sync issues early.

**Example:** Cursor sync looked perfect with 1 browser. With 2 browsers, discovered coordinate transformation bug. Would have been much harder to debug later.

**Pattern:**
- Test with 2+ browsers from first implementation
- Don't wait until "feature complete"
- Use incognito windows for isolation

**Impact:** Caught issues 50% faster

---

### 22. Service Layer Pays Off

**Lesson:** Extra hour setting up service layer saved 4+ hours in testing and debugging.

**Benefits:**
- Testable with emulators
- Consistent API
- Easy to mock
- AI-ready for Phase 2

**Cost:** +1 hour initial setup  
**Saved:** 4+ hours in testing, easier AI integration

**Pattern:**
- Create service class for each domain (auth, canvas, cursor)
- Services own all Firebase logic
- Components call services through context/hooks

**Impact:** High - Architectural win

---

## 🔍 How to Use This Document

### Debugging Workflow

1. **Search for symptoms:**
   ```bash
   # Search this file
   grep -i "your error message" GOTCHAS.md
   ```

2. **Check related section:**
   - Firebase issues → Firebase / Sync section
   - Canvas issues → Canvas / Rendering section
   - etc.

3. **Apply solution:**
   - Follow code examples exactly
   - Test with documented scenarios
   - Document if you find new gotchas!

### Before Making Changes

1. **Read relevant section**
   - Changing cursors? → Read cursor gotchas
   - Adding shapes? → Read canvas gotchas

2. **Check for edge cases**
   - Coordinate transformation needed?
   - Cleanup listeners?
   - Handle negative values?

3. **Prevent issues**
   - Follow documented patterns
   - Test scenarios mentioned here

### Adding New Gotchas

When you encounter a new gotcha:

1. **Document immediately** (while fresh in memory)
2. **Use this format:**
   - **Issue:** What went wrong
   - **Symptoms:** What you saw
   - **Root Cause:** Why it happened
   - **Solution:** How to fix (with code)
   - **Prevention:** How to avoid
   - **Impact:** How critical is this

3. **Add to appropriate section**

---

## 📚 Related Documentation

- **Setup:** `SETUP.md` - Troubleshooting specific setup issues
- **Architecture:** `ARCHITECTURE.md` - Technical decisions explained
- **Testing:** Test files show patterns in practice
- **Archive:** `docs/archive/` - Historical context for decisions

---

Built during CollabCanvas MVP (October 2025)  
19 gotchas documented, countless hours saved 🚀

**Remember:** The best gotcha is the one you read about instead of experiencing!

