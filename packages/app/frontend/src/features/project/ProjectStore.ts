import {
  FlowEdge,
  FlowGraph,
  FlowNode,
  getBlock,
  getDefaultPropsForBlock,
  defaultProjectConfig,
  normalizeGraph,
  createFlowDefinition,
  flowById,
  getFlows,
  type FlowDefinition,
  type ProjectConfig,
} from '@flowcamel/core';
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Edge, Node } from '@xyflow/react';
import { syncGraphFromCanvas } from './syncGraphFromCanvas.js';

interface ProjectState {
  graph: FlowGraph;
  activeFlowId: string | null;
  selectedNodeId: string | null;
  isDirty: boolean;

  activeFlow: () => FlowDefinition | undefined;
  setActiveFlow: (flowId: string) => void;
  addFlow: (name?: string) => FlowDefinition;
  renameFlow: (flowId: string, name: string) => void;
  deleteFlow: (flowId: string) => void;

  addNode: (blockType: string, position: { x: number; y: number }) => FlowNode;
  removeNode: (nodeId: string) => void;
  updateNodeProps: (nodeId: string, props: Record<string, string>) => void;
  updateNodeSubtitle: (nodeId: string, subtitle: string) => void;
  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
  addEdge: (edge: FlowEdge) => void;
  removeEdge: (edgeId: string) => void;
  setSelectedNode: (nodeId: string | null) => void;
  setGraphName: (name: string) => void;
  updateProjectConfig: (config: ProjectConfig) => void;
  loadGraph: (graph: FlowGraph) => void;
  mergeCanvas: (activeFlowId: string | null, nodes: Node[], edges: Edge[]) => void;
  resetGraph: () => void;
  patchActiveFlow: (patch: Partial<FlowDefinition>) => void;
}

const emptyGraph = (): FlowGraph => {
  const flow = createFlowDefinition('Flow 1', []);
  return {
    id: uuidv4(),
    name: 'Untitled flow',
    flows: [flow],
    config: defaultProjectConfig(),
  };
};

