import { useMemo, useState } from 'react';
import type { ConfigEntry, PropSchema } from '@flowcamel/core';
import {
  CONFIG_REF_PREFIX,
  isConfigRef,
  isFieldLinkableToConfig,
  suggestConfigKeys,
  suggestPropertyKeyForField,
} from '@flowcamel/core';
import { CatalogPropertyField } from './CatalogPropertyField.js';

interface Props {
  step: PropSchema;
  value: string;
  onChange: (value: string) => void;
  configKeys: ConfigEntry[];
  blockType: string;
  onEnter?: () => void;
}

function optionLabel(entry: ConfigEntry): string {
  const key = entry.key.trim();
  if (!key) return '';
  if (entry.secret) return `${key} (secret)`;
  if (entry.value?.trim()) return `${key} — ${entry.value}`;
  return key;
}

export function PropertyRefField({
  step,
  value,
  onChange,
  configKeys,
  blockType,
  onEnter,
}: Props) {
  const linkable = isFieldLinkableToConfig(step);
  const [mode, setMode] = useState<'literal' | 'property'>(
    isConfigRef(value) ? 'property' : 'literal'
  );

  const propertyOptions = useMemo(() => {
    const defined = configKeys.filter((e) => e.key.trim());
    const definedNames = new Set(defined.map((e) => e.key.trim()));
    const suggested = suggestPropertyKeyForField(blockType, step.key);
    const extras = suggestConfigKeys(blockType).filter((k) => !definedNames.has(k));
    const orderedNames = [
      ...defined.map((e) => e.key.trim()),
      ...(definedNames.has(suggested) ? [] : [suggested]),
      ...extras.filter((k) => k !== suggested),
    ];
    const byKey = new Map(defined.map((e) => [e.key.trim(), e]));
    return orderedNames.map((key) => ({
      key,
      entry: byKey.get(key),
      isSuggested: key === suggested && !definedNames.has(key),
    }));
  }, [configKeys, blockType, step.key]);

  if (!linkable) {
    return <CatalogPropertyField step={step} value={value} onChange={onChange} onEnter={onEnter} />;
  }

  const hasDefinedKeys = configKeys.some((e) => e.key.trim());
  const selectedKey = isConfigRef(value) ? value.slice(CONFIG_REF_PREFIX.length) : '';

  return (
    <div className="prop-ref-field">
      <div className="chip-group prop-ref-field__mode">
        <button
          type="button"
          className={`chip${mode === 'literal' ? ' selected' : ''}`}
          onClick={() => {
            setMode('literal');
            if (isConfigRef(value)) onChange('');
          }}
        >
          Literal
        </button>
        <button
          type="button"
          className={`chip${mode === 'property' ? ' selected' : ''}`}
          onClick={() => setMode('property')}
        >
          Application property
        </button>
      </div>
      {mode === 'property' ? (
        <>
          <select
            className="field filled"
            value={selectedKey}
            onChange={(e) => {
              const k = e.target.value;
              onChange(k ? `${CONFIG_REF_PREFIX}${k}` : '');
            }}
          >
            <option value="">Select property key…</option>
            {propertyOptions.map(({ key, entry, isSuggested }) => (
              <option key={key} value={key}>
                {entry ? optionLabel(entry) : isSuggested ? `${key} (suggested — add in App config)` : key}
              </option>
            ))}
          </select>
          {!hasDefinedKeys && (
            <p className="prop-ref-field__hint">
              Add keys under <strong>App config</strong> first (e.g.{' '}
              <code>{suggestPropertyKeyForField(blockType, step.key)}</code>), then pick them here.
            </p>
          )}
          {selectedKey && (
            <p className="prop-ref-field__hint">
              Exports as <code>{'${' + selectedKey + '}'}</code> in routes and{' '}
              <code>application.yml</code>. Profile overrides (dev/prod) set per-environment values.
            </p>
          )}
        </>
      ) : (
        <CatalogPropertyField step={step} value={value} onChange={onChange} onEnter={onEnter} />
      )}
    </div>
  );
}
