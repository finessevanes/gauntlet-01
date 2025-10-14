/**
 * Password validation utilities
 * Implements industry-standard password requirements
 */

export interface PasswordRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
  regex?: RegExp;
}

// Password requirement regexes
export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: 'minLength',
    label: 'At least 8 characters',
    test: (password: string) => password.length >= 8,
  },
  {
    id: 'uppercase',
    label: 'One uppercase letter',
    test: (password: string) => /[A-Z]/.test(password),
    regex: /[A-Z]/,
  },
  {
    id: 'number',
    label: 'One number',
    test: (password: string) => /[0-9]/.test(password),
    regex: /[0-9]/,
  },
  {
    id: 'special',
    label: 'One special character (!@#$%^&*...)',
    test: (password: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
  },
];

/**
 * Validates a password against all requirements
 */
export function validatePassword(password: string): {
  isValid: boolean;
  requirements: { [key: string]: boolean };
} {
  const requirements: { [key: string]: boolean } = {};
  
  PASSWORD_REQUIREMENTS.forEach((requirement) => {
    requirements[requirement.id] = requirement.test(password);
  });

  const isValid = Object.values(requirements).every((met) => met);

  return { isValid, requirements };
}

/**
 * Checks if passwords match
 */
export function validatePasswordMatch(
  password: string,
  confirmPassword: string
): boolean {
  return password === confirmPassword && password.length > 0;
}

/**
 * Gets a user-friendly error message for password validation
 */
export function getPasswordErrorMessage(password: string): string | null {
  const validation = validatePassword(password);
  
  if (validation.isValid) {
    return null;
  }

  const unmetRequirements = PASSWORD_REQUIREMENTS.filter(
    (req) => !validation.requirements[req.id]
  ).map((req) => req.label.toLowerCase());

  if (unmetRequirements.length === 1) {
    return `Password must contain ${unmetRequirements[0]}`;
  }

  return `Password must contain: ${unmetRequirements.join(', ')}`;
}