function updateFlowInGraph(
  graph: FlowGraph,
  flowId: string,
  updater: (flow: FlowDefinition) => FlowDefinition
): FlowGraph {
  return {
    ...graph,
    flows: graph.flows.map((f) => (f.id === flowId ? updater(f) : f)),
  };
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  graph: emptyGraph(),
  activeFlowId: null,
  selectedNodeId: null,
  isDirty: false,

  activeFlow() {
    const { graph, activeFlowId } = get();
    const flows = getFlows(graph);
    const id = activeFlowId ?? flows[0]?.id;
    return id ? flowById(graph, id) : flows[0];
  },

  setActiveFlow(flowId) {
    set({ activeFlowId: flowId, selectedNodeId: null });
  },

  addFlow(name) {
    const { graph } = get();
    const flows = getFlows(graph);
    const n = flows.length + 1;
    const flow = createFlowDefinition(name ?? `Flow ${n}`, flows);
    const next = { ...graph, flows: [...flows, flow] };
    set({ graph: next, activeFlowId: flow.id, isDirty: true });
    return flow;
  },

  renameFlow(flowId, name) {
    const { graph } = get();
    set({
      graph: updateFlowInGraph(graph, flowId, (f) => ({ ...f, name })),
      isDirty: true,
    });
  },

  deleteFlow(flowId) {
    const { graph, activeFlowId } = get();
    const flows = getFlows(graph).filter((f) => f.id !== flowId);
    if (flows.length === 0) return;
    const nextActive =
      activeFlowId === flowId ? flows[0]!.id : activeFlowId ?? flows[0]!.id;
    set({
      graph: { ...graph, flows },
      activeFlowId: nextActive,
      selectedNodeId: null,
      isDirty: true,
    });
  },

  patchActiveFlow(patch) {
    const flow = get().activeFlow();
    if (!flow) return;
    set((s) => ({
      graph: updateFlowInGraph(s.graph, flow.id, (f) => ({ ...f, ...patch })),
      isDirty: true,
    }));
  },

  addNode(blockType, position) {
    const flow = get().activeFlow();
    if (!flow) throw new Error('No active flow');
    const block = getBlock(blockType);
    const node: FlowNode = {
      id: uuidv4(),
      blockType,
      label: block?.label ?? blockType,
      position,
      props: getDefaultPropsForBlock(blockType),
    };
    set((s) => ({
      graph: updateFlowInGraph(s.graph, flow.id, (f) => ({
        ...f,
        nodes: [...f.nodes, node],
      })),
      isDirty: true,
    }));
    return node;
  },

  removeNode(nodeId) {
    const flow = get().activeFlow();
    if (!flow) return;
    set((s) => ({
      graph: updateFlowInGraph(s.graph, flow.id, (f) => ({
        ...f,
        nodes: f.nodes.filter((n) => n.id !== nodeId),
        edges: f.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      })),
      selectedNodeId: s.selectedNodeId === nodeId ? null : s.selectedNodeId,
      isDirty: true,
    }));
  },

  updateNodeProps(nodeId, props) {
    const flow = get().activeFlow();
    if (!flow) return;
    set((s) => ({
      graph: updateFlowInGraph(s.graph, flow.id, (f) => ({
        ...f,
        nodes: f.nodes.map((n) => (n.id === nodeId ? { ...n, props } : n)),
      })),
      isDirty: true,
    }));
  },

  updateNodeSubtitle(nodeId, subtitle) {
    const flow = get().activeFlow();
    if (!flow) return;
    set((s) => ({
      graph: updateFlowInGraph(s.graph, flow.id, (f) => ({
        ...f,
        nodes: f.nodes.map((n) => (n.id === nodeId ? { ...n, subtitle } : n)),
      })),
      isDirty: true,
    }));
  },

  updateNodePosition(nodeId, position) {
    const flow = get().activeFlow();
    if (!flow) return;
    set((s) => ({
      graph: updateFlowInGraph(s.graph, flow.id, (f) => ({
        ...f,
        nodes: f.nodes.map((n) => (n.id === nodeId ? { ...n, position } : n)),
      })),
      isDirty: true,
    }));
  },

  addEdge(edge) {
    const flow = get().activeFlow();
    if (!flow) return;
    set((s) => ({
      graph: updateFlowInGraph(s.graph, flow.id, (f) => ({
        ...f,
        edges: [...f.edges, edge],
      })),
      isDirty: true,
    }));
  },

  removeEdge(edgeId) {
    const flow = get().activeFlow();
    if (!flow) return;
    set((s) => ({
      graph: updateFlowInGraph(s.graph, flow.id, (f) => ({
        ...f,
        edges: f.edges.filter((e) => e.id !== edgeId),
      })),
      isDirty: true,
    }));
  },

  setSelectedNode(nodeId) {
    set({ selectedNodeId: nodeId });
  },

  setGraphName(name) {
    set((s) => ({ graph: { ...s.graph, name }, isDirty: true }));
  },

  updateProjectConfig(config) {
    set((s) => ({ graph: { ...s.graph, config }, isDirty: true }));
  },

  loadGraph(graph) {
    const normalized = normalizeGraph(graph);
    const firstId = normalized.flows[0]?.id ?? null;
    set({
      graph: normalized,
      activeFlowId: firstId,
      selectedNodeId: null,
      isDirty: false,
    });
  },

  mergeCanvas(activeFlowId, flowNodes, flowEdges) {
    const synced = syncGraphFromCanvas(get().graph, activeFlowId, flowNodes, flowEdges);
    set({ graph: synced, isDirty: true });
  },

  resetGraph() {
    const g = emptyGraph();
    set({
      graph: g,
      activeFlowId: g.flows[0]?.id ?? null,
      selectedNodeId: null,
      isDirty: false,
    });
  },
}));
