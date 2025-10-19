import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from './types';
import ClippyAvatar from './ClippyAvatar';
import TypingIndicator from './TypingIndicator';
import './FloatingClippy.css';

interface FloatingClippyProps {
  isVisible: boolean;
  onDismiss: () => void;
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  onDeleteMessage: (messageId: string) => void;
  isLoading: boolean;
}

/**
 * Floating Clippy Component
 * Classic Microsoft Office assistant experience with AI integration
 * - Draggable Clippy character
 * - Speech bubbles that point to Clippy
 * - Can be minimized or dismissed
 * - AI-powered message sending
 */
const FloatingClippy: React.FC<FloatingClippyProps> = ({ isVisible, onDismiss, messages, onSendMessage, onDeleteMessage, isLoading }) => {
  const [position, setPosition] = useState({ x: window.innerWidth - 300, y: window.innerHeight - 400 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const clippyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Show all messages (user + assistant) for full chat history
  // For chat persistence, users need to see their own messages too
  const allMessages = messages;
  const currentMessage = allMessages[currentMessageIndex];

  // Auto-cycle through messages (disabled for now to show latest message)
  useEffect(() => {
    // Disabled auto-cycling - users should see latest message by default
    // Can re-enable if needed
    return;
  }, [isVisible, isMinimized, allMessages.length]);

  // Always show the latest message when new messages arrive
  useEffect(() => {
    if (allMessages.length > 0) {
      setCurrentMessageIndex(allMessages.length - 1);
    }
  }, [allMessages.length]);

  // Handle mouse down on Clippy to start dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't drag when clicking buttons or input fields
    if (
      e.target instanceof HTMLButtonElement ||
      e.target instanceof HTMLInputElement ||
      (e.target as HTMLElement).closest('.clippy-input-area')
    ) {
      return;
    }
    
    setIsDragging(true);
    const rect = clippyRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  // Handle mouse move for dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Constrain to viewport
      const maxX = window.innerWidth - 250;
      const maxY = window.innerHeight - 200;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Handle Escape key to dismiss
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isVisible) {
        onDismiss();
      }
    };

    if (isVisible) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, onDismiss]);

  // Input validation
  const isInputValid = inputValue.trim().length > 0 && inputValue.length <= 500;

  // Handle message submission
  const handleSubmit = () => {
    if (!inputValue.trim() || isLoading || inputValue.length > 500) {
      return;
    }

    onSendMessage(inputValue.trim());
    setInputValue('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle Enter key to send
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isVisible) return null;

  return (
    <div
      ref={clippyRef}
      className={`floating-clippy ${isDragging ? 'dragging' : ''} ${isMinimized ? 'minimized' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onMouseDown={handleMouseDown}
      role="dialog"
      aria-label="Clippy assistant"
    >
      {/* Speech Bubble - Show typing indicator or message */}
      {!isMinimized && (
        <>
          {isLoading ? (
            <div className="clippy-speech-bubble">
              <div className="speech-bubble-content">
                <TypingIndicator />
              </div>
              <div className="speech-bubble-tail" />
            </div>
          ) : currentMessage ? (
            <div className="clippy-speech-bubble">
              <div className="speech-bubble-content" style={{ position: 'relative' }}>
                {/* Delete button (X) in top-right corner */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteMessage(currentMessage.id);
                  }}
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '12px',
                    lineHeight: '1',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0',
                    fontWeight: 'bold',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.background = '#b91c1c';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.background = '#dc2626';
                  }}
                  aria-label="Delete message"
                  title="Delete this message"
                >
                  ×
                </button>
                
                {/* Show who sent the message */}
                {currentMessage.role === 'user' && (
                  <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#666' }}>
                    You:
                  </div>
                )}
                {currentMessage.content}
              </div>
              
              {/* Navigation dots if multiple messages */}
              {allMessages.length > 1 && (
                <div className="message-dots">
                  {allMessages.map((msg, index) => (
                    <button
                      key={index}
                      className={`dot ${index === currentMessageIndex ? 'active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentMessageIndex(index);
                      }}
                      aria-label={`Go to message ${index + 1} (${msg.role})`}
                      title={msg.role === 'user' ? 'Your message' : 'Clippy\'s response'}
                    />
                  ))}
                </div>
              )}

              {/* Speech bubble tail (triangle pointing down to Clippy) */}
              <div className="speech-bubble-tail" />
            </div>
          ) : null}
        </>
      )}

      {/* Input Area - Show when not minimized */}
      {!isMinimized && (
        <div className="clippy-input-area" onClick={(e) => e.stopPropagation()}>
          <input
            ref={inputRef}
            type="text"
            className="clippy-input"
            placeholder="Ask Clippy anything..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            aria-label="Ask Clippy a question"
            maxLength={500}
          />
          <button
            className="clippy-send-button"
            onClick={handleSubmit}
            disabled={!isInputValid || isLoading}
            aria-label="Send question"
          >
            ➤
          </button>
        </div>
      )}

      {/* Clippy Character */}
      <div className="clippy-character">
        <ClippyAvatar size="large" />
        
        {/* Control Buttons */}
        <div className="clippy-controls">
          <button
            className="control-btn minimize-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
            title={isMinimized ? 'Show message' : 'Hide message'}
            aria-label={isMinimized ? 'Show message' : 'Hide message'}
          >
            {isMinimized ? '💬' : '─'}
          </button>
          <button
            className="control-btn close-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            title="Dismiss Clippy (Esc)"
            aria-label="Dismiss Clippy"
          >
            ✕
          </button>
        </div>
      </div>

    </div>
  );
};

export default FloatingClippy;

