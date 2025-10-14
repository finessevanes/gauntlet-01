import { createContext, useContext, useState, ReactNode } from 'react';
import { DEFAULT_COLOR } from '../utils/constants';

interface CanvasContextType {
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  stageScale: number;
  setStageScale: (scale: number) => void;
  stagePosition: { x: number; y: number };
  setStagePosition: (position: { x: number; y: number }) => void;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export function CanvasProvider({ children }: { children: ReactNode }) {
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLOR);
  const [stageScale, setStageScale] = useState(1);
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 });

  const value = {
    selectedColor,
    setSelectedColor,
    stageScale,
    setStageScale,
    stagePosition,
    setStagePosition,
  };

  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
}

export function useCanvasContext() {
  const context = useContext(CanvasContext);
  if (context === undefined) {
    throw new Error('useCanvasContext must be used within a CanvasProvider');
  }
  return context;
}

