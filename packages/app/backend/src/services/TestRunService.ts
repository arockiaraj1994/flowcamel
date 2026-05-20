import { spawn } from 'child_process';
import { access, constants as fsConstants } from 'fs/promises';
import { mkdtemp, writeFile, rm } from 'fs/promises';
import { tmpdir, homedir } from 'os';
import { join } from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import {
  graphToYamlRoutes,
  validateForYamlExport,
  type FlowGraph,
} from '@flowcamel/core';
import { getProject } from './ProjectService.js';

const execFileAsync = promisify(execFile);

const CAMEL_JBANG_VERSION = '4.5.0';
const CAMEL_DOCKER_IMAGE = `apache/camel-jbang:${CAMEL_JBANG_VERSION}`;
const MAX_MESSAGES = '5';
const RUN_TIMEOUT_MS = 90_000;

export type TestRunEvent =
  | { type: 'yaml'; content: string }
  | { type: 'log'; time: string; level: 'info' | 'warn' | 'err'; msg: string }
  | { type: 'done'; exitCode: number; durationMs: number }
  | { type: 'error'; message: string };

type RunInvocation = { command: string; args: string[]; runtime: string; cwd?: string };

function formatTime(): string {
  const d = new Date();
  return (
    d.toLocaleTimeString('en-US', { hour12: false }) +
    '.' +
    String(d.getMilliseconds()).padStart(3, '0')
  );
}

function logLevel(line: string): 'info' | 'warn' | 'err' {
  const u = line.toUpperCase();
  if (u.includes(' ERROR ') || u.startsWith('ERROR') || u.includes('EXCEPTION')) return 'err';
  if (u.includes(' WARN ') || u.startsWith('WARN')) return 'warn';
  return 'info';
}

async function commandExists(cmd: string, args: string[]): Promise<boolean> {
  try {
    await execFileAsync(cmd, args, { timeout: 8000, env: process.env });
    return true;
  } catch {
    return false;
  }
}

async function fileExecutable(path: string): Promise<boolean> {
  try {
    await access(path, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/** Resolve camel / jbang binaries (PATH + common JBang install dirs). */
async function resolveBinaries(): Promise<{ camel?: string; jbang?: string }> {
  const home = homedir();
  const jbangCandidates = [
    'jbang',
    join(home, '.jbang', 'bin', 'jbang'),
    join(home, '.local', 'bin', 'jbang'),
  ];
  const camelCandidates = [
    'camel',
    join(home, '.jbang', 'bin', 'camel'),
    join(home, '.local', 'bin', 'camel'),
  ];

  let jbang: string | undefined;
  for (const p of jbangCandidates) {
    if (p === 'jbang' ? await commandExists('jbang', ['version']) : await fileExecutable(p)) {
      jbang = p;
      break;
    }
  }

  let camel: string | undefined;
  for (const p of camelCandidates) {
    if (p === 'camel' ? await commandExists('camel', ['version']) : await fileExecutable(p)) {
      camel = p;
      break;
    }
  }

  return { camel, jbang };
}

const RUN_TRAILING = ['--max-messages', MAX_MESSAGES, '--logging-level', 'info'];

function installHint(): string {
  return (
    'Camel JBang is required for Test run.\n\n' +
    'Option A — install JBang + Camel (recommended):\n' +
    '  curl -Ls https://sh.jbang.dev | bash -s - app setup\n' +
    `  jbang app install -Dcamel.jbang.version=${CAMEL_JBANG_VERSION} camel@apache/camel\n` +
    '  # restart terminal, then: pnpm setup:camel\n\n' +
    'Option B — Docker:\n' +
    `  docker pull ${CAMEL_DOCKER_IMAGE}\n` +
    '  (Test run will use Docker automatically when camel/jbang are missing)\n\n' +
    'Option C — skip on install: SKIP_CAMEL_JBANG=1 pnpm install'
  );
}

/** Karavan dev run: camel run *.camel.yaml (local camel, jbang, or Docker). */
async function resolveRunInvocation(
  yamlFileName: string,
  workDir: string
): Promise<RunInvocation> {
  const { camel, jbang } = await resolveBinaries();

  if (camel) {
    return {
      command: camel,
      args: ['run', yamlFileName, ...RUN_TRAILING],
      runtime: 'camel',
      cwd: workDir,
    };
  }

  if (jbang) {
    return {
      command: jbang,
      args: [
        `-Dcamel.jbang.version=${CAMEL_JBANG_VERSION}`,
        'camel@apache/camel',
        'run',
        yamlFileName,
        ...RUN_TRAILING,
      ],
      runtime: 'jbang',
      cwd: workDir,
    };
  }

  const dockerArgs = [
    'run',
    '--rm',
    '-v',
    `${workDir}:/work`,
    '-w',
    '/work',
    CAMEL_DOCKER_IMAGE,
    'run',
    yamlFileName,
    ...RUN_TRAILING,
  ];

  if (await commandExists('docker', ['version'])) {
    return { command: 'docker', args: dockerArgs, runtime: 'docker', cwd: workDir };
  }

  if (await commandExists('podman', ['version'])) {
    return { command: 'podman', args: dockerArgs, runtime: 'podman', cwd: workDir };
  }

  throw new Error(installHint());
}

function spawnCamelRun(
  command: string,
  args: string[],
  cwd: string,
  onLine: (line: string, stream: 'stdout' | 'stderr') => void
): Promise<{ exitCode: number; durationMs: number; timedOut: boolean }> {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    let timedOut = false;
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let outBuf = '';
    let errBuf = '';

    const flush = (buf: string, stream: 'stdout' | 'stderr'): string => {
      const lines = buf.split(/\r?\n/);
      const rest = lines.pop() ?? '';
      for (const line of lines) {
        if (line.trim()) onLine(line, stream);
      }
      return rest;
    };

    child.stdout.on('data', (chunk: Buffer) => {
      outBuf = flush(outBuf + chunk.toString(), 'stdout');
    });
    child.stderr.on('data', (chunk: Buffer) => {
      errBuf = flush(errBuf + chunk.toString(), 'stderr');
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, RUN_TIMEOUT_MS);

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (outBuf.trim()) onLine(outBuf.trim(), 'stdout');
      if (errBuf.trim()) onLine(errBuf.trim(), 'stderr');
      resolve({
        exitCode: timedOut ? 124 : (code ?? 1),
        durationMs: Date.now() - started,
        timedOut,
      });
    });
  });
}

