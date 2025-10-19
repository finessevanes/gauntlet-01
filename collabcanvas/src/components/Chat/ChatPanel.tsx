import React, { useEffect, useRef } from 'react';
import type { ChatPanelProps } from './types';
import MessageBubble from './MessageBubble';
import ChatEmptyState from './ChatEmptyState';
import './ChatPanel.css';

/**
 * Chat Panel Component
 * Main container for the Clippy-style chat interface
 * Features:
 * - Slide-in/out animation
 * - Message display with auto-scroll
 * - Empty state when no messages
 * - Disabled input (ready for PR #10 backend integration)
 */
const ChatPanel: React.FC<ChatPanelProps> = ({ isOpen, onClose, messages }) => {
  const messageListRef = useRef<HTMLDivElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const previousScrollHeightRef = useRef<number>(0);

  // Auto-scroll to bottom when new messages arrive
  // Only scroll if user is already near the bottom (don't interrupt manual scrolling)
  useEffect(() => {
    if (messageListRef.current && messageEndRef.current) {
      const container = messageListRef.current;
      const scrollThreshold = 100; // pixels from bottom
      
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < scrollThreshold;
      
      // Also scroll if this is the first message
      const isFirstMessage = previousScrollHeightRef.current === 0;
      
      if (isNearBottom || isFirstMessage) {
        // Check if scrollIntoView exists (not available in some test environments)
        if (typeof messageEndRef.current.scrollIntoView === 'function') {
          messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }
      
      previousScrollHeightRef.current = container.scrollHeight;
    }
  }, [messages]);

  // Handle Escape key to close panel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <div
      className={`chat-panel ${isOpen ? 'chat-panel-open' : 'chat-panel-closed'}`}
      role="dialog"
      aria-label="Chat with Clippy"
      aria-modal="true"
    >
      {/* Header */}
      <div className="chat-panel-header">
        <div className="chat-panel-title">
          <span className="chat-icon">💬</span>
          Chat with Clippy
        </div>
        <button
          className="chat-close-button"
          onClick={onClose}
          aria-label="Close chat"
          title="Close chat (Esc)"
        >
          ✕
        </button>
      </div>

      {/* Message List */}
      <div
        ref={messageListRef}
        className="chat-message-list"
        role="log"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <ChatEmptyState />
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {/* Invisible element to scroll to */}
            <div ref={messageEndRef} />
          </>
        )}
      </div>

      {/* Input Area (Disabled for this PR) */}
      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <input
            type="text"
            className="chat-input"
            placeholder="Coming soon in PR #10..."
            disabled
            title="Chat functionality will be connected in the next PR"
            aria-label="Message input (coming soon)"
          />
          <button
            className="chat-send-button"
            disabled
            title="Chat functionality will be connected in the next PR"
            aria-label="Send message (coming soon)"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 21L23 12L2 3V10L17 12L2 14V21Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
        <div className="chat-input-hint">
          💡 Tip: Chat functionality will be connected in PR #10
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;

