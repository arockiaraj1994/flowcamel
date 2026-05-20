import { BlockCategory } from '../model/BlockCategory.js';
import type { FlowGraph } from '../model/FlowGraph.js';
import type { FlowNode } from '../model/FlowNode.js';
import { getBlock } from './BlockRegistry.js';
import { getEipType } from './CatalogRegistry.js';
import { orderedNodesFromGraph } from './graphOrder.js';
import type { EndpointDescriptor } from './ComponentUri.js';
import { buildEndpointDescriptor } from './UriBuilder.js';
import type { YamlEndpoint, YamlRouteDefinition, YamlStep } from './YamlRouteModel.js';

function toYamlEndpoint(desc: EndpointDescriptor): YamlEndpoint {
  if (desc.parameters && Object.keys(desc.parameters).length > 0) {
    return { uri: desc.uri, parameters: desc.parameters };
  }
  return { uri: desc.uri };
}

function emitYamlEipStep(eipId: string, props: FlowNode['props'], endpoint: EndpointDescriptor): YamlStep[] {
  switch (eipId) {
    case 'filter':
      return [{ filter: { expression: { simple: props['expression'] ?? 'true' } } }];
    case 'log':
      return [{ log: { message: props['message'] ?? '${body}' } }];
    case 'transform': {
      const lang = props['language'] ?? 'simple';
      return [{ transform: { [lang]: props['expression'] ?? '${body}' } }];
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
      return [{ to: toYamlEndpoint(endpoint) }];
    default:
      return endpoint.uri ? [{ to: toYamlEndpoint(endpoint) }] : [];
  }
}

function emitYamlStep(node: FlowNode, isFirst: boolean): YamlStep[] {
  const block = getBlock(node.blockType);
  if (!block) return [];

  const endpoint = buildEndpointDescriptor(node.blockType, node.props);

  if (isFirst) return [];

  const eip = getEipType(node.blockType);
  if (eip) return emitYamlEipStep(eip, node.props, endpoint);

  if (block.category === BlockCategory.DESTINATION || endpoint.uri) {
    return [{ to: toYamlEndpoint(endpoint) }];
  }

  return [];
}

export function buildYamlRoute(graph: FlowGraph, routeId = 'flowcamel-route'): YamlRouteDefinition | null {
  const ordered = orderedNodesFromGraph(graph);
  if (ordered.length === 0) return null;

  const source = ordered[0]!;
  const fromEndpoint = buildEndpointDescriptor(source.blockType, source.props);
  const steps: YamlStep[] = [];

  for (let i = 1; i < ordered.length; i++) {
    const node = ordered[i];
    if (node) steps.push(...emitYamlStep(node, false));
  }

  return {
    route: {
      id: routeId,
      from: {
        ...toYamlEndpoint(fromEndpoint),
        steps,
      },
    },
  };
}
