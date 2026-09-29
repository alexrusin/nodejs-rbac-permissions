import { Router } from 'express';
import { z } from 'zod';
import { route } from '../auth/route.js';
import { prisma } from '../db.js';

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

route(router, {
  method: 'get',
  path: '/',
  permission: 'task:read',
  handler: async (req, res) => {
    const { projectId } = projectParamsSchema.parse(req.params);

    const tasks = await prisma.task.findMany({
      where: { projectId, archivedAt: null },
      orderBy: { createdAt: 'asc' },
    });

    res.json(tasks);
  },
});

route(router, {
  method: 'post',
  path: '/',
  permission: 'task:create',
  handler: async (req, res) => {
    const { projectId } = projectParamsSchema.parse(req.params);
    const { title } = createTaskSchema.parse(req.body);

    const project = await prisma.project.findUnique({ where: { id: projectId } });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const task = await prisma.task.create({ data: { projectId, title } });

    res.status(201).json(task);
  },
});

route(router, {
  method: 'patch',
  path: '/:taskId',
  permission: 'task:update',
  handler: async (req, res) => {
    const { projectId, taskId } = taskParamsSchema.parse(req.params);
    const data = updateTaskSchema.parse(req.body);

    const [task] = await prisma.task.updateManyAndReturn({
      where: { id: taskId, projectId },
      data,
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json(task);
  },
});

route(router, {
  method: 'delete',
  path: '/:taskId',
  permission: 'task:delete',
  handler: async (req, res) => {
    const { projectId, taskId } = taskParamsSchema.parse(req.params);

    const { count } = await prisma.task.deleteMany({ where: { id: taskId, projectId } });

    if (count === 0) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.status(204).end();
  },
});

route(router, {
  method: 'post',
  path: '/:taskId/archive',
  permission: 'task:archive',
  handler: async (req, res) => {
    const { projectId, taskId } = taskParamsSchema.parse(req.params);

    const [archived] = await prisma.task.updateManyAndReturn({
      where: { id: taskId, projectId, archivedAt: null },
      data: { archivedAt: new Date() },
    });

    if (archived) {
      res.json(archived);
      return;
    }

    // Archiving an archived task keeps the first archivedAt.
    const task = await prisma.task.findFirst({ where: { id: taskId, projectId } });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json(task);
  },
});

export default router;
