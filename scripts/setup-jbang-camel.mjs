#!/usr/bin/env node
/**
 * Install JBang (optional) + Camel JBang for local test runs.
 * Runs on pnpm install. Skip: SKIP_CAMEL_JBANG=1
 * Auto-install JBang when missing: INSTALL_JBANG=1 (default on postinstall)
 */
import { execFile, spawn } from 'child_process';
import { access } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';
import { readFileSync } from 'fs';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

function readCamelVersion() {
  try {
    const raw = readFileSync(
      new URL('../packages/core/src/catalog/camel/version.json', import.meta.url),
      'utf8'
    );
    return JSON.parse(raw).version ?? '4.5.0';
  } catch {
    return '4.5.0';
  }
}

const CAMEL_VERSION = readCamelVersion();

async function commandOk(cmd, args, timeoutMs = 12_000) {
  try {
    await execFileAsync(cmd, args, { timeout: timeoutMs, env: process.env });
    return true;
  } catch {
    return false;
  }
}

async function fileOk(path) {
  try {
    await access(path, 0o1);
    return true;
  } catch {
    return false;
  }
}

async function hasJbang() {
  if (await commandOk('jbang', ['version'])) return true;
  return fileOk(join(homedir(), '.jbang', 'bin', 'jbang'));
}

async function hasCamel() {
  if (await commandOk('camel', ['version'], 15_000)) return true;
  return fileOk(join(homedir(), '.jbang', 'bin', 'camel'));
}

async function jbangCmd() {
  const local = join(homedir(), '.jbang', 'bin', 'jbang');
  return (await fileOk(local)) ? local : 'jbang';
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', env: process.env, ...opts });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

async function installJbangViaCurl() {
  console.log('[flowcamel] Installing JBang via https://sh.jbang.dev …');
  await new Promise((resolve, reject) => {
    const child = spawn(
      'bash',
      ['-c', 'curl -Ls https://sh.jbang.dev | bash -s - app setup'],
      { stdio: 'inherit', env: { ...process.env, CI: 'true' } }
    );
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`JBang installer exited with code ${code}`));
    });
  });
}

async function installCamelApp() {
  const bin = await jbangCmd();
  const args = [
    'app',
    'install',
    `-Dcamel.jbang.version=${CAMEL_VERSION}`,
    `-Dcamel-kamelets.version=${CAMEL_VERSION}`,
    'camel@apache/camel',
  ];
  if (process.env.FORCE_CAMEL_JBANG === '1') {
    args.splice(2, 0, '--force', '--fresh');
  }
  console.log('[flowcamel] Installing Camel JBang', CAMEL_VERSION, '…');
  await run(bin, args);
}

async function main() {
  if (process.env.SKIP_CAMEL_JBANG === '1') {
    console.log('[flowcamel] SKIP_CAMEL_JBANG=1 — skipping Camel JBang setup.');
    return;
  }

  if (await hasCamel()) {
    console.log('[flowcamel] Camel CLI ready (test run).');
    return;
  }

  const installJbang = process.env.INSTALL_JBANG !== '0';

  if (!(await hasJbang()) && installJbang) {
    try {
      await installJbangViaCurl();
    } catch (err) {
      console.warn(
        '[flowcamel] Could not auto-install JBang:',
        err instanceof Error ? err.message : err,
        '\n  Install manually: https://www.jbang.dev/download/ then pnpm setup:camel'
      );
    }
  }

  if (!(await hasJbang())) {
    console.warn(
      '[flowcamel] JBang not on PATH — Test run can still use Docker if installed.\n' +
        '  Install JBang: curl -Ls https://sh.jbang.dev | bash -s - app setup\n' +
        '  Then: pnpm setup:camel\n' +
        '  Or: SKIP_CAMEL_JBANG=1 pnpm install'
    );
    return;
  }

  try {
    await installCamelApp();
    if (await hasCamel()) {
      console.log('[flowcamel] Camel JBang installed. Restart the terminal if `camel` is not found.');
    } else {
      const home = homedir();
      console.warn(
        '[flowcamel] Camel installed via JBang but `camel` not on PATH.\n' +
          `  Add to PATH: export PATH="$PATH:${home}/.jbang/bin"\n` +
          '  Or open a new terminal and run: pnpm dev'
      );
    }
  } catch (err) {
    console.warn(
      '[flowcamel] Camel JBang install failed:',
      err instanceof Error ? err.message : err,
      '\n  Retry: pnpm setup:camel'
    );
  }
}

main();
