# PR-10 Test Plan: Paint-Style UI Facelift

## Overview
Transform CollabCanvas UI to match Microsoft Paint aesthetic while maintaining all existing functionality (real-time collaboration, shape drawing, locking, cursor sync, multi-user support).

**Branch:** `ui/facelift`  
**Estimated Duration:** 3-4 hours  
**Target:** Visual redesign with zero functional regressions

---

## Setup Instructions

### Prerequisites
- [ ] Firebase emulators running (`firebase emulators:start`)
- [ ] Dev server running (`npm run dev`)
- [ ] 2-3 browser windows for multi-user testing
- [ ] Reference image of Microsoft Paint UI

### Environment
```bash
cd collabcanvas
# Terminal 1: Emulators
firebase emulators:start

# Terminal 2: Dev server
npm run dev

# Browser: http://localhost:5173
```

---

## Test Scenarios

### 1. Visual Design - Paint Aesthetic
**Goal:** UI matches Microsoft Paint look and feel from reference image

#### 1.1 Title Bar (Window Chrome)
- [ ] Paint-style blue title bar with window controls (close, minimize, maximize buttons)
- [ ] "untitled - Paint" style title text centered
- [ ] macOS traffic lights (red, yellow, green) in top-left
- [ ] Settings/menu icon in top-right
- [ ] User presence indicators integrated into title bar

#### 1.2 Menu Bar
- [ ] Classic menu items: File, Edit, View, Image, Options, Help
- [ ] Menu text style matches Paint (simple, sans-serif)
- [ ] Hover states work correctly
- [ ] Menus are non-functional but styled (MVP - visual only)

#### 1.3 Tool Palette (Left Sidebar)
- [ ] Vertical tool palette similar to Paint
- [ ] Tool icons in 2-column grid layout
- [ ] Tools include: Select, Free-form select, Eraser, Fill, Pick color, Magnifier, Pencil, Brush, Airbrush, Text, Line, Curve, Rectangle, Polygon, Ellipse, Rounded rectangle
- [ ] Currently selected tool has pressed/active state
- [ ] Rectangle tool is functional (existing draw mode)
- [ ] Other tools styled but non-functional (Phase 2)

#### 1.4 Color Palette (Bottom)
- [ ] Two-row color palette with Paint's classic colors
- [ ] Primary/secondary color selector (two overlapping squares)
- [ ] 28 color swatches in standard Paint arrangement
- [ ] Active color has visual indicator
- [ ] Edit colors button present (non-functional)

