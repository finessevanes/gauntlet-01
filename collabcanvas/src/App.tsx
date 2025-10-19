import { useState, Profiler } from 'react';
import type { ProfilerOnRenderCallback } from 'react';
import { useAuth } from './hooks/useAuth';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import AppShell from './components/Layout/AppShell';
import Canvas from './components/Canvas/Canvas';
import { CanvasProvider } from './contexts/CanvasContext';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

function App() {
  const { user, userProfile, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(true);

  // Profiler callback to track Canvas render performance
  const handleCanvasProfiler: ProfilerOnRenderCallback = (
    _id,
    phase,
    actualDuration,
    _baseDuration
  ) => {
    // Log performance data (React Profiler already measured it for us)
    // Disabled to reduce console noise
    // if (process.env.NODE_ENV === 'development') {
    //   console.log(`⚛️ ${id} ${phase}:`, {
    //     actualDuration: actualDuration.toFixed(2) + 'ms',
    //     baseDuration: baseDuration.toFixed(2) + 'ms',
    //     renderType: phase === 'mount' ? 'Initial Render' : 'Re-render',
    //   });
    // }

    // Emit user-friendly event for the retro performance panel
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('user-action', {
          detail: {
            action: phase === 'mount' 
              ? 'Screen loaded for the first time (full initialization)' 
              : `Screen refreshed with your changes (${actualDuration.toFixed(1)}ms total)`,
            duration: actualDuration,
            icon: '⚛️',
          },
        })
      );
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading...</p>
      </div>
    );
  }

  // If not authenticated or no user profile, show login/signup
  if (!user || !userProfile) {
    return showLogin ? (
      <Login onSwitchToSignup={() => setShowLogin(false)} />
    ) : (
      <Signup onSwitchToLogin={() => setShowLogin(true)} />
    );
  }

  // If authenticated, show main app with canvas
  return (
    <ErrorBoundary>
      <CanvasProvider>
        <AppShell>
          <Profiler id="Canvas" onRender={handleCanvasProfiler}>
            <Canvas />
          </Profiler>
        </AppShell>
      </CanvasProvider>
    </ErrorBoundary>
  );
}

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '1rem',
    color: '#6b7280',
    fontSize: '0.875rem',
  },
};

export default App;
