import { generateProject } from '@flowcamel/generator';
import { validateForYamlExport } from '@flowcamel/core';
import { getProject } from './ProjectService.js';

export async function generateZip(projectId: string): Promise<Buffer> {
  const meta = getProject(projectId);
  if (!meta) throw new Error(`Project not found: ${projectId}`);

  const validation = validateForYamlExport(meta.graph);
  if (!validation.valid) {
    throw new Error(validation.errors.join('\n'));
  }

  return generateProject(meta.graph, meta);
}
