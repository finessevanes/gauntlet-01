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
      title="Chat with Clippy (Cmd/Ctrl + K)"
    >
      📎 Chat with Clippy
    </button>
  );
};

export default ChatTriggerButton;

