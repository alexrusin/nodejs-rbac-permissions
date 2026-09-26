import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router({ mergeParams: true });

const projectParamsSchema = z.object({
  projectId: z.uuid(),
});

const taskParamsSchema = z.object({
  projectId: z.uuid(),
  taskId: z.uuid(),
});

const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
});

const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    done: z.boolean().optional(),
  })
  .refine((data) => data.title !== undefined || data.done !== undefined, {
    message: 'Provide at least one field to update',
  });

router.get('/', authenticate, requireRole('ADMIN', 'EDITOR', 'VIEWER'), async (req, res) => {
  const { projectId } = projectParamsSchema.parse(req.params);

  const tasks = await prisma.task.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
  });

  res.json(tasks);
});

router.post('/', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res) => {
  const { projectId } = projectParamsSchema.parse(req.params);
  const { title } = createTaskSchema.parse(req.body);

  const project = await prisma.project.findUnique({ where: { id: projectId } });

  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const task = await prisma.task.create({ data: { projectId, title } });

  res.status(201).json(task);
});

router.patch('/:taskId', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res) => {
  const { taskId } = taskParamsSchema.parse(req.params);
  const data = updateTaskSchema.parse(req.body);

  const task = await prisma.task.update({
    where: { id: taskId },
    data,
  });

  res.json(task);
});

router.delete('/:taskId', authenticate, requireRole('ADMIN', 'EDITOR'), async (req, res) => {
  const { taskId } = taskParamsSchema.parse(req.params);

  await prisma.task.delete({ where: { id: taskId } });

  res.status(204).end();
});

export default router;
