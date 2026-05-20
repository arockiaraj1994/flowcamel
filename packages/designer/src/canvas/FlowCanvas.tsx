import {
  Background,
  BackgroundVariant,
  Edge,
  MarkerType,
  Node,
  NodeTypes,
  EdgeTypes,
  OnConnect,
  OnEdgesChange,
  OnNodesChange,
  ReactFlow,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FlowEdgeComponent } from './FlowEdge.js';
import { FlowNodeComponent } from './FlowNode.js';
import './canvas.css';

const nodeTypes: NodeTypes = { flowNode: FlowNodeComponent as never };
const edgeTypes: EdgeTypes = { flowEdge: FlowEdgeComponent as never };

function ZoomControls() {
  const { zoomIn, zoomOut, setViewport, getZoom } = useReactFlow();
  const zoom = getZoom();

  return (
    <div className="fc-zoom-ctrls">
      <button type="button" className="btn btn-icon" title="Zoom in" onClick={() => zoomIn()}>
        <i className="ti ti-plus" style={{ fontSize: 13 }} />
      </button>
      <div className="fc-zoom-label">{Math.round(zoom * 100)}%</div>
      <button type="button" className="btn btn-icon" title="Zoom out" onClick={() => zoomOut()}>
        <i className="ti ti-minus" style={{ fontSize: 13 }} />
      </button>
      <button
        type="button"
        className="btn btn-icon"
        title="Fit to screen"
        onClick={() => setViewport({ x: 0, y: 0, zoom: 1 })}
      >
        <i className="ti ti-maximize" style={{ fontSize: 13 }} />
      </button>
    </div>
  );
}

interface FlowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onNodeDoubleClick?: (event: React.MouseEvent, node: Node) => void;
  dropActive?: boolean;
  canvasRef?: React.Ref<HTMLDivElement>;
}

export function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onDrop,
  onDragOver,
  onNodeClick,
  onNodeDoubleClick,
  dropActive = false,
  canvasRef,
}: FlowCanvasProps) {
  const empty = nodes.length === 0;

  return (
    <div
      ref={canvasRef}
      className={`fc-canvas-wrap${dropActive ? ' drop-active' : ''}`}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: 'flowEdge',
          markerEnd: { type: MarkerType.ArrowClosed, color: '#1D9E75' },
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <Background variant={BackgroundVariant.Dots} color="rgba(15, 23, 42, 0.08)" gap={20} size={1.2} />
        <ZoomControls />
      </ReactFlow>
      {empty && !dropActive && (
        <div className="fc-canvas-empty">
          <i className="ti ti-grip-horizontal" />
          <div className="hint">Drag blocks here to start building</div>
          <div style={{ fontSize: 11, marginTop: 2 }}>or describe what you want on the right</div>
        </div>
      )}
    </div>
  );
}
