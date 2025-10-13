import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Navbar from './components/Layout/Navbar';
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

  // If authenticated, show main app
  return (
    <div style={styles.appContainer}>
      <Navbar />
      <div style={styles.mainContent}>
        <div style={styles.placeholder}>
          <h2 style={styles.placeholderTitle}>🎨 Canvas Coming Soon</h2>
          <p style={styles.placeholderText}>
            Authentication complete! The collaborative canvas will be implemented in the next PR.
          </p>
          <div style={styles.statusBadge}>
            <span style={styles.statusIndicator}>✓</span>
            <span>PR #1: Authentication - Complete</span>
          </div>
        </div>
      </div>
    </div>
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
  appContainer: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
  },
  mainContent: {
    paddingTop: '80px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(100vh - 80px)',
  },
  placeholder: {
    backgroundColor: 'white',
    padding: '3rem',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    textAlign: 'center' as const,
    maxWidth: '500px',
  },
  placeholderTitle: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: '1rem',
  },
  placeholderText: {
    color: '#6b7280',
    fontSize: '1rem',
    lineHeight: '1.6',
    marginBottom: '2rem',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    borderRadius: '20px',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  statusIndicator: {
    fontSize: '1.25rem',
  },
};

export default App;
