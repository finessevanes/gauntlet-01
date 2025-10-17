import React, { useEffect, useRef, useState } from 'react';

interface TextEditorOverlayProps {
  shapeId: string;
  initialText: string;
  position: { x: number; y: number };
  fontSize: number;
  color: string;
  onSave: (text: string) => void;
  onTextChange?: (text: string) => void;
  onDimensionsChange?: (dimensions: { width: number; height: number }) => void;
}

/**
 * TextEditorOverlay - HTML overlay for in-place text editing
 * 
 * This component provides a seamless text editing experience by rendering
 * an HTML input element positioned exactly over the Konva text node.
 * 
 * Key features:
 * - Pixel-perfect positioning with Konva text
 * - Auto-focus and text selection on mount
 * - Keyboard event handling (Enter/Escape)
 * - Real-time position updates during zoom/pan
 * - Styling that matches the text appearance
 */
export const TextEditorOverlay: React.FC<TextEditorOverlayProps> = ({
  initialText,
  position,
  fontSize,
  color,
  onSave,
  onTextChange,
  onDimensionsChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(initialText);

  // Auto-focus and select text on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  // Measure and report dimensions when text changes
  useEffect(() => {
    if (inputRef.current && onDimensionsChange) {
      // Use a more accurate method to measure text content
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        context.font = `${fontSize}px Arial, sans-serif`;
        const metrics = context.measureText(text);
        const textWidth = metrics.width;
        const textHeight = fontSize * 1.2; // Line height
        
        onDimensionsChange({
          width: textWidth,
          height: textHeight
        });
      } else {
        // Fallback to getBoundingClientRect
        const rect = inputRef.current.getBoundingClientRect();
        onDimensionsChange({
          width: rect.width,
          height: rect.height
        });
      }
    }
  }, [text, fontSize, onDimensionsChange]);

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSave(text);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      console.log('ESC pressed - clearing text completely');
      // Save empty string to effectively remove the text
      onSave('');
    }
    // Allow all other keys (backspace, delete, arrow keys, etc.) to work normally
    // by not calling preventDefault() for them
  };

  // Handle text changes
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setText(newText);
    // Notify parent component of text changes for dynamic border updates
    if (onTextChange) {
      onTextChange(newText);
    }
  };

  // Handle blur (click outside) - save changes
  const handleBlur = () => {
    console.log('Blur event - saving text:', text);
    onSave(text);
  };

  // Calculate the final position accounting for stage transform and padding
  // The position passed in is the top-left of the text shape border
  // We need to account for padding and vertical centering
  const padding = 4; // Same padding as used in CanvasShape.tsx
  const finalPosition = {
    x: position.x + padding,
    y: position.y + padding, // Start from top of border + padding
  };

  // Style the input to match the text appearance
  const inputStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${finalPosition.x}px`,
    top: `${finalPosition.y}px`,
    fontSize: `${fontSize}px`,
    color: color,
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    padding: '0',
    margin: '0',
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    width: 'auto',
    minWidth: '1px',
    maxWidth: 'none',
    zIndex: 1000,
    // Ensure the input doesn't interfere with canvas interactions
    pointerEvents: 'auto',
    // Match the line height used in Konva text (1.2 * fontSize)
    lineHeight: `${fontSize * 1.2}px`,
    // Ensure proper vertical alignment
    verticalAlign: 'middle',
    // Remove any default browser styling that might affect positioning
    boxSizing: 'border-box',
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={text}
      onChange={handleTextChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      style={inputStyle}
      // Prevent the input from being selected by canvas selection
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      // Ensure keyboard events are properly handled
      onKeyUp={(e) => e.stopPropagation()}
      onKeyPress={(e) => e.stopPropagation()}
    />
  );
};

export default TextEditorOverlay;
