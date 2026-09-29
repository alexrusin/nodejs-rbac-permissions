import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { authorize } from './authorize.js';
import type { Permission } from './permissions.js';

const projectParamsSchema = z.object({
  projectId: z.uuid(),
});

export function requirePermission(permission: Permission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { projectId } = projectParamsSchema.parse(req.params);
    const result = await authorize(req.user.id, projectId, permission);

    if (result.status === 'not_member') {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    if (result.status === 'forbidden') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    res.locals.membership = result.membership;
    next();
  };
}
