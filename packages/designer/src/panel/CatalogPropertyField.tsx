import type { PropSchema } from '@flowcamel/core';

interface Props {
  step: PropSchema;
  value: string;
  onChange: (value: string) => void;
  onEnter?: () => void;
}

/** Renders a single property field from blocks overlay or Camel catalog (Karavan-style). */
export function CatalogPropertyField({ step, value, onChange, onEnter }: Props) {
  if (step.type === 'chips') {
    const opts = (step.options ?? []) as string[];
    return (
      <div className="chip-group">
        {opts.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`chip${value === opt ? ' selected' : ''}`}
            onClick={() => onChange(opt)}
          >
            {opt}
          </button>
        ))}
        <input
          className="field"
          style={{ width: 88, padding: '4px 8px', marginLeft: 4 }}
          value={!opts.includes(value) ? value || '' : ''}
          placeholder="custom"
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  if (step.type === 'radio') {
    const opts = (step.options ?? []) as Array<{ value: string; title: string; sub?: string }>;
    return (
      <div className="radio-tiles">
        {opts.map((opt) => (
          <div
            key={opt.value}
            role="button"
            tabIndex={0}
            className={`radio-tile${value === opt.value ? ' selected' : ''}`}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => e.key === 'Enter' && onChange(opt.value)}
          >
            <i className={`ti ${value === opt.value ? 'ti-circle-check-filled' : 'ti-circle'}`} />
            <div style={{ flex: 1 }}>
              <div className="radio-tile-title">{opt.title}</div>
              {opt.sub && <div className="radio-tile-sub">{opt.sub}</div>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (step.type === 'textarea') {
    return (
      <textarea
        className={`field${value ? ' filled' : ''}`}
        value={value}
        placeholder={step.placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
      />
    );
  }

  return (
    <input
      type={step.type === 'password' ? 'password' : step.type === 'number' ? 'number' : 'text'}
      className={`field${value ? ' filled' : ''}`}
      value={value}
      placeholder={step.placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onEnter) onEnter();
      }}
    />
  );
}
