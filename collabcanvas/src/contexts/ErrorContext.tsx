import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { ErrorDialog } from '../components/ErrorDialog';

interface ErrorContextType {
  showError: (message: string) => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const ErrorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showError = (message: string) => {
    setErrorMessage(message);
  };

  const closeError = () => {
    setErrorMessage(null);
  };

  return (
    <ErrorContext.Provider value={{ showError }}>
      {children}
      {errorMessage && <ErrorDialog message={errorMessage} onClose={closeError} />}
    </ErrorContext.Provider>
  );
};

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

