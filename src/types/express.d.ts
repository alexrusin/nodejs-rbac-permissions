import type { Role } from '../generated/prisma/enums.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      role: Role;
    };
  }
}
