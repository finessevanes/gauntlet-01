import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import PasswordRequirements from './PasswordRequirements';
import {
  validatePassword,
  validatePasswordMatch,
} from '../../utils/passwordValidation';

interface SignupProps {
  onSwitchToLogin: () => void;
}

export default function Signup({ onSwitchToLogin }: SignupProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { signup, loginWithGoogle } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validation
    if (!username || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (username.trim().length < 2) {
      toast.error('Username must be at least 2 characters');
      return;
    }

    // Validate password requirements
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      toast.error('Password does not meet all requirements');
      return;
    }

    // Validate password match
    if (!validatePasswordMatch(password, confirmPassword)) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      await signup(email, password, username.trim());
      toast.success('Account created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Signup failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);

    try {
      await loginWithGoogle();
      toast.success('Account created successfully!');
    } catch (error: any) {
      // Don't show error toast if user cancelled
      if (error.message !== 'Sign-in cancelled') {
        toast.error(error.message || 'Google sign-in failed');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Paint-style Title Bar */}
        <div style={styles.titleBar}>
          <span style={styles.titleBarText}>CollabCanvas - Sign Up</span>
        </div>
        
        <div style={styles.cardContent}>
          <h2 style={styles.title}>Create Account</h2>
          <p style={styles.subtitle}>Join CollabCanvas and start creating</p>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            style={{
              ...styles.googleButton,
              ...(isGoogleLoading || isSubmitting ? styles.googleButtonDisabled : {}),
            }}
            disabled={isGoogleLoading || isSubmitting}
          >
            {isGoogleLoading ? (
              'Signing in...'
            ) : (
              <>
                <svg style={styles.googleIcon} viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Divider */}
          <div style={styles.divider}>
            <div style={styles.dividerLine}></div>
            <span style={styles.dividerText}>OR</span>
            <div style={styles.dividerLine}></div>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name"
              style={styles.input}
              disabled={isSubmitting}
              maxLength={30}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={styles.input}
              disabled={isSubmitting}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordInputWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={styles.passwordInput}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.toggleButton}
                disabled={isSubmitting}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg style={styles.eyeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg style={styles.eyeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {password && <PasswordRequirements password={password} />}
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm Password</label>
            <div style={styles.passwordInputWrapper}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                style={styles.passwordInput}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.toggleButton}
                disabled={isSubmitting}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <svg style={styles.eyeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg style={styles.eyeIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {confirmPassword && (
              <div
                style={{
                  ...styles.matchIndicator,
                  color: validatePasswordMatch(password, confirmPassword)
                    ? '#10b981'
                    : '#ef4444',
                }}
              >
                <span style={styles.matchIcon}>
                  {validatePasswordMatch(password, confirmPassword) ? '✓' : '×'}
                </span>
                <span>
                  {validatePasswordMatch(password, confirmPassword)
                    ? 'Passwords match'
                    : 'Passwords do not match'}
                </span>
              </div>
            )}
          </div>

          <button
            type="submit"
            style={{
              ...styles.button,
              ...(isSubmitting ? styles.buttonDisabled : {}),
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

          <p style={styles.footer}>
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              style={styles.link}
              disabled={isSubmitting}
            >
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#008080', // Classic teal background
    backgroundImage: 'linear-gradient(45deg, #008080 25%, transparent 25%, transparent 75%, #008080 75%, #008080), linear-gradient(45deg, #008080 25%, transparent 25%, transparent 75%, #008080 75%, #008080)',
    backgroundSize: '60px 60px',
    backgroundPosition: '0 0, 30px 30px',
  },
  card: {
    backgroundColor: '#c0c0c0',
    padding: '2px',
    boxShadow: 'inset -1px -1px 0 0 #808080, inset 1px 1px 0 0 #ffffff',
    width: '100%',
    maxWidth: '420px',
  },
  titleBar: {
    height: '28px',
    background: 'linear-gradient(to bottom, #2c5fa8 0%, #1e4785 100%)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 4px 0 8px',
    marginBottom: '2px',
  },
  titleBarText: {
    color: '#ffffff',
    fontSize: '11px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontWeight: '600',
    letterSpacing: '0.3px',
  },
  cardContent: {
    backgroundColor: '#c0c0c0',
    padding: '20px',
  },
  googleButton: {
    width: '100%',
    padding: '8px',
    backgroundColor: '#d8d8d8',
    color: '#000000',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    transition: 'none',
    boxShadow: 'inset -1px -1px 0 0 #808080, inset 1px 1px 0 0 #ffffff',
    fontSize: '13px',
    fontWeight: '400',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  } as const,
  googleButtonDisabled: {
    backgroundColor: '#c0c0c0',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  googleIcon: {
    width: '20px',
    height: '20px',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '16px 0',
    gap: '12px',
  },
  dividerLine: {
    flex: 1,
    height: '2px',
    backgroundColor: '#808080',
    boxShadow: '0 1px 0 0 #ffffff',
  },
  dividerText: {
    fontSize: '11px',
    color: '#000000',
    fontWeight: '700',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  title: {
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '4px',
    textAlign: 'center' as const,
    color: '#000000',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  subtitle: {
    fontSize: '11px',
    color: '#000000',
    textAlign: 'center' as const,
    marginBottom: '16px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  label: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  input: {
    padding: '4px 6px',
    border: 'none',
    fontSize: '13px',
    outline: 'none',
    backgroundColor: '#ffffff',
    boxShadow: 'inset 1px 1px 0 0 #808080, inset -1px -1px 0 0 #ffffff',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  passwordInputWrapper: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
  },
  passwordInput: {
    padding: '4px 36px 4px 6px',
    border: 'none',
    fontSize: '13px',
    outline: 'none',
    backgroundColor: '#ffffff',
    boxShadow: 'inset 1px 1px 0 0 #808080, inset -1px -1px 0 0 #ffffff',
    width: '100%',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  toggleButton: {
    position: 'absolute' as const,
    right: '4px',
    background: '#d8d8d8',
    border: 'none',
    cursor: 'pointer',
    padding: '2px 4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#000000',
    transition: 'none',
    boxShadow: 'inset -1px -1px 0 0 #808080, inset 1px 1px 0 0 #ffffff',
  },
  eyeIcon: {
    width: '16px',
    height: '16px',
  },
  hint: {
    fontSize: '10px',
    color: '#000000',
    margin: 0,
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  matchIndicator: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '11px',
    fontWeight: '600',
    marginTop: '4px',
    transition: 'color 0.2s ease',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  } as const,
  matchIcon: {
    marginRight: '0.5rem',
    fontSize: '12px',
    fontWeight: 'bold',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1rem',
    height: '1rem',
  } as const,
  button: {
    padding: '8px',
    backgroundColor: '#d8d8d8',
    color: '#000000',
    border: 'none',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'none',
    boxShadow: 'inset -1px -1px 0 0 #808080, inset 1px 1px 0 0 #ffffff',
    fontSize: '13px',
    fontWeight: '600',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  buttonDisabled: {
    backgroundColor: '#c0c0c0',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  footer: {
    marginTop: '16px',
    textAlign: 'center' as const,
    fontSize: '11px',
    color: '#000000',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  link: {
    color: '#000080',
    textDecoration: 'underline',
    fontWeight: '400',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
};

