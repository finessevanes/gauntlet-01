interface UserPresenceBadgeProps {
  username: string;
  color: string;
  online: boolean;
}

export default function UserPresenceBadge({ username, color, online }: UserPresenceBadgeProps) {
  return (
    <div style={styles.badge}>
      <div
        style={{
          ...styles.dot,
          backgroundColor: online ? color : '#9ca3af',
        }}
      />
      <span style={styles.username}>{username}</span>
      {online && <span style={styles.onlineIndicator}>●</span>}
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
  onlineIndicator: {
    color: '#10b981',
    fontSize: '0.625rem',
    animation: 'pulse 2s ease-in-out infinite',
  } as React.CSSProperties,
};

