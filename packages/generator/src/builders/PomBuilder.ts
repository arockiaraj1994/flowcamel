import { FlowGraph, getBlock, getMavenStarter } from '@flowcamel/core';
import Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatePath = join(__dirname, '../templates/pom.xml.hbs');
const template = Handlebars.compile(readFileSync(templatePath, 'utf-8'));

export function buildPom(graph: FlowGraph, projectName: string): string {
  const artifacts = new Set<string>();

  for (const node of graph.nodes) {
    const block = getBlock(node.blockType);
    if (!block) continue;
    const artifact = getMavenStarter(node.blockType);
    if (artifact) artifacts.add(artifact);
  }

  const artifactId = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const packageName = artifactId.replace(/-/g, '');

  return template({
    projectName,
    artifactId,
    packageName,
    dependencies: Array.from(artifacts),
  });
}
