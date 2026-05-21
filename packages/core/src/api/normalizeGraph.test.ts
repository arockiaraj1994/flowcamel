import { describe, expect, it } from 'vitest';
import { fromJSON } from './GraphSerializer.js';
import { graphToYamlRoutes } from './RouteYamlEmitter.js';
import { normalizeGraph } from './normalizeGraph.js';
import type { FlowGraph } from '../model/FlowGraph.js';

describe('normalizeGraph', () => {
  it('wraps legacy nodes/edges into flows[0]', () => {
    const legacy: FlowGraph = {
      id: 'p1',
      name: 'Legacy',
      flows: [],
      nodes: [{ id: 'n1', blockType: 'timer-source', label: 'T', position: { x: 0, y: 0 }, props: { period: '1s' } }],
      edges: [],
    };
    const g = normalizeGraph(legacy);
    expect(g.flows).toHaveLength(1);
    expect(g.flows[0]?.nodes).toHaveLength(1);
    expect(g.flows[0]?.routeId).toBe('flow-1');
    expect(g.nodes).toBeUndefined();
  });

  it('fromJSON schema v2 with flows', () => {
    const raw = JSON.stringify({
      schemaVersion: 2,
      graph: {
        id: 'p2',
        name: 'Multi',
        flows: [
          {
            id: 'f1',
            name: 'Flow 1',
            routeId: 'flow-1',
            nodes: [],
            edges: [],
          },
        ],
      },
    });
    const g = fromJSON(raw);
    expect(g.flows).toHaveLength(1);
  });
});

describe('multi-route YAML', () => {
  it('emits two routes from two flows', () => {
    const graph: FlowGraph = {
      id: 'p',
      name: 'p',
      flows: [
        {
          id: 'f1',
          name: 'Flow 1',
          routeId: 'flow-1',
          nodes: [
            { id: 's1', blockType: 'timer-source', label: 'T', position: { x: 0, y: 0 }, props: { period: '1s' } },
            { id: 'd1', blockType: 'log-dest', label: 'L', position: { x: 0, y: 0 }, props: { loggerName: 'flowcamel', level: 'INFO' } },
          ],
          edges: [{ id: 'e1', source: 's1', target: 'd1' }],
        },
        {
          id: 'f2',
          name: 'Flow 2',
          routeId: 'flow-2',
          nodes: [
            { id: 's2', blockType: 'timer-source', label: 'T2', position: { x: 0, y: 0 }, props: { period: '2s' } },
            { id: 'd2', blockType: 'log-dest', label: 'L2', position: { x: 0, y: 0 }, props: { loggerName: 'flowcamel', level: 'INFO' } },
          ],
          edges: [{ id: 'e2', source: 's2', target: 'd2' }],
        },
      ],
    };
    const yaml = graphToYamlRoutes(graph);
    expect(yaml).toContain('id: flow-1');
    expect(yaml).toContain('id: flow-2');
  });

  it('call-flow-action emits direct:targetRouteId', () => {
    const graph: FlowGraph = {
      id: 'p',
      name: 'p',
      flows: [
        {
          id: 'f1',
          name: 'Flow 1',
          routeId: 'flow-1',
          nodes: [
            { id: 's1', blockType: 'timer-source', label: 'T', position: { x: 0, y: 0 }, props: { period: '1s' } },
            { id: 'c1', blockType: 'call-flow-action', label: 'Call', position: { x: 0, y: 0 }, props: { targetRouteId: 'flow-2' } },
          ],
          edges: [{ id: 'e1', source: 's1', target: 'c1' }],
        },
        {
          id: 'f2',
          name: 'Flow 2',
          routeId: 'flow-2',
          nodes: [
            { id: 's2', blockType: 'timer-source', label: 'T2', position: { x: 0, y: 0 }, props: { period: '2s' } },
          ],
          edges: [],
        },
      ],
    };
    const yaml = graphToYamlRoutes(graph);
    expect(yaml).toContain('direct:flow-2');
  });
});
