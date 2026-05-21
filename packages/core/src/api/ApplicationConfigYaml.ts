import type { ConfigEntry, ConfigProfile, ProjectConfig, VaultProvider } from '../model/ProjectConfig.js';

function setNested(target: Record<string, unknown>, key: string, value: unknown) {
  const parts = key.split('.');
  let cur: Record<string, unknown> = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i]!;
    if (!(p in cur) || typeof cur[p] !== 'object' || cur[p] === null) {
      cur[p] = {};
    }
    cur = cur[p] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]!] = value;
}

function emitValue(entry: ConfigEntry, forExport: boolean): string {
  if (forExport && entry.secret) {
    return '${' + entry.key + '}';
  }
  return entry.value;
}

function nestedFromEntries(entries: ConfigEntry[], forExport: boolean): Record<string, unknown> {
  const root: Record<string, unknown> = {};
  const sorted = [...entries].sort((a, b) => a.key.localeCompare(b.key));
  for (const e of sorted) {
    if (!e.key.trim()) continue;
    setNested(root, e.key, emitValue(e, forExport));
  }
  return root;
}

/** Simple nested YAML emitter (no external deps). */
export function entriesToYamlMap(entries: ConfigEntry[], forExport: boolean): string {
  const root = nestedFromEntries(entries, forExport);
  return objectToYaml(root, 0).trimEnd();
}

function objectToYaml(obj: Record<string, unknown>, indent: number): string {
  const lines: string[] = [];
  for (const key of Object.keys(obj).sort()) {
    const val = obj[key];
    const pad = ' '.repeat(indent);
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      lines.push(`${pad}${key}:`);
      lines.push(objectToYaml(val as Record<string, unknown>, indent + 2));
    } else {
      const scalar = formatScalar(val);
      lines.push(`${pad}${key}: ${scalar}`);
    }
  }
  return lines.join('\n');
}

function formatScalar(v: unknown): string {
  if (v === null || v === undefined) return '""';
  const s = String(v);
  if (s.startsWith('${') && s.endsWith('}')) return s;
  if (/^-?\d+(\.\d+)?$/.test(s)) return s;
  if (s === 'true' || s === 'false') return s;
  if (/^[a-zA-Z0-9._/@-]+$/.test(s) && !s.includes(':')) return s;
  return JSON.stringify(s);
}

export function buildApplicationYamlPreview(
  projectName: string,
  config: ProjectConfig | undefined
): string {
  const lines: string[] = [
    'spring:',
    '  application:',
    `    name: ${formatScalar(projectName)}`,
  ];

  const vault = config?.vault?.provider ?? 'none';
  if (vault === 'aws') {
    const id = config?.vault?.secretId?.trim() || 'my-app/';
    lines.push('  config:');
    lines.push(`    import: optional:aws-secretsmanager:${id}`);
  } else if (vault === 'azure') {
    lines.push('  config:');
    lines.push('    import: optional:azure-keyvault:');
  }

  lines.push('');
  lines.push('camel:');
  lines.push('  springboot:');
  lines.push('    main-run-controller: true');
  lines.push('  main:');
  lines.push('    routes-include-pattern: classpath:camel/**');
  lines.push('');

  const body = entriesToYamlMap(config?.default ?? [], false);
  if (body) lines.push(body);

  return lines.join('\n');
}

export function buildProfileYaml(profile: ConfigProfile): string {
  const lines: string[] = [
    'spring:',
    '  config:',
    '    activate:',
    `      on-profile: ${profile.name}`,
  ];
  const body = entriesToYamlMap(profile.entries, true);
  if (body) {
    lines.push('');
    lines.push(body);
  }
  return lines.join('\n');
}

export function defaultProjectConfig(): ProjectConfig {
  return { default: [], exportProfiles: [], profiles: [], vault: { provider: 'none' } };
}

export function configKeyExists(config: ProjectConfig | undefined, key: string): boolean {
  if (!config?.default) return false;
  return config.default.some((e) => e.key === key);
}

export function blockConfigPrefix(blockType: string): string {
  return blockType.replace(/-source$/, '').replace(/-dest$/, '').replace(/-action$/, '');
}

export function suggestConfigKeys(blockType: string): string[] {
  const prefix = blockConfigPrefix(blockType);
  return [
    `${prefix}.host`,
    `${prefix}.port`,
    `${prefix}.username`,
    `${prefix}.password`,
    `${prefix}.folder`,
    `${prefix}.directory`,
    `${prefix}.url`,
    `${prefix}.topic`,
    `${prefix}.brokers`,
  ];
}

/** Best-guess application.yml key for a block field (e.g. host → sftp.host). */
export function suggestPropertyKeyForField(blockType: string, fieldKey: string): string {
  const prefix = blockConfigPrefix(blockType);
  const aliases: Record<string, string> = {
    folder: `${prefix}.folder`,
    directory: `${prefix}.directory`,
    jdbcUrl: `${prefix}.jdbcUrl`,
    brokers: `${prefix}.brokers`,
  };
  return aliases[fieldKey] ?? `${prefix}.${fieldKey}`;
}

export function getDefinedConfigKeys(config: ProjectConfig | undefined): ConfigEntry[] {
  if (!config?.default) return [];
  return config.default.filter((e) => e.key.trim() !== '');
}

export function getDefinedConfigKeyNames(config: ProjectConfig | undefined): string[] {
  return getDefinedConfigKeys(config).map((e) => e.key.trim());
}
