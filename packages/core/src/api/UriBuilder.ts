import { BlockCategory } from '../model/BlockCategory.js';
import type { BlockDefinition } from '../model/BlockDefinition.js';
import type { FlowNode } from '../model/FlowNode.js';
import { getBlock } from './BlockRegistry.js';
import { resolveNodeProps, roleForBlockCategory } from './ComponentProperties.js';
import { buildUriFromCatalog, splitEndpointUri, type EndpointDescriptor } from './ComponentUri.js';

/**
 * Builds a Camel endpoint URI: catalog syntax first (Karavan), then blocks.json template fallback.
 */
export function buildEndpointUri(blockType: string, props: FlowNode['props']): string {
  const block = getBlock(blockType);
  if (!block) return '';

  const merged = resolveNodeProps(blockType, props);

  if (block.scheme) {
    const role = roleForBlockCategory(block.category);
    if (role) {
      const fromCatalog = buildUriFromCatalog(block.scheme, role, merged);
      if (fromCatalog) return fromCatalog;
    }
  }

  if (block.camelUri) return fillUriTemplate(block.camelUri, merged);
  return '';
}

export function fillUriTemplate(uriTemplate: string, props: Record<string, string>): string {
  return uriTemplate.replace(/\{\{props\.(\w+)\}\}/g, (_match, key: string) => String(props[key] ?? ''));
}

export function getBlockUriTemplate(block: BlockDefinition): string {
  return block.camelUri;
}

export function buildEndpointDescriptor(
  blockType: string,
  props: FlowNode['props']
): EndpointDescriptor {
  const full = buildEndpointUri(blockType, props);
  const block = getBlock(blockType);
  const scheme = block?.scheme ?? full.split(':')[0]?.split('?')[0] ?? '';
  if (!full) return { uri: '' };
  if (!scheme) return { uri: full };
  return splitEndpointUri(full, scheme);
}
