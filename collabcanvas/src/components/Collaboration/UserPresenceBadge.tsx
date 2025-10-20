import { getPresenceStatus, type PresenceUser } from '../../services/presenceService';

interface UserPresenceBadgeProps {
  username: string;
  color: string;
  online: boolean;
  active?: boolean;
}

export default function UserPresenceBadge({ username, color, online, active = false }: UserPresenceBadgeProps) {
  const status = getPresenceStatus({ online, active } as PresenceUser);
  
  // Status colors
  const statusColors = {
    active: '#10b981',   // 🟢 Green
    away: '#3b82f6',     // 🔵 Blue
    offline: '#ef4444',  // 🔴 Red
  };
  
  const statusLabels = {
    active: 'Active',
    away: 'Away',
    offline: 'Offline',
  };
  
  return (
    <div style={styles.badge}>
      <div
        style={{
          ...styles.dot,
          backgroundColor: online ? color : '#9ca3af',
          opacity: online ? 1 : 0.5,
        }}
      />
      <span style={{
        ...styles.username,
        opacity: online ? 1 : 0.6,
      }}>
        {username}
      </span>
      <span 
        style={{
          ...styles.statusIndicator,
          color: statusColors[status],
        }}
        title={statusLabels[status]}
      >
        ●
      </span>
    </div>
  );
}

const styles = {
  badge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    fontSize: '0.875rem',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  dot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    border: '2px solid white',
    boxShadow: '0 0 0 1px #e5e7eb',
  } as React.CSSProperties,
  username: {
    flex: 1,
    color: '#374151',
    fontWeight: 500,
  } as React.CSSProperties,
  statusIndicator: {
    fontSize: '0.75rem',
    fontWeight: 600,
    lineHeight: 1,
  } as React.CSSProperties,
};

