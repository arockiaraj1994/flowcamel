import { FlowGraph } from './FlowGraph.js';

export interface ProjectMeta {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  graph: FlowGraph;
}
