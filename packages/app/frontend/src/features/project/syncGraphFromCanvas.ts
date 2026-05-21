import type { FlowEdge, FlowGraph } from '@flowcamel/core';
import { flowById } from '@flowcamel/core';
import type { Edge, Node } from '@xyflow/react';

/** Merge React Flow canvas state into the active flow before persisting. */
export function syncGraphFromCanvas(
  graph: FlowGraph,
  activeFlowId: string | null,
  flowNodes: Node[],
  flowEdges: Edge[]
): FlowGraph {
  const flow = activeFlowId ? flowById(graph, activeFlowId) : graph.flows[0];
  if (!flow) return graph;

  const positionById = Object.fromEntries(flowNodes.map((n) => [n.id, n.position]));

  const nodes = flow.nodes.map((gn) => ({
    ...gn,
    position: positionById[gn.id] ?? gn.position,
  }));

  const edges: FlowEdge[] = flowEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
  }));

  return {
    ...graph,
    flows: graph.flows.map((f) =>
      f.id === flow.id ? { ...f, nodes, edges } : f
    ),
  };
}
