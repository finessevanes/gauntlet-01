import React from 'react';
import type { MessageBubbleProps } from './types';
import ClippyAvatar from './ClippyAvatar';
import './ChatPanel.css';

/**
 * Message Bubble Component
 * Displays individual chat messages with speech bubble styling
 * AI messages: left-aligned, yellow, with Clippy avatar
 * User messages: right-aligned, white
 */
const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isAI = message.role === 'assistant';
  
  // Format timestamp
  const timeString = message.timestamp.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div
      className={`message-container ${isAI ? 'message-ai' : 'message-user'}`}
      aria-label={isAI ? `Clippy says: ${message.content}` : `You said: ${message.content}`}
    >
      {/* AI messages have avatar on the left */}
      {isAI && (
        <div className="message-avatar">
          <ClippyAvatar size="small" />
        </div>
      )}
      
      <div className="message-bubble-wrapper">
        <div className={`message-bubble ${isAI ? 'message-bubble-ai' : 'message-bubble-user'}`}>
          <div className="message-content">{message.content}</div>
        </div>
        <div className={`message-timestamp ${isAI ? 'timestamp-left' : 'timestamp-right'}`}>
          {timeString}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;

