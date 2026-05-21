import type { FlowDefinition } from './FlowDefinition.js';
import type { FlowEdge } from './FlowEdge.js';
import type { FlowNode } from './FlowNode.js';
import type { ProjectConfig } from './ProjectConfig.js';

export interface FlowGraph {
  id: string;
  name: string;
  flows: FlowDefinition[];
  config?: ProjectConfig;
  /** @deprecated Legacy single-flow shape; migrated via normalizeGraph */
  nodes?: FlowNode[];
  /** @deprecated Legacy single-flow shape; migrated via normalizeGraph */
  edges?: FlowEdge[];
}
