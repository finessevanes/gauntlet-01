# PR-10 Quick Start: Paint-Style UI

**Test the new Microsoft Paint-inspired UI in 2 minutes.**

---

## Prerequisites
- Firebase emulators running
- CollabCanvas dev server running

---

## Setup (30 seconds)

```bash
cd collabcanvas

# Terminal 1: Emulators (if not running)
firebase emulators:start

# Terminal 2: Dev server
npm run dev

# Open browser: http://localhost:5173
```

---

## Visual Verification (30 seconds)

**You should see:**
1. ✅ Blue title bar with "untitled - Paint" at top
2. ✅ Menu bar with File, Edit, View, Image, Options, Help
3. ✅ Tool palette on left side (2-column grid of tools)
4. ✅ Color palette at bottom (2 rows of 14 colors)
5. ✅ Status bar at very bottom
6. ✅ White canvas area with checkerboard pattern outside bounds
7. ✅ Current color displayed in tool palette

---

## Functional Test (1 minute)

### Drawing
1. Click a color in bottom palette (should highlight)
2. Click Rectangle tool in left palette (should show pressed state)
3. Click and drag on canvas → Should create colored rectangle
4. ✅ Drawing works with new UI

### Color Selection
1. Click different colors in palette
2. Tool palette should show selected color in color display
3. Draw new rectangle → Should use new color
4. ✅ Color selection works

### Mode Switching
1. Click Select tool (top-left in tool palette)
2. Cursor should change to grab/hand mode
3. Click and drag canvas → Should pan
4. Click Rectangle tool again
5. ✅ Mode switching works

### Shape Manipulation
1. Switch to Select mode
2. Click existing shape → Should show green border
3. Drag shape → Should move
4. ✅ Shape manipulation works

---

## Multi-User Test (30 seconds)

1. Open incognito window → http://localhost:5173
2. Log in as different user
3. Both users should appear in title bar presence indicators
4. Draw shape in one window → Appears in other
5. ✅ Collaboration features work

---

## Success Criteria

**Visual:**
- [ ] Paint-style window chrome visible
- [ ] Tool palette shows all tools
- [ ] Color palette shows 28 colors
- [ ] Status bar shows canvas info

**Functional:**
- [ ] All drawing features work
- [ ] All colors selectable
- [ ] All modes switchable  
- [ ] All shapes draggable
- [ ] Multi-user sync works

---

## Troubleshooting

**UI looks broken:**
- Check browser console for errors
- Verify all components compiled
- Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)

**Features don't work:**
- Same behavior as before UI change
- Check Firebase emulators running
- Check network tab for connection issues

---

**Total Time:** ~2 minutes  
**Next:** Run full PR-10-TEST-PLAN.md if issues found

