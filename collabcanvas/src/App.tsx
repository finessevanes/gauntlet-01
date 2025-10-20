import { useState, useEffect, Profiler } from 'react';
import type { ProfilerOnRenderCallback } from 'react';
import { useAuth } from './hooks/useAuth';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import AppShell from './components/Layout/AppShell';
import Canvas from './components/Canvas/Canvas';
import { CanvasGallery } from './components/CanvasGallery/CanvasGallery';
import { CanvasProvider, useCanvasContext } from './contexts/CanvasContext';
import { canvasListService } from './services/canvasListService';
import ErrorBoundary from './components/ErrorBoundary';
import toast from 'react-hot-toast';
import './App.css';

type View = 'gallery' | 'canvas';

/**
 * Inner app component that has access to CanvasContext
 */
function AppContent() {
  const { userProfile } = useAuth();
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

  // Handle shared canvas access - add user as collaborator if needed
  useEffect(() => {
    const handleSharedCanvasAccess = async () => {
      // Only process if on canvas view with canvas ID
      if (currentView !== 'canvas' || !urlCanvasId) {
        return;
      }

      // If user is not authenticated, they need to login first
      // The main App component will handle showing login screen
      if (!userProfile) {
        return;
      }

      try {
        console.log(`🔍 Checking canvas access for: ${urlCanvasId}`);
        
        // Check if canvas exists and get metadata
        const canvas = await canvasListService.getCanvasById(urlCanvasId);
        
        if (!canvas) {
          console.error('❌ Canvas not found');
          toast.error('Canvas not found or you don\'t have access');
          // Redirect to gallery after 2 seconds
          setTimeout(() => {
            navigateToGallery();
          }, 2000);
          return;
        }

        console.log(`✅ Canvas found: ${canvas.name}`);
        console.log(`👥 Current collaborators:`, canvas.collaboratorIds);
        console.log(`👤 Current user: ${userProfile.uid}`);

        // Check if user is already a collaborator
        const isCollaborator = canvas.collaboratorIds.includes(userProfile.uid);
        
        if (!isCollaborator) {
          console.log('➕ Adding user as collaborator...');
          // Add user as collaborator (via shared link)
          await canvasListService.addCollaborator(urlCanvasId, userProfile.uid);
          console.log('✅ User added as collaborator');
          toast.success(`You've been added to "${canvas.name}"!`);
        } else {
          console.log('✅ User is already a collaborator');
        }

        // Update last accessed timestamp
        await canvasListService.updateCanvasAccess(urlCanvasId);
      } catch (error) {
        console.error('❌ Error handling shared canvas access:', error);
        toast.error('Unable to join canvas. Please try again.');
      }
    };

    handleSharedCanvasAccess();
  }, [currentView, urlCanvasId, userProfile]);

  // Fetch canvas name and update document title
  useEffect(() => {
    if (currentView === 'canvas' && urlCanvasId) {
      canvasListService.getCanvasById(urlCanvasId).then((metadata) => {
        if (metadata) {
          document.title = `CollabCanvas - ${metadata.name}`;
        } else {
          document.title = 'CollabCanvas';
        }
      });
    } else if (currentView === 'gallery') {
      document.title = 'CollabCanvas - Gallery';
    } else {
      document.title = 'CollabCanvas';
    }
  }, [currentView, urlCanvasId]);

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
  // The URL will be preserved, so after login they'll return to the same page
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
