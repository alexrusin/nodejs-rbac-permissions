import { Router } from 'express';
import { z } from 'zod';
import { route } from '../auth/route.js';
import { prisma } from '../db.js';

const router = Router();

const projectParamsSchema = z.object({
  projectId: z.uuid(),
});

route(router, {
  method: 'get',
  path: '/:projectId',
  permission: 'project:read',
  handler: async (req, res) => {
    const { projectId } = projectParamsSchema.parse(req.params);

    const project = await prisma.project.findUnique({ where: { id: projectId } });

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json(project);
  },
});

export default router;
