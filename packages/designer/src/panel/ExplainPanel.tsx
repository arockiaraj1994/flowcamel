import type { BlockDefinition } from '@flowcamel/core';
import type { FlowNode } from '@flowcamel/core';
import { EipGlyph } from './EipGlyph.js';

interface Props {
  block: BlockDefinition;
  node: FlowNode;
  onOpenConfig: () => void;
}

function stepIdiomFor(block: BlockDefinition, node: FlowNode): string {
  const p = node.props;
  switch (block.type) {
    case 'sftp-source':
      return `Every ${p['pollEvery'] || 'few minutes'}, log in to ${p['host'] || 'the server'} as ${p['username'] || 'your user'} and pick up new files from ${p['folder'] || 'the folder'}.`;
    case 'filter-action':
      return `Only let through messages where ${p['field'] || 'the filename'} matches "${p['expression'] || 'the rule'}".`;
    case 'log-action':
      return `Write a ${p['level'] || 'INFO'} log line: "${p['message'] || 'the message'}".`;
    case 'log-dest':
      return `Send the message to the "${p['loggerName'] || 'flowcamel'}" logger at ${p['level'] || 'INFO'} level.`;
    case 'timer-source':
      return `Fire every ${p['period'] || '5 minutes'}${p['repeatCount'] ? `, ${p['repeatCount']} times total` : ''}.`;
    case 'transform-action':
      return p['from'] && p['to'] ? `Convert messages from ${p['from']} to ${p['to']}.` : block.explain;
    case 'set-body-action':
      return `Set the message body to: "${(p['expression'] || '${body}').slice(0, 48)}".`;
    default:
      return block.explain;
  }
}

export function ExplainPanel({ block, node, onOpenConfig }: Props) {
  const cat = block.category.toLowerCase();
  return (
    <div className="rpanel">
      <div className="rpanel-head">
        <div
          className="node-icon"
          style={{
            background: `var(--${cat === 'source' ? 'teal' : cat === 'action' ? 'purple' : 'amber'}-bg)`,
            color: `var(--${cat === 'source' ? 'teal' : cat === 'action' ? 'purple' : 'amber'}-fg)`,
          }}
        >
          <i className={`ti ${block.icon}`} />
        </div>
        <div className="rpanel-titles">
          <div className="rpanel-title">{node.label || block.label}</div>
          <div className="rpanel-sub">{cat} · {block.type}</div>
        </div>
      </div>
      <div className="rpanel-body">
        <div className="wiz-glyph">
          <EipGlyph kind={block.glyph} />
        </div>
        <div className="wiz-question">{block.label}</div>
        <div className="wiz-help" style={{ marginBottom: 16 }}>{block.explain}</div>

        <div className="field-label">in plain english</div>
        <div style={{
          fontSize: 12,
          color: 'var(--color-text-primary)',
          lineHeight: 1.5,
          marginBottom: 14,
          padding: '10px 12px',
          background: 'var(--color-background-secondary)',
          borderRadius: 'var(--border-radius-md)',
        }}>
          <i>{stepIdiomFor(block, node)}</i>
        </div>

        <div className="field-label">what it does</div>
        <ul style={{ paddingLeft: 18, margin: '4px 0 14px', fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
          {block.props.map((s) => (
            <li key={s.key}>
              {s.label}:{' '}
              {node.props[s.key]
                ? <strong style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{node.props[s.key]}</strong>
                : <span style={{ color: 'var(--color-text-tertiary)' }}>not set</span>
              }
            </li>
          ))}
        </ul>

        <button
          className="btn btn-primary btn-sm"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={onOpenConfig}
        >
          <i className="ti ti-adjustments" /> Edit all properties
        </button>
      </div>
      <div className="rpanel-foot">
        <div className="ai-tag"><span className="spark">✦</span> AI suggest</div>
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
          Press Tab to jump fields, or describe what you want and I'll fill it in.
        </div>
      </div>
    </div>
  );
}
