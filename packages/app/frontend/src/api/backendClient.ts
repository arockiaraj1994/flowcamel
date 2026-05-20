import axios from 'axios';
import { FlowGraph, ProjectMeta } from '@flowcamel/core';

const http = axios.create({ baseURL: '/api' });

export async function listProjects(): Promise<ProjectMeta[]> {
  const { data } = await http.get<ProjectMeta[]>('/projects');
  return data;
}

export async function getProject(id: string): Promise<ProjectMeta> {
  const { data } = await http.get<ProjectMeta>(`/projects/${id}`);
  return data;
}

export async function createProject(name: string, graph?: FlowGraph): Promise<ProjectMeta> {
  const { data } = await http.post<ProjectMeta>('/projects', { name, graph });
  return data;
}

export async function updateProject(
  id: string,
  patch: { name?: string; graph?: FlowGraph }
): Promise<ProjectMeta> {
  const { data } = await http.put<ProjectMeta>(`/projects/${id}`, patch);
  return data;
}

export async function deleteProject(id: string): Promise<void> {
  await http.delete(`/projects/${id}`);
}

export async function generateProjectZip(projectId: string): Promise<Blob> {
  const response = await http.post('/generate', { projectId }, { responseType: 'blob' });
  return response.data as Blob;
}

export type TestRunStreamEvent =
  | { type: 'yaml'; content: string }
  | { type: 'log'; time: string; level: 'info' | 'warn' | 'err'; msg: string }
  | { type: 'done'; exitCode: number; durationMs: number }
  | { type: 'error'; message: string };

/** Stream Camel JBang test run (generated routes.camel.yaml). */
export async function streamTestRun(
  projectId: string,
  onEvent: (event: TestRunStreamEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch('/api/test-run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId }),
    signal,
  });

  if (!response.ok) {
    let message = 'Test run failed';
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body from test run');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      onEvent(JSON.parse(trimmed) as TestRunStreamEvent);
    }
  }
  if (buffer.trim()) {
    onEvent(JSON.parse(buffer.trim()) as TestRunStreamEvent);
  }
}

/** Karavan-style Stop — kills the active JBang/Docker process for this project. */
export async function stopTestRun(projectId: string): Promise<boolean> {
  const response = await fetch('/api/test-run/stop', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId }),
  });
  if (!response.ok) {
    let message = 'Failed to stop test run';
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  const body = (await response.json()) as { stopped?: boolean };
  return body.stopped === true;
}
