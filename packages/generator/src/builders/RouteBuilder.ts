import { FlowGraph, emitRouteStep, orderedNodesFromGraph } from '@flowcamel/core';
import Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatePath = join(__dirname, '../templates/RouteBuilder.java.hbs');
const template = Handlebars.compile(readFileSync(templatePath, 'utf-8'));

export function buildRoute(graph: FlowGraph, packageName: string): string {
  const ordered = orderedNodesFromGraph(graph);
  if (ordered.length === 0) return '';

  const lines = ordered.map((node, i) => emitRouteStep(node, i === 0));
  const routeDsl = lines.join('\n') + ';';

  return template({ routeDsl, packageName });
}
