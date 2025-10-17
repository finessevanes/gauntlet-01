# AI Service Testing Guide

## Setup

### 1. Environment Configuration

Create a `.env` file in the `collabcanvas` directory with your OpenAI API key:

```bash
VITE_OPENAI_API_KEY=sk-your-api-key-here
```

**Important:** 
- Get your API key from https://platform.openai.com/api-keys
- Never commit the `.env` file to git (it's already in `.gitignore`)
- The key must start with `sk-`

### 2. Start the Development Server

```bash
cd collabcanvas
npm run dev
```

## Testing in Browser Console

Once the app is running, open your browser console (F12) and test the AI service:

### Test 1: Initialize the Service

```javascript
// AIService is exposed globally via window.AIService
const ai = new window.AIService();
const userId = "test_user_123"; // Replace with actual user ID from auth if logged in
```

### Test 2: Create a Blue Rectangle

```javascript
await ai.executeCommand("create a blue rectangle at 500, 500", userId);
// Expected: Blue rectangle appears at (500, 500)
// Expected console output: "✓ Created 1 rectangle"
```

### Test 3: Create a Centered Red Rectangle

```javascript
await ai.executeCommand("create a red rectangle in the center", userId);
// Expected: Red rectangle appears centered on canvas
// Expected console output: "✓ Created 1 rectangle"
```

### Test 4: Create a Green Circle at Top

```javascript
await ai.executeCommand("add a green circle at the top", userId);
// Expected: Green circle appears at top center
// Expected console output: "✓ Created 1 circle"
```

### Test 5: Create a Yellow Triangle

```javascript
await ai.executeCommand("make a yellow triangle in the bottom-left", userId);
// Expected: Yellow triangle appears in bottom-left area
// Expected console output: "✓ Created 1 triangle"
```

### Test 6: Create Basic Text

```javascript
await ai.executeCommand("add text that says Hello World", userId);
// Expected: "Hello World" text appears on canvas
// Expected console output: "✓ Created text layer"
```

### Test 7: Create Formatted Text

```javascript
await ai.executeCommand("create bold italic text saying TITLE at the center", userId);
// Expected: Bold, italic "TITLE" text appears centered
// Expected console output: "✓ Created text layer"
```

### Test 8: Multi-Shape Command

```javascript
await ai.executeCommand("create 3 blue rectangles at 100, 200", userId);
// Expected: 3 blue rectangles appear (AI should call createRectangle 3 times)
// Expected console output: "✓ Created 3 elements"
```

### Test 9: Error Handling

```javascript
await ai.executeCommand("create a rectangle at 10000, 10000", userId);
// Expected: Graceful error message (position out of bounds handled by AI or service)
```

## Quick Test (One-Liner)

You can also test with a single command:

```javascript
new window.AIService().executeCommand("create a blue circle in the center", "test_user").then(r => console.log(r.message));
```

## Troubleshooting

### Issue: "OpenAI API key not found"
**Solution:** Verify `.env` file has `VITE_OPENAI_API_KEY=sk-...`

### Issue: AI creates shape but it doesn't appear
**Solution:** 
1. Check that Firebase is connected
2. Test `canvasService.createShape()` manually first
3. Check browser console for Firebase errors

### Issue: AI doesn't understand position commands
**Solution:** Review system prompt examples in `src/utils/aiPrompts.ts`

### Issue: "Tool call failed" errors
**Solution:** Check browser console for detailed error messages

### Issue: Shapes created at wrong positions
**Solution:** Verify position calculations in system prompt (centering logic)

### Issue: CORS or API errors
**Solution:** 
1. Verify API key is valid and has credits
2. Check that `dangerouslyAllowBrowser: true` is set in aiService.ts
3. Check OpenAI API status at https://status.openai.com/

## Success Criteria

All tests should pass with:
- ✅ Shapes appear on canvas in real-time
- ✅ Success messages are displayed
- ✅ Position calculations are accurate
- ✅ Color codes match exactly
- ✅ No console errors
- ✅ API calls complete in <2 seconds

## Next Steps (PR #2)

After this PR is complete:
- Add 11 more tools (move, resize, rotate, group, align, etc.)
- Expand system prompt for manipulation commands
- Add layout commands ("arrange in a row")

