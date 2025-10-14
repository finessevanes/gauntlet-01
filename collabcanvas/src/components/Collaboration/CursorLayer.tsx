import { Layer } from 'react-konva';
import Cursor from './Cursor';
import type { CursorsMap } from '../../services/cursorService';

interface CursorLayerProps {
  cursors: CursorsMap;
}

export default function CursorLayer({ cursors }: CursorLayerProps) {
  return (
    <Layer listening={false}>
      {Object.entries(cursors).map(([userId, cursor]) => (
        <Cursor
          key={userId}
          x={cursor.x}
          y={cursor.y}
          username={cursor.username}
          color={cursor.color}
        />
      ))}
    </Layer>
  );
}

