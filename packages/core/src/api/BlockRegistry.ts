import { BlockCategory } from '../model/BlockCategory.js';
import { BlockDefinition } from '../model/BlockDefinition.js';
import catalog from '../catalog/blocks.json' with { type: 'json' };

const blocks = catalog as BlockDefinition[];
const byType = new Map<string, BlockDefinition>(blocks.map((b) => [b.type, b]));

export function getBlock(type: string): BlockDefinition | undefined {
  return byType.get(type);
}

export function getAllBlocks(): BlockDefinition[] {
  return blocks;
}

export function getByCategory(category: BlockCategory): BlockDefinition[] {
  return blocks.filter((b) => b.category === category);
}
