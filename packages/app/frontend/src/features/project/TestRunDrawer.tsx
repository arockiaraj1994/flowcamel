import { useState, useRef, useEffect } from 'react';

export interface LogEntry {
  time: string;
  level: 'info' | 'warn' | 'err';
  msg: string;
  trace?: { node: string; duration: number; summary: string };
}

interface Props {
  logs: LogEntry[];
  isRunning: boolean;
  yamlPreview?: string;
  onClose: () => void;
  onReplay: () => void;
}

export function TestRunDrawer({ logs, isRunning, yamlPreview, onClose, onReplay }: Props) {
  const [tab, setTab] = useState<'logs' | 'trace' | 'payload'>('logs');
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [logs.length]);

  return (
    <div className="drawer">
      <div className="drawer-head">
        <div className="drawer-title">
          {isRunning
            ? <span style={{ color: 'var(--accent)' }}>● Running</span>
            : <span style={{ color: 'var(--color-text-tertiary)' }}>○ Idle</span>
          }
          <span style={{ marginLeft: 10 }}>Test run</span>
        </div>
        <div className="drawer-tabs">
          {(
            [
              ['logs', 'Logs'],
              ['trace', 'Trace'],
              ['payload', 'YAML'],
            ] as const
          ).map(([id, label]) => (
            <div
              key={id}
              className={`drawer-tab${tab === id ? ' active' : ''}`}
              onClick={() => setTab(id)}
            >
              {label}
            </div>
          ))}
        </div>
        <button className="btn btn-sm btn-ghost" onClick={onReplay} disabled={isRunning}>
          <i className="ti ti-refresh" /> Replay
        </button>
        <button className="btn btn-icon btn-ghost" onClick={onClose}>
          <i className="ti ti-x" />
        </button>
      </div>
      <div className="drawer-body" ref={bodyRef}>
        {tab === 'logs' && logs.map((l, i) => (
          <div key={i} className="log-line">
            <span className="log-time">{l.time}</span>
            <span className={`log-level ${l.level}`}>{l.level.toUpperCase()}</span>
            <span className="log-msg">{l.msg}</span>
          </div>
        ))}
        {tab === 'trace' && (
          <div style={{ color: 'var(--color-text-secondary)' }}>
            {logs.filter((l) => l.trace).map((l, i) => (
              <div key={i} style={{ padding: '4px 0', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                <span style={{ color: 'var(--accent)' }}>→</span>{' '}
                <span style={{ color: 'var(--color-text-primary)' }}>{l.trace!.node}</span>
                <span style={{ marginLeft: 8, color: 'var(--color-text-tertiary)' }}>{l.trace!.duration}ms</span>
                <div style={{ paddingLeft: 14, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{l.trace!.summary}</div>
              </div>
            ))}
          </div>
        )}
        {tab === 'payload' && (
          <pre style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 11, whiteSpace: 'pre-wrap' }}>
            {yamlPreview ?? '# YAML will appear when the test run starts'}
          </pre>
        )}
      </div>
    </div>
  );
}
