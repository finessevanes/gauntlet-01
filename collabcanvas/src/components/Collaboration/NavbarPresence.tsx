import { usePresence } from '../../hooks/usePresence';
import { getPresenceStatus } from '../../services/presenceService';

export default function NavbarPresence() {
  const { onlineUsers, onlineCount } = usePresence();

  // Show max 3 user avatars, then "+X" for remaining
  const maxVisible = 3;
  const visibleUsers = onlineUsers.slice(0, maxVisible);
  const remainingCount = Math.max(0, onlineCount - maxVisible);

  if (onlineCount === 0) {
    return null;
  }

  // Count users by status
  const activeCount = onlineUsers.filter(u => getPresenceStatus(u) === 'active').length;
  const awayCount = onlineUsers.filter(u => getPresenceStatus(u) === 'away').length;

  // Status ring colors (Windows 95 style)
  const getStatusRingColor = (user: any) => {
    const status = getPresenceStatus(user);
    if (status === 'active') return '#00ff00';  // 🟢 Bright Green
    if (status === 'away') return '#0000ff';    // 🔵 Bright Blue
    return '#ff0000';                           // 🔴 Bright Red
  };

  const getStatusDotColor = (user: any) => {
    const status = getPresenceStatus(user);
    if (status === 'active') return '#00ff00';  // 🟢 Bright Green
    if (status === 'away') return '#0000ff';    // 🔵 Bright Blue
    return '#ff0000';                           // 🔴 Bright Red
  };

  return (
    <div style={styles.container}>
      {/* User avatars with status indicators */}
      <div style={styles.avatarStack}>
        {visibleUsers.map((user, index) => {
          const status = getPresenceStatus(user);
          const statusLabel = status === 'active' ? 'Active' : status === 'away' ? 'Away' : 'Offline';
          
          return (
            <div
              key={user.userId}
              style={{
                ...styles.avatarWrapper,
                marginLeft: index > 0 ? '-8px' : '0',
                zIndex: maxVisible - index,
              }}
            >
              <div
                style={{
                  ...styles.avatar,
                  backgroundColor: user.color,
                  borderColor: getStatusRingColor(user),
                }}
                title={`${user.username} (${statusLabel})`}
              >
                <span style={styles.avatarText}>
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              {/* Status dot overlay */}
              <div
                style={{
                  ...styles.statusDot,
                  backgroundColor: getStatusDotColor(user),
                }}
              />
            </div>
          );
        })}
        {remainingCount > 0 && (
          <div
            style={{
              ...styles.avatarWrapper,
              marginLeft: '-8px',
              zIndex: 0,
            }}
          >
            <div
              style={{
                ...styles.avatar,
                backgroundColor: '#6b7280',
                borderColor: 'white',
              }}
              title={`${remainingCount} more online`}
            >
              <span style={styles.avatarText}>+{remainingCount}</span>
            </div>
          </div>
        )}
      </div>

      {/* Status breakdown badge */}
      <div style={styles.statusBreakdown}>
        <div style={styles.statusRow}>
          <span style={styles.totalCount}>{onlineCount} online</span>
        </div>
        <div style={styles.statusRow}>
          {activeCount > 0 && (
            <span style={styles.statusItem}>
              <span style={{...styles.statusDotSmall, backgroundColor: '#00ff00'}}></span>
              {activeCount} active
            </span>
          )}
          {awayCount > 0 && (
            <span style={styles.statusItem}>
              <span style={{...styles.statusDotSmall, backgroundColor: '#0000ff'}}></span>
              {awayCount} away
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '3px 6px',
    backgroundColor: '#c0c0c0',
    border: '2px solid',
    borderColor: '#ffffff #808080 #808080 #ffffff',
    fontFamily: 'MS Sans Serif, Arial, sans-serif',
  },
  avatarStack: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  avatarWrapper: {
    position: 'relative' as const,
  },
  avatar: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid',
    cursor: 'pointer',
    boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.5), inset -1px -1px 0 rgba(0,0,0,0.3)',
  },
  avatarText: {
    color: 'white',
    fontSize: '10px',
    fontWeight: 'bold',
    userSelect: 'none' as const,
    textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
  },
  statusDot: {
    position: 'absolute' as const,
    bottom: '-3px',
    right: '-3px',
    width: '10px',
    height: '10px',
    border: '1px solid #000000',
    boxShadow: '0 0 0 1px #ffffff',
  },
  statusBreakdown: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
    paddingLeft: '6px',
    borderLeft: '2px solid',
    borderLeftColor: '#808080',
    marginLeft: '2px',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
  },
  totalCount: {
    fontWeight: 'bold',
    color: '#000000',
    fontSize: '11px',
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    color: '#000000',
    fontSize: '10px',
  },
  statusDotSmall: {
    width: '8px',
    height: '8px',
    display: 'inline-block',
    border: '1px solid #000000',
    marginRight: '2px',
  },
};

