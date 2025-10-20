import { useState, useEffect } from 'react';
import { usePerformanceMetrics } from '../hooks/usePerformanceMonitor';
import { performanceMonitor } from '../utils/performanceMonitor';
import { requirementsMonitor, type PerformanceRequirement } from '../utils/performanceRequirements';

interface PerformancePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Performance Requirements Monitor (90s/00s Windows style)
 * Tracks 3 key requirements: FPS, Sync Times, Scale Capacity
 */
export default function PerformancePanel({ isOpen, onClose }: PerformancePanelProps) {
  const { clearMetrics, exportAsCSV } = usePerformanceMetrics();
  const [performanceMode, setPerformanceMode] = useState(false);
  
  // FPS tracking
  const [currentFPS, setCurrentFPS] = useState(60);
  const [fpsHistory, setFpsHistory] = useState<number[]>([]);
  const [isActiveMeasuring, setIsActiveMeasuring] = useState(false);
  
  // Requirements tracking
  const [requirements, setRequirements] = useState<PerformanceRequirement[]>([]);

  // Toggle console logging with performance mode
  useEffect(() => {
    performanceMonitor.setLogging(performanceMode);
  }, [performanceMode]);

  // Update requirements status periodically
  useEffect(() => {
    if (!isOpen || !performanceMode) return;

    const updateRequirements = () => {
      const reqs = requirementsMonitor.getRequirementsStatus(currentFPS);
      setRequirements(reqs);
    };

    // Update immediately
    updateRequirements();

    // Update every 2 seconds
    const interval = setInterval(updateRequirements, 2000);

    return () => clearInterval(interval);
  }, [isOpen, performanceMode, currentFPS]);

  // FPS tracking with requestAnimationFrame
  useEffect(() => {
    if (!isOpen || !performanceMode) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;
    let lastActivityTime = performance.now();

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      const elapsed = currentTime - lastTime;

      // Show "actively measuring" pulse when frames are rendering
      // If we're getting frames, we're actively measuring
      if (currentTime - lastActivityTime < 100) {
        setIsActiveMeasuring(true);
      } else {
        setIsActiveMeasuring(false);
      }
      lastActivityTime = currentTime;

      // Update FPS every second
      if (elapsed >= 1000) {
        const fps = Math.round((frameCount * 1000) / elapsed);
        setCurrentFPS(fps);
        
        // Keep last 30 seconds of FPS history
        setFpsHistory(prev => {
          const newHistory = [...prev, fps];
          return newHistory.slice(-30);
        });

        frameCount = 0;
        lastTime = currentTime;
      }

      animationFrameId = requestAnimationFrame(measureFPS);
    };

    animationFrameId = requestAnimationFrame(measureFPS);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isOpen, performanceMode]);

  if (!isOpen) return null;

  const getFPSStatus = (fps: number) => {
    if (fps >= 55) return { emoji: '🟢', text: 'Excellent', color: '#008000' };
    if (fps >= 30) return { emoji: '🟡', text: 'Good', color: '#0066cc' };
    if (fps >= 20) return { emoji: '🟠', text: 'Choppy', color: '#ff8c00' };
    return { emoji: '🔴', text: 'Very Slow', color: '#cc0000' };
  };
  
  const avgFPS = fpsHistory.length > 0 
    ? Math.round(fpsHistory.reduce((sum, fps) => sum + fps, 0) / fpsHistory.length)
    : currentFPS;
  const minFPS = fpsHistory.length > 0 ? Math.min(...fpsHistory) : currentFPS;

  const handleExportCSV = () => {
    const csv = exportAsCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-log-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Add keyframes animation for pulse effect */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
      `}</style>
      
      <div style={styles.overlay}>
        <div style={styles.panel}>
        {/* Title Bar (Windows 95 style) */}
        <div style={styles.titleBar}>
          <div style={styles.titleSection}>
            <span style={styles.titleIcon}>⚡</span>
            <span style={styles.titleText}>Performance Requirements</span>
            <span style={styles.titleBadge}>
              {requirements.filter(r => r.status === 'met').length}/{requirements.length}
            </span>
          </div>
          <div style={styles.windowControls}>
            <button style={styles.windowButton} title="Minimize">─</button>
            <button style={styles.windowButton} title="Maximize">□</button>
            <button onClick={onClose} style={styles.windowButton} title="Close">✕</button>
          </div>
        </div>

        {/* Toolbar (Windows 95 style) */}
        <div style={styles.toolbar}>
          <div style={styles.toolbarSection}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={performanceMode}
                onChange={(e) => setPerformanceMode(e.target.checked)}
                style={styles.checkbox}
              />
              <span style={styles.checkboxText}>
                {performanceMode ? '● Recording' : '○ Paused'}
              </span>
            </label>
          </div>
          <div style={styles.toolbarButtons}>
            <button onClick={clearMetrics} style={styles.toolbarButton}>
              Clear
            </button>
            <button onClick={handleExportCSV} style={styles.toolbarButton}>
              Export...
            </button>
          </div>
        </div>


        {/* Content Area */}
        <div style={styles.content}>
            <>
              {/* FPS Monitor */}
              <div style={styles.fpsPanel}>
                <div style={styles.fpsBigNumber}>
                  <div style={styles.fpsLiveBadge}>
                    <span style={{
                      ...styles.liveDot,
                      animation: isActiveMeasuring ? 'pulse 1s ease-in-out infinite' : 'none',
                      backgroundColor: isActiveMeasuring ? '#00ff00' : '#666666'
                    }}>●</span>
                    <span style={styles.liveText}>
                      {isActiveMeasuring ? 'LIVE' : 'IDLE'}
                    </span>
                  </div>
                  <div style={styles.fpsValue}>
                    <span style={{...styles.fpsNumber, color: getFPSStatus(currentFPS).color}}>
                      {currentFPS}
                    </span>
                    <span style={styles.fpsLabel}>FPS</span>
                  </div>
                  <div style={styles.fpsStatus}>
                    {getFPSStatus(currentFPS).emoji} {getFPSStatus(currentFPS).text}
                  </div>
                </div>
                <div style={styles.fpsStats}>
                  <div style={styles.fpsStatRow}>
                    <span style={styles.fpsStatLabel}>Average (30s):</span>
                    <span style={styles.fpsStatValue}>
                      {avgFPS} FPS {getFPSStatus(avgFPS).emoji}
                    </span>
                  </div>
                  <div style={styles.fpsStatRow}>
                    <span style={styles.fpsStatLabel}>Lowest (30s):</span>
                    <span style={styles.fpsStatValue}>
                      {minFPS} FPS {getFPSStatus(minFPS).emoji}
                    </span>
                  </div>
                  <div style={styles.fpsStatRow}>
                    <span style={styles.fpsStatLabel}>Target:</span>
                    <span style={styles.fpsStatValue}>60 FPS 🎯</span>
                  </div>
                  {/* Mini FPS History Graph */}
                  {fpsHistory.length > 0 && (
                    <div style={styles.fpsGraphContainer}>
                      <div style={styles.fpsGraph}>
                        {fpsHistory.slice(-15).map((fps, idx) => {
                          const height = Math.min((fps / 60) * 100, 100);
                          const color = fps >= 55 ? '#00ff00' : fps >= 30 ? '#ffff00' : '#ff0000';
                          return (
                            <div
                              key={idx}
                              style={{
                                ...styles.fpsBar,
                                height: `${height}%`,
                                backgroundColor: color,
                              }}
                              title={`${fps} FPS`}
                            />
                          );
                        })}
                      </div>
                      <div style={styles.fpsGraphLabel}>Last 15 seconds</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Requirements Dashboard */}
              <div style={styles.requirementsSection}>
                <div style={styles.requirementsSectionTitle}>Performance Requirements</div>
                <div style={styles.requirementsGrid}>
                  {requirements.map((req, idx) => {
                    const statusColor = 
                      req.status === 'met' ? '#008000' : 
                      req.status === 'warning' ? '#ff8c00' : 
                      '#cc0000';
                    const statusIcon = 
                      req.status === 'met' ? '✓' : 
                      req.status === 'warning' ? '⚠' : 
                      '✗';
                    const statusBg = 
                      req.status === 'met' ? '#e6ffe6' : 
                      req.status === 'warning' ? '#fff4e6' : 
                      '#ffe6e6';

                    // Check if "higher is better" or "lower is better"
                    const higherIsBetter = req.unit === 'FPS' || req.unit === 'objects' || req.unit === 'users';
                    const comparison = higherIsBetter 
                      ? `${req.current}/${req.target}`
                      : `${req.current.toFixed(0)}ms (target: <${req.target}ms)`;

                    return (
                      <div key={idx} style={{...styles.requirementCard, backgroundColor: statusBg}}>
                        <div style={styles.requirementHeader}>
                          <span style={styles.requirementName}>{req.name}</span>
                          <span style={{...styles.requirementStatus, color: statusColor}}>
                            {statusIcon} {req.status.toUpperCase()}
                          </span>
                        </div>
                        <div style={styles.requirementValue}>
                          {req.current === 0 && req.unit === 'ms' ? 'N/A' : comparison}
                        </div>
                        <div style={styles.requirementDescription}>{req.description}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Simple Guide */}
              <div style={styles.simpleGuide}>
                <div style={styles.guideTitle}>📖 Quick Guide</div>
                <div style={styles.guideRow}>
                  <strong>Goal:</strong> All requirements show ✓ MET (green)
                </div>
                <div style={styles.guideRow}>
                  ⚠ <strong>WARNING</strong> (orange) = Close to failing
                </div>
                <div style={styles.guideRow}>
                  ✗ <strong>FAILING</strong> (red) = Performance issue - needs optimization
                </div>
              </div>
            </>
        </div>

        {/* Status Bar (Windows 95 style) */}
        <div style={styles.statusBar}>
          <div style={styles.statusBarSection}>
            {performanceMode ? '● Monitoring active' : '○ Monitoring paused'}
          </div>
          <div style={styles.statusBarDivider} />
          <div style={styles.statusBarSection}>
            {isActiveMeasuring ? '🔴 LIVE' : '⚪ IDLE'}
          </div>
          <div style={styles.statusBarDivider} />
          <div style={styles.statusBarSection}>
            📌 You can work while this is open
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

// Windows 95/98 Retro Styles
const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    justifyContent: 'flex-end',
    zIndex: 9999,
    pointerEvents: 'none', // Allow clicks to pass through to canvas
  },
  panel: {
    width: '450px',
    height: '100%',
    backgroundColor: '#c0c0c0',
    boxShadow: 'inset 1px 1px 0 #ffffff, inset -1px -1px 0 #808080',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'MS Sans Serif, Arial, sans-serif',
    fontSize: '11px',
    pointerEvents: 'auto', // Re-enable clicks on the panel itself
  },
  titleBar: {
    height: '24px',
    background: 'linear-gradient(to right, #000080, #1084d0)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 4px',
    boxShadow: 'inset 0 1px 0 #0a246a',
  },
  titleSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  titleIcon: {
    fontSize: '14px',
  },
  titleText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '11px',
    textShadow: '1px 1px 0 #000000',
  },
  titleBadge: {
    backgroundColor: '#dfdfdf',
    color: '#000000',
    padding: '1px 6px',
    borderRadius: '2px',
    fontSize: '10px',
    fontWeight: 'bold',
    boxShadow: 'inset 1px 1px 0 #ffffff, inset -1px -1px 0 #808080',
  },
  windowControls: {
    display: 'flex',
    gap: '2px',
    alignItems: 'center',
  },
  windowButton: {
    width: '16px',
    height: '14px',
    backgroundColor: '#c0c0c0',
    border: '1px solid',
    borderColor: '#ffffff #000000 #000000 #ffffff',
    color: '#000000',
    fontSize: '10px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  toolbar: {
    backgroundColor: '#c0c0c0',
    padding: '4px',
    borderBottom: '1px solid #808080',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toolbarSection: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
  },
  checkbox: {
    margin: 0,
  },
  checkboxText: {
    fontSize: '11px',
    fontWeight: 'bold',
  },
  toolbarButtons: {
    display: 'flex',
    gap: '4px',
  },
  toolbarButton: {
    padding: '3px 12px',
    backgroundColor: '#c0c0c0',
    border: '2px solid',
    borderColor: '#ffffff #000000 #000000 #ffffff',
    fontSize: '11px',
    cursor: 'pointer',
    fontFamily: 'MS Sans Serif, Arial, sans-serif',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    backgroundColor: '#c0c0c0',
    padding: '8px',
  },
  fpsPanel: {
    backgroundColor: '#000080',
    border: '2px solid',
    borderColor: '#808080 #ffffff #ffffff #808080',
    padding: '12px',
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
  },
  fpsBigNumber: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  fpsLiveBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginBottom: '4px',
  },
  liveDot: {
    fontSize: '12px',
    lineHeight: '1',
  },
  liveText: {
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: '1px',
  },
  fpsValue: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
  },
  fpsNumber: {
    fontSize: '48px',
    fontWeight: 'bold',
    fontFamily: 'Courier New, monospace',
    lineHeight: '1',
    textShadow: '2px 2px 0 rgba(0,0,0,0.3)',
  },
  fpsLabel: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#ffffff',
    textShadow: '1px 1px 0 rgba(0,0,0,0.3)',
  },
  fpsStatus: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  fpsStats: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  fpsStatRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fpsStatLabel: {
    fontSize: '11px',
    color: '#ffffff',
    fontWeight: 'bold',
  },
  fpsStatValue: {
    fontSize: '11px',
    color: '#ffff00',
    fontFamily: 'Courier New, monospace',
    fontWeight: 'bold',
  },
  fpsGraphContainer: {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid rgba(255, 255, 255, 0.2)',
  },
  fpsGraph: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '2px',
    height: '40px',
    padding: '4px',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '2px',
  },
  fpsBar: {
    flex: 1,
    minWidth: '3px',
    transition: 'height 0.3s ease, background-color 0.3s ease',
    borderRadius: '1px',
  },
  fpsGraphLabel: {
    fontSize: '9px',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: '4px',
    opacity: 0.7,
  },
  requirementsSection: {
    marginBottom: '8px',
  },
  requirementsSectionTitle: {
    fontWeight: 'bold',
    fontSize: '12px',
    color: '#000000',
    marginBottom: '6px',
    padding: '0 2px',
  },
  requirementsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px',
  },
  requirementCard: {
    border: '2px solid',
    borderColor: '#808080 #ffffff #ffffff #808080',
    padding: '8px',
    borderRadius: '2px',
  },
  requirementHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  requirementName: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#000000',
  },
  requirementStatus: {
    fontSize: '9px',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
  },
  requirementValue: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#000000',
    fontFamily: 'Courier New, monospace',
    marginBottom: '4px',
  },
  requirementDescription: {
    fontSize: '9px',
    color: '#666666',
    lineHeight: '1.3',
  },
  simpleGuide: {
    backgroundColor: '#ffffe0',
    border: '2px solid',
    borderColor: '#808080 #ffffff #ffffff #808080',
    padding: '8px',
    fontSize: '10px',
    color: '#000000',
  },
  guideTitle: {
    fontWeight: 'bold',
    marginBottom: '6px',
    color: '#000000',
    fontSize: '11px',
  },
  guideRow: {
    marginBottom: '4px',
    color: '#000000',
    lineHeight: '1.4',
  },
  statusBar: {
    height: '20px',
    backgroundColor: '#c0c0c0',
    borderTop: '2px solid',
    borderColor: '#ffffff #808080 #808080 #ffffff',
    display: 'flex',
    alignItems: 'center',
    fontSize: '10px',
    padding: '0 4px',
  },
  statusBarSection: {
    padding: '0 6px',
  },
  statusBarDivider: {
    width: '2px',
    height: '16px',
    backgroundColor: '#808080',
    marginRight: '1px',
    boxShadow: '1px 0 0 #ffffff',
  },
};

