/**
 * Canonical property UX: schema-driven WizardPanel (see HANDOVER.md).
 * Per-block RHF forms in ../forms/ are legacy — not used here.
 */
import type { FlowNode, ProjectConfig } from '@flowcamel/core';
import type { FlowTargetOption } from './WizardPanel.js';
import { getBlock } from '@flowcamel/core';
import { WizardPanel } from './WizardPanel.js';
import { AIEmptyState } from './AIEmptyState.js';
import './panel.css';

interface Props {
  node: FlowNode | null;
  allNodes: FlowNode[];
  projectConfig?: ProjectConfig;
  flowTargets?: FlowTargetOption[];
  onNodeUpdate: (nodeId: string, props: Record<string, string>) => void;
  onOpenConfig: () => void;
  onCreateFlow: (prompt: string) => void;
}

export function PropertyPanel({
  node,
  allNodes,
  projectConfig,
  flowTargets,
  onNodeUpdate,
  onOpenConfig,
  onCreateFlow,
}: Props) {
  if (!node) {
    return <AIEmptyState compact onCreateFlow={onCreateFlow} nodeCount={allNodes.length} />;
  }

  const block = getBlock(node.blockType);
  if (!block) {
    return (
      <div className="rpanel">
        <div className="rpanel-body" style={{ padding: 16, color: 'var(--color-text-tertiary)' }}>
          Unknown block type: {node.blockType}
        </div>
      </div>
    );
  }

  return (
    <WizardPanel
      block={block}
      node={node}
      projectConfig={projectConfig}
      flowTargets={flowTargets}
      onNodeUpdate={onNodeUpdate}
      onOpenConfig={onOpenConfig}
    />
  );
}
