import yaml from 'js-yaml';
import type { FlowGraph } from '../model/FlowGraph.js';
import { buildYamlRoute } from './YamlRouteBuilder.js';

/** Emit plain Camel YAML DSL (array of routes) for `kamel run *.camel.yaml`. */
export function graphToYamlRoutes(graph: FlowGraph): string {
  const route = buildYamlRoute(graph);
  if (!route) return '[]\n';

  const doc = [route];
  return yaml.dump(doc, {
    lineWidth: 120,
    noRefs: true,
    quotingType: '"',
    sortKeys: (a, b) => {
      if (a === 'steps') return 1;
      if (b === 'steps') return -1;
      return 0;
    },
  });
}
