#!/usr/bin/env node
/**
 * Sync Camel component catalog from Maven (same source as Apache Karavan).
 *
 * Karavan: org.apache.camel:camel-catalog on classpath →
 *   /org/apache/camel/catalog/components.properties
 *   /org/apache/camel/catalog/components/{name}.json
 * See: camel-karavan/karavan-generator/.../CamelComponentsGenerator.java
 *
 * Run: pnpm catalog:sync
 */
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Must match packages/generator/src/templates/pom.xml.hbs camel.version */
const CAMEL_VERSION = '4.5.0';
const GROUP = 'org.apache.camel';
const ARTIFACT = 'camel-catalog';
const JAR = `${ARTIFACT}-${CAMEL_VERSION}.jar`;
const MAVEN_URL = `https://repo1.maven.org/maven2/${GROUP.replace(/\./g, '/')}/${ARTIFACT}/${CAMEL_VERSION}/${JAR}`;

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const cacheDir = join(root, '.cache/camel-catalog');
const jarPath = join(cacheDir, JAR);
const extractDir = join(cacheDir, 'extracted');
const catalogRoot = join(extractDir, 'org/apache/camel/catalog');
const outFile = join(root, 'packages/core/src/catalog/camel/components.json');
const versionFile = join(root, 'packages/core/src/catalog/camel/version.json');

async function downloadJar() {
  await mkdir(cacheDir, { recursive: true });
  const res = await fetch(MAVEN_URL);
  if (!res.ok) {
    throw new Error(`Failed to download ${MAVEN_URL}: ${res.status}`);
  }
  await pipeline(res.body, createWriteStream(jarPath));
  console.log(`Downloaded ${JAR}`);
}

async function extractJar() {
  await rm(extractDir, { recursive: true, force: true });
  await mkdir(extractDir, { recursive: true });
  execSync(`unzip -q -o "${jarPath}" -d "${extractDir}"`, { stdio: 'inherit' });
}

function parseProperties(content) {
  return content
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
}

/** Karavan: drop componentProperties, skip deprecated and kamelet */
function normalizeComponent(raw) {
  const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
  delete obj.componentProperties;
  const comp = obj.component;
  if (!comp || comp.deprecated || comp.name === 'kamelet') return null;
  return obj;
}

async function buildComponentsJson() {
  const propsPath = join(catalogRoot, 'components.properties');
  const names = parseProperties(await readFile(propsPath, 'utf8'));
  const components = [];
  let skipped = 0;

  for (const name of names) {
    const jsonPath = join(catalogRoot, 'components', `${name}.json`);
    try {
      const raw = await readFile(jsonPath, 'utf8');
      const entry = normalizeComponent(raw);
      if (entry) components.push(entry);
      else skipped++;
    } catch {
      console.warn(`WARN missing ${name}.json`);
      skipped++;
    }
  }

  await mkdir(dirname(outFile), { recursive: true });
  await writeFile(outFile, JSON.stringify(components));
  await writeFile(
    versionFile,
    JSON.stringify(
      {
        version: CAMEL_VERSION,
        maven: `${GROUP}:${ARTIFACT}:${CAMEL_VERSION}`,
        componentCount: components.length,
        syncedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );

  const mb = (Buffer.byteLength(JSON.stringify(components)) / 1024 / 1024).toFixed(2);
  console.log(`Wrote ${components.length} components (${skipped} skipped) → ${outFile}`);
  console.log(`Size: ~${mb} MB | version ${CAMEL_VERSION}`);
}

async function main() {
  console.log(`Syncing Camel catalog ${CAMEL_VERSION} from Maven Central…`);
  await downloadJar();
  await extractJar();
  await buildComponentsJson();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
