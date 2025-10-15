# PR #2: Canvas Shell + Pan/Zoom + Color Toolbar - Test Plan

## Testing Instructions

### 1. Start the Application
- Dev server should be running at http://localhost:5173
- Firebase emulators should be running (if testing auth persistence)

### 2. Authentication Test
- [x] Login with existing credentials or sign up
- [x] Verify navbar shows username and cursor color
- [x] Verify logout button works

### 3. Canvas Rendering Test
- [x] Canvas should display a 5000×5000px white workspace with grid lines
- [x] Canvas info overlay should show in bottom-left corner:
  - Canvas dimensions: 5000 × 5000px
  - Current zoom percentage
  - Current position (x, y)

### 4. Color Toolbar Test
- [x] Toolbar should appear below the navbar
- [x] Four color buttons should be visible: Red, Blue, Green, Yellow
- [x] Blue should be selected by default (with checkmark and border)
- [x] Clicking each color should:
  - Highlight the selected color with a border
  - Show a checkmark on the selected color
  - Update the selected color in the canvas context

### 5. Pan Functionality Test
- [x] Click and drag anywhere on the canvas background
- [x] Canvas should move smoothly with the mouse
- [x] Position values in the info overlay should update in real-time
- [x] Panning should feel smooth (no lag or stuttering)

### 6. Zoom Functionality Test (Cursor-Centered)
- [x] Hover mouse over different parts of the canvas
- [x] Scroll wheel up to zoom in
- [x] Scroll wheel down to zoom out
- [x] Zoom should center on the cursor position (not the canvas center)
- [x] Zoom percentage should update in the info overlay
- [x] Minimum zoom: 10% (0.1x)
- [x] Maximum zoom: 300% (3x)
- [x] Zooming should feel smooth

### 7. Combined Pan + Zoom Test
- [x] Zoom in to 200%
- [x] Pan around the canvas
- [x] Zoom out to 50%
- [x] Pan to different areas
- [x] Verify smooth performance throughout

### 8. Performance Test (60 FPS Target)
- [ ] Open browser DevTools (F12)
- [ ] Go to Performance tab
- [ ] Start recording
- [ ] Perform rapid panning and zooming for 10 seconds
- [ ] Stop recording
- [ ] Check FPS metrics - should maintain ~60 FPS
- [ ] No significant frame drops or jank

### 9. Edge Cases
- [x] Try to zoom beyond min/max limits (should clamp)
- [x] Pan to extreme positions (should work without issues)
- [x] Resize browser window (canvas should adapt)
- [x] Refresh page (should maintain auth, reset canvas view)

## Expected Results

### Visual Appearance
- Clean, modern UI with white canvas and light gray grid
- Smooth animations and transitions
- Responsive toolbar with clear active states
- Professional color scheme matching the design system

### Performance Metrics
- **Target:** 60 FPS during all interactions
- Pan latency: <16ms (instant response)
- Zoom latency: <16ms (instant response)
- No memory leaks during extended use

### User Experience
- Intuitive pan and zoom controls
- Clear visual feedback for all interactions
- Smooth, native-feeling gestures
- Canvas info provides helpful debugging information

## PR Checklist Verification

Based on task.md requirements:
- [ ] Stage renders at 5000×5000
- [ ] Pan via drag; zoom via wheel centers on cursor
- [ ] Toolbar selects among 4 colors; default Blue
- [ ] 60 FPS during pan/zoom

## Known Limitations (Expected)
- No shapes yet (PR #4 will add shape creation)
- No cursor tracking yet (PR #3 will add real-time cursors)
- No presence list yet (PR #3 will add presence awareness)
- Grid is for visual reference only (not interactive)

## Next Steps After Testing
If all tests pass:
1. Commit changes to branch `feature/canvas-core`
2. Create PR with description and screenshots
3. Move to PR #3: Cursor Sync + Presence

## Troubleshooting

### Canvas not appearing
- Check browser console for errors
- Verify Konva and react-konva are installed
- Check that CanvasContext is wrapping the app

### Pan/Zoom not working
- Ensure Stage `draggable` prop is set to true
- Verify onWheel handler is attached
- Check that stage refs are properly initialized

### Colors not switching
- Verify CanvasContext is providing setSelectedColor
- Check ColorToolbar component is using context correctly
- Confirm DEFAULT_COLOR constant is set to COLORS.BLUE

### Performance issues
- Check browser hardware acceleration is enabled
- Close other browser tabs
- Verify no infinite render loops in components
- Check React DevTools Profiler for expensive re-renders

