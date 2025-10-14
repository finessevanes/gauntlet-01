interface StatusBarProps {
  canvasWidth: number;
  canvasHeight: number;
  cursorX?: number;
  cursorY?: number;
  zoom: number;
}

export default function StatusBar({ 
  canvasWidth, 
  canvasHeight, 
  cursorX, 
  cursorY, 
  zoom 
}: StatusBarProps) {
  return (
    <div style={styles.statusBar}>
      <div style={styles.statusSection}>
        For Help, click Help Topics on the Help Menu.
      </div>
      <div style={styles.divider} />
      <div style={styles.statusSection}>
        {cursorX !== undefined && cursorY !== undefined 
          ? `${Math.round(cursorX)}, ${Math.round(cursorY)}`
          : ''}
      </div>
      <div style={styles.divider} />
      <div style={styles.statusSection}>
        {canvasWidth}x{canvasHeight}px
      </div>
      <div style={styles.divider} />
      <div style={styles.statusSection}>
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}

const styles = {
  statusBar: {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: '20px',
    backgroundColor: '#f0f0f0',
    borderTop: '1px solid #ffffff',
    boxShadow: 'inset 0 1px 0 0 #ffffff',
    display: 'flex',
    alignItems: 'center',
    fontSize: '11px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    zIndex: 100,
    paddingLeft: '4px',
  },
  statusSection: {
    padding: '0 8px',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    color: '#000000',
  },
  divider: {
    width: '1px',
    height: '16px',
    backgroundColor: '#808080',
    boxShadow: '1px 0 0 0 #ffffff',
  },
};

