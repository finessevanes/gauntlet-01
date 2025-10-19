import { Group, Circle, Text } from 'react-konva';
import { memo } from 'react';

interface CursorProps {
  x: number;
  y: number;
  username: string;
  color: string;
}

function Cursor({ x, y, username, color }: CursorProps) {
  return (
    <Group x={x} y={y}>
      {/* Cursor pointer (triangle-like shape using circle) */}
      <Circle
        x={0}
        y={0}
        radius={24}
        fill={color}
        stroke="white"
        strokeWidth={4}
        shadowColor="black"
        shadowBlur={10}
        shadowOpacity={0.4}
        shadowOffsetX={3}
        shadowOffsetY={3}
      />
      
      {/* Username label */}
      <Group x={28} y={28}>
        {/* Label background */}
        <Text
          text={username}
          fontSize={12}
          fontFamily="sans-serif"
          fill="white"
          padding={4}
          align="left"
          verticalAlign="top"
          shadowColor="black"
          shadowBlur={4}
          shadowOpacity={0.3}
          shadowOffsetX={1}
          shadowOffsetY={1}
        />
        
        {/* Label text with background effect */}
        <Text
          text={username}
          fontSize={12}
          fontFamily="sans-serif"
          fill={color}
          padding={4}
          align="left"
          verticalAlign="top"
          stroke="white"
          strokeWidth={0.5}
        />
      </Group>
    </Group>
  );
}

// Only re-render if props actually change (shallow comparison)
export default memo(Cursor);

