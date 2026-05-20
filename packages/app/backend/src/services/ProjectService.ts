import { FlowGraph, ProjectMeta } from '@flowcamel/core';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/schema.js';

interface ProjectRow {
  id: string;
  name: string;
  graph_json: string;
  created_at: string;
  updated_at: string;
}

function rowToMeta(row: ProjectRow): ProjectMeta {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    graph: JSON.parse(row.graph_json) as FlowGraph,
  };
}

export function listProjects(): ProjectMeta[] {
  const rows = getDb().prepare('SELECT * FROM projects ORDER BY updated_at DESC').all() as ProjectRow[];
  return rows.map(rowToMeta);
}

export function getProject(id: string): ProjectMeta | undefined {
  const row = getDb().prepare('SELECT * FROM projects WHERE id = ?').get(id) as ProjectRow | undefined;
  return row ? rowToMeta(row) : undefined;
}

export function createProject(name: string, graph: FlowGraph): ProjectMeta {
  const id = uuidv4();
  const now = new Date().toISOString();
  const graphWithId: FlowGraph = { ...graph, id };
  getDb()
    .prepare('INSERT INTO projects (id, name, graph_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
    .run(id, name, JSON.stringify(graphWithId), now, now);
  return getProject(id)!;
}

export function updateProject(id: string, patch: { name?: string; graph?: FlowGraph }): ProjectMeta | undefined {
  const existing = getProject(id);
  if (!existing) return undefined;

  const name = patch.name ?? existing.name;
  const graph = patch.graph ?? existing.graph;
  const now = new Date().toISOString();

  getDb()
    .prepare('UPDATE projects SET name = ?, graph_json = ?, updated_at = ? WHERE id = ?')
    .run(name, JSON.stringify(graph), now, id);

  return getProject(id);
}

export function deleteProject(id: string): boolean {
  const result = getDb().prepare('DELETE FROM projects WHERE id = ?').run(id);
  return result.changes > 0;
}
