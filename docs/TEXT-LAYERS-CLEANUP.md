# Text Layers - Legacy Cleanup

## Why We're Removing This
- HTML overlay approach causes zoom/positioning bugs
- Rebuilding with Konva native approach
- Current implementation documented in TEXT-LAYERS-IMPLEMENTATION-SUMMARY.md

## Files to Delete
- src/components/Canvas/TextInput.tsx
- src/components/Canvas/TextControls.tsx

## Code to Remove
- Canvas.tsx: Text rendering/editing (lines 450-520)
- CanvasContext.tsx: editingTextId state, text methods
- canvasService.ts: createText, updateText, etc.
- helpers.ts: getFontStyle, validateFontSize

## What to Keep
- Type definitions in ShapeData (will reuse)
- Existing lock system (unchanged)

## Verification
- [ ] npm run build succeeds
- [ ] No TypeScript errors
- [ ] Canvas still renders shapes
- [ ] No broken imports