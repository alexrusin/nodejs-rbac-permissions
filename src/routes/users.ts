import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { Role } from '../generated/prisma/enums.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();

const userParamsSchema = z.object({
  userId: z.uuid(),
});

const updateRoleSchema = z.object({
  role: z.enum(Role),
});

router.patch('/:userId/role', authenticate, requireRole('ADMIN'), async (req, res) => {
  const { userId } = userParamsSchema.parse(req.params);
  const { role } = updateRoleSchema.parse(req.body);

  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, email: true, role: true },
  });

  res.json(user);
});

export default router;
