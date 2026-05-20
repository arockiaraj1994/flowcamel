import { Router, IRouter } from 'express';
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
} from '../services/ProjectService.js';

export const projectsRouter: IRouter = Router();

projectsRouter.get('/', (_req, res) => {
  res.json(listProjects());
});

projectsRouter.get('/:id', (req, res) => {
  const project = getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Not found' });
  return res.json(project);
});

projectsRouter.post('/', (req, res) => {
  const { name, graph } = req.body as { name: string; graph: ReturnType<typeof Object> };
  if (!name) return res.status(400).json({ error: 'name is required' });
  const project = createProject(name, graph ?? { id: '', name, nodes: [], edges: [] });
  return res.status(201).json(project);
});

projectsRouter.put('/:id', (req, res) => {
  const updated = updateProject(req.params.id, req.body as { name?: string; graph?: ReturnType<typeof Object> });
  if (!updated) return res.status(404).json({ error: 'Not found' });
  return res.json(updated);
});

projectsRouter.delete('/:id', (req, res) => {
  const deleted = deleteProject(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  return res.json({ success: true });
});
