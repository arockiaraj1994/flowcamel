import type { FlowEdge } from './FlowEdge.js';
import type { FlowNode } from './FlowNode.js';

/** One Camel route: nodes/edges on the canvas tab. */
export interface FlowDefinition {
  id: string;
  name: string;
  routeId: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
}
