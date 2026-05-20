import { Router, type IRouter } from 'express';
import { streamTestRunForProject } from '../services/TestRunService.js';

export const testRunRouter: IRouter = Router();

/** NDJSON stream: yaml, log lines, done (Karavan-style camel/jbang run on generated YAML). */
testRunRouter.post('/', async (req, res) => {
  const { projectId } = req.body as { projectId?: string };
  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' });
  }

  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    for await (const event of streamTestRunForProject(projectId)) {
      res.write(JSON.stringify(event) + '\n');
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Test run failed';
    res.write(JSON.stringify({ type: 'error', message }) + '\n');
  }
  res.end();
});
