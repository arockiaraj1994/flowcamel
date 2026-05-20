import { BlockCategory } from '../model/BlockCategory.js';
import type { BlockDefinition } from '../model/BlockDefinition.js';
import type {
  CamelComponentMeta,
  CamelComponentDescriptor,
  CamelCatalogProperty,
} from '../model/CamelCatalog.js';
import componentsCatalog from '../catalog/camel/components.json' with { type: 'json' };
import catalogVersion from '../catalog/camel/version.json' with { type: 'json' };
import blocks from '../catalog/blocks.json' with { type: 'json' };
import eips from '../catalog/eips.json' with { type: 'json' };

/** One entry from camel-catalog Maven JAR (Karavan components.json item). */
export interface CatalogComponentEntry {
  component: CamelComponentMeta;
  properties?: Record<string, RawCatalogProperty>;
  headers?: Record<string, unknown>;
}

interface RawCatalogProperty {
  displayName?: string;
  label?: string;
  type?: string;
  required?: boolean;
  secret?: boolean;
  defaultValue?: string | number | boolean;
  enum?: string[];
  description?: string;
  group?: string;
  kind?: string;
  deprecated?: boolean;
}

const blockList = blocks as BlockDefinition[];
const byType = new Map<string, BlockDefinition>(blockList.map((b) => [b.type, b]));

const entries = componentsCatalog as unknown as CatalogComponentEntry[];
const byScheme = new Map<string, CatalogComponentEntry>();
const byName = new Map<string, CatalogComponentEntry>();

for (const entry of entries) {
  const scheme = entry.component.scheme;
  const name = entry.component.name;
  byScheme.set(scheme, entry);
  byName.set(name, entry);
}

/** Camel catalog version from Maven (see packages/core/src/catalog/camel/version.json). */
export const CAMEL_CATALOG_VERSION = catalogVersion.version as string;
export const CAMEL_CATALOG_MAVEN = catalogVersion.maven as string;

function toCatalogProperties(
  props?: Record<string, RawCatalogProperty>
): CamelCatalogProperty[] {
  if (!props) return [];
  return Object.entries(props)
    .filter(([, v]) => !v.deprecated)
    .map(([name, v]) => ({
      name,
      displayName: v.displayName ?? name,
      type: v.type ?? 'string',
      required: Boolean(v.required),
      secret: Boolean(v.secret),
      defaultValue: v.defaultValue,
      enum: v.enum,
      description: v.description,
      label: typeof v.label === 'string' ? v.label : undefined,
      group: v.group,
      kind: v.kind,
    }));
}

function resolveEntry(schemeOrName: string): CatalogComponentEntry | undefined {
  return byScheme.get(schemeOrName) ?? byName.get(schemeOrName);
}

export function getCatalogComponent(scheme: string): CamelComponentDescriptor | undefined {
  const entry = resolveEntry(scheme);
  if (!entry) return undefined;
  return {
    scheme: entry.component.scheme,
    component: entry.component,
    properties: toCatalogProperties(entry.properties),
  };
}

export function getAllCatalogSchemes(): string[] {
  return Array.from(byScheme.keys()).sort();
}

export function getAllCatalogComponents(): CatalogComponentEntry[] {
  return entries;
}

export function rolesForScheme(scheme: string): BlockCategory[] {
  const c = resolveEntry(scheme)?.component;
  if (!c) return [];
  if (c.consumerOnly) return [BlockCategory.SOURCE];
  if (c.producerOnly) return [BlockCategory.DESTINATION];
  return [BlockCategory.SOURCE, BlockCategory.DESTINATION];
}

/** Spring Boot starter artifact (from catalog component.artifactId). */
export function getMavenStarter(blockType: string): string | null {
  const block = byType.get(blockType);
  if (!block) return null;
  if (block.category === BlockCategory.ACTION && !block.scheme) {
    if (getEipType(blockType) === 'json-xml') return 'camel-jacksonxml-starter';
    if (block.camelComponent === 'camel-core') return null;
  }
  const scheme = block.scheme;
  if (!scheme) return legacyStarter(block.camelComponent);
  const meta = resolveEntry(scheme)?.component;
  if (!meta) return legacyStarter(block.camelComponent);
  const id = meta.artifactId;
  if (!id || id === 'camel-core') return null;
  return id.endsWith('-starter') ? id : `${id}-starter`;
}

function legacyStarter(camelComponent: string): string | null {
  const map: Record<string, string | null> = {
    'camel-ftp-starter': 'camel-ftp-starter',
    'camel-kafka': 'camel-kafka-starter',
    'camel-activemq': 'camel-activemq-starter',
    'camel-undertow': 'camel-undertow-starter',
    'camel-file': 'camel-file-starter',
    'camel-mail': 'camel-mail-starter',
    'camel-jdbc': 'camel-jdbc-starter',
    'camel-http': 'camel-http-starter',
    'camel-xslt': 'camel-xslt-starter',
    'camel-jacksonxml': 'camel-jacksonxml-starter',
    'camel-timer': 'camel-timer-starter',
    'camel-core': null,
  };
  return map[camelComponent] ?? null;
}

export function enrichBlock(block: BlockDefinition): BlockDefinition & { catalog?: CamelComponentMeta } {
  if (!block.scheme) return block;
  const catalog = resolveEntry(block.scheme)?.component;
  return catalog ? { ...block, catalog } : block;
}

export function getBlockWithCatalog(type: string): (BlockDefinition & { catalog?: CamelComponentMeta }) | undefined {
  const block = byType.get(type);
  return block ? enrichBlock(block) : undefined;
}

export function getEipType(type: string): string | undefined {
  const row = (eips as { type: string; eipId: string }[]).find((e) => e.type === type);
  return row?.eipId;
}
