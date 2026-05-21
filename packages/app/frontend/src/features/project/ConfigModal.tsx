import { useState } from 'react';
import type { FlowNode, BlockDefinition, ProjectConfig } from '@flowcamel/core';
import { getConfigPropertiesForBlock } from '@flowcamel/core';
import { PropertyRefField, type FlowTargetOption } from '@flowcamel/designer';

interface Props {
  node: FlowNode;
  block: BlockDefinition;
  projectConfig?: ProjectConfig;
  flowTargets?: FlowTargetOption[];
  onClose: () => void;
  onSave: (patch: { label: string; subtitle: string; props: Record<string, string> }) => void;
  onDelete?: () => void;
}

export function ConfigModal({ node, block, projectConfig, flowTargets, onClose, onSave, onDelete }: Props) {
  const configKeys = projectConfig?.default ?? [];
  const fields = getConfigPropertiesForBlock(block.type);
  const [vals, setVals] = useState<Record<string, string>>({
    ...node.props,
    _label: node.label || block.label,
    _subtitle: node.subtitle || '',
  });

  const setField = (k: string, v: string) => setVals((prev) => ({ ...prev, [k]: v }));
  const cat = block.category.toLowerCase();

  const handleSave = () => {
    const { _label, _subtitle, ...props } = vals;
    onSave({
      label: _label || block.label,
      subtitle: _subtitle ?? '',
      props,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 540, maxHeight: '85vh' }}>
        <div className="modal-head">
          <div
            className="node-icon"
            style={{
              background: `var(--${cat === 'source' ? 'teal' : cat === 'action' ? 'purple' : 'amber'}-bg)`,
              color: `var(--${cat === 'source' ? 'teal' : cat === 'action' ? 'purple' : 'amber'}-fg)`,
              width: 32,
              height: 32,
              fontSize: 16,
            }}
          >
            <i className={`ti ${block.icon}`} />
          </div>
          <div className="modal-title" style={{ flex: 1 }}>
            <div style={{ fontWeight: 500 }}>{block.label}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontWeight: 400 }}>
              {block.scheme ? `Camel ${block.scheme} · ` : ''}catalog properties
            </div>
          </div>
          <button type="button" className="btn btn-icon btn-ghost" onClick={onClose}>
            <i className="ti ti-x" />
          </button>
        </div>
        <div className="modal-body" style={{ overflowY: 'auto', maxHeight: 'calc(85vh - 140px)' }}>
          <div className="form-grid">
            <div className="form-field full">
              <div className="field-label">display name</div>
              <input
                className={`field${vals['_label'] ? ' filled' : ''}`}
                value={vals['_label'] || ''}
                onChange={(e) => setField('_label', e.target.value)}
              />
            </div>
            <div className="form-field full">
              <div className="field-label">subtitle (shown on canvas)</div>
              <input
                className={`field${vals['_subtitle'] ? ' filled' : ''}`}
                value={vals['_subtitle'] || ''}
                onChange={(e) => setField('_subtitle', e.target.value)}
                placeholder={block.short}
              />
            </div>
            {fields.map((s) => (
              <div
                key={s.key}
                className={`form-field${s.type === 'textarea' || s.type === 'radio' ? ' full' : ''}`}
              >
                <div className="field-label">{s.label}</div>
                {s.help && (
                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 6 }}>
                    {s.help}
                  </div>
                )}
                {block.type === 'call-flow-action' && s.key === 'targetRouteId' ? (
                  <select
                    className="field filled"
                    value={vals[s.key] || ''}
                    onChange={(e) => setField(s.key, e.target.value)}
                  >
                    <option value="">Select target flow…</option>
                    {(flowTargets ?? []).map((t) => (
                      <option key={t.routeId} value={t.routeId}>
                        {t.name} (direct:{t.routeId})
                      </option>
                    ))}
                  </select>
                ) : (
                  <PropertyRefField
                    step={s}
                    value={vals[s.key] || ''}
                    onChange={(v) => setField(s.key, v)}
                    configKeys={configKeys}
                    blockType={block.type}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="modal-foot">
          {onDelete && (
            <button type="button" className="btn btn-ghost" style={{ color: 'var(--red)' }} onClick={onDelete}>
              <i className="ti ti-trash" /> Delete block
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
