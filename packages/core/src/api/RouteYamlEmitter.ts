import yaml from 'js-yaml';
import type { FlowGraph } from '../model/FlowGraph.js';
import { buildAllYamlRoutes } from './YamlRouteBuilder.js';

/** Emit plain Camel YAML DSL (array of routes) for `kamel run *.camel.yaml`. */
export function graphToYamlRoutes(graph: FlowGraph): string {
  const routes = buildAllYamlRoutes(graph);
  if (routes.length === 0) return '[]\n';

  return yaml.dump(routes, {
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
