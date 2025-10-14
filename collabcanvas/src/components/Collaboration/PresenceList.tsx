import { usePresence } from '../../hooks/usePresence';
import UserPresenceBadge from './UserPresenceBadge';

export default function PresenceList() {
  const { onlineUsers, onlineCount } = usePresence();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Online Users</h3>
        <span style={styles.count}>{onlineCount}</span>
      </div>
      
      <div style={styles.userList}>
        {onlineUsers.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyText}>No other users online</span>
          </div>
        ) : (
          onlineUsers.map((user) => (
            <UserPresenceBadge
              key={user.userId}
              username={user.username}
              color={user.color}
              online={user.online}
            />
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    padding: '1rem',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    minWidth: '250px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  },
  count: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: 600,
    width: '24px',
    height: '24px',
    borderRadius: '50%',
  },
  userList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  emptyState: {
    padding: '1.5rem 1rem',
    textAlign: 'center' as const,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: '0.875rem',
    fontStyle: 'italic' as const,
  },
};

