import { BlockCategory } from '../model/BlockCategory.js';
import type { BlockDefinition, PropSchema } from '../model/BlockDefinition.js';
import type { CamelCatalogProperty } from '../model/CamelCatalog.js';
import { getCatalogComponent } from './CatalogRegistry.js';
import { getBlock } from './BlockRegistry.js';

export type ComponentRole = 'consumer' | 'producer';

/** Karavan ComponentApi.getComponentProperties — ordered for property panels */
export function getComponentProperties(scheme: string, role: ComponentRole): CamelCatalogProperty[] {
  const desc = getCatalogComponent(scheme);
  if (!desc) return [];

  const inverted = role === 'consumer' ? 'producer' : 'consumer';
  const raw = desc.properties;

  const path = raw.filter((p) => p.kind === 'path');
  const required = raw.filter((p) => p.kind !== 'path' && p.required);
  const common = raw.filter(
    (p) =>
      p.kind !== 'path' &&
      !p.required &&
      !labelHas(p, inverted) &&
      !labelHas(p, 'advanced')
  );
  const rest = raw.filter(
    (p) =>
      !path.includes(p) &&
      !required.includes(p) &&
      !common.includes(p) &&
      !labelHas(p, inverted)
  );

  const ordered = [...path, ...required, ...common, ...rest];
  return dedupeByName(ordered);
}

function labelHas(p: CamelCatalogProperty, token: string): boolean {
  const lab = String(p.label ?? '').toLowerCase();
  return lab.includes(token);
}

function dedupeByName(props: CamelCatalogProperty[]): CamelCatalogProperty[] {
  const seen = new Set<string>();
  return props.filter((p) => {
    if (seen.has(p.name)) return false;
    seen.add(p.name);
    return true;
  });
}

export function roleForBlockCategory(category: BlockCategory): ComponentRole | null {
  if (category === BlockCategory.SOURCE) return 'consumer';
  if (category === BlockCategory.DESTINATION) return 'producer';
  return null;
}

export function catalogPropToSchema(cp: CamelCatalogProperty, overlay?: PropSchema): PropSchema {
  const type = overlay?.type ?? mapCatalogType(cp);
  const options =
    overlay?.options ??
    (cp.enum?.length ? cp.enum : type === 'radio' && cp.type === 'boolean' ? booleanOptions() : undefined);
  return {
    key: cp.name,
    label: overlay?.label ?? cp.displayName,
    type,
    placeholder: overlay?.placeholder,
    required: overlay?.required ?? cp.required,
    options,
    defaultValue:
      overlay?.defaultValue ??
      (typeof cp.defaultValue === 'boolean' ? String(cp.defaultValue) : cp.defaultValue),
    q: overlay?.q ?? cp.displayName,
    help: overlay?.help ?? cp.description,
  };
}

function mapCatalogType(cp: CamelCatalogProperty): PropSchema['type'] {
  if (cp.secret) return 'password';
  if (cp.enum?.length) return 'chips';
  if (cp.type === 'boolean') return 'radio';
  if (cp.type === 'integer' || cp.type === 'number') return 'number';
  if (cp.type === 'object' || (cp.type === 'string' && (cp.description?.length ?? 0) > 120)) {
    return 'textarea';
  }
  return 'text';
}

function booleanOptions(): PropSchema['options'] {
  return [
    { value: 'true', title: 'Yes', sub: 'Enabled' },
    { value: 'false', title: 'No', sub: 'Disabled' },
  ];
}

/** Wizard steps: curated overlay from blocks.json only */
export function getWizardSteps(blockType: string): PropSchema[] {
  return getBlock(blockType)?.props ?? [];
}

/** Default prop values from blocks.json (applied when dropping a new block). */
export function getDefaultPropsForBlock(blockType: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const step of getWizardSteps(blockType)) {
    if (step.defaultValue !== undefined && step.defaultValue !== '') {
      out[step.key] = String(step.defaultValue);
    }
  }
  return out;
}

/** Node props with catalog/wizard defaults filled in for validation and URI build. */
export function resolveNodeProps(
  blockType: string,
  props: Record<string, string>
): Record<string, string> {
  return { ...getDefaultPropsForBlock(blockType), ...props };
}

export function resolvePropValue(props: Record<string, string>, schema: PropSchema): string {
  const v = props[schema.key];
  if (v !== undefined && v !== '') return v;
  if (schema.defaultValue !== undefined && schema.defaultValue !== '') {
    return String(schema.defaultValue);
  }
  return '';
}

/** Config modal: overlay props + extra catalog fields (Karavan advanced panel) */
export function getConfigPropertiesForBlock(blockType: string): PropSchema[] {
  const block = getBlock(blockType);
  if (!block) return [];

  const result: PropSchema[] = [...block.props];
  const keys = new Set(block.props.map((p) => p.key));
  const role = roleForBlockCategory(block.category);

  if (block.scheme && role) {
    for (const cp of getComponentProperties(block.scheme, role)) {
      if (keys.has(cp.name)) continue;
      if (labelHas(cp, 'advanced') && !cp.required) continue;
      result.push(catalogPropToSchema(cp));
      keys.add(cp.name);
    }
  }

  return result;
}
