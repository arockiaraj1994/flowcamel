import type { FlowEdge, FlowGraph } from '@flowcamel/core';
import type { Edge, Node } from '@xyflow/react';

/** Merge React Flow canvas state into the Zustand graph before persisting to the API. */
export function syncGraphFromCanvas(
  graph: FlowGraph,
  flowNodes: Node[],
  flowEdges: Edge[]
): FlowGraph {
  const positionById = Object.fromEntries(flowNodes.map((n) => [n.id, n.position]));

  const nodes = graph.nodes.map((gn) => ({
    ...gn,
    position: positionById[gn.id] ?? gn.position,
  }));

  const edges: FlowEdge[] = flowEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
  }));

  return { ...graph, nodes, edges };
}
