import { useState } from 'react';
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
          <Canvas />
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
