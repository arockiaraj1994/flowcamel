import { useState, useEffect } from 'react';
import type { BlockDefinition } from '@flowcamel/core';
import type { FlowNode } from '@flowcamel/core';

interface Props {
  block: BlockDefinition;
  node: FlowNode;
  onNodeUpdate: (nodeId: string, props: Record<string, string>) => void;
}

interface Message {
  role: 'ai' | 'user';
  text: string;
}

export function ChatPanel({ block, node, onNodeUpdate }: Props) {
  const firstStep = block.props[0];
  const [msgs, setMsgs] = useState<Message[]>([
    { role: 'ai', text: `I'll help you set up ${block.label}. ${block.explain}` },
    { role: 'ai', text: firstStep ? `What should ${firstStep.label} be?` : 'How can I help?' },
  ]);
  const [input, setInput] = useState('');
  const [stepIdx, setStepIdx] = useState(0);
  const cat = block.category.toLowerCase();

  useEffect(() => {
    const fs = block.props[0];
    setMsgs([
      { role: 'ai', text: `I'll help you set up ${block.label}. ${block.explain}` },
      { role: 'ai', text: fs ? `What should ${fs.label} be?` : 'How can I help?' },
    ]);
    setStepIdx(0);
    setInput('');
  }, [node.id]);

  const send = () => {
    if (!input.trim()) return;
    const step = block.props[stepIdx];
    if (!step) return;
    const newMsgs: Message[] = [...msgs, { role: 'user', text: input }];
    onNodeUpdate(node.id, { ...node.props, [step.key]: input });
    const nextIdx = stepIdx + 1;
    const nextStep = block.props[nextIdx];
    if (nextStep) {
      newMsgs.push({ role: 'ai', text: `Got it. Next: ${nextStep.q || nextStep.label}` });
    } else {
      newMsgs.push({ role: 'ai', text: 'All set! You can keep tweaking or move on to the next block.' });
    }
    setMsgs(newMsgs);
    setStepIdx(nextIdx);
    setInput('');
  };

  return (
    <div className="rpanel" style={{ display: 'flex', flexDirection: 'column' }}>
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
          <div className="rpanel-sub">{cat} · chat mode</div>
        </div>
      </div>
      <div className="rpanel-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {msgs.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'ai' ? 'flex-start' : 'flex-end',
              background: m.role === 'ai' ? 'var(--color-background-secondary)' : 'var(--teal-bg)',
              color: m.role === 'ai' ? 'var(--color-text-primary)' : 'var(--teal-fg)',
              padding: '8px 12px',
              borderRadius: 'var(--border-radius-md)',
              fontSize: 12,
              lineHeight: 1.45,
              maxWidth: '85%',
            }}
          >
            {m.text}
          </div>
        ))}
      </div>
      <div style={{ padding: 12, borderTop: '0.5px solid var(--color-border-tertiary)', display: 'flex', gap: 6 }}>
        <input
          className="field"
          value={input}
          placeholder="Type your answer..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
        />
        <button className="btn btn-primary btn-icon" onClick={send}>
          <i className="ti ti-send" />
        </button>
      </div>
    </div>
  );
}
