import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { UserSelection } from '../services/selectionService';
import { selectionService } from '../services/selectionService';
import { useAuth } from '../hooks/useAuth';

// Separate context for high-frequency user selection updates
// This prevents the main CanvasContext from re-rendering on every selection change
interface UserSelectionsContextType {
  userSelections: Record<string, UserSelection>;
}

const UserSelectionsContext = createContext<UserSelectionsContextType | undefined>(undefined);

export function UserSelectionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [userSelections, setUserSelections] = useState<Record<string, UserSelection>>({});

  // Subscribe to other users' selections
  useEffect(() => {
    if (!user) {
      setUserSelections({});
      return;
    }

    const unsubscribe = selectionService.subscribeToCanvasSelections(
      user.uid,
      (selections) => {
        setUserSelections(selections);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user]);

  // This context value is stable - only userSelections changes
  // And it only affects components that specifically need it
  return (
    <UserSelectionsContext.Provider value={{ userSelections }}>
      {children}
    </UserSelectionsContext.Provider>
  );
}

export function useUserSelections() {
  const context = useContext(UserSelectionsContext);
  if (context === undefined) {
    throw new Error('useUserSelections must be used within a UserSelectionsProvider');
  }
  return context;
}

