import express, { type NextFunction, type Request, type Response } from 'express';
import { ZodError } from 'zod';
import { PUBLIC, route } from './auth/route.js';
import authRouter from './routes/auth.js';
import projectsRouter from './routes/projects.js';
import tasksRouter from './routes/tasks.js';

export const app = express();

app.use(express.json());

route(app, {
  method: 'get',
  path: '/health',
  permission: PUBLIC,
  handler: (_req, res) => {
    res.json({ status: 'ok' });
  },
});


app.use('/auth', authRouter);
app.use('/projects/:projectId/tasks', tasksRouter);
app.use('/projects', projectsRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Invalid request', issues: err.issues });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});
