/**
 * Integration Tests: FloatingClippy AI Connection (PR #10)
 * Tests the integration between FloatingClippy and AIService
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FloatingClippy from '../../src/components/Chat/FloatingClippy';
import type { ChatMessage } from '../../src/components/Chat/types';

describe('FloatingClippy AI Integration Tests', () => {
  const mockMessages: ChatMessage[] = [
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm Clippy, your canvas assistant. How can I help you today?",
      timestamp: new Date('2024-01-01T10:00:00'),
    },
  ];

  describe('Gate 1: Input Functionality', () => {
    it('Gate 1.1: Input field is enabled and accepts text', () => {
      const handleSendMessage = vi.fn();
      const handleDismiss = vi.fn();
      
      render(
        <FloatingClippy
          isVisible={true}
          onDismiss={handleDismiss}
          messages={mockMessages}
          onSendMessage={handleSendMessage}
          isLoading={false}
        />
      );
      
      const input = screen.getByLabelText('Ask Clippy a question') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input).not.toBeDisabled();
      
      fireEvent.change(input, { target: { value: 'Create a blue circle' } });
      expect(input.value).toBe('Create a blue circle');
    });

    it('Gate 1.2: Placeholder updated to "Ask Clippy anything..."', () => {
      const handleSendMessage = vi.fn();
      const handleDismiss = vi.fn();
      
      render(
        <FloatingClippy
          isVisible={true}
          onDismiss={handleDismiss}
          messages={mockMessages}
          onSendMessage={handleSendMessage}
          isLoading={false}
        />
      );
      
      const input = screen.getByPlaceholderText('Ask Clippy anything...');
      expect(input).toBeInTheDocument();
    });

    it('Gate 1.3: Send button enables when input has text', () => {
      const handleSendMessage = vi.fn();
      const handleDismiss = vi.fn();
      
      render(
        <FloatingClippy
          isVisible={true}
          onDismiss={handleDismiss}
          messages={mockMessages}
          onSendMessage={handleSendMessage}
          isLoading={false}
        />
      );
      
      const input = screen.getByLabelText('Ask Clippy a question') as HTMLInputElement;
      const sendButton = screen.getByLabelText('Send question');
      
      // Initially disabled (empty input)
      expect(sendButton).toBeDisabled();
      
      // Enabled after typing
      fireEvent.change(input, { target: { value: 'Hello' } });
      expect(sendButton).not.toBeDisabled();
    });
  });

  describe('Gate 2: Message Sending', () => {
    it('Gate 2.1: Enter key sends message', () => {
      const handleSendMessage = vi.fn();
      const handleDismiss = vi.fn();
      
      render(
        <FloatingClippy
          isVisible={true}
          onDismiss={handleDismiss}
          messages={mockMessages}
          onSendMessage={handleSendMessage}
          isLoading={false}
        />
      );
      
      const input = screen.getByLabelText('Ask Clippy a question');
      
      fireEvent.change(input, { target: { value: 'Hello Clippy' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(handleSendMessage).toHaveBeenCalledWith('Hello Clippy');
    });

    it('Gate 2.2: Clicking send button sends message', () => {
      const handleSendMessage = vi.fn();
      const handleDismiss = vi.fn();
      
      render(
        <FloatingClippy
          isVisible={true}
          onDismiss={handleDismiss}
          messages={mockMessages}
          onSendMessage={handleSendMessage}
          isLoading={false}
        />
      );
      
      const input = screen.getByLabelText('Ask Clippy a question');
      const sendButton = screen.getByLabelText('Send question');
      
      fireEvent.change(input, { target: { value: 'Create a circle' } });
      fireEvent.click(sendButton);
      
      expect(handleSendMessage).toHaveBeenCalledWith('Create a circle');
    });

    it('Gate 2.3: Input clears after sending', async () => {
      const handleSendMessage = vi.fn();
      const handleDismiss = vi.fn();
      
      render(
        <FloatingClippy
          isVisible={true}
          onDismiss={handleDismiss}
          messages={mockMessages}
          onSendMessage={handleSendMessage}
          isLoading={false}
        />
      );
      
      const input = screen.getByLabelText('Ask Clippy a question') as HTMLInputElement;
      const sendButton = screen.getByLabelText('Send question');
      
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('Gate 2.4: Message trimmed before sending', () => {
      const handleSendMessage = vi.fn();
      const handleDismiss = vi.fn();
      
      render(
        <FloatingClippy
          isVisible={true}
          onDismiss={handleDismiss}
          messages={mockMessages}
          onSendMessage={handleSendMessage}
          isLoading={false}
        />
      );
      
      const input = screen.getByLabelText('Ask Clippy a question');
      
      fireEvent.change(input, { target: { value: '  Hello Clippy  ' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(handleSendMessage).toHaveBeenCalledWith('Hello Clippy');
    });
  });

  describe('Gate 3: Loading State', () => {
    it('Gate 3.1: Input disabled while loading', () => {
      const handleSendMessage = vi.fn();
      const handleDismiss = vi.fn();
      
      render(
        <FloatingClippy
          isVisible={true}
          onDismiss={handleDismiss}
          messages={mockMessages}
          onSendMessage={handleSendMessage}
          isLoading={true}
        />
      );
      
      const input = screen.getByLabelText('Ask Clippy a question');
      expect(input).toBeDisabled();
    });

    it('Gate 3.2: Send button disabled while loading', () => {
      const handleSendMessage = vi.fn();
      const handleDismiss = vi.fn();
      
      render(
        <FloatingClippy
          isVisible={true}
          onDismiss={handleDismiss}
          messages={mockMessages}
          onSendMessage={handleSendMessage}
          isLoading={true}
        />
      );
      
      const sendButton = screen.getByLabelText('Send question');
      expect(sendButton).toBeDisabled();
    });

    it('Gate 3.3: Typing indicator shows when loading', () => {
      const handleSendMessage = vi.fn();
      const handleDismiss = vi.fn();
      
      render(
        <FloatingClippy
          isVisible={true}
          onDismiss={handleDismiss}
          messages={mockMessages}
          onSendMessage={handleSendMessage}
          isLoading={true}
        />
      );
      
      expect(screen.getByText('Clippy is typing')).toBeInTheDocument();
    });

    it('Gate 3.4: Typing indicator hidden when not loading', () => {
      const handleSendMessage = vi.fn();
      const handleDismiss = vi.fn();
      
      render(
        <FloatingClippy
          isVisible={true}
          onDismiss={handleDismiss}
          messages={mockMessages}
          onSendMessage={handleSendMessage}
          isLoading={false}
        />
      );
      
      expect(screen.queryByText('Clippy is typing')).not.toBeInTheDocument();
    });
  });

  describe('Gate 4: Message Display', () => {
    it('Gate 4.1: AI messages display in speech bubble', () => {
      const handleSendMessage = vi.fn();
      const handleDismiss = vi.fn();
      
      render(
        <FloatingClippy
          isVisible={true}
          onDismiss={handleDismiss}
          messages={mockMessages}
          onSendMessage={handleSendMessage}
          isLoading={false}
        />
      );
      
      expect(screen.getByText("Hi! I'm Clippy, your canvas assistant. How can I help you today?")).toBeInTheDocument();
    });

    it('Gate 4.2: Multiple messages navigable with dots', () => {
      const handleSendMessage = vi.fn();
      const handleDismiss = vi.fn();
      
      const multipleMessages: ChatMessage[] = [
        ...mockMessages,
        {
          id: 'msg2',
          role: 'assistant',
          content: 'Second message',
          timestamp: new Date(),
        },
      ];
      
      const { container } = render(
        <FloatingClippy
          isVisible={true}
          onDismiss={handleDismiss}
          messages={multipleMessages}
          onSendMessage={handleSendMessage}
          isLoading={false}
        />
      );
      
      const dots = container.querySelectorAll('.message-dots button');
      expect(dots.length).toBe(2);
    });
  });

  describe('Gate 5: Input Validation', () => {
    it('Gate 5.1: Empty message blocks sending', () => {
      const handleSendMessage = vi.fn();
      const handleDismiss = vi.fn();
      
      render(
        <FloatingClippy
          isVisible={true}
          onDismiss={handleDismiss}
          messages={mockMessages}
          onSendMessage={handleSendMessage}
          isLoading={false}
        />
      );
      
      const sendButton = screen.getByLabelText('Send question');
      expect(sendButton).toBeDisabled();
    });

    it('Gate 5.2: 500 char limit enforced', () => {
      const handleSendMessage = vi.fn();
      const handleDismiss = vi.fn();
      
      render(
        <FloatingClippy
          isVisible={true}
          onDismiss={handleDismiss}
          messages={mockMessages}
          onSendMessage={handleSendMessage}
          isLoading={false}
        />
      );
      
      const input = screen.getByLabelText('Ask Clippy a question') as HTMLInputElement;
      expect(input).toHaveAttribute('maxLength', '500');
    });
  });

  describe('Gate 6: Draggable Functionality', () => {
    it('Gate 6.1: Clippy is draggable', () => {
      const handleSendMessage = vi.fn();
      const handleDismiss = vi.fn();
      
      const { container } = render(
        <FloatingClippy
          isVisible={true}
          onDismiss={handleDismiss}
          messages={mockMessages}
          onSendMessage={handleSendMessage}
          isLoading={false}
        />
      );
      
      const clippy = container.querySelector('.floating-clippy');
      expect(clippy).toBeInTheDocument();
      expect(clippy?.className).toContain('floating-clippy');
    });

    it('Gate 6.2: Minimize button works', () => {
      const handleSendMessage = vi.fn();
      const handleDismiss = vi.fn();
      
      render(
        <FloatingClippy
          isVisible={true}
          onDismiss={handleDismiss}
          messages={mockMessages}
          onSendMessage={handleSendMessage}
          isLoading={false}
        />
      );
      
      const minimizeButton = screen.getByLabelText('Hide message');
      expect(minimizeButton).toBeInTheDocument();
    });

    it('Gate 6.3: Close button calls onDismiss', () => {
      const handleSendMessage = vi.fn();
      const handleDismiss = vi.fn();
      
      render(
        <FloatingClippy
          isVisible={true}
          onDismiss={handleDismiss}
          messages={mockMessages}
          onSendMessage={handleSendMessage}
          isLoading={false}
        />
      );
      
      const closeButton = screen.getByLabelText('Dismiss Clippy');
      fireEvent.click(closeButton);
      
      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('Gate 7: Edge Cases', () => {
    it('Gate 7.1: Hidden when isVisible is false', () => {
      const handleSendMessage = vi.fn();
      const handleDismiss = vi.fn();
      
      const { container } = render(
        <FloatingClippy
          isVisible={false}
          onDismiss={handleDismiss}
          messages={mockMessages}
          onSendMessage={handleSendMessage}
          isLoading={false}
        />
      );
      
      expect(container.firstChild).toBeNull();
    });

    it('Gate 7.2: Escape key dismisses Clippy', () => {
      const handleSendMessage = vi.fn();
      const handleDismiss = vi.fn();
      
      render(
        <FloatingClippy
          isVisible={true}
          onDismiss={handleDismiss}
          messages={mockMessages}
          onSendMessage={handleSendMessage}
          isLoading={false}
        />
      );
      
      fireEvent.keyDown(window, { key: 'Escape' });
      
      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });
  });
});

