import React from 'react';
import ClippyAvatar from './ClippyAvatar';
import './ChatPanel.css';

/**
 * Chat Empty State Component
 * Displays when there are no messages in the chat
 * Shows large Clippy avatar with welcoming greeting
 */
const ChatEmptyState: React.FC = () => {
  return (
    <div className="chat-empty-state">
      <div className="empty-state-avatar">
        <ClippyAvatar size="large" />
      </div>
      <div className="empty-state-greeting">
        👋 Hi! I'm Clippy, your canvas assistant. Ask me anything!
      </div>
      <div className="empty-state-subtext">
        I can help you create shapes, organize your canvas, and more.
      </div>
    </div>
  );
};

export default ChatEmptyState;

