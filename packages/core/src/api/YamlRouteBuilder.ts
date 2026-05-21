import { BlockCategory } from '../model/BlockCategory.js';
import type { FlowDefinition } from '../model/FlowDefinition.js';
import type { FlowGraph } from '../model/FlowGraph.js';
import type { FlowNode } from '../model/FlowNode.js';
import { getBlock } from './BlockRegistry.js';
import { getEipType } from './CatalogRegistry.js';
import { orderedNodesFromFlow } from './graphOrder.js';
import { getFlows } from './normalizeGraph.js';
import { resolvePropForEmit } from './ConfigRefs.js';
import { buildEndpointUri } from './UriBuilder.js';
import type { YamlEndpoint, YamlRouteDefinition, YamlStep } from './YamlRouteModel.js';

/** Full Camel URI in `uri` (required for e.g. `log:loggerName`). */
function toYamlEndpoint(blockType: string, props: FlowNode['props']): YamlEndpoint {
  return { uri: buildEndpointUri(blockType, props) };
}

function emitYamlEipStep(eipId: string, blockType: string, props: FlowNode['props']): YamlStep[] {
  switch (eipId) {
    case 'filter':
      return [{ filter: { expression: { simple: resolvePropForEmit(props['expression']) || 'true' } } }];
    case 'log':
      return [{ log: { message: props['message'] ?? '${body}' } }];
    case 'transform': {
      const lang = props['language'] ?? 'simple';
      return [{ transform: { [lang]: resolvePropForEmit(props['expression']) || '${body}' } }];
    }
    case 'set-body': {
      const lang = props['language'] ?? 'simple';
      return [{ setBody: { [lang]: resolvePropForEmit(props['expression']) || '${body}' } }];
    }
    case 'call-flow': {
      const target = props['targetRouteId']?.trim();
      return target ? [{ to: { uri: `direct:${target}` } }] : [];
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

export function buildYamlRouteFromFlow(
  flow: FlowDefinition,
  routeId?: string
): YamlRouteDefinition | null {
  const ordered = orderedNodesFromFlow(flow);
  if (ordered.length === 0) return null;

  const rid = routeId ?? flow.routeId ?? 'flow-1';
  const source = ordered[0]!;
  const steps: YamlStep[] = [];

  for (let i = 1; i < ordered.length; i++) {
    const node = ordered[i];
    if (node) steps.push(...emitYamlStep(node, false));
  }

  return {
    route: {
      id: rid,
      from: {
        ...toYamlEndpoint(source.blockType, source.props),
        steps,
      },
    },
  };
}

/** @deprecated Use buildYamlRouteFromFlow */
export function buildYamlRoute(graph: FlowGraph, routeId = 'flowcamel-route'): YamlRouteDefinition | null {
  const flows = getFlows(graph);
  if (flows.length === 0) return null;
  return buildYamlRouteFromFlow(flows[0]!, routeId);
}

export function buildAllYamlRoutes(graph: FlowGraph): YamlRouteDefinition[] {
  const routes: YamlRouteDefinition[] = [];
  for (const flow of getFlows(graph)) {
    const r = buildYamlRouteFromFlow(flow);
    if (r) routes.push(r);
  }
  return routes;
}
