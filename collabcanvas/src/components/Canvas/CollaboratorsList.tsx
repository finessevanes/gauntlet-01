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
    border: '1px solid',
    borderColor: '#808080 #dfdfdf #dfdfdf #808080',
    boxShadow: 'inset -1px -1px 0 0 #ffffff, inset 1px 1px 0 0 #000000',
    backgroundColor: '#fff',
    padding: '8px',
    maxHeight: '180px',
    overflowY: 'auto' as const,
    minHeight: '80px',
    fontFamily: "'MS Sans Serif', sans-serif",
  },
  loadingText: {
    textAlign: 'center' as const,
    fontSize: '11px',
    color: '#000',
    padding: '16px',
  },
  emptyText: {
    textAlign: 'center' as const,
    fontSize: '11px',
    color: '#000',
    padding: '12px',
    lineHeight: '1.4',
  },
  collaboratorItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 4px',
    borderBottom: '1px solid #c0c0c0',
    fontSize: '11px',
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '0', // Square for 90s style
    backgroundColor: '#000080',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold' as const,
    fontSize: '11px',
    border: '2px solid',
    borderColor: '#ffffff #000000 #000000 #ffffff',
    flexShrink: 0,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontWeight: 'bold' as const,
    color: '#000',
    fontSize: '11px',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  email: {
    fontSize: '10px',
    color: '#808080',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  badge: {
    fontSize: '10px',
    fontWeight: 'bold' as const,
    color: '#000',
    padding: '2px 6px',
    backgroundColor: '#c0c0c0',
    border: '1px solid',
    borderColor: '#ffffff #000000 #000000 #ffffff',
    whiteSpace: 'nowrap' as const,
  },
};

