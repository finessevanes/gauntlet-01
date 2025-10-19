import React from 'react';
import type { ChatTriggerButtonProps } from './types';
import './ChatPanel.css';

/**
 * Chat Trigger Button (FAB - Floating Action Button)
 * Always visible in bottom-right corner
 * Opens the chat panel when clicked
 */
const ChatTriggerButton: React.FC<ChatTriggerButtonProps> = ({ onClick }) => {
  return (
    <button
      className="chat-trigger-button"
      onClick={onClick}
      aria-label="Open chat with Clippy"
      title="Chat with Clippy"
    >
      {/* Chat bubble icon with sparkle */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
          fill="white"
        />
        <circle cx="8" cy="9" r="1.5" fill="#0078D4" />
        <circle cx="12" cy="9" r="1.5" fill="#0078D4" />
        <circle cx="16" cy="9" r="1.5" fill="#0078D4" />
      </svg>
      {/* Small sparkle indicator */}
      <div className="chat-trigger-sparkle">✨</div>
    </button>
  );
};

export default ChatTriggerButton;

