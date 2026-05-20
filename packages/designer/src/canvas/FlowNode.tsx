import { Handle, Node, NodeProps, Position } from '@xyflow/react';
import { BlockCategory, getBlock } from '@flowcamel/core';
import './canvas.css';

export interface FlowNodeData extends Record<string, unknown> {
  blockType: string;
  label: string;
  subtitle?: string;
  props: Record<string, string | number | boolean>;
  nodeStyle?: 'card' | 'minimal';
  pulse?: boolean;
}

export type FlowNodeType = Node<FlowNodeData, 'flowNode'>;

export function FlowNodeComponent({ data, selected }: NodeProps<FlowNodeType>) {
  const typedData = data as FlowNodeData;
  const block = getBlock(typedData.blockType);
  const category = block?.category ?? BlockCategory.ACTION;
  const nodeStyle = typedData.nodeStyle ?? 'card';
  const subtitle = typedData.subtitle || block?.short || '';
  const catClass = category === BlockCategory.SOURCE ? 'SOURCE' : category === BlockCategory.DESTINATION ? 'DESTINATION' : 'ACTION';

  const catLabel =
    category === BlockCategory.SOURCE
      ? 'Source'
      : category === BlockCategory.DESTINATION
        ? 'Destination'
        : 'Action';

  return (
    <div
      className={`fc-flow-node fc-flow-node--${catClass}${selected ? ' selected' : ''}${typedData.pulse ? ' pulse' : ''}`}
      data-category={catClass}
    >
      <div className="fc-flow-node__status ok" title="OK" />
      <Handle type="target" position={Position.Left} id="in" />
      <div className="fc-flow-node__row">
        <div className={`fc-flow-node__icon fc-flow-node__icon--${catClass}`}>
          {block && <i className={`ti ${block.icon}`} />}
        </div>
        <div className="fc-flow-node__text">
          <div className="fc-flow-node__label">{typedData.label}</div>
          {subtitle && <div className="fc-flow-node__subtitle">{subtitle}</div>}
        </div>
      </div>
      {nodeStyle !== 'minimal' && (
        <span className={`fc-flow-node__badge fc-flow-node__badge--${catClass}`}>{catLabel}</span>
      )}
      <Handle type="source" position={Position.Right} id="out" />
    </div>
  );
}
