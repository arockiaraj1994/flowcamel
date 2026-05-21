import { useEffect, useRef } from 'react';
import {
  Background,
  BackgroundVariant,
  Edge,
  FinalConnectionState,
  IsValidConnection,
  MarkerType,
  Node,
  NodeTypes,
  EdgeTypes,
  OnConnect,
  OnConnectEnd,
  OnEdgesChange,
  OnNodesChange,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FlowEdgeComponent } from './FlowEdge.js';
import { FlowNodeComponent } from './FlowNode.js';
import './canvas.css';

const nodeTypes: NodeTypes = { flowNode: FlowNodeComponent as never };
const edgeTypes: EdgeTypes = { flowEdge: FlowEdgeComponent as never };

export interface FlowCanvasCoords {
  screenToFlowPosition: (position: { x: number; y: number }) => { x: number; y: number };
  fitView: (options?: {
    nodes?: { id: string }[];
    padding?: number;
    duration?: number;
  }) => void;
}

function FlowCanvasCoordsBridge({
  onCoordsReady,
}: {
  onCoordsReady?: (api: FlowCanvasCoords) => void;
}) {
  const { screenToFlowPosition, fitView } = useReactFlow();
  const readyRef = useRef(onCoordsReady);
  readyRef.current = onCoordsReady;

  useEffect(() => {
    readyRef.current?.({
      screenToFlowPosition,
      fitView: (options) => {
        void fitView(options);
      },
    });
  }, [screenToFlowPosition, fitView]);

  return null;
}

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

interface FlowCanvasInnerProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onConnectEnd?: OnConnectEnd;
  isValidConnection?: IsValidConnection;
  onDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onNodeDoubleClick?: (event: React.MouseEvent, node: Node) => void;
  onCoordsReady?: (api: FlowCanvasCoords) => void;
  dropActive?: boolean;
}

function FlowCanvasInner({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onConnectEnd,
  isValidConnection,
  onDrop,
  onDragOver,
  onNodeClick,
  onNodeDoubleClick,
  onCoordsReady,
  dropActive = false,
}: FlowCanvasInnerProps) {
  const empty = nodes.length === 0;

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        isValidConnection={isValidConnection}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        autoPanOnConnect
        autoPanOnNodeDrag
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: 'flowEdge',
          markerEnd: { type: MarkerType.ArrowClosed, color: '#1D9E75' },
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <Background variant={BackgroundVariant.Dots} color="rgba(15, 23, 42, 0.08)" gap={20} size={1.2} />
        <FlowCanvasCoordsBridge onCoordsReady={onCoordsReady} />
        <ZoomControls />
      </ReactFlow>
      {empty && !dropActive && (
        <div className="fc-canvas-empty">
          <i className="ti ti-grip-horizontal" />
          <div className="hint">Drag blocks here to start building</div>
          <div style={{ fontSize: 11, marginTop: 2 }}>or describe what you want on the right</div>
        </div>
      )}
    </>
  );
}

export interface FlowCanvasProps extends FlowCanvasInnerProps {
  canvasRef?: React.Ref<HTMLDivElement>;
}

export function FlowCanvas({
  canvasRef,
  dropActive = false,
  onCoordsReady,
  ...inner
}: FlowCanvasProps) {
  return (
    <div
      ref={canvasRef}
      tabIndex={0}
      className={`fc-canvas-wrap${dropActive ? ' drop-active' : ''}`}
    >
      <ReactFlowProvider>
        <FlowCanvasInner {...inner} dropActive={dropActive} onCoordsReady={onCoordsReady} />
      </ReactFlowProvider>
    </div>
  );
}

export type { FinalConnectionState, OnConnectEnd, IsValidConnection };
