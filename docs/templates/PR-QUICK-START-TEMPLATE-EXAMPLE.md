# PR #3: Cursor Sync + Presence - Quick Start

## Prerequisites
Firebase emulators and Node.js installed

## Setup

```bash
# Terminal 1
cd collabcanvas && firebase emulators:start

# Terminal 2
cd collabcanvas && npm run dev
```

## Test

**Browser 1 (Incognito):**
1. Go to `http://localhost:5173`
2. Sign up as "Alice"
3. Move mouse around canvas

**Browser 2 (Normal):**
1. Go to `http://localhost:5173`
2. Sign up as "Bob"
3. Move mouse around canvas

## Expected Result

- ✅ Alice sees Bob's cursor moving in real-time (<50ms lag)
- ✅ Bob sees Alice's cursor moving in real-time
- ✅ Each cursor has a different color
- ✅ Username labels appear next to cursors
- ✅ Presence list shows "2 online" in both browsers
- ✅ Cursors disappear when mouse leaves canvas bounds

