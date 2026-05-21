import { BlockCategory } from '../model/BlockCategory.js';
import type { BlockDefinition } from '../model/BlockDefinition.js';
import { getBlock } from './BlockRegistry.js';
import { getFeaturedBlocks } from './PaletteRegistry.js';

/** Categories allowed as the next node after `fromBlockType`. */
export function getSuccessorCategories(fromBlockType: string): BlockCategory[] {
  const block = getBlock(fromBlockType);
  if (!block) return [];

  if (block.category === BlockCategory.SOURCE) {
    return [BlockCategory.ACTION, BlockCategory.DESTINATION];
  }
  if (block.category === BlockCategory.ACTION) {
    if (fromBlockType === 'call-flow-action') return [];
    return [BlockCategory.ACTION, BlockCategory.DESTINATION];
  }
  return [];
}

export function hasSuccessors(fromBlockType: string): boolean {
  return getSuccessorCategories(fromBlockType).length > 0;
}

/** Featured palette blocks that may follow `fromBlockType`. */
export function getSuccessorBlocks(fromBlockType: string): BlockDefinition[] {
  const allowed = new Set(getSuccessorCategories(fromBlockType));
  if (allowed.size === 0) return [];
  return getFeaturedBlocks().filter((b) => allowed.has(b.category));
}

/** Whether an edge from source block type to target block type is valid. */
export function canConnect(sourceBlockType: string, targetBlockType: string): boolean {
  const target = getBlock(targetBlockType);
  if (!target) return false;
  return getSuccessorCategories(sourceBlockType).includes(target.category);
}
