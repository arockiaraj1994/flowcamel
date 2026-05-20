import { describe, expect, it } from 'vitest';
import type { FlowGraph } from '../model/FlowGraph.js';
import { graphToYamlRoutes } from './RouteYamlEmitter.js';
import { buildEndpointUri } from './UriBuilder.js';

describe('graphToYamlRoutes', () => {
  it('emits a plain route with from and steps', () => {
    const graph: FlowGraph = {
      id: 'test-project',
      name: 'test',
      nodes: [
        {
          id: 's1',
          blockType: 'timer-source',
          label: 'Timer',
          position: { x: 0, y: 0 },
          props: { period: '1m' },
        },
        {
          id: 'a1',
          blockType: 'log-action',
          label: 'Log',
          position: { x: 200, y: 0 },
          props: { message: 'tick' },
        },
        {
          id: 'd1',
          blockType: 'email-dest',
          label: 'Email',
          position: { x: 400, y: 0 },
          props: {
            host: 'smtp.example.com',
            port: '587',
            username: 'u',
            password: 'p',
            to: 'ops@example.com',
            subject: 'done',
          },
        },
      ],
      edges: [
        { id: 'e1', source: 's1', target: 'a1' },
        { id: 'e2', source: 'a1', target: 'd1' },
      ],
    };

    const yaml = graphToYamlRoutes(graph);
    expect(yaml).toContain('route:');
    expect(yaml).toContain('from:');
    expect(yaml).toContain('steps:');
    expect(yaml).toContain('log:');
    expect(yaml).toContain('tick');
  });

  it('builds kafka source URI from catalog', () => {
    const uri = buildEndpointUri('kafka-source', {
      topic: 'orders',
      brokers: 'localhost:9092',
      groupId: 'g1',
    });
    expect(uri).toContain('kafka');
    expect(uri).toContain('orders');
    expect(uri).toContain('brokers');
  });
});
