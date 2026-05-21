import { useState } from 'react';
import type { FlowDefinition } from '@flowcamel/core';
import { ConfirmDialog } from '../../shared/ConfirmDialog.js';

export interface FlowTarget {
  routeId: string;
  name: string;
  flowId: string;
}

interface Props {
  flows: FlowDefinition[];
  activeFlowId: string;
  onSelect: (flowId: string) => void;
  onAdd: () => void;
  onRename: (flowId: string, name: string) => void;
  onDelete: (flowId: string) => void;
}

export function FlowTabBar({ flows, activeFlowId, onSelect, onAdd, onRename, onDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<FlowDefinition | null>(null);

  function startRename(flow: FlowDefinition) {
    setEditingId(flow.id);
    setEditName(flow.name);
  }

  function commitRename(flowId: string) {
    const trimmed = editName.trim();
    if (trimmed) onRename(flowId, trimmed);
    setEditingId(null);
  }

  return (
    <div className="flow-tab-bar">
      <div className="flow-tab-bar__scroll">
        {flows.map((flow) => (
          <div
            key={flow.id}
            className={`flow-tab${flow.id === activeFlowId ? ' is-active' : ''}`}
          >
            {editingId === flow.id ? (
              <input
                className="flow-tab__input"
                value={editName}
                autoFocus
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => commitRename(flow.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename(flow.id);
                  if (e.key === 'Escape') setEditingId(null);
                }}
              />
            ) : (
              <button
                type="button"
                className="flow-tab__btn"
                onClick={() => onSelect(flow.id)}
                onDoubleClick={() => startRename(flow)}
                title={`Route id: ${flow.routeId} (double-click to rename)`}
              >
                {flow.name}
              </button>
            )}
            {flows.length > 1 && (
              <button
                type="button"
                className="flow-tab__close"
                aria-label={`Delete ${flow.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(flow);
                }}
              >
                <i className="ti ti-x" />
              </button>
            )}
          </div>
        ))}
        <button type="button" className="flow-tab flow-tab--add" onClick={onAdd} title="Add flow">
          <i className="ti ti-plus" />
        </button>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete flow?"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.name}" and all its blocks? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete flow"
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) onDelete(deleteTarget.id);
        }}
      />
    </div>
  );
}

/** Other flows for Call flow target picker. */
export function flowTargetsFor(
  flows: FlowDefinition[],
  activeFlowId: string
): FlowTarget[] {
  return flows
    .filter((f) => f.id !== activeFlowId)
    .map((f) => ({ routeId: f.routeId, name: f.name, flowId: f.id }));
}
