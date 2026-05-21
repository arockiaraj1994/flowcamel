import { useEffect, useRef } from 'react';
import { BlockCategory, type BlockDefinition } from '@flowcamel/core';
import './canvas.css';

const CATEGORY_LABEL: Record<BlockCategory, string> = {
  [BlockCategory.SOURCE]: 'sources',
  [BlockCategory.ACTION]: 'actions',
  [BlockCategory.DESTINATION]: 'destinations',
};

const CATEGORIES: BlockCategory[] = [
  BlockCategory.ACTION,
  BlockCategory.DESTINATION,
];

interface Props {
  x: number;
  y: number;
  blocks: BlockDefinition[];
  onSelect: (block: BlockDefinition) => void;
  onClose: () => void;
}

export function ConnectionBlockPicker({ x, y, blocks, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) onClose();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onPointer, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onPointer, true);
    };
  }, [onClose]);

  const pad = 8;
  const maxW = 280;
  const maxH = 320;
  const left = Math.min(Math.max(pad, x), window.innerWidth - maxW - pad);
  const top = Math.min(Math.max(pad, y), window.innerHeight - maxH - pad);

  return (
    <div
      ref={ref}
      className="fc-connection-picker"
      style={{ left, top, maxWidth: maxW, maxHeight: maxH }}
      role="dialog"
      aria-label="Add next block"
    >
      <div className="fc-connection-picker__title">Add next block</div>
      <div className="fc-connection-picker__scroll">
        {CATEGORIES.map((cat) => {
          const section = blocks.filter((b) => b.category === cat);
          if (section.length === 0) return null;
          return (
            <div key={cat} className="fc-connection-picker__section">
              <div className="fc-connection-picker__section-title">
                <span className={`fc-block-panel__section-dot fc-block-panel__section-dot--${cat}`} />
                {CATEGORY_LABEL[cat]}
              </div>
              {section.map((block) => (
                <button
                  key={block.type}
                  type="button"
                  className="fc-connection-picker__item"
                  onClick={() => onSelect(block)}
                >
                  <div className={`fc-block-item__icon fc-block-item__icon--${cat}`}>
                    <i className={`ti ${block.icon}`} />
                  </div>
                  <span className="fc-block-item__label">{block.label}</span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
