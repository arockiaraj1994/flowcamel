import { FlowEdge, FlowGraph, FlowNode, getBlock, getDefaultPropsForBlock } from '@flowcamel/core';
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

// TODO: add tests for store actions

interface ProjectState {
  graph: FlowGraph;
  selectedNodeId: string | null;
  isDirty: boolean;

  addNode: (blockType: string, position: { x: number; y: number }) => FlowNode;
  removeNode: (nodeId: string) => void;
  updateNodeProps: (nodeId: string, props: Record<string, string>) => void;
  updateNodeSubtitle: (nodeId: string, subtitle: string) => void;
  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
  addEdge: (edge: FlowEdge) => void;
  removeEdge: (edgeId: string) => void;
  setSelectedNode: (nodeId: string | null) => void;
  setGraphName: (name: string) => void;
  loadGraph: (graph: FlowGraph) => void;
  resetGraph: () => void;
}

const emptyGraph = (): FlowGraph => ({
  id: uuidv4(),
  name: 'Untitled flow',
  nodes: [],
  edges: [],
});

export const useProjectStore = create<ProjectState>((set) => ({
  graph: emptyGraph(),
  selectedNodeId: null,
  isDirty: false,

  addNode(blockType, position) {
    const block = getBlock(blockType);
    const node: FlowNode = {
      id: uuidv4(),
      blockType,
      label: block?.label ?? blockType,
      position,
      props: getDefaultPropsForBlock(blockType),
    };
    set((s) => ({ graph: { ...s.graph, nodes: [...s.graph.nodes, node] }, isDirty: true }));
    return node;
  },

  removeNode(nodeId) {
    set((s) => ({
      graph: {
        ...s.graph,
        nodes: s.graph.nodes.filter((n) => n.id !== nodeId),
        edges: s.graph.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      },
      selectedNodeId: s.selectedNodeId === nodeId ? null : s.selectedNodeId,
      isDirty: true,
    }));
  },

  updateNodeProps(nodeId, props) {
    set((s) => ({
      graph: {
        ...s.graph,
        nodes: s.graph.nodes.map((n) => (n.id === nodeId ? { ...n, props } : n)),
      },
      isDirty: true,
    }));
  },

  updateNodeSubtitle(nodeId, subtitle) {
    set((s) => ({
      graph: {
        ...s.graph,
        nodes: s.graph.nodes.map((n) => (n.id === nodeId ? { ...n, subtitle } : n)),
      },
      isDirty: true,
    }));
  },

  updateNodePosition(nodeId, position) {
    set((s) => ({
      graph: {
        ...s.graph,
        nodes: s.graph.nodes.map((n) => (n.id === nodeId ? { ...n, position } : n)),
      },
      isDirty: true,
    }));
  },

  addEdge(edge) {
    set((s) => ({ graph: { ...s.graph, edges: [...s.graph.edges, edge] }, isDirty: true }));
  },

  removeEdge(edgeId) {
    set((s) => ({
      graph: { ...s.graph, edges: s.graph.edges.filter((e) => e.id !== edgeId) },
      isDirty: true,
    }));
  },

  setSelectedNode(nodeId) {
    set({ selectedNodeId: nodeId });
  },

  setGraphName(name) {
    set((s) => ({ graph: { ...s.graph, name }, isDirty: true }));
  },

  loadGraph(graph) {
    set({ graph, selectedNodeId: null, isDirty: false });
  },

  resetGraph() {
    set({ graph: emptyGraph(), selectedNodeId: null, isDirty: false });
  },
}));
