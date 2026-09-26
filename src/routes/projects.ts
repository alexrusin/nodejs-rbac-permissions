import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();

const projectParamsSchema = z.object({
  projectId: z.uuid(),
});

router.get('/:projectId', authenticate, requireRole('ADMIN', 'EDITOR', 'VIEWER'), async (req, res) => {
  const { projectId } = projectParamsSchema.parse(req.params);

  const project = await prisma.project.findUnique({ where: { id: projectId } });

  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  res.json(project);
});

export default router;
