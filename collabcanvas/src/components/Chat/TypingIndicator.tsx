import React from 'react';
import ClippyAvatar from './ClippyAvatar';
import './TypingIndicator.css';

/**
 * Typing Indicator Component
 * Displays "Clippy is thinking..." with animated dots while AI is processing
 */
const TypingIndicator: React.FC = () => {
  return (
    <div 
      className="typing-indicator"
      role="status"
      aria-live="polite"
      aria-label="Clippy is thinking"
    >
      <div className="typing-indicator-avatar">
        <ClippyAvatar size="small" />
      </div>
      <div className="typing-indicator-bubble">
        <span className="typing-text">Clippy is thinking</span>
        <span className="typing-dots">
          <span className="dot">.</span>
          <span className="dot">.</span>
          <span className="dot">.</span>
        </span>
      </div>
    </div>
  );
};

export default TypingIndicator;

