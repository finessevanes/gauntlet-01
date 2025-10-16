import { useState, useEffect, useRef } from 'react';

interface TextInputProps {
  initialText?: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  onSave: (text: string) => void;
  onCancel: () => void;
  stageScale?: number;
  stagePosition?: { x: number; y: number };
}

export default function TextInput({
  initialText = '',
  x,
  y,
  fontSize,
  color,
  onSave,
  onCancel,
  stageScale = 1,
  stagePosition = { x: 0, y: 0 },
}: TextInputProps) {
  const [text, setText] = useState(initialText);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate screen position from canvas position
  const screenX = x * stageScale + stagePosition.x;
  const screenY = y * stageScale + stagePosition.y;

  const handleSave = () => {
    if (text.trim()) {
      onSave(text.trim());
    } else {
      onCancel();
    }
  };

  useEffect(() => {
    // Auto-focus on mount with small delay to ensure DOM is ready
    const focusTimeout = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 10); // Small delay to ensure DOM is ready

    return () => clearTimeout(focusTimeout);
  }, []);

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
        left: screenX,
        top: screenY,
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
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{
          fontSize: `${fontSize * stageScale}px`,
          color,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          border: '2px solid #3b82f6',
          outline: 'none',
          padding: '2px 4px',
          fontFamily: 'Arial, sans-serif',
          minWidth: '100px',
          maxWidth: '500px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        }}
      />
    </div>
  );
}

