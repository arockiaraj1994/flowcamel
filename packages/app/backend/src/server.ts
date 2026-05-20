import express, { Express } from 'express';
import { catalogRouter } from './api/CatalogRouter.js';
import { generateRouter } from './api/GenerateRouter.js';
import { projectsRouter } from './api/ProjectsRouter.js';
import { testRunRouter } from './api/TestRunRouter.js';

const app: Express = express();
const PORT = process.env.PORT ?? 3001;

app.use(express.json({ limit: '10mb' }));

app.use('/api/projects', projectsRouter);
app.use('/api/generate', generateRouter);
app.use('/api/test-run', testRunRouter);
app.use('/api/catalog', catalogRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (_req, res) => {
  res.redirect('http://localhost:5173');
});

app.listen(PORT, () => {
  console.log(`FlowCamel backend running on http://localhost:${PORT}`);
});

export default app;
