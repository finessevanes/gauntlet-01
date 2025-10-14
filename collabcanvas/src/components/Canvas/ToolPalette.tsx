import { useCanvasContext } from '../../contexts/CanvasContext';

interface Tool {
  id: string;
  icon: string;
  name: string;
  active: boolean;
}

export default function ToolPalette() {
  const { isDrawMode, setIsDrawMode, isBombMode, setIsBombMode, selectedColor } = useCanvasContext();

  const tools: Tool[] = [
    { id: 'pan', icon: '✋', name: 'Pan / Move Canvas', active: !isDrawMode && !isBombMode },
    { id: 'rectangle', icon: '⬜', name: 'Rectangle / Draw', active: isDrawMode },
    { id: 'bomb', icon: '💣', name: 'Bomb / Clear Canvas', active: isBombMode },
  ];

  const handleToolClick = (toolId: string) => {
    if (toolId === 'rectangle') {
      setIsDrawMode(true);
      setIsBombMode(false);
    } else if (toolId === 'pan') {
      setIsDrawMode(false);
      setIsBombMode(false);
    } else if (toolId === 'bomb') {
      setIsDrawMode(false);
      setIsBombMode(true);
    }
  };

  return (
    <div style={styles.palette}>
      <div style={styles.toolGrid}>
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => handleToolClick(tool.id)}
            style={{
              ...styles.toolButton,
              ...(tool.active ? styles.activeTool : {}),
            }}
            title={tool.name}
            aria-label={tool.name}
          >
            {tool.id === 'rectangle' ? (
              <div style={styles.rectangleIcon} />
            ) : (
              tool.icon
            )}
          </button>
        ))}
      </div>
      
      {/* Current Colors Display */}
      <div style={styles.colorDisplay}>
        <div style={styles.colorSquares}>
          {/* Primary and secondary color overlapping squares (Paint style) */}
          <div style={{ position: 'relative', width: '50px', height: '50px' }}>
            <div style={{
              ...styles.primaryColor,
              backgroundColor: selectedColor,
            }} />
            <div style={{
              ...styles.secondaryColor,
              backgroundColor: '#ffffff',
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  palette: {
    position: 'fixed' as const,
    left: 0,
    top: '67px', // Below title bar + menu bar
    width: '70px',
    backgroundColor: '#f0f0f0',
    borderRight: '1px solid #c0c0c0',
    borderBottom: '1px solid #c0c0c0',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    zIndex: 900,
    boxShadow: 'inset -1px -1px 0 0 #808080, inset 1px 1px 0 0 #ffffff',
  },
  toolGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  toolButton: {
    width: '54px',
    height: '54px',
    backgroundColor: '#d8d8d8',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    padding: 0,
    transition: 'none',
    boxShadow: 'inset -1px -1px 0 0 #808080, inset 1px 1px 0 0 #ffffff',
    borderRadius: '3px',
    fontWeight: 'bold' as const,
  },
  rectangleIcon: {
    width: '32px',
    height: '24px',
    backgroundColor: 'transparent',
    border: '2px dashed #000000',
    boxSizing: 'border-box' as const,
  },
  activeTool: {
    backgroundColor: '#c0c0c0',
    boxShadow: 'inset 1px 1px 0 0 #808080, inset -1px -1px 0 0 #ffffff',
  },
  colorDisplay: {
    marginTop: '8px',
    padding: '6px',
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
    boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.2)',
  },
  colorSquares: {
    display: 'flex',
    justifyContent: 'center',
  },
  primaryColor: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '34px',
    height: '34px',
    border: '2px solid #000000',
    boxShadow: 'inset -1px -1px 0 0 rgba(0,0,0,0.3), inset 1px 1px 0 0 rgba(255,255,255,0.5), 0 2px 4px rgba(0,0,0,0.2)',
  },
  secondaryColor: {
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    width: '34px',
    height: '34px',
    border: '2px solid #000000',
    boxShadow: 'inset -1px -1px 0 0 rgba(0,0,0,0.3), inset 1px 1px 0 0 rgba(255,255,255,0.5), 0 2px 4px rgba(0,0,0,0.2)',
  },
};

