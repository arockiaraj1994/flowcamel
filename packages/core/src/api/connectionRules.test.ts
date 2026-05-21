import { describe, expect, it } from 'vitest';
import { BlockCategory } from '../model/BlockCategory.js';
import {
  canConnect,
  getSuccessorBlocks,
  getSuccessorCategories,
  hasSuccessors,
} from './connectionRules.js';

describe('connectionRules', () => {
  it('SOURCE allows ACTION and DESTINATION successors', () => {
    const cats = getSuccessorCategories('timer-source');
    expect(cats).toContain(BlockCategory.ACTION);
    expect(cats).toContain(BlockCategory.DESTINATION);
    expect(cats).not.toContain(BlockCategory.SOURCE);
  });

  it('call-flow-action has no successors', () => {
    expect(getSuccessorCategories('call-flow-action')).toEqual([]);
    expect(hasSuccessors('call-flow-action')).toBe(false);
    expect(getSuccessorBlocks('call-flow-action')).toEqual([]);
  });

  it('DESTINATION has no successors', () => {
    expect(getSuccessorCategories('log-dest')).toEqual([]);
    expect(hasSuccessors('log-dest')).toBe(false);
  });

  it('getSuccessorBlocks returns featured blocks in allowed categories', () => {
    const blocks = getSuccessorBlocks('timer-source');
    expect(blocks.length).toBeGreaterThan(0);
    for (const b of blocks) {
      expect([BlockCategory.ACTION, BlockCategory.DESTINATION]).toContain(b.category);
    }
  });

  it('canConnect rejects SOURCE as target', () => {
    expect(canConnect('log-action', 'timer-source')).toBe(false);
    expect(canConnect('timer-source', 'log-action')).toBe(true);
  });
});
