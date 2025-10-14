import { Group, Circle, Text } from 'react-konva';

interface CursorProps {
  x: number;
  y: number;
  username: string;
  color: string;
}

export default function Cursor({ x, y, username, color }: CursorProps) {
  return (
    <Group x={x} y={y}>
      {/* Cursor pointer (triangle-like shape using circle) */}
      <Circle
        x={0}
        y={0}
        radius={8}
        fill={color}
        stroke="white"
        strokeWidth={2}
        shadowColor="black"
        shadowBlur={4}
        shadowOpacity={0.3}
        shadowOffsetX={1}
        shadowOffsetY={1}
      />
      
      {/* Username label */}
      <Group x={12} y={12}>
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

