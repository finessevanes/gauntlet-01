import { useState, useCallback } from 'react';
import { canvasListService } from '../../services/canvasListService';
import { clipboardService } from '../../services/clipboardService';
import { useError } from '../../contexts/ErrorContext';

interface CopyLinkButtonProps {
  canvasId: string;
}

/**
 * CopyLinkButton - Quick copy shareable link from gallery (90s/00s style)
 * Owner-only, appears on canvas cards
 */
export function CopyLinkButton({ canvasId }: CopyLinkButtonProps) {
  const [copyButtonText, setCopyButtonText] = useState('📋 Copy');
  const [isCopied, setIsCopied] = useState(false);
  const { showError } = useError();

  const handleCopyLink = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    const shareableLink = canvasListService.generateShareableLink(canvasId);
    const success = await clipboardService.copyToClipboard(shareableLink);
    
    if (success) {
      setCopyButtonText('✓ Copied!');
      setIsCopied(true);
      
      // Reset button after 2 seconds
      setTimeout(() => {
        setCopyButtonText('📋 Copy');
        setIsCopied(false);
      }, 2000);
    } else {
      showError('Failed to copy link');
    }
  }, [canvasId, showError]);

  return (
    <button
      onClick={handleCopyLink}
      style={{
        ...styles.button,
        backgroundColor: isCopied ? '#90ee90' : '#c0c0c0',
      }}
      onMouseEnter={(e) => {
        if (!isCopied) {
          e.currentTarget.style.backgroundColor = '#d0d0d0';
        }
      }}
      onMouseLeave={(e) => {
        if (!isCopied) {
          e.currentTarget.style.backgroundColor = '#c0c0c0';
        }
      }}
      title="Copy shareable link"
      aria-label="Copy shareable link"
    >
      {copyButtonText}
    </button>
  );
}

const styles = {
  button: {
    padding: '0.3rem 0.6rem',
    backgroundColor: '#c0c0c0',
    border: '2px outset #c0c0c0',
    borderRadius: '0',
    fontSize: '0.65rem',
    fontWeight: 'bold' as const,
    fontFamily: "'MS Sans Serif', 'Segoe UI', sans-serif",
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: 'background-color 0.1s',
    boxShadow: '1px 1px 0 #000',
  } as React.CSSProperties,
};

