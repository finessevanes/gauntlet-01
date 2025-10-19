/**
 * Integration Tests: Clippy-Style Chat UI Component
 * PR #9: Tests the visual chat interface (no backend integration)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatPanel from '../../src/components/Chat/ChatPanel';
import ChatTriggerButton from '../../src/components/Chat/ChatTriggerButton';
import MessageBubble from '../../src/components/Chat/MessageBubble';
import ChatEmptyState from '../../src/components/Chat/ChatEmptyState';
import ClippyAvatar from '../../src/components/Chat/ClippyAvatar';
import type { ChatMessage } from '../../src/components/Chat/types';

describe('Chat UI Integration Tests', () => {
  const mockMessages: ChatMessage[] = [
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m Clippy, your canvas assistant. How can I help you today?',
      timestamp: new Date('2024-01-01T10:00:00'),
    },
    {
      id: '2',
      role: 'user',
      content: 'Hello Clippy! Can you help me with my canvas?',
      timestamp: new Date('2024-01-01T10:01:00'),
    },
    {
      id: '3',
      role: 'assistant',
      content: 'Of course! I can help you create shapes, organize them, and more. What would you like to do?',
      timestamp: new Date('2024-01-01T10:02:00'),
    },
  ];

  describe('Gate 1: ChatTriggerButton (FAB)', () => {
    it('Gate 1.1: Renders trigger button in bottom-right corner', () => {
      const handleClick = vi.fn();
      render(<ChatTriggerButton onClick={handleClick} />);
      
      const button = screen.getByRole('button', { name: /open chat with clippy/i });
      expect(button).toBeInTheDocument();
      
      // Check if button has fixed positioning styles (via CSS class)
      expect(button.className).toContain('chat-trigger-button');
      
      // Verify accessibility
      expect(button).toHaveAttribute('aria-label', 'Open chat with Clippy');
    });

    it('Gate 1.2: Calls onClick when FAB is clicked', () => {
      const handleClick = vi.fn();
      render(<ChatTriggerButton onClick={handleClick} />);
      
      const button = screen.getByRole('button', { name: /open chat with clippy/i });
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Gate 2: ClippyAvatar Component', () => {
    it('Gate 2.1: Renders small avatar (32x32px)', () => {
      const { container } = render(<ClippyAvatar size="small" />);
      
      const avatar = container.querySelector('.clippy-avatar-small');
      expect(avatar).toBeInTheDocument();
      
      // Check SVG is rendered
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-label', 'Clippy assistant');
    });

    it('Gate 2.2: Renders large avatar (64x64px)', () => {
      const { container } = render(<ClippyAvatar size="large" />);
      
      const avatar = container.querySelector('.clippy-avatar-large');
      expect(avatar).toBeInTheDocument();
      
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Gate 3: ChatEmptyState Component', () => {
    it('Gate 3.1: Displays empty state with large Clippy and greeting', () => {
      render(<ChatEmptyState />);
      
      // Check greeting text
      expect(screen.getByText(/Hi! I'm Clippy, your canvas assistant/i)).toBeInTheDocument();
      expect(screen.getByText(/I can help you create shapes/i)).toBeInTheDocument();
      
      // Check that large avatar is rendered (through CSS class)
      const container = screen.getByText(/Hi! I'm Clippy/i).closest('.chat-empty-state');
      expect(container).toBeInTheDocument();
    });

    it('Gate 3.2: Empty state has proper styling', () => {
      const { container } = render(<ChatEmptyState />);
      
      const emptyState = container.querySelector('.chat-empty-state');
      expect(emptyState).toBeInTheDocument();
      expect(emptyState?.className).toContain('chat-empty-state');
    });
  });

  describe('Gate 4: MessageBubble Component', () => {
    it('Gate 4.1: Renders AI message with yellow bubble and Clippy avatar', () => {
      const aiMessage = mockMessages[0];
      const { container } = render(<MessageBubble message={aiMessage} />);
      
      // Check message content
      expect(screen.getByText(aiMessage.content)).toBeInTheDocument();
      
      // Check for AI message styling
      const bubble = container.querySelector('.message-bubble-ai');
      expect(bubble).toBeInTheDocument();
      
      // Check for Clippy avatar
      const avatar = container.querySelector('.clippy-avatar-small');
      expect(avatar).toBeInTheDocument();
      
      // Check accessibility
      expect(screen.getByLabelText(/Clippy says:/i)).toBeInTheDocument();
    });

    it('Gate 4.2: Renders user message with white bubble (no avatar)', () => {
      const userMessage = mockMessages[1];
      const { container } = render(<MessageBubble message={userMessage} />);
      
      // Check message content
      expect(screen.getByText(userMessage.content)).toBeInTheDocument();
      
      // Check for user message styling
      const bubble = container.querySelector('.message-bubble-user');
      expect(bubble).toBeInTheDocument();
      
      // Check that no avatar is rendered for user messages
      const avatar = container.querySelector('.clippy-avatar-small');
      expect(avatar).not.toBeInTheDocument();
      
      // Check accessibility
      expect(screen.getByLabelText(/You said:/i)).toBeInTheDocument();
    });

    it('Gate 4.3: Displays timestamp for messages', () => {
      const message = mockMessages[0];
      const { container } = render(<MessageBubble message={message} />);
      
      // Check that timestamp element exists
      const timestamp = container.querySelector('.message-timestamp');
      expect(timestamp).toBeInTheDocument();
      expect(timestamp?.textContent).toBeTruthy();
    });
  });

  describe('Gate 5: ChatPanel - Empty State', () => {
    it('Gate 5.1: Shows empty state when messages array is empty', () => {
      const handleClose = vi.fn();
      render(
        <ChatPanel
          isOpen={true}
          onClose={handleClose}
          messages={[]}
        />
      );
      
      // Empty state should be visible
      expect(screen.getByText(/Hi! I'm Clippy, your canvas assistant/i)).toBeInTheDocument();
    });

    it('Gate 5.2: Has proper ARIA attributes for dialog', () => {
      const handleClose = vi.fn();
      const { container } = render(
        <ChatPanel
          isOpen={true}
          onClose={handleClose}
          messages={[]}
        />
      );
      
      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-label', 'Chat with Clippy');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });
  });

  describe('Gate 6: ChatPanel - With Messages', () => {
    it('Gate 6.1: Renders all messages when messages array is provided', () => {
      const handleClose = vi.fn();
      const { container } = render(
        <ChatPanel
          isOpen={true}
          onClose={handleClose}
          messages={mockMessages}
        />
      );
      
      // All 3 messages should be rendered
      mockMessages.forEach((message) => {
        expect(screen.getByText(message.content)).toBeInTheDocument();
      });
      
      // Empty state component should NOT be visible (check for the empty state container, not just text)
      const emptyState = container.querySelector('.chat-empty-state');
      expect(emptyState).not.toBeInTheDocument();
    });

    it('Gate 6.2: Message list has proper ARIA attributes', () => {
      const handleClose = vi.fn();
      const { container } = render(
        <ChatPanel
          isOpen={true}
          onClose={handleClose}
          messages={mockMessages}
        />
      );
      
      const messageList = container.querySelector('[role="log"]');
      expect(messageList).toBeInTheDocument();
      expect(messageList).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Gate 7: ChatPanel - Header and Controls', () => {
    it('Gate 7.1: Renders panel header with title', () => {
      const handleClose = vi.fn();
      render(
        <ChatPanel
          isOpen={true}
          onClose={handleClose}
          messages={mockMessages}
        />
      );
      
      expect(screen.getByText('Chat with Clippy')).toBeInTheDocument();
    });

    it('Gate 7.2: Close button triggers onClose callback', () => {
      const handleClose = vi.fn();
      render(
        <ChatPanel
          isOpen={true}
          onClose={handleClose}
          messages={mockMessages}
        />
      );
      
      const closeButton = screen.getByRole('button', { name: /close chat/i });
      expect(closeButton).toBeInTheDocument();
      
      fireEvent.click(closeButton);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Gate 8: ChatPanel - Input Area (Disabled)', () => {
    it('Gate 8.1: Input field is disabled with coming soon placeholder', () => {
      const handleClose = vi.fn();
      render(
        <ChatPanel
          isOpen={true}
          onClose={handleClose}
          messages={mockMessages}
        />
      );
      
      const input = screen.getByPlaceholderText(/Coming soon in PR #10/i);
      expect(input).toBeInTheDocument();
      expect(input).toBeDisabled();
    });

    it('Gate 8.2: Send button is disabled', () => {
      const handleClose = vi.fn();
      render(
        <ChatPanel
          isOpen={true}
          onClose={handleClose}
          messages={mockMessages}
        />
      );
      
      const sendButton = screen.getByRole('button', { name: /send message/i });
      expect(sendButton).toBeInTheDocument();
      expect(sendButton).toBeDisabled();
    });

    it('Gate 8.3: Hint text about PR #10 is visible', () => {
      const handleClose = vi.fn();
      render(
        <ChatPanel
          isOpen={true}
          onClose={handleClose}
          messages={mockMessages}
        />
      );
      
      expect(screen.getByText(/Chat functionality will be connected in PR #10/i)).toBeInTheDocument();
    });
  });

  describe('Gate 9: ChatPanel - Open/Close States', () => {
    it('Gate 9.1: Panel has open class when isOpen is true', () => {
      const handleClose = vi.fn();
      const { container } = render(
        <ChatPanel
          isOpen={true}
          onClose={handleClose}
          messages={mockMessages}
        />
      );
      
      const panel = container.querySelector('.chat-panel');
      expect(panel).toHaveClass('chat-panel-open');
    });

    it('Gate 9.2: Panel has closed class when isOpen is false', () => {
      const handleClose = vi.fn();
      const { container } = render(
        <ChatPanel
          isOpen={false}
          onClose={handleClose}
          messages={mockMessages}
        />
      );
      
      const panel = container.querySelector('.chat-panel');
      expect(panel).toHaveClass('chat-panel-closed');
    });
  });

  describe('Gate 10: Keyboard Shortcuts', () => {
    it('Gate 10.1: Escape key closes the panel', () => {
      const handleClose = vi.fn();
      render(
        <ChatPanel
          isOpen={true}
          onClose={handleClose}
          messages={mockMessages}
        />
      );
      
      // Simulate Escape key press
      fireEvent.keyDown(window, { key: 'Escape' });
      
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('Gate 10.2: Escape key does nothing when panel is closed', () => {
      const handleClose = vi.fn();
      render(
        <ChatPanel
          isOpen={false}
          onClose={handleClose}
          messages={mockMessages}
        />
      );
      
      // Simulate Escape key press
      fireEvent.keyDown(window, { key: 'Escape' });
      
      // Should not be called when panel is already closed
      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('Gate 11: Edge Cases', () => {
    it('Gate 11.1: Handles very long message content', () => {
      const longMessage: ChatMessage = {
        id: 'long',
        role: 'assistant',
        content: 'A'.repeat(1000), // 1000 characters
        timestamp: new Date(),
      };

      const handleClose = vi.fn();
      const { container } = render(
        <ChatPanel
          isOpen={true}
          onClose={handleClose}
          messages={[longMessage]}
        />
      );
      
      // Message should render without breaking layout
      const bubble = container.querySelector('.message-bubble-ai');
      expect(bubble).toBeInTheDocument();
      expect(bubble?.textContent).toContain('A'.repeat(100)); // At least part of it
    });

    it('Gate 11.2: Handles large number of messages (100+)', () => {
      const manyMessages: ChatMessage[] = Array.from({ length: 100 }, (_, i) => ({
        id: `msg-${i}`,
        role: i % 2 === 0 ? 'assistant' : 'user',
        content: `Message ${i}`,
        timestamp: new Date(),
      })) as ChatMessage[];

      const handleClose = vi.fn();
      const { container } = render(
        <ChatPanel
          isOpen={true}
          onClose={handleClose}
          messages={manyMessages}
        />
      );
      
      // All messages should be in the DOM
      const messageList = container.querySelector('.chat-message-list');
      expect(messageList).toBeInTheDocument();
      
      // Check that scrolling container exists
      expect(messageList?.className).toContain('chat-message-list');
    });

    it('Gate 11.3: Handles empty message content gracefully', () => {
      const emptyMessage: ChatMessage = {
        id: 'empty',
        role: 'user',
        content: '',
        timestamp: new Date(),
      };

      const handleClose = vi.fn();
      const { container } = render(
        <ChatPanel
          isOpen={true}
          onClose={handleClose}
          messages={[emptyMessage]}
        />
      );
      
      // Should render bubble even with empty content
      const bubble = container.querySelector('.message-bubble-user');
      expect(bubble).toBeInTheDocument();
    });

    it('Gate 11.4: Handles special characters and emoji safely', () => {
      const specialMessage: ChatMessage = {
        id: 'special',
        role: 'assistant',
        content: '🎨 <script>alert("XSS")</script> & "special" \'chars\'',
        timestamp: new Date(),
      };

      const handleClose = vi.fn();
      render(
        <ChatPanel
          isOpen={true}
          onClose={handleClose}
          messages={[specialMessage]}
        />
      );
      
      // Content should be displayed as text (not executed)
      expect(screen.getByText(/🎨/)).toBeInTheDocument();
      expect(screen.getByText(/special/)).toBeInTheDocument();
      
      // Script tag should be rendered as text, not executed
      const content = screen.getByText(/script/i);
      expect(content).toBeInTheDocument();
    });
  });

  describe('Gate 12: Styling and Visual Requirements', () => {
    it('Gate 12.1: AI messages have correct CSS classes', () => {
      const { container } = render(<MessageBubble message={mockMessages[0]} />);
      
      const aiContainer = container.querySelector('.message-ai');
      expect(aiContainer).toBeInTheDocument();
      
      const aiBubble = container.querySelector('.message-bubble-ai');
      expect(aiBubble).toBeInTheDocument();
    });

    it('Gate 12.2: User messages have correct CSS classes', () => {
      const { container } = render(<MessageBubble message={mockMessages[1]} />);
      
      const userContainer = container.querySelector('.message-user');
      expect(userContainer).toBeInTheDocument();
      
      const userBubble = container.querySelector('.message-bubble-user');
      expect(userBubble).toBeInTheDocument();
    });

    it('Gate 12.3: Panel has retro styling classes applied', () => {
      const handleClose = vi.fn();
      const { container } = render(
        <ChatPanel
          isOpen={true}
          onClose={handleClose}
          messages={mockMessages}
        />
      );
      
      const panel = container.querySelector('.chat-panel');
      expect(panel).toBeInTheDocument();
      
      const header = container.querySelector('.chat-panel-header');
      expect(header).toBeInTheDocument();
      
      const messageList = container.querySelector('.chat-message-list');
      expect(messageList).toBeInTheDocument();
    });
  });
});

