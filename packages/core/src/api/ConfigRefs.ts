/** Designer-only prefix; emitted as Spring/Camel ${key} placeholders. */
export const CONFIG_REF_PREFIX = '@config:';

export function isConfigRef(value: string | undefined): boolean {
  return typeof value === 'string' && value.startsWith(CONFIG_REF_PREFIX);
}

export function configRefKey(value: string): string {
  return value.slice(CONFIG_REF_PREFIX.length);
}

/** Resolve a node prop value for URI/YAML emission. */
export function resolvePropForEmit(value: string | undefined): string {
  if (value === undefined || value === '') return '';
  if (isConfigRef(value)) return '${' + configRefKey(value) + '}';
  return value;
}

export function listConfigRefsInProps(props: Record<string, string>): string[] {
  const keys: string[] = [];
  for (const v of Object.values(props)) {
    if (isConfigRef(v)) keys.push(configRefKey(v));
  }
  return keys;
}
