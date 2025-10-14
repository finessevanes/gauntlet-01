import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import NavbarPresence from '../Collaboration/NavbarPresence';

export default function Navbar() {
  const { userProfile, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to logout');
    }
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        <div style={styles.leftSection}>
          <h1 style={styles.logo}>CollabCanvas</h1>
          {userProfile && (
            <div style={styles.userBadge}>
              <div
                style={{
                  ...styles.colorDot,
                  backgroundColor: userProfile.cursorColor,
                }}
              />
              <span style={styles.username}>{userProfile.username}</span>
            </div>
          )}
        </div>

        <div style={styles.rightSection}>
          <NavbarPresence />
          <button onClick={handleLogout} style={styles.logoutButton}>
            Log Out
          </button>
        </div>
      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    maxWidth: '100%',
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    margin: 0,
    color: '#3b82f6',
  },
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#f3f4f6',
    borderRadius: '20px',
  },
  colorDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    border: '2px solid white',
    boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1)',
  },
  username: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
  },
  logoutButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
};

