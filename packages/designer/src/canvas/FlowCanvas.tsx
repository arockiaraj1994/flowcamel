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
import { SidebarDropHandler } from './SidebarDropHandler.js';
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

function publishCoords(
  onCoordsReady: FlowCanvasInnerProps['onCoordsReady'],
  screenToFlowPosition: (p: { x: number; y: number }) => { x: number; y: number },
  fitView: (options?: Parameters<FlowCanvasCoords['fitView']>[0]) => Promise<boolean>
) {
  onCoordsReady?.({
    screenToFlowPosition: (p) => screenToFlowPosition(p),
    fitView: (options) => {
      void fitView(options);
    },
  });
}

/** Keep screenToFlowPosition in sync after viewport changes (pan/zoom). */
function CoordsSync({ onCoordsReady }: { onCoordsReady?: (api: FlowCanvasCoords) => void }) {
  const { screenToFlowPosition, fitView } = useReactFlow();
  const readyRef = useRef(onCoordsReady);
  readyRef.current = onCoordsReady;

  useEffect(() => {
    publishCoords(readyRef.current, screenToFlowPosition, fitView);
  }, [screenToFlowPosition, fitView]);

  return null;
}

/** Fit all nodes once when switching flows — never when adding blocks on the same flow. */
function FitViewOnFlowChange({ flowKey }: { flowKey?: string }) {
  const { fitView, getNodes } = useReactFlow();
  const lastKeyRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!flowKey || flowKey === lastKeyRef.current) return;
    lastKeyRef.current = flowKey;

    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (getNodes().length > 0) {
          void fitView({ padding: 0.15, duration: 0 });
        }
      });
    });
    return () => cancelAnimationFrame(id);
  }, [flowKey, fitView, getNodes]);

  return null;
}

function ZoomControls() {
  const { zoomIn, zoomOut, fitView, getZoom } = useReactFlow();
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
        title="Fit all blocks in view"
        onClick={() => void fitView({ padding: 0.15, duration: 200 })}
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
  /** Active flow id — fit all nodes once when this changes (tab switch). */
  flowKey?: string;
  dropActive?: boolean;
  /** Block type dragged from sidebar; drop handled inside React Flow. */
  draggingBlockType?: string | null;
  onSidebarDrop?: (blockType: string, position: { x: number; y: number }) => void;
  onSidebarDragEnd?: () => void;
  canvasWrapRef?: React.RefObject<HTMLDivElement | null>;
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
  flowKey,
  dropActive = false,
  draggingBlockType = null,
  onSidebarDrop,
  onSidebarDragEnd,
  canvasWrapRef,
}: FlowCanvasInnerProps) {
  const empty = nodes.length === 0;
  const coordsReadyRef = useRef(onCoordsReady);
  coordsReadyRef.current = onCoordsReady;

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onInit={(instance) => {
          publishCoords(
            coordsReadyRef.current,
            (p) => instance.screenToFlowPosition(p),
            (opts) => instance.fitView(opts)
          );
        }}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        isValidConnection={isValidConnection}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
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
        <CoordsSync onCoordsReady={onCoordsReady} />
        <FitViewOnFlowChange flowKey={flowKey} />
        {canvasWrapRef && onSidebarDrop && onSidebarDragEnd && (
          <SidebarDropHandler
            draggingBlockType={draggingBlockType}
            canvasWrapRef={canvasWrapRef}
            onDrop={onSidebarDrop}
            onDragEnd={onSidebarDragEnd}
          />
        )}
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
  draggingBlockType,
  onSidebarDrop,
  onSidebarDragEnd,
  ...inner
}: FlowCanvasProps) {
  const wrapRef = canvasRef as React.RefObject<HTMLDivElement | null>;

  return (
    <div
      ref={canvasRef}
      tabIndex={0}
      className={`fc-canvas-wrap${dropActive ? ' drop-active' : ''}`}
    >
      <ReactFlowProvider>
        <FlowCanvasInner
          {...inner}
          dropActive={dropActive}
          onCoordsReady={onCoordsReady}
          draggingBlockType={draggingBlockType}
          onSidebarDrop={onSidebarDrop}
          onSidebarDragEnd={onSidebarDragEnd}
          canvasWrapRef={wrapRef}
        />
      </ReactFlowProvider>
    </div>
  );
}

export type { FinalConnectionState, OnConnectEnd, IsValidConnection };
