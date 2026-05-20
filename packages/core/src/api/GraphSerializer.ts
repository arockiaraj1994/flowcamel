import { FlowGraph } from '../model/FlowGraph.js';

const SCHEMA_VERSION = 1;

interface SerializedGraph {
  schemaVersion: number;
  graph: FlowGraph;
}

export function toJSON(graph: FlowGraph): string {
  const payload: SerializedGraph = { schemaVersion: SCHEMA_VERSION, graph };
  return JSON.stringify(payload, null, 2);
}

export function fromJSON(json: string): FlowGraph {
  const parsed: unknown = JSON.parse(json);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid graph JSON: not an object');
  }

  const data = parsed as Record<string, unknown>;

  if ('schemaVersion' in data && 'graph' in data) {
    return data['graph'] as FlowGraph;
  }

  // Support raw FlowGraph without wrapper (backwards compat)
  if ('id' in data && 'nodes' in data && 'edges' in data) {
    return data as unknown as FlowGraph;
  }

  throw new Error('Invalid graph JSON: missing required fields');
}
