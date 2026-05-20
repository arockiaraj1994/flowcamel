import Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const template = Handlebars.compile(
  readFileSync(join(__dirname, '../templates/README.md.hbs'), 'utf-8')
);

export function buildReadme(projectName: string, artifactId: string): string {
  return template({
    projectName,
    artifactId,
    camelVersion: '4.5.0',
  });
}
