import { BlockCategory, getBlock, validate, validateForYamlExport } from '@flowcamel/core';
import type { FlowGraph } from '@flowcamel/core';
import { useProjectStore } from './ProjectStore.js';

function statusMessage(
  valid: boolean,
  sourceCount: number,
  destCount: number
): { text: string; icon: string; color: string } {
  if (valid) {
    return { text: 'Route valid', icon: 'ti-check', color: 'var(--accent)' };
  }
  if (sourceCount === 0) {
    return { text: 'Needs a source', icon: 'ti-alert-triangle', color: '#c08a32' };
  }
  if (destCount === 0) {
    return { text: 'Needs a destination', icon: 'ti-alert-triangle', color: '#c08a32' };
  }
  return { text: 'Connect remaining blocks', icon: 'ti-alert-triangle', color: '#c08a32' };
}

interface Props {
  graph?: FlowGraph;
}

export function StatusBar({ graph: graphProp }: Props) {
  const storeGraph = useProjectStore((s) => s.graph);
  const activeFlowId = useProjectStore((s) => s.activeFlowId);
  const graph = graphProp ?? storeGraph;
  const activeFlow =
    graph.flows.find((f) => f.id === activeFlowId) ?? graph.flows[0];
  const flowCount = graph.flows.length;

  const result = validate(graph);
  const yamlResult = validateForYamlExport(graph);
  const nodeCount = activeFlow?.nodes.length ?? 0;
  const edgeCount = activeFlow?.edges.length ?? 0;
  const sourceCount =
    activeFlow?.nodes.filter((n) => getBlock(n.blockType)?.category === BlockCategory.SOURCE)
      .length ?? 0;
  const destCount =
    activeFlow?.nodes.filter((n) => getBlock(n.blockType)?.category === BlockCategory.DESTINATION)
      .length ?? 0;
  const msg = statusMessage(result.valid, sourceCount, destCount);

  return (
    <div className="statusbar">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span className="seg">
          <span
            className="dot"
            style={{ background: nodeCount ? 'var(--accent)' : 'var(--color-border-secondary)' }}
          />
          {nodeCount} block{nodeCount === 1 ? '' : 's'} · {flowCount} flow{flowCount === 1 ? '' : 's'}
        </span>
        <span className="sep" />
        <span className="seg">
          <i className="ti ti-git-branch" /> {edgeCount} connection{edgeCount === 1 ? '' : 's'}
        </span>
        <span className="sep" />
        <span
          className="seg"
          title={
            result.valid
              ? yamlResult.valid
                ? 'Ready for generate and test run'
                : yamlResult.errors.join('\n')
              : result.errors.join('\n')
          }
        >
          <i className={`ti ${msg.icon}`} style={{ color: msg.color }} /> {msg.text}
        </span>
        {!result.valid && result.errors[0] && (
          <span className="seg" style={{ color: 'var(--color-text-tertiary)', maxWidth: 280 }} title={result.errors.join('\n')}>
            — {result.errors[0]}
          </span>
        )}
        {result.valid && !yamlResult.valid && yamlResult.errors[0] && (
          <span className="seg" style={{ color: 'var(--color-text-tertiary)', maxWidth: 280 }} title={yamlResult.errors.join('\n')}>
            — {yamlResult.errors[0]}
          </span>
        )}
      </div>
      <div style={{ color: 'var(--color-text-tertiary)' }}>Spring Boot 3 · Camel 4.x</div>
    </div>
  );
}
