import { FlowEdge } from './FlowEdge.js';
import { FlowNode } from './FlowNode.js';

export interface FlowGraph {
  id: string;
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
}
