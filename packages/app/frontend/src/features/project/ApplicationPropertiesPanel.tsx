import { useMemo } from 'react';
import type { ConfigEntry, ConfigProfile, ProjectConfig, VaultProvider } from '@flowcamel/core';
import {
  buildApplicationYamlPreview,
  defaultProjectConfig,
  getDefinedConfigKeys,
} from '@flowcamel/core';

interface Props {
  projectName: string;
  config: ProjectConfig | undefined;
  onChange: (config: ProjectConfig) => void;
}

function emptyEntry(): ConfigEntry {
  return { key: '', value: '', secret: false, description: '' };
}

const PROFILE_PRESETS = ['dev', 'prod', 'staging'];

export function ApplicationPropertiesPanel({ projectName, config, onChange }: Props) {
  const cfg = config ?? defaultProjectConfig();
  const entries = cfg.default ?? [];

  const yamlPreview = useMemo(
    () => buildApplicationYamlPreview(projectName, cfg),
    [projectName, cfg]
  );

  function patch(partial: Partial<ProjectConfig>) {
    onChange({ ...cfg, ...partial });
  }

  function updateEntry(index: number, field: keyof ConfigEntry, value: string | boolean) {
    const next = entries.map((e, i) => (i === index ? { ...e, [field]: value } : e));
    patch({ default: next });
  }

  function addEntry() {
    patch({ default: [...entries, emptyEntry()] });
  }

  function removeEntry(index: number) {
    patch({ default: entries.filter((_, i) => i !== index) });
  }

  function toggleExportProfile(name: string) {
    const current = cfg.exportProfiles ?? [];
    const next = current.includes(name)
      ? current.filter((p) => p !== name)
      : [...current, name];
    const profiles = cfg.profiles ?? [];
    if (!current.includes(name) && !profiles.some((p) => p.name === name)) {
      const profile: ConfigProfile = { name, label: name, entries: [] };
      patch({ exportProfiles: next, profiles: [...profiles, profile] });
    } else {
      patch({ exportProfiles: next });
    }
  }

  function ensureProfile(name: string): ConfigProfile {
    const existing = (cfg.profiles ?? []).find((p) => p.name === name);
    if (existing) return existing;
    return { name, label: name, entries: [] };
  }

  function updateProfileEntry(
    profileName: string,
    index: number,
    field: keyof ConfigEntry,
    value: string | boolean
  ) {
    const profile = ensureProfile(profileName);
    const profileEntries = [...(profile.entries ?? [])];
    profileEntries[index] = { ...profileEntries[index]!, [field]: value };
    const profiles = (cfg.profiles ?? []).filter((p) => p.name !== profileName);
    profiles.push({ ...profile, entries: profileEntries });
    patch({ profiles });
  }

  const vaultProvider: VaultProvider = cfg.vault?.provider ?? 'none';
  const definedKeys = getDefinedConfigKeys(cfg);

  function defaultValueForKey(key: string): string | undefined {
    return definedKeys.find((e) => e.key.trim() === key)?.value;
  }

  function addProfileEntry(profileName: string, prefillKey?: string) {
    const profile = ensureProfile(profileName);
    const used = new Set((profile.entries ?? []).map((e) => e.key.trim()));
    const firstFree =
      prefillKey ??
      definedKeys.map((e) => e.key.trim()).find((k) => k && !used.has(k)) ??
      '';
    const row: ConfigEntry = { key: firstFree, value: defaultValueForKey(firstFree) ?? '', secret: false };
    patch({
      profiles: [
        ...(cfg.profiles ?? []).filter((p) => p.name !== profileName),
        { ...profile, entries: [...(profile.entries ?? []), row] },
      ],
    });
  }

  return (
    <div className="rpanel app-props-panel">
      <div className="rpanel-body app-props-panel__scroll">
        <div className="app-props-flow-hint">
          <i className="ti ti-route" aria-hidden />
          <span>
            <strong>1.</strong> Define keys and default values here.{' '}
            <strong>2.</strong> On the <em>Block</em> tab, choose <em>Application property</em> on SFTP and other
            connection fields. <strong>3.</strong> Use export profiles below for dev/prod overrides.
          </span>
        </div>

        <section className="app-props-section">
          <div className="app-props-section__head">
            <h3 className="app-props-section__title">Default properties</h3>
            <p className="app-props-section__hint">
              Dot notation (e.g. <code>sftp.password</code>). Secrets export as placeholders in the ZIP.
            </p>
          </div>

          {entries.length === 0 ? (
            <div className="app-props-empty">
              <i className="ti ti-key" aria-hidden />
              <span>No properties yet. Add keys your routes can reference.</span>
            </div>
          ) : (
            <ul className="app-props-kv-list">
              {entries.map((e, i) => (
                <li key={i} className="app-props-kv-row">
                  <input
                    className="field"
                    value={e.key}
                    placeholder="sftp.host"
                    aria-label="Property key"
                    onChange={(ev) => updateEntry(i, 'key', ev.target.value)}
                  />
                  <input
                    className="field"
                    type={e.secret ? 'password' : 'text'}
                    value={e.value}
                    placeholder="value"
                    aria-label="Property value"
                    onChange={(ev) => updateEntry(i, 'value', ev.target.value)}
                  />
                  <label className="app-props-secret" title="Export as ${key} placeholder">
                    <input
                      type="checkbox"
                      checked={!!e.secret}
                      onChange={(ev) => updateEntry(i, 'secret', ev.target.checked)}
                    />
                    <span>Secret</span>
                  </label>
                  <button
                    type="button"
                    className="btn btn-icon btn-ghost app-props-remove"
                    aria-label="Remove property"
                    onClick={() => removeEntry(i)}
                  >
                    <i className="ti ti-trash" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="app-props-add-row">
            <button type="button" className="btn btn-sm app-props-add" onClick={addEntry}>
              <i className="ti ti-plus" /> Add property
            </button>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => {
                const template: ConfigEntry[] = [
                  { key: 'sftp.host', value: '', secret: false },
                  { key: 'sftp.port', value: '22', secret: false },
                  { key: 'sftp.username', value: '', secret: false },
                  { key: 'sftp.password', value: '', secret: true },
                  { key: 'sftp.folder', value: '/inbox', secret: false },
                ];
                const existing = new Set(entries.map((e) => e.key.trim()));
                const toAdd = template.filter((t) => !existing.has(t.key));
                if (toAdd.length) patch({ default: [...entries, ...toAdd] });
              }}
            >
              <i className="ti ti-template" /> SFTP keys
            </button>
          </div>
        </section>

        <section className="app-props-section">
          <div className="app-props-section__head">
            <h3 className="app-props-section__title">Export profiles</h3>
            <p className="app-props-section__hint">Included as <code>application-{'{profile}'}.yml</code> in the generated project.</p>
          </div>
          <div className="chip-group app-props-chips">
            {PROFILE_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                className={`chip${(cfg.exportProfiles ?? []).includes(p) ? ' selected' : ''}`}
                onClick={() => toggleExportProfile(p)}
              >
                {p}
              </button>
            ))}
          </div>

          {(cfg.exportProfiles ?? []).map((profileName) => {
            const profile = ensureProfile(profileName);
            const usedKeys = new Set((profile.entries ?? []).map((e) => e.key.trim()));
            const availableKeys = definedKeys
              .map((e) => e.key.trim())
              .filter((k) => k && !usedKeys.has(k));
            return (
              <div key={profileName} className="app-props-profile">
                <div className="app-props-profile__label">
                  <i className="ti ti-stack-2" aria-hidden />
                  Overrides for <strong>{profileName}</strong>
                </div>
                {definedKeys.length === 0 ? (
                  <p className="app-props-profile__empty">
                    Add default properties above before setting profile overrides.
                  </p>
                ) : (
                  <>
                    {(profile.entries ?? []).map((e, i) => {
                      const defVal = defaultValueForKey(e.key.trim());
                      return (
                        <div key={i} className="app-props-kv-row app-props-kv-row--profile">
                          <select
                            className="field filled"
                            value={e.key}
                            aria-label="Property key"
                            onChange={(ev) => {
                              const newKey = ev.target.value;
                              const profiles = (cfg.profiles ?? []).filter(
                                (p) => p.name !== profileName
                              );
                              const profileEntries = [...(profile.entries ?? [])];
                              profileEntries[i] = {
                                ...profileEntries[i]!,
                                key: newKey,
                                value: defaultValueForKey(newKey) ?? '',
                              };
                              profiles.push({ ...profile, entries: profileEntries });
                              patch({ profiles });
                            }}
                          >
                            <option value="">Select key…</option>
                            {definedKeys.map((d) => (
                              <option
                                key={d.key}
                                value={d.key}
                                disabled={
                                  d.key.trim() !== e.key.trim() && usedKeys.has(d.key.trim())
                                }
                              >
                                {d.key}
                                {d.secret ? ' (secret)' : ''}
                              </option>
                            ))}
                          </select>
                          <input
                            className="field"
                            value={e.value}
                            placeholder={defVal ? `default: ${defVal}` : 'override value'}
                            aria-label="Profile override value"
                            onChange={(ev) =>
                              updateProfileEntry(profileName, i, 'value', ev.target.value)
                            }
                          />
                          <button
                            type="button"
                            className="btn btn-icon btn-ghost app-props-remove"
                            aria-label="Remove override"
                            onClick={() => {
                              const next = (profile.entries ?? []).filter((_, j) => j !== i);
                              const profiles = (cfg.profiles ?? []).filter(
                                (p) => p.name !== profileName
                              );
                              profiles.push({ ...profile, entries: next });
                              patch({ profiles });
                            }}
                          >
                            <i className="ti ti-trash" />
                          </button>
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      disabled={availableKeys.length === 0}
                      onClick={() => addProfileEntry(profileName)}
                    >
                      <i className="ti ti-plus" /> Add override
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </section>

        <section className="app-props-section">
          <div className="app-props-section__head">
            <h3 className="app-props-section__title">Vault wiring</h3>
            <p className="app-props-section__hint">Adds starters and <code>spring.config.import</code> to the export — resolved at runtime, not in FlowCamel.</p>
          </div>
          <select
            className="field filled"
            value={vaultProvider}
            onChange={(e) =>
              patch({
                vault: {
                  provider: e.target.value as VaultProvider,
                  secretId: cfg.vault?.secretId,
                },
              })
            }
          >
            <option value="none">None</option>
            <option value="aws">AWS Secrets Manager</option>
            <option value="azure">Azure Key Vault</option>
          </select>
          {vaultProvider === 'aws' && (
            <input
              className="field filled"
              style={{ marginTop: 8 }}
              placeholder="Secret id prefix (e.g. my-app/)"
              value={cfg.vault?.secretId ?? ''}
              onChange={(e) => patch({ vault: { provider: 'aws', secretId: e.target.value } })}
            />
          )}
        </section>

        <section className="app-props-section app-props-section--yaml">
          <div className="app-props-section__head">
            <h3 className="app-props-section__title">YAML preview</h3>
          </div>
          <pre className="app-props-yaml">{yamlPreview}</pre>
        </section>
      </div>
    </div>
  );
}
