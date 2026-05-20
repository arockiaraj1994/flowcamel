import { BaseEdge, EdgeProps, getBezierPath } from '@xyflow/react';
import './canvas.css';

export interface FlowEdgeData extends Record<string, unknown> {
  flowing?: boolean;
}

export function FlowEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const flowing = (data as FlowEdgeData | undefined)?.flowing ?? false;

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      className={flowing ? 'fc-flow-edge flowing' : 'fc-flow-edge'}
      style={{
        stroke: '#1D9E75',
        strokeWidth: 1.5,
        strokeDasharray: '4 3',
      }}
    />
  );
}
