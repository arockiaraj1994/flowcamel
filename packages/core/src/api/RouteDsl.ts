import { BlockCategory } from '../model/BlockCategory.js';
import type { FlowNode } from '../model/FlowNode.js';
import { getBlock } from './BlockRegistry.js';
import { getEipType } from './CatalogRegistry.js';
import { buildEndpointUri } from './UriBuilder.js';

/** Emit one Camel Java DSL line for a flow node (from catalog URI template or EIP registry). */
export function emitRouteStep(node: FlowNode, isFirst: boolean): string {
  const block = getBlock(node.blockType);
  if (!block) return `// Unknown block: ${node.blockType}`;

  const props = node.props;
  const uri = buildEndpointUri(node.blockType, props);

  if (isFirst) {
    return `        from("${uri}")`;
  }

  const eip = getEipType(node.blockType);
  if (eip) {
    return emitEipStep(eip, props, uri);
  }

  if (block.category === BlockCategory.DESTINATION || uri) {
    return `            .to("${uri}")`;
  }

  return `// Unsupported step: ${node.blockType}`;
}

function emitEipStep(eipId: string, props: FlowNode['props'], uri: string): string {
  switch (eipId) {
    case 'filter':
      return `            .filter(simple("${props['expression'] ?? ''}"))`;
    case 'log':
      return `            .log("${props['message'] ?? '${body}'}")`;
    case 'transform':
      return `            .transform().${props['language'] ?? 'simple'}("${props['expression'] ?? '${body}'}")`;
    case 'set-body':
      return `            .setBody(${props['language'] ?? 'simple'}("${props['expression'] ?? '${body}'}"))`;
    case 'call-flow': {
      const target = props['targetRouteId']?.trim();
      return target ? `            .to("direct:${target}")` : `// Call flow: missing targetRouteId`;
    }
    case 'split': {
      const delimiter = props['delimiter'];
      if (delimiter === 'json-array' || delimiter === 'array') {
        return `            .split(jsonpath("$[*]"))`;
      }
      if (delimiter === 'comma') return `            .split(body().tokenize(","))`;
      return `            .split(body().tokenize("\\n"))`;
    }
    case 'json-xml': {
      const dir = props['direction'];
      if (dir === 'xml-to-json') return `            .unmarshal().jacksonXml().marshal().json()`;
      return `            .unmarshal().json().marshal().jacksonXml()`;
    }
    case 'to-uri':
      return `            .to("${uri}")`;
    default:
      return uri ? `            .to("${uri}")` : `// Unknown EIP: ${eipId}`;
  }
}
