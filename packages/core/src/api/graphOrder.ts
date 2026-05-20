import { BlockCategory } from '../model/BlockCategory.js';
import type { FlowGraph } from '../model/FlowGraph.js';
import type { FlowNode } from '../model/FlowNode.js';
import { getBlock } from './BlockRegistry.js';

/** Topological walk from the single SOURCE node (same order as Java route builder). */
export function orderedNodesFromGraph(graph: FlowGraph): FlowNode[] {
  const sourceNode = graph.nodes.find(
    (n) => getBlock(n.blockType)?.category === BlockCategory.SOURCE
  );
  if (!sourceNode) return [];

  const adjMap = new Map<string, string[]>();
  for (const n of graph.nodes) adjMap.set(n.id, []);
  for (const e of graph.edges) adjMap.get(e.source)?.push(e.target);

  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const ordered: FlowNode[] = [];
  const visited = new Set<string>();

  function dfs(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const node = nodeMap.get(id);
    if (node) ordered.push(node);
    for (const child of adjMap.get(id) ?? []) dfs(child);
  }

  dfs(sourceNode.id);
  return ordered;
}
