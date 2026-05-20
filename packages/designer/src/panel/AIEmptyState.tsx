import { useState } from 'react';

const AI_EXAMPLES = [
  'Watch an SFTP folder for new XML files, only pick the orders, and log them.',
  'Every 5 minutes, read pending rows from the database and email any over $10,000 to ops.',
  'When someone posts to /webhook, transform the JSON to XML and upload it via SFTP.',
  'Read from Kafka topic events, split each batch, and save each one to the database.',
];

interface Props {
  onCreateFlow: (prompt: string) => void;
  nodeCount: number;
}

export function AIEmptyState({ onCreateFlow, nodeCount }: Props) {
  const [prompt, setPrompt] = useState('');

  const submit = (text: string) => {
    if (text.trim()) {
      onCreateFlow(text.trim());
      setPrompt('');
    }
  };

  return (
    <div className="rpanel ai-empty">
      <div className="ai-empty-head">
        <div className="ai-empty-title">
          <span className="ai-empty-spark" aria-hidden>✦</span>
          Describe your integration
        </div>
        <p className="ai-empty-sub">
          {nodeCount === 0
            ? 'Tell me what you want in plain English. I\'ll draft the flow — you can edit anything after.'
            : 'Select a block on the canvas to configure it, or describe what to add next.'}
        </p>
      </div>

      <div className="ai-empty-body">
        <label className="ai-prompt-label" htmlFor="ai-flow-prompt">
          Your description
        </label>
        <textarea
          id="ai-flow-prompt"
          className="ai-prompt"
          placeholder="e.g. Every morning, grab new XML files from our SFTP server and email a summary to ops."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit(prompt);
            }
          }}
        />

        <div className="ai-prompt-actions">
          <span className="ai-prompt-hint">⌘↵ to send</span>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={!prompt.trim()}
            onClick={() => submit(prompt)}
          >
            <i className="ti ti-sparkles" /> Build it
          </button>
        </div>

        <p className="ai-examples-label">Or try one of these</p>
        <div className="ai-suggestions">
          {AI_EXAMPLES.map((ex, i) => (
            <button key={i} type="button" className="ai-suggestion" onClick={() => submit(ex)}>
              <i className="ti ti-sparkles" aria-hidden />
              <span>{ex}</span>
            </button>
          ))}
        </div>

        <div className="ai-empty-hint">
          <i className="ti ti-grip-horizontal" aria-hidden />
          <span>
            Or drag any block from the left onto the canvas. Double-click a node for the full property editor.
          </span>
        </div>
      </div>
    </div>
  );
}
