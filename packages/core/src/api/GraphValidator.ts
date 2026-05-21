import { BlockCategory } from '../model/BlockCategory.js';
import type { FlowDefinition } from '../model/FlowDefinition.js';
import { FlowGraph } from '../model/FlowGraph.js';
import { getBlock } from './BlockRegistry.js';
import { getWizardSteps, resolveNodeProps, resolvePropValue } from './ComponentProperties.js';
import { configKeyExists } from './ApplicationConfigYaml.js';
import { isConfigRef } from './ConfigRefs.js';
import { getFlows } from './normalizeGraph.js';
import { buildEndpointUri } from './UriBuilder.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function hasCycle(flow: FlowDefinition): boolean {
  const adjacency = new Map<string, string[]>();
  for (const node of flow.nodes) adjacency.set(node.id, []);
  for (const edge of flow.edges) {
    adjacency.get(edge.source)?.push(edge.target);
  }

  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<string, number>(flow.nodes.map((n) => [n.id, WHITE]));

  function dfs(id: string): boolean {
    color.set(id, GRAY);
    for (const neighbor of adjacency.get(id) ?? []) {
      if (color.get(neighbor) === GRAY) return true;
      if (color.get(neighbor) === WHITE && dfs(neighbor)) return true;
    }
    color.set(id, BLACK);
    return false;
  }

  for (const node of flow.nodes) {
    if (color.get(node.id) === WHITE && dfs(node.id)) return true;
  }
  return false;
}

function validateFlow(
  flow: FlowDefinition,
  graph: FlowGraph,
  routeIds: Set<string>
): string[] {
  const errors: string[] = [];
  const prefix = `[${flow.name}] `;

  const sourceNodes = flow.nodes.filter(
    (n) => getBlock(n.blockType)?.category === BlockCategory.SOURCE
  );
  const destNodes = flow.nodes.filter(
    (n) => getBlock(n.blockType)?.category === BlockCategory.DESTINATION
  );

  if (flow.nodes.length > 0 && sourceNodes.length === 0) {
    errors.push(`${prefix}Flow must have at least one source block.`);
  }
  const hasCallFlow = flow.nodes.some((n) => n.blockType === 'call-flow-action');
  if (flow.nodes.length > 0 && destNodes.length === 0 && !hasCallFlow) {
    errors.push(`${prefix}Flow must have a destination or a Call flow block.`);
  }

  const incomingCount = new Map<string, number>();
  const outgoingCount = new Map<string, number>();

  for (const node of flow.nodes) {
    incomingCount.set(node.id, 0);
    outgoingCount.set(node.id, 0);
  }

  for (const edge of flow.edges) {
    outgoingCount.set(edge.source, (outgoingCount.get(edge.source) ?? 0) + 1);
    incomingCount.set(edge.target, (incomingCount.get(edge.target) ?? 0) + 1);
  }

  for (const node of flow.nodes) {
    const category = getBlock(node.blockType)?.category;
    const incoming = incomingCount.get(node.id) ?? 0;
    const outgoing = outgoingCount.get(node.id) ?? 0;

    if (category === BlockCategory.SOURCE && incoming > 0) {
      errors.push(`${prefix}Source block "${node.label}" must not have incoming connections.`);
    }
    if (category === BlockCategory.DESTINATION && outgoing > 0) {
      errors.push(`${prefix}Destination block "${node.label}" must not have outgoing connections.`);
    }
    if (category !== BlockCategory.SOURCE && incoming === 0) {
      errors.push(`${prefix}Block "${node.label}" has no incoming connection.`);
    }
    if (
      category !== BlockCategory.DESTINATION &&
      category !== BlockCategory.ACTION &&
      outgoing === 0
    ) {
      errors.push(`${prefix}Block "${node.label}" has no outgoing connection.`);
    }
    if (node.blockType === 'call-flow-action' && outgoing > 0) {
      errors.push(`${prefix}"${node.label}" (Call flow) must not have outgoing connections.`);
    }
  }

  if (hasCycle(flow)) {
    errors.push(`${prefix}Flow contains a cycle, which is not allowed.`);
  }

  return errors;
}