export async function* streamTestRunForProject(projectId: string): AsyncGenerator<TestRunEvent> {
  const meta = getProject(projectId);
  if (!meta) {
    yield { type: 'error', message: `Project not found: ${projectId}` };
    return;
  }
  yield* streamTestRunForGraph(meta.graph);
}

export async function* streamTestRunForGraph(graph: FlowGraph): AsyncGenerator<TestRunEvent> {
  const validation = validateForYamlExport(graph);
  if (!validation.valid) {
    yield { type: 'error', message: validation.errors.join('\n') };
    return;
  }

  const yaml = graphToYamlRoutes(graph);
  yield { type: 'yaml', content: yaml };

  const workDir = await mkdtemp(join(tmpdir(), 'flowcamel-run-'));
  const yamlFileName = 'routes.camel.yaml';
  const yamlPath = join(workDir, yamlFileName);

  try {
    await writeFile(yamlPath, yaml, 'utf8');

    let invocation: RunInvocation;
    try {
      invocation = await resolveRunInvocation(yamlFileName, workDir);
    } catch (e) {
      yield {
        type: 'error',
        message: e instanceof Error ? e.message : 'Could not resolve Camel runtime',
      };
      return;
    }

    yield {
      type: 'log',
      time: formatTime(),
      level: 'info',
      msg: `[flowcamel] ${invocation.runtime}: ${invocation.command} ${invocation.args.join(' ')}`,
    };

    if (invocation.runtime === 'docker' || invocation.runtime === 'podman') {
      yield {
        type: 'log',
        time: formatTime(),
        level: 'info',
        msg: `[flowcamel] First ${invocation.runtime} run may pull ${CAMEL_DOCKER_IMAGE} (one-time download).`,
      };
    }

    const logQueue: TestRunEvent[] = [];
    const onLine = (line: string, stream: 'stdout' | 'stderr') => {
      const level =
        stream === 'stderr' && !line.includes('INFO') ? logLevel(line) : logLevel(line);
      logQueue.push({ type: 'log', time: formatTime(), level, msg: line });
    };

    const runCwd = invocation.cwd ?? workDir;
    let runResult: Awaited<ReturnType<typeof spawnCamelRun>> | undefined;
    const runPromise = spawnCamelRun(invocation.command, invocation.args, runCwd, onLine).then(
      (r) => {
        runResult = r;
        return r;
      }
    );

    while (runResult === undefined) {
      while (logQueue.length > 0) {
        yield logQueue.shift()!;
      }
      await Promise.race([runPromise, new Promise((r) => setTimeout(r, 80))]);
    }

    while (logQueue.length > 0) {
      yield logQueue.shift()!;
    }

    const { exitCode, durationMs, timedOut } = runResult;
    if (timedOut) {
      yield {
        type: 'log',
        time: formatTime(),
        level: 'warn',
        msg: `[flowcamel] Test run stopped after ${RUN_TIMEOUT_MS / 1000}s timeout.`,
      };
    }
    yield {
      type: 'log',
      time: formatTime(),
      level: exitCode === 0 ? 'info' : 'err',
      msg: `[flowcamel] Process exited with code ${exitCode} (${durationMs}ms)`,
    };
    yield { type: 'done', exitCode, durationMs };
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
