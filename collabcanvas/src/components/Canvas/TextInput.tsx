import { useState, useEffect, useRef } from 'react';

interface TextInputProps {
  initialText?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize: number;
  color: string;
  rotation?: number;
  onSave: (text: string) => void;
  onCancel: () => void;
  stageScale?: number;
  stagePosition?: { x: number; y: number };
}

export default function TextInput({
  initialText = '',
  x,
  y,
  width,
  height,
  fontSize,
  color,
  rotation = 0,
  onSave,
  onCancel,
  stageScale = 1,
  stagePosition = { x: 0, y: 0 },
}: TextInputProps) {
  const [text, setText] = useState(initialText);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate dimensions for rotation (use passed width/height or estimate)
  const textWidth = width || (initialText.length || 4) * fontSize * 0.6;
  const textHeight = height || fontSize * 1.2;
  
  // Calculate center position in canvas coordinates
  const centerX = x + textWidth / 2;
  const centerY = y + textHeight / 2;
  
  // Convert center position to screen coordinates
  const screenCenterX = centerX * stageScale + stagePosition.x;
  const screenCenterY = centerY * stageScale + stagePosition.y;

  const handleSave = () => {
    if (text.trim()) {
      onSave(text.trim());
    } else {
      onCancel();
    }
  };

  useEffect(() => {
    // Auto-focus and select text on mount
    const focusTimeout = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        // Use setSelectionRange for more reliable text selection
        const length = inputRef.current.value.length;
        inputRef.current.setSelectionRange(0, length);
      }
    }, 0);

    return () => clearTimeout(focusTimeout);
  }, []);

  // Additional effect to ensure text stays selected when editing existing text
  useEffect(() => {
    if (initialText && inputRef.current) {
      // Only select if there's initial text (editing mode)
      const selectTimeout = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const length = inputRef.current.value.length;
          inputRef.current.setSelectionRange(0, length);
        }
      }, 50); // Slightly longer delay for editing mode

      return () => clearTimeout(selectTimeout);
    }
  }, [initialText]);

  useEffect(() => {
    // Handle clicks outside - delay to avoid catching the click that opened this input
    let cleanupFn: (() => void) | null = null;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (text.trim()) {
          onSave(text.trim());
        } else {
          onCancel();
        }
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      cleanupFn = () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, 100); // 100ms delay to avoid catching the opening click

    return () => {
      clearTimeout(timeoutId);
      if (cleanupFn) {
        cleanupFn();
      }
    };
  }, [text, onSave, onCancel]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        left: screenCenterX,
        top: screenCenterY,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        transformOrigin: 'center center',
        zIndex: 10000,
      }}
      onClick={(e) => {
        // Stop propagation so canvas doesn't handle this click
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        // Stop propagation so canvas doesn't handle this mousedown
        e.stopPropagation();
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={text}
        placeholder="Text"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{
          fontSize: `${fontSize * stageScale}px`,
          color,
          backgroundColor: 'transparent',
          border: 'none',
          outline: '1px solid #000000', // Thin black outline to show it's editable
          outlineOffset: '-1px',
          padding: '1px 3px',
          margin: '0',
          fontFamily: 'Arial, sans-serif',
          width: width ? `${width * stageScale}px` : `${(text.length || 4) * fontSize * stageScale * 0.55}px`,
          minWidth: `${fontSize * stageScale * 2}px`,
          maxWidth: '800px',
          lineHeight: '1.2',
        }}
      />
    </div>
  );
}