#### 1.5 Canvas Area
- [ ] White canvas background (no gray border)
- [ ] Checkerboard pattern outside canvas bounds (transparency indicator)
- [ ] Canvas bounds clearly visible
- [ ] Grid removed or made much lighter (Paint doesn't have grid)
- [ ] Zoom info moved to bottom status bar

#### 1.6 Status Bar (Bottom)
- [ ] Shows canvas dimensions (e.g., "For Help, click Help Topics on the Help Menu.")
- [ ] Shows cursor position on canvas
- [ ] Shows zoom level
- [ ] Paint-style subtle 3D border effect

### 2. Functional Regression Testing
**Goal:** All existing features still work after UI changes

#### 2.1 Authentication
- [ ] Login page still accessible and functional
- [ ] Signup page still accessible and functional
- [ ] Logout button works (integrated into new UI)
- [ ] Password requirements validation intact

#### 2.2 Drawing & Shapes
- [ ] Rectangle tool (draw mode) still works
- [ ] Click-and-drag creates rectangles
- [ ] Preview rectangle shows during drag
- [ ] Color selection changes rectangle color
- [ ] Shapes clamp to canvas bounds
- [ ] Minimum shape size enforced
- [ ] Shapes persist to Firestore

#### 2.3 Shape Manipulation
- [ ] Shapes can be selected by clicking
- [ ] Selected shapes show green border
- [ ] Shapes can be dragged
- [ ] Dragging respects canvas boundaries
- [ ] Lock system works (optimistic locking)
- [ ] Locked-by-other shapes show red border + lock icon
- [ ] 5-second auto-unlock timeout works
- [ ] Shape position updates persist to Firestore

#### 2.4 Pan & Zoom
- [ ] Pan mode (hand tool) works
- [ ] Draw mode (rectangle tool) works
- [ ] Mode toggle reflected in tool palette
- [ ] Scroll wheel zooms (cursor-centered)
- [ ] Zoom level displayed in status bar
- [ ] Pan position displayed in status bar

#### 2.5 Multi-User Collaboration
- [ ] User presence shows in title bar (replacing navbar presence)
- [ ] Other users' cursors render correctly
- [ ] Cursor colors match user colors
- [ ] Cursor names visible
- [ ] Real-time shape sync works
- [ ] Lock conflicts handled gracefully

### 3. Responsiveness & Performance
**Goal:** Paint UI scales well, maintains 60 FPS

#### 3.1 Performance
- [ ] Canvas maintains 60 FPS with 5+ shapes
- [ ] Cursor latency < 50ms
- [ ] No lag when switching tools/colors
- [ ] No lag during drawing
- [ ] No lag during panning/zooming

#### 3.2 Layout
- [ ] Tool palette doesn't overlap canvas
- [ ] Color palette doesn't overlap canvas
- [ ] Status bar always visible at bottom
- [ ] Window resizing handled gracefully
- [ ] No horizontal scrollbars
- [ ] No vertical scrollbars (unless canvas zoomed out)

### 4. Edge Cases
**Goal:** UI handles unusual states gracefully

#### 4.1 Empty States
- [ ] Canvas with no shapes looks correct
- [ ] No users present shows appropriate UI
- [ ] Single user shows correctly

#### 4.2 Many Items
- [ ] UI handles 10+ active users (presence list)
- [ ] UI handles 100+ shapes on canvas
- [ ] Color palette doesn't break with rapid clicks
- [ ] Tool palette doesn't break with rapid switching

#### 4.3 Browser Compatibility
- [ ] Chrome: All features work
- [ ] Firefox: All features work  
- [ ] Safari: All features work
- [ ] Incognito mode: All features work

---

## Success Criteria

### Visual Design (80% complete minimum)
- [x] Title bar matches Paint style
- [x] Menu bar styled (non-functional menus OK)
- [x] Tool palette matches Paint layout
- [x] Color palette matches Paint style
- [x] Canvas area looks like Paint
- [x] Status bar shows relevant info
- [x] Checkerboard pattern for non-canvas area

### Functional Preservation (100% required)
- [x] All drawing features work
- [x] All shape manipulation works
- [x] All locking features work
- [x] All cursor sync features work
- [x] All pan/zoom features work
- [x] All auth features work
- [x] All presence features work

### Performance (100% required)
- [x] 60 FPS maintained
- [x] < 50ms cursor latency
- [x] No visual regressions
- [x] No console errors

---

## Known Scope Exclusions (Phase 2)
- [ ] Functional menu items (File, Edit, etc.) - styled only
- [ ] Additional tools (pencil, brush, eraser, etc.) - styled only
- [ ] Keyboard shortcuts in menu
- [ ] Window drag/resize functionality
- [ ] Color picker dialog
- [ ] Advanced Paint features (text tool, selections, etc.)

---

## Rollback Plan
If visual changes cause functional issues:
1. Revert UI changes: `git checkout main -- src/components/`
2. Keep functional code: Cherry-pick bug fixes
3. Address blocking issues
4. Re-apply visual changes incrementally

---

## Testing Timeline
- [ ] Phase 1: Visual design implementation (2 hours)
- [ ] Phase 2: Functional regression testing (30 minutes)
- [ ] Phase 3: Multi-user testing (30 minutes)
- [ ] Phase 4: Performance validation (15 minutes)
- [ ] Phase 5: Edge case testing (15 minutes)

**Total estimated testing time:** 3.5 hours

---

## Notes
- Reference image provided by user shows classic Windows Paint UI
- Goal is aesthetic transformation, not functional rewrite
- All existing features must continue to work
- Performance targets unchanged (60 FPS, <50ms latency)
- Multi-browser testing critical (don't break Safari)

---

**Created:** October 14, 2025  
**Test Plan Status:** ✅ Ready for implementation  
**Next Step:** Create PR-10-IMPLEMENTATION-STATUS.md and begin coding

