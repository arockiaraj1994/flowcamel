import type { FlowDefinition } from '../model/FlowDefinition.js';
import type { FlowGraph } from '../model/FlowGraph.js';
import { defaultProjectConfig } from './ApplicationConfigYaml.js';

function newId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2, 11)}`;
}

function slugRouteId(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return base || 'flow';
}

/** Unique routeId among existing flows; appends -2, -3 on collision. */
export function allocateRouteId(name: string, existing: FlowDefinition[]): string {
  const base = slugRouteId(name);
  const used = new Set(existing.map((f) => f.routeId));
  if (!used.has(base)) return base;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${base}-${i}`;
    if (!used.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

export function createFlowDefinition(
  name: string,
  existing: FlowDefinition[],
  id?: string
): FlowDefinition {
  return {
    id: id ?? newId(),
    name,
    routeId: allocateRouteId(name, existing),
    nodes: [],
    edges: [],
  };
}

/** Migrate legacy top-level nodes/edges into flows[]; ensure at least one flow. */
export function normalizeGraph(graph: FlowGraph): FlowGraph {
  const g = { ...graph };

  if (!g.config) {
    g.config = defaultProjectConfig();
  }

  if (g.flows && g.flows.length > 0) {
    g.flows = g.flows.map((f) => ({
      ...f,
      nodes: f.nodes ?? [],
      edges: f.edges ?? [],
      routeId: f.routeId?.trim() || allocateRouteId(f.name || 'flow', []),
    }));
    return g;
  }

  const legacyNodes = g.nodes ?? [];
  const legacyEdges = g.edges ?? [];
  const flow: FlowDefinition = {
    id: newId(),
    name: 'Flow 1',
    routeId: 'flow-1',
    nodes: legacyNodes,
    edges: legacyEdges,
  };

  return {
    ...g,
    flows: [flow],
    nodes: undefined,
    edges: undefined,
  };
}

export function getFlows(graph: FlowGraph): FlowDefinition[] {
  return normalizeGraph(graph).flows;
}

export function flowById(graph: FlowGraph, flowId: string): FlowDefinition | undefined {
  return getFlows(graph).find((f) => f.id === flowId);
}
