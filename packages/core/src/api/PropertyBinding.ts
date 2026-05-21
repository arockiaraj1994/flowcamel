import type { PropSchema } from '../model/BlockDefinition.js';

/** Field keys that can bind to Application properties when not explicitly marked. */
const LINKABLE_FIELD_KEYS = new Set([
  'host',
  'username',
  'password',
  'port',
  'folder',
  'directory',
  'url',
  'path',
  'brokers',
  'topic',
  'jdbcUrl',
  'to',
  'address',
  'apiKey',
]);

export function isFieldLinkableToConfig(step: PropSchema): boolean {
  if (step.linkable === true) return true;
  if (step.type === 'password') return true;
  if (step.type === 'textarea') return false;
  if (step.type === 'chips' || step.type === 'radio') return false;
  return LINKABLE_FIELD_KEYS.has(step.key);
}