function validateFlowForYaml(
  flow: FlowDefinition,
  graph: FlowGraph,
  routeIds: Set<string>
): string[] {
  const errors = validateFlow(flow, graph, routeIds);
  const prefix = `[${flow.name}] `;

  for (const node of flow.nodes) {
    const block = getBlock(node.blockType);
    if (!block) {
      errors.push(`${prefix}Unknown block type "${node.blockType}" on "${node.label}".`);
      continue;
    }

    const props = resolveNodeProps(node.blockType, node.props);

    for (const schema of getWizardSteps(node.blockType)) {
      if (!schema.required) continue;
      if (!resolvePropValue(props, schema)) {
        errors.push(
          `${prefix}"${node.label}" (${block.label}): missing "${schema.label || schema.key}".`
        );
      }
    }

    if (node.blockType === 'call-flow-action') {
      const target = props['targetRouteId']?.trim();
      if (!target) {
        errors.push(`${prefix}"${node.label}" (Call flow): select a target flow.`);
      } else if (target === flow.routeId) {
        errors.push(`${prefix}"${node.label}" (Call flow): cannot call the same flow.`);
      } else if (!routeIds.has(target)) {
        errors.push(`${prefix}"${node.label}" (Call flow): unknown route "${target}".`);
      }
    }

    const needsUri =
      block.category === BlockCategory.SOURCE ||
      block.category === BlockCategory.DESTINATION ||
      block.camelUri !== '';
    if (needsUri && node.blockType !== 'call-flow-action') {
      const uri = buildEndpointUri(node.blockType, props);
      if (!uri) {
        errors.push(
          `${prefix}"${node.label}" (${block.label}): endpoint URI could not be built — check required settings.`
        );
      }
    }

    const eip = block.category === BlockCategory.ACTION;
    const expr = props['expression'];
    if (eip && node.blockType === 'filter-action' && !expr?.trim() && !isConfigRef(expr)) {
      errors.push(`${prefix}"${node.label}" (Filter): missing filter expression.`);
    }
    if (eip && node.blockType === 'transform-action' && !expr?.trim() && !isConfigRef(expr)) {
      errors.push(`${prefix}"${node.label}" (Transform): missing expression.`);
    }

    for (const [propKey, propVal] of Object.entries(node.props)) {
      if (isConfigRef(propVal)) {
        const cfgKey = propVal.slice('@config:'.length);
        if (!configKeyExists(graph.config, cfgKey)) {
          errors.push(
            `${prefix}"${node.label}": property "${propKey}" references unknown config key "${cfgKey}". Add it under Application properties.`
          );
        }
      }
    }
  }

  return errors;
}

export function validateForYamlExport(graph: FlowGraph): ValidationResult {
  const flows = getFlows(graph);
  const errors: string[] = [];

  const routeIdCounts = new Map<string, number>();
  for (const f of flows) {
    const rid = f.routeId?.trim() || '';
    if (rid) routeIdCounts.set(rid, (routeIdCounts.get(rid) ?? 0) + 1);
  }
  for (const [rid, count] of routeIdCounts) {
    if (count > 1) errors.push(`Duplicate route id "${rid}" across flows.`);
  }

  const routeIds = new Set(flows.map((f) => f.routeId).filter(Boolean));

  for (const flow of flows) {
    if (flow.nodes.length === 0) continue;
    errors.push(...validateFlowForYaml(flow, graph, routeIds));
  }

  if (flows.every((f) => f.nodes.length === 0)) {
    errors.push('Project has no blocks in any flow.');
  }

  return { valid: errors.length === 0, errors };
}

export function validate(graph: FlowGraph): ValidationResult {
  const flows = getFlows(graph);
  const errors: string[] = [];
  const routeIds = new Set(flows.map((f) => f.routeId).filter(Boolean));

  for (const flow of flows) {
    if (flow.nodes.length === 0) continue;
    errors.push(...validateFlow(flow, graph, routeIds));
  }

  if (flows.every((f) => f.nodes.length === 0)) {
    errors.push('Add at least one block to a flow.');
  }

  return { valid: errors.length === 0, errors };
}
