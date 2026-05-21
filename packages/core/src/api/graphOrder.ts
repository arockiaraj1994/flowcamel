import { BlockCategory } from '../model/BlockCategory.js';
import type { FlowDefinition } from '../model/FlowDefinition.js';
import type { FlowGraph } from '../model/FlowGraph.js';
import type { FlowNode } from '../model/FlowNode.js';
import { getBlock } from './BlockRegistry.js';
import { getFlows } from './normalizeGraph.js';

/** Topological walk from the single SOURCE node within one flow. */
export function orderedNodesFromFlow(flow: FlowDefinition): FlowNode[] {
  const sourceNode = flow.nodes.find(
    (n) => getBlock(n.blockType)?.category === BlockCategory.SOURCE
  );
  if (!sourceNode) return [];

  const adjMap = new Map<string, string[]>();
  for (const n of flow.nodes) adjMap.set(n.id, []);
  for (const e of flow.edges) adjMap.get(e.source)?.push(e.target);

  const nodeMap = new Map(flow.nodes.map((n) => [n.id, n]));
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

/** @deprecated Use orderedNodesFromFlow with active flow */
export function orderedNodesFromGraph(graph: FlowGraph): FlowNode[] {
  const flows = getFlows(graph);
  if (flows.length === 0) return [];
  return orderedNodesFromFlow(flows[0]!);
}
