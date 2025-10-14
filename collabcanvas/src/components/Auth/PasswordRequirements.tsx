import { PASSWORD_REQUIREMENTS } from '../../utils/passwordValidation';

interface PasswordRequirementsProps {
  password: string;
}

export default function PasswordRequirements({ password }: PasswordRequirementsProps) {
  return (
    <div style={styles.container}>
      {PASSWORD_REQUIREMENTS.map((requirement) => {
        const isMet = requirement.test(password);
        
        return (
          <div
            key={requirement.id}
            style={{
              ...styles.requirement,
              color: isMet ? '#10b981' : '#ef4444',
            }}
          >
            <span style={styles.icon}>{isMet ? '✓' : '×'}</span>
            <span style={styles.label}>{requirement.label}</span>
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  container: {
    marginTop: '4px',
    padding: '8px',
    backgroundColor: '#e0e0e0',
    border: 'none',
    boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.2)',
  },
  requirement: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '11px',
    fontWeight: '600' as const,
    marginBottom: '2px',
    transition: 'color 0.2s ease',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  icon: {
    marginRight: '0.5rem',
    fontSize: '12px',
    fontWeight: 'bold' as const,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1rem',
    height: '1rem',
  },
  label: {
    lineHeight: '1rem',
  },
};

