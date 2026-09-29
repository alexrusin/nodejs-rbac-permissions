import type { ProjectMember } from '../generated/prisma/client.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
    };
  }

  interface Locals {
    membership?: ProjectMember;
  }
}
