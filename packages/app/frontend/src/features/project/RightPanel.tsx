import type { ReactNode } from 'react';

export type RightPanelTab = 'block' | 'properties';

interface Props {
  tab: RightPanelTab;
  onTabChange: (tab: RightPanelTab) => void;
  children: ReactNode;
}

const TABS: { id: RightPanelTab; label: string; icon: string }[] = [
  { id: 'block', label: 'Block', icon: 'ti-box' },
  { id: 'properties', label: 'App config', icon: 'ti-settings-2' },
];

export function RightPanel({ tab, onTabChange, children }: Props) {
  return (
    <div className="fc-right-panel">
      <div className="fc-right-panel__tabs" role="tablist" aria-label="Inspector">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`fc-right-panel__tab${tab === t.id ? ' is-active' : ''}`}
            onClick={() => onTabChange(t.id)}
          >
            <i className={`ti ${t.icon}`} aria-hidden />
            <span>{t.label}</span>
          </button>
        ))}
      </div>
      <div className="fc-right-panel__body" role="tabpanel">
        {children}
      </div>
    </div>
  );
}
