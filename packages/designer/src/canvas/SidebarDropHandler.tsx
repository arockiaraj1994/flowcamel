import { useEffect, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';

/** Card size for centering dropped nodes under the cursor (matches .fc-flow-node). */
export const FLOW_NODE_WIDTH = 168;
export const FLOW_NODE_HEIGHT = 88;
const SNAP_GRID = 20;

function snapPosition(pos: { x: number; y: number }): { x: number; y: number } {
  return {
    x: Math.round(pos.x / SNAP_GRID) * SNAP_GRID,
    y: Math.round(pos.y / SNAP_GRID) * SNAP_GRID,
  };
}

/** Top-left flow position so the node center sits on the given screen point. */
export function flowPositionAtScreen(
  screenToFlowPosition: (p: { x: number; y: number }) => { x: number; y: number },
  clientX: number,
  clientY: number
): { x: number; y: number } {
  const point = screenToFlowPosition({ x: clientX, y: clientY });
  return snapPosition({
    x: point.x - FLOW_NODE_WIDTH / 2,
    y: point.y - FLOW_NODE_HEIGHT / 2,
  });
}

interface Props {
  draggingBlockType: string | null;
  canvasWrapRef: React.RefObject<HTMLDivElement | null>;
  onDrop: (blockType: string, position: { x: number; y: number }) => void;
  onDragEnd: () => void;
}

/**
 * Handles palette drag-and-drop using React Flow's screenToFlowPosition
 * (must run inside ReactFlowProvider).
 */
export function SidebarDropHandler({
  draggingBlockType,
  canvasWrapRef,
  onDrop,
  onDragEnd,
}: Props) {
  const { screenToFlowPosition } = useReactFlow();
  const blockTypeRef = useRef(draggingBlockType);
  blockTypeRef.current = draggingBlockType;
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;
  const onDragEndRef = useRef(onDragEnd);
  onDragEndRef.current = onDragEnd;

  useEffect(() => {
    if (!draggingBlockType) return;

    const up = (e: MouseEvent) => {
      const blockType = blockTypeRef.current;
      const wrap = canvasWrapRef.current;
      if (blockType && wrap) {
        const rect = wrap.getBoundingClientRect();
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom
        ) {
          const position = flowPositionAtScreen(
            (p) => screenToFlowPosition(p),
            e.clientX,
            e.clientY
          );
          onDropRef.current(blockType, position);
        }
      }
      onDragEndRef.current();
    };

    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, [draggingBlockType, screenToFlowPosition, canvasWrapRef]);

  return null;
}
