import { FlowGraph, ProjectMeta, graphToYamlRoutes } from '@flowcamel/core';
import archiver from 'archiver';
import { Writable } from 'stream';
import { buildConfig } from './builders/ConfigBuilder.js';
import { buildPom } from './builders/PomBuilder.js';
import { buildReadme } from './builders/ReadmeBuilder.js';
import { appendMavenWrapper } from './mavenWrapper.js';
import Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function readTemplate(name: string): HandlebarsTemplateDelegate {
  const src = readFileSync(join(__dirname, `templates/${name}`), 'utf-8');
  return Handlebars.compile(src);
}

export async function generateProject(graph: FlowGraph, meta: ProjectMeta): Promise<Buffer> {
  const projectName = meta.name;
  const artifactId = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const packageName = artifactId.replace(/-/g, '');

  const hasKafka = graph.nodes.some(
    (n) => n.blockType === 'kafka-source' || n.blockType === 'kafka-dest'
  );
  const hasActiveMQ = graph.nodes.some(
    (n) => n.blockType === 'jms-source' || n.blockType === 'jms-dest'
  );

  const pomXml = buildPom(graph, projectName);
  const routesYaml = graphToYamlRoutes(graph);
  const appYml = buildConfig(graph, projectName);
  const readme = buildReadme(projectName, artifactId);

  const appJavaTemplate = readTemplate('Application.java.hbs');
  const appJava = appJavaTemplate({ packageName });

  const dockerTemplate = readTemplate('docker-compose.yml.hbs');
  const dockerCompose = dockerTemplate({ artifactId, includeKafka: hasKafka, includeActiveMQ: hasActiveMQ });

  const srcBase = `src/main/java/com/flowcamel/${packageName}`;

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const sink = new Writable({
      write(chunk: Buffer, _enc, cb) {
        chunks.push(chunk);
        cb();
      },
    });

    sink.on('finish', () => resolve(Buffer.concat(chunks)));
    sink.on('error', reject);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', reject);
    archive.pipe(sink);

    archive.append(readme, { name: 'README.md' });
    archive.append(pomXml, { name: 'pom.xml' });
    appendMavenWrapper(archive);
    archive.append(appYml, { name: 'src/main/resources/application.yml' });
    archive.append(routesYaml, { name: 'src/main/resources/camel/routes.camel.yaml' });
    archive.append(appJava, { name: `${srcBase}/Application.java` });
    archive.append(dockerCompose, { name: 'docker-compose.yml' });

    archive.finalize();
  });
}
