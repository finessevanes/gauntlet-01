import { useState } from 'react';
import ShareModal from './ShareModal';

interface ShareButtonProps {
  canvasId: string;
  isOwner: boolean;
}

/**
 * ShareButton - Button to open share modal (90s/00s style)
 * Only visible to canvas owners
 */
export default function ShareButton({ canvasId, isOwner }: ShareButtonProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Don't render if user is not the owner
  if (!isOwner) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsShareModalOpen(true)}
        style={styles.shareButton}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#d0d0d0';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#c0c0c0';
        }}
        aria-label="Share canvas"
        title="Share this canvas with others"
      >
        <span style={styles.shareIcon}>🔗</span>
        <span style={styles.shareText}>Share</span>
      </button>

      {isShareModalOpen && (
        <ShareModal
          canvasId={canvasId}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </>
  );
}

const styles = {
  shareButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#c0c0c0',
    border: '2px outset #c0c0c0',
    borderRadius: '0', // No rounded corners for 90s style
    fontSize: '0.875rem',
    fontWeight: 'bold' as const,
    fontFamily: "'MS Sans Serif', 'Segoe UI', sans-serif",
    cursor: 'pointer',
    transition: 'background-color 0.1s',
    boxShadow: '1px 1px 0 #000, inset 1px 1px 0 #fff',
  } as React.CSSProperties,
  shareIcon: {
    fontSize: '1rem',
  },
  shareText: {
    color: '#000',
  },
};

