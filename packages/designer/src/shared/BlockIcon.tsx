import { BlockDefinition } from '@flowcamel/core';

interface BlockIconProps {
  block: Pick<BlockDefinition, 'icon'>;
  className?: string;
}

export function BlockIcon({ block, className }: BlockIconProps) {
  return <i className={`ti ${block.icon}${className ? ` ${className}` : ''}`} />;
}
