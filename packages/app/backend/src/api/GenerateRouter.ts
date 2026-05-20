import { Router, IRouter } from 'express';
import { generateZip } from '../services/GeneratorService.js';

export const generateRouter: IRouter = Router();

generateRouter.post('/', async (req, res) => {
  const { projectId } = req.body as { projectId: string };
  if (!projectId) return res.status(400).json({ error: 'projectId is required' });

  try {
    const buffer = await generateZip(projectId);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="flowcamel-project.zip"`);
    return res.send(buffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    const status =
      message.includes('missing') ||
      message.includes('must have') ||
      message.includes('required')
        ? 400
        : 500;
    return res.status(status).json({ error: message });
  }
});
