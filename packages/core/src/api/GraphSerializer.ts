import { FlowGraph } from '../model/FlowGraph.js';
import { normalizeGraph } from './normalizeGraph.js';

const SCHEMA_VERSION = 2;

interface SerializedGraph {
  schemaVersion: number;
  graph: FlowGraph;
}

export function toJSON(graph: FlowGraph): string {
  const normalized = normalizeGraph(graph);
  const payload: SerializedGraph = { schemaVersion: SCHEMA_VERSION, graph: normalized };
  return JSON.stringify(payload, null, 2);
}

export function fromJSON(json: string): FlowGraph {
  const parsed: unknown = JSON.parse(json);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid graph JSON: not an object');
  }

  const data = parsed as Record<string, unknown>;

  if ('schemaVersion' in data && 'graph' in data) {
    return normalizeGraph(data['graph'] as FlowGraph);
  }

  if ('id' in data && ('nodes' in data || 'flows' in data)) {
    return normalizeGraph(data as unknown as FlowGraph);
  }

  throw new Error('Invalid graph JSON: missing required fields');
}
