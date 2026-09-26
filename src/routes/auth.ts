import argon2, { type HashOptions } from 'argon2';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../db.js';
import { env } from '../env.js';
import { JWT_AUDIENCE, JWT_ISSUER } from '../middleware/authenticate.js';

const router = Router();

const hashOptions: HashOptions = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

const dummyHash = await argon2.hash('dummy-password-for-unknown-users', hashOptions);

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

router.post('/login', async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  const passwordValid = await argon2.verify(user?.passwordHash ?? dummyHash, password);

  if (!user || !passwordValid) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, {
    algorithm: 'HS256',
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    expiresIn: '15m',
  });

  res.json({ token });
});

export default router;
