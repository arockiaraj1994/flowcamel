import { useState } from 'react';
import { BlockCategory, BlockDefinition, getFeaturedBlocks, getBlockWithCatalog } from '@flowcamel/core';
import './panel.css';

const CATEGORIES: BlockCategory[] = [
  BlockCategory.SOURCE,
  BlockCategory.ACTION,
  BlockCategory.DESTINATION,
];

const CATEGORY_LABEL: Record<BlockCategory, string> = {
  [BlockCategory.SOURCE]: 'sources',
  [BlockCategory.ACTION]: 'actions',
  [BlockCategory.DESTINATION]: 'destinations',
};

interface BlockPanelProps {
  onSidebarDragStart?: (block: BlockDefinition, clientX: number, clientY: number) => void;
  draggingBlockType?: string | null;
}

export function BlockPanel({ onSidebarDragStart, draggingBlockType }: BlockPanelProps) {
  const [search, setSearch] = useState('');
  const allBlocks = getFeaturedBlocks();

  const filtered = allBlocks.filter(
    (b) =>
      !search ||
      b.label.toLowerCase().includes(search.toLowerCase()) ||
      b.short.toLowerCase().includes(search.toLowerCase())
  );

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>, block: BlockDefinition) {
    e.preventDefault();
    onSidebarDragStart?.(block, e.clientX, e.clientY);
  }

  function renderBlock(block: BlockDefinition) {
    const cat = block.category;
    const catalogTitle = getBlockWithCatalog(block.type)?.catalog?.title;
    return (
      <div
        key={block.type}
        className={`fc-block-item${draggingBlockType === block.type ? ' dragging' : ''}`}
        onMouseDown={(e) => handleMouseDown(e, block)}
        title={catalogTitle ? `${block.short} (${catalogTitle})` : block.short}
      >
        <div className={`fc-block-item__icon fc-block-item__icon--${cat}`}>
          <i className={`ti ${block.icon}`} />
        </div>
        <span className="fc-block-item__label">{block.label}</span>
        <i className="ti ti-grip-vertical fc-block-item__grip" />
      </div>
    );
  }

  return (
    <aside className="fc-block-panel">
      <div className="fc-block-panel__search">
        <div className="fc-block-panel__search-input">
          <i className="ti ti-search" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search connectors..."
          />
          {search && (
            <i
              className="ti ti-x"
              style={{ cursor: 'pointer' }}
              onClick={() => setSearch('')}
            />
          )}
        </div>
      </div>
      <div className="fc-block-panel__scroll">
        {CATEGORIES.map((cat) => {
          const blocks = filtered.filter((b) => b.category === cat);
          if (blocks.length === 0) return null;
          return (
            <div key={cat} className="fc-block-panel__section">
              <div className="fc-block-panel__section-title">
                <span className={`fc-block-panel__section-dot fc-block-panel__section-dot--${cat}`} />
                {CATEGORY_LABEL[cat]}
              </div>
              {blocks.map(renderBlock)}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="fc-block-panel__empty">
            No connectors match &quot;{search}&quot;.
          </div>
        )}
      </div>
    </aside>
  );
}
