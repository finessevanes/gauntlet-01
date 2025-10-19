import React from 'react';
import type { ChatTriggerButtonProps } from './types';
import './ChatPanel.css';

/**
 * Chat Trigger Button (FAB - Floating Action Button)
 * Always visible in bottom-right corner
 * Shows Clippy assistant when clicked
 */
const ChatTriggerButton: React.FC<ChatTriggerButtonProps> = ({ onClick }) => {
  return (
    <button
      className="chat-trigger-button"
      onClick={onClick}
      aria-label="Show Clippy assistant"
      title="Show Clippy (Cmd/Ctrl + K)"
    >
      📎 Ask Clippy
    </button>
  );
};

export default ChatTriggerButton;

