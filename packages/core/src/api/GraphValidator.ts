import { BlockCategory } from '../model/BlockCategory.js';
import { FlowGraph } from '../model/FlowGraph.js';
import { getBlock } from './BlockRegistry.js';
import { getWizardSteps, resolveNodeProps, resolvePropValue } from './ComponentProperties.js';
import { buildEndpointUri } from './UriBuilder.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** Stricter validation before YAML / export (topology + required fields + resolvable URIs). */
export function validateForYamlExport(graph: FlowGraph): ValidationResult {
  const base = validate(graph);
  const errors = [...base.errors];

  for (const node of graph.nodes) {
    const block = getBlock(node.blockType);
    if (!block) {
      errors.push(`Unknown block type "${node.blockType}" on "${node.label}".`);
      continue;
    }

    const props = resolveNodeProps(node.blockType, node.props);

    for (const schema of getWizardSteps(node.blockType)) {
      if (!schema.required) continue;
      if (!resolvePropValue(props, schema)) {
        errors.push(
          `"${node.label}" (${block.label}): missing "${schema.label || schema.key}".`
        );
      }
    }

    const needsUri =
      block.category === BlockCategory.SOURCE ||
      block.category === BlockCategory.DESTINATION ||
      block.camelUri !== '';
    if (needsUri) {
      const uri = buildEndpointUri(node.blockType, props);
      if (!uri) {
        errors.push(`"${node.label}" (${block.label}): endpoint URI could not be built — check required settings.`);
      }
    }

    const eip = block.category === BlockCategory.ACTION;
    if (eip && node.blockType === 'filter-action' && !props['expression']?.trim()) {
      errors.push(`"${node.label}" (Filter): missing filter expression.`);
    }
    if (eip && node.blockType === 'transform-action' && !props['expression']?.trim()) {
      errors.push(`"${node.label}" (Transform): missing expression.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validate(graph: FlowGraph): ValidationResult {
  const errors: string[] = [];

  const sourceNodes = graph.nodes.filter(
    (n) => getBlock(n.blockType)?.category === BlockCategory.SOURCE
  );
  const destNodes = graph.nodes.filter(
    (n) => getBlock(n.blockType)?.category === BlockCategory.DESTINATION
  );

  if (sourceNodes.length === 0) errors.push('Flow must have at least one source block.');
  if (destNodes.length === 0) errors.push('Flow must have at least one destination block.');

  const incomingCount = new Map<string, number>();
  const outgoingCount = new Map<string, number>();

  for (const node of graph.nodes) {
    incomingCount.set(node.id, 0);
    outgoingCount.set(node.id, 0);
  }

  for (const edge of graph.edges) {
    outgoingCount.set(edge.source, (outgoingCount.get(edge.source) ?? 0) + 1);
    incomingCount.set(edge.target, (incomingCount.get(edge.target) ?? 0) + 1);
  }

  for (const node of graph.nodes) {
    const category = getBlock(node.blockType)?.category;
    const incoming = incomingCount.get(node.id) ?? 0;
    const outgoing = outgoingCount.get(node.id) ?? 0;

    if (category === BlockCategory.SOURCE && incoming > 0) {
      errors.push(`Source block "${node.label}" must not have incoming connections.`);
    }
    if (category === BlockCategory.DESTINATION && outgoing > 0) {
      errors.push(`Destination block "${node.label}" must not have outgoing connections.`);
    }
    if (category !== BlockCategory.SOURCE && incoming === 0) {
      errors.push(`Block "${node.label}" has no incoming connection.`);
    }
    if (category !== BlockCategory.DESTINATION && outgoing === 0) {
      errors.push(`Block "${node.label}" has no outgoing connection.`);
    }
  }

  if (hasCycle(graph)) {
    errors.push('Flow contains a cycle, which is not allowed.');
  }

  return { valid: errors.length === 0, errors };
}

function hasCycle(graph: FlowGraph): boolean {
  const adjacency = new Map<string, string[]>();
  for (const node of graph.nodes) adjacency.set(node.id, []);
  for (const edge of graph.edges) {
    adjacency.get(edge.source)?.push(edge.target);
  }

  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<string, number>(graph.nodes.map((n) => [n.id, WHITE]));

  function dfs(id: string): boolean {
    color.set(id, GRAY);
    for (const neighbor of adjacency.get(id) ?? []) {
      if (color.get(neighbor) === GRAY) return true;
      if (color.get(neighbor) === WHITE && dfs(neighbor)) return true;
    }
    color.set(id, BLACK);
    return false;
  }

  for (const node of graph.nodes) {
    if (color.get(node.id) === WHITE && dfs(node.id)) return true;
  }
  return false;
}
