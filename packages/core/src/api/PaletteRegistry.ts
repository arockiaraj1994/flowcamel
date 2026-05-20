import type { BlockDefinition } from '../model/BlockDefinition.js';
import { getAllBlocks } from './BlockRegistry.js';
import supported from '../catalog/supported-components.json' with { type: 'json' };
import blocked from '../catalog/blocked-components.json' with { type: 'json' };

const featured = new Set((supported as { featured: string[] }).featured);
const blockedSchemes = new Set((blocked as { schemes: string[] }).schemes);

export function isFeaturedBlock(blockType: string): boolean {
  return featured.has(blockType);
}

export function isBlockedScheme(scheme: string): boolean {
  return blockedSchemes.has(scheme);
}

/** Palette blocks (featured list); excludes blocked schemes */
export function getFeaturedBlocks(): BlockDefinition[] {
  return getAllBlocks().filter((b) => {
    if (!featured.has(b.type)) return false;
    if (b.scheme && isBlockedScheme(b.scheme)) return false;
    return true;
  });
}

export function getSupportedBlockTypes(): string[] {
  return [...featured];
}
