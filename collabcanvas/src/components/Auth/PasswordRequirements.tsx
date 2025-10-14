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
    marginTop: '0.5rem',
    padding: '0.75rem',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
  },
  requirement: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.875rem',
    fontWeight: '500' as const,
    marginBottom: '0.25rem',
    transition: 'color 0.2s ease',
  },
  icon: {
    marginRight: '0.5rem',
    fontSize: '1rem',
    fontWeight: 'bold' as const,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.25rem',
    height: '1.25rem',
  },
  label: {
    lineHeight: '1.25rem',
  },
};

