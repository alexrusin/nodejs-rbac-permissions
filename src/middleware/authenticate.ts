import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../env.js';

export const JWT_ISSUER = 'rbac-demo';
export const JWT_AUDIENCE = 'rbac-demo-api';

const tokenPayloadSchema = z.object({
  sub: z.uuid(),
});

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = header.slice('Bearer '.length);

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      clockTolerance: 60,
    });
    const payload = tokenPayloadSchema.parse(decoded);

    req.user = { id: payload.sub };
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}
