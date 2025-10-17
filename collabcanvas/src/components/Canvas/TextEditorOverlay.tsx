import React, { useEffect, useRef, useState } from 'react';

interface TextEditorOverlayProps {
  shapeId: string;
  initialText: string;
  position: { x: number; y: number };
  fontSize: number;
  color: string;
  onSave: (text: string) => void;
  onCancel: () => void;
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
  onCancel,
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

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSave(text);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
    // Allow all other keys (backspace, delete, arrow keys, etc.) to work normally
    // by not calling preventDefault() for them
  };

  // Handle text changes
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };

  // Handle blur (click outside) - save changes
  const handleBlur = () => {
    onSave(text);
  };

  // Calculate the final position accounting for stage transform
  const finalPosition = {
    x: position.x,
    y: position.y,
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
    minWidth: '20px',
    maxWidth: '500px',
    zIndex: 1000,
    // Ensure the input doesn't interfere with canvas interactions
    pointerEvents: 'auto',
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
