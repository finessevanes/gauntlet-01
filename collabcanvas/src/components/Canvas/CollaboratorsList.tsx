import type { CollaboratorInfo } from '../../services/types/canvasTypes';

interface CollaboratorsListProps {
  canvasId: string;
  collaborators: CollaboratorInfo[];
  loading: boolean;
}

/**
 * CollaboratorsList - Display list of canvas collaborators (90s/00s style)
 * Shows avatar/initial, name/email, and role badge
 */
export default function CollaboratorsList({ collaborators, loading }: CollaboratorsListProps) {
  // Loading state
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingText}>Loading collaborators...</div>
      </div>
    );
  }

  // Empty state
  if (collaborators.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyText}>No collaborators yet</div>
      </div>
    );
  }

  // Only owner case
  if (collaborators.length === 1 && collaborators[0].isOwner) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyText}>
          You're the only person with access. Share the link to invite collaborators!
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container} role="list" aria-label="Collaborators">
      {collaborators.map((collaborator) => (
        <div 
          key={collaborator.userId} 
          style={styles.collaboratorItem}
          role="listitem"
        >
          <div style={styles.avatar}>
            {getInitial(collaborator.displayName || collaborator.email)}
          </div>
          <div style={styles.info}>
            <div style={styles.name}>
              {collaborator.displayName || collaborator.email}
            </div>
            <div style={styles.email}>
              {collaborator.displayName && collaborator.email}
            </div>
          </div>
          <div style={styles.badge}>
            {collaborator.isOwner ? '[Owner]' : '[Collaborator]'}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Get first initial from name or email
 */
function getInitial(text: string): string {
  return text.charAt(0).toUpperCase();
}

const styles = {
  container: {
    border: '2px inset #808080',
    backgroundColor: '#fff',
    padding: '0.5rem',
    maxHeight: '200px',
    overflowY: 'auto' as const,
    minHeight: '60px',
  },
  loadingText: {
    textAlign: 'center' as const,
    fontSize: '0.75rem',
    color: '#666',
    padding: '1rem',
  },
  emptyText: {
    textAlign: 'center' as const,
    fontSize: '0.75rem',
    color: '#666',
    padding: '0.5rem',
    lineHeight: '1.4',
  },
  collaboratorItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem',
    borderBottom: '1px solid #e0e0e0',
    fontSize: '0.75rem',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold' as const,
    fontSize: '0.875rem',
    border: '2px solid #808080',
    flexShrink: 0,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontWeight: 'bold' as const,
    color: '#000',
    fontSize: '0.75rem',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  email: {
    fontSize: '0.625rem',
    color: '#666',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  badge: {
    fontSize: '0.625rem',
    fontWeight: 'bold' as const,
    color: '#000',
    padding: '0.2rem 0.4rem',
    backgroundColor: '#f0f0f0',
    border: '1px solid #808080',
    whiteSpace: 'nowrap' as const,
  },
};

