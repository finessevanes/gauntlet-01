interface StatusBarProps {
  canvasWidth: number;
  canvasHeight: number;
  cursorX?: number;
  cursorY?: number;
  zoom: number;
  selectedShapes?: string[];
  shapes?: Array<{ id: string; groupId: string | null }>;
  onPerformanceClick?: () => void;
}

export default function StatusBar({ 
  canvasWidth, 
  canvasHeight, 
  cursorX, 
  cursorY, 
  zoom,
  selectedShapes = [],
  shapes = [],
  onPerformanceClick
}: StatusBarProps) {
  // Check if any selected shapes are grouped
  const firstSelectedShape = selectedShapes.length > 0 
    ? shapes.find(s => selectedShapes.includes(s.id))
    : null;
  
  const hasGroupedShapes = firstSelectedShape?.groupId !== null && firstSelectedShape?.groupId !== undefined;
  const groupId = hasGroupedShapes ? firstSelectedShape?.groupId : null;
  const shapesInGroup = groupId ? shapes.filter(s => s.groupId === groupId).length : 0;

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
      {hasGroupedShapes && (
        <>
          <div style={styles.divider} />
          <div style={styles.groupedStatusSection}>
            <span style={{ fontSize: '12px', marginRight: '4px' }}>🔒</span>
            {shapesInGroup} {shapesInGroup === 1 ? 'shape' : 'shapes'} grouped
          </div>
        </>
      )}
      {/* Performance Button */}
      <div style={{ marginLeft: 'auto' }} />
      {onPerformanceClick && (
        <>
          <div style={styles.divider} />
          <button
            onClick={onPerformanceClick}
            style={styles.performanceButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e0e0e0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Open Performance Monitor"
          >
            ⚡ Performance
          </button>
        </>
      )}
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
  groupedStatusSection: {
    padding: '0 8px',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#0066cc',
    color: '#ffffff',
    fontWeight: 500,
  },
  divider: {
    width: '1px',
    height: '16px',
    backgroundColor: '#808080',
    boxShadow: '1px 0 0 0 #ffffff',
  },
  performanceButton: {
    padding: '0 12px',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '11px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    cursor: 'pointer',
    color: '#000000',
    transition: 'background-color 0.2s',
    fontWeight: 500,
  },
};

