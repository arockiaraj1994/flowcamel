import { BlockCategory } from '../model/BlockCategory.js';
import type { FlowGraph } from '../model/FlowGraph.js';
import type { FlowNode } from '../model/FlowNode.js';
import { getBlock } from './BlockRegistry.js';
import { getEipType } from './CatalogRegistry.js';
import { orderedNodesFromGraph } from './graphOrder.js';
import { buildEndpointUri } from './UriBuilder.js';
import type { YamlEndpoint, YamlRouteDefinition, YamlStep } from './YamlRouteModel.js';

/** Full Camel URI in `uri` (required for e.g. `log:loggerName`). */
function toYamlEndpoint(blockType: string, props: FlowNode['props']): YamlEndpoint {
  return { uri: buildEndpointUri(blockType, props) };
}

function emitYamlEipStep(eipId: string, blockType: string, props: FlowNode['props']): YamlStep[] {
  switch (eipId) {
    case 'filter':
      return [{ filter: { expression: { simple: props['expression'] ?? 'true' } } }];
    case 'log':
      return [{ log: { message: props['message'] ?? '${body}' } }];
    case 'transform': {
      const lang = props['language'] ?? 'simple';
      return [{ transform: { [lang]: props['expression'] ?? '${body}' } }];
    }
    case 'set-body': {
      const lang = props['language'] ?? 'simple';
      return [{ setBody: { [lang]: props['expression'] ?? '${body}' } }];
    }
    case 'split': {
      const delimiter = props['delimiter'];
      if (delimiter === 'json-array' || delimiter === 'array') {
        return [{ split: { jsonpath: '$[*]' } }];
      }
      if (delimiter === 'comma') {
        return [{ split: { tokenize: ',' } }];
      }
      return [{ split: { tokenize: '\\n' } }];
    }
    case 'json-xml': {
      if (props['direction'] === 'xml-to-json') {
        return [
          { unmarshal: { jacksonXml: {} } },
          { marshal: { json: {} } },
        ];
      }
      return [
        { unmarshal: { json: {} } },
        { marshal: { jacksonXml: {} } },
      ];
    }
    case 'to-uri':
      return [{ to: toYamlEndpoint(blockType, props) }];
    default: {
      const uri = buildEndpointUri(blockType, props);
      return uri ? [{ to: toYamlEndpoint(blockType, props) }] : [];
    }
  }
}

function emitYamlStep(node: FlowNode, isFirst: boolean): YamlStep[] {
  const block = getBlock(node.blockType);
  if (!block) return [];

  const endpointUri = buildEndpointUri(node.blockType, node.props);

  if (isFirst) return [];

  const eip = getEipType(node.blockType);
  if (eip) return emitYamlEipStep(eip, node.blockType, node.props);

  if (block.category === BlockCategory.DESTINATION || endpointUri) {
    return [{ to: toYamlEndpoint(node.blockType, node.props) }];
  }

  return [];
}

export function buildYamlRoute(graph: FlowGraph, routeId = 'flowcamel-route'): YamlRouteDefinition | null {
  const ordered = orderedNodesFromGraph(graph);
  if (ordered.length === 0) return null;

  const source = ordered[0]!;
  const steps: YamlStep[] = [];

  for (let i = 1; i < ordered.length; i++) {
    const node = ordered[i];
    if (node) steps.push(...emitYamlStep(node, false));
  }

  return {
    route: {
      id: routeId,
      from: {
        ...toYamlEndpoint(source.blockType, source.props),
        steps,
      },
    },
  };
}
