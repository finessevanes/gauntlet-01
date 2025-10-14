import { usePresence } from '../../hooks/usePresence';

export default function NavbarPresence() {
  const { onlineUsers, onlineCount } = usePresence();

  // Show max 3 user avatars, then "+X" for remaining
  const maxVisible = 3;
  const visibleUsers = onlineUsers.slice(0, maxVisible);
  const remainingCount = Math.max(0, onlineCount - maxVisible);

  if (onlineCount === 0) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.avatarStack}>
        {visibleUsers.map((user, index) => (
          <div
            key={user.userId}
            style={{
              ...styles.avatar,
              backgroundColor: user.color,
              marginLeft: index > 0 ? '-8px' : '0',
              zIndex: maxVisible - index,
            }}
            title={user.username}
          >
            <span style={styles.avatarText}>
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
        ))}
        {remainingCount > 0 && (
          <div
            style={{
              ...styles.avatar,
              backgroundColor: '#6b7280',
              marginLeft: '-8px',
              zIndex: 0,
            }}
            title={`${remainingCount} more online`}
          >
            <span style={styles.avatarText}>+{remainingCount}</span>
          </div>
        )}
      </div>
      <div style={styles.countBadge}>
        <span style={styles.countText}>{onlineCount}</span>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  avatarStack: {
    display: 'flex',
    alignItems: 'center',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid white',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    transition: 'transform 0.15s',
  },
  avatarText: {
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: '600',
    userSelect: 'none' as const,
  },
  countBadge: {
    backgroundColor: '#3b82f6',
    color: 'white',
    borderRadius: '12px',
    padding: '0.25rem 0.625rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: '0.75rem',
    fontWeight: '600',
  },
};

