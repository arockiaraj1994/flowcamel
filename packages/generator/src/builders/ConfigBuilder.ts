import { FlowGraph, getBlock } from '@flowcamel/core';
import Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatePath = join(__dirname, '../templates/application.yml.hbs');
const template = Handlebars.compile(readFileSync(templatePath, 'utf-8'));

export function buildConfig(graph: FlowGraph, projectName: string): string {
  const lines: string[] = [];

  for (const node of graph.nodes) {
    const block = getBlock(node.blockType);
    if (!block || Object.keys(node.props).length === 0) continue;

    const prefix = node.blockType.replace(/-/g, '.');
    for (const [key, value] of Object.entries(node.props)) {
      if (value !== '' && value !== undefined) {
        lines.push(`  ${prefix}.${key}: ${value}`);
      }
    }
  }

  const config = lines.length > 0 ? `# Generated node properties\n${lines.join('\n')}` : '';

  return template({ projectName, config: config || undefined });
}
