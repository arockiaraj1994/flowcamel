import type archiver from 'archiver';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Bundle mvnw + .mvn/wrapper into the project ZIP (only-script wrapper, no jar). */
export function appendMavenWrapper(archive: archiver.Archiver): void {
  const root = join(__dirname, 'assets/maven-wrapper');

  function walk(dir: string, zipPrefix: string): void {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const zipPath = zipPrefix ? `${zipPrefix}/${name}` : name;
      const st = statSync(full);
      if (st.isDirectory()) {
        walk(full, zipPath);
      } else {
        const mode = name === 'mvnw' ? 0o755 : undefined;
        archive.append(readFileSync(full), { name: zipPath, mode });
      }
    }
  }

  walk(root, '');
}
