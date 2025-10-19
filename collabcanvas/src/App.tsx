import { useState, useEffect, Profiler } from 'react';
import type { ProfilerOnRenderCallback } from 'react';
import { useAuth } from './hooks/useAuth';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import AppShell from './components/Layout/AppShell';
import Canvas from './components/Canvas/Canvas';
import { CanvasGallery } from './components/CanvasGallery/CanvasGallery';
import { CanvasProvider, useCanvasContext } from './contexts/CanvasContext';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

type View = 'gallery' | 'canvas';

/**
 * Inner app component that has access to CanvasContext
 */
function AppContent() {
  const { setCurrentCanvasId } = useCanvasContext();
  const [currentView, setCurrentView] = useState<View>('gallery');
  const [urlCanvasId, setUrlCanvasId] = useState<string | null>(null);

  // Parse URL and determine current view
  useEffect(() => {
    const parseUrl = () => {
      const pathname = window.location.pathname;
      
      // Match /canvas/:canvasId
      const canvasMatch = pathname.match(/^\/canvas\/([^\/]+)$/);
      if (canvasMatch) {
        const canvasId = canvasMatch[1];
        setUrlCanvasId(canvasId);
        setCurrentView('canvas');
        setCurrentCanvasId(canvasId);
        return;
      }
      
      // Default to gallery for / or /gallery
      setCurrentView('gallery');
      setUrlCanvasId(null);
      setCurrentCanvasId(null);
    };

    // Parse initial URL
    parseUrl();

    // Listen for back/forward button
    const handlePopState = () => {
      parseUrl();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [setCurrentCanvasId]);

  // Navigate to canvas
  const navigateToCanvas = (canvasId: string) => {
    const newUrl = `/canvas/${canvasId}`;
    window.history.pushState({}, '', newUrl);
    setUrlCanvasId(canvasId);
    setCurrentView('canvas');
    setCurrentCanvasId(canvasId);
  };

  // Navigate to gallery
  const navigateToGallery = () => {
    const newUrl = '/gallery';
    window.history.pushState({}, '', newUrl);
    setUrlCanvasId(null);
    setCurrentView('gallery');
    setCurrentCanvasId(null);
  };

  // Profiler callback to track Canvas render performance
  const handleCanvasProfiler: ProfilerOnRenderCallback = (
    _id,
    phase,
    actualDuration,
    _baseDuration
  ) => {
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

  // Render gallery view
  if (currentView === 'gallery') {
    return (
      <AppShell onNavigateToGallery={navigateToGallery}>
        <CanvasGallery onCanvasSelect={navigateToCanvas} />
      </AppShell>
    );
  }

  // Render canvas view
  if (currentView === 'canvas' && urlCanvasId) {
    return (
      <AppShell onNavigateToGallery={navigateToGallery}>
        <Profiler id="Canvas" onRender={handleCanvasProfiler}>
          <Canvas />
        </Profiler>
      </AppShell>
    );
  }

  // Fallback to gallery
  return (
    <AppShell onNavigateToGallery={navigateToGallery}>
      <CanvasGallery onCanvasSelect={navigateToCanvas} />
    </AppShell>
  );
}

function App() {
  const { user, userProfile, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(true);

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

  // If authenticated, show main app with routing
  return (
    <ErrorBoundary>
      <CanvasProvider>
        <AppContent />
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
