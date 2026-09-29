import { prisma } from '../db.js';
import type { ProjectMember } from '../generated/prisma/client.js';
import { roleHasPermission, type Permission } from './permissions.js';

export type AuthorizeResult =
  | { status: 'not_member' }
  | { status: 'forbidden' }
  | { status: 'allowed'; membership: ProjectMember };

export async function authorize(
  userId: string,
  projectId: string,
  permission: Permission,
): Promise<AuthorizeResult> {
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });

  if (!membership) {
    return { status: 'not_member' };
  }

  if (!roleHasPermission(membership.role, permission)) {
    return { status: 'forbidden' };
  }

  return { status: 'allowed', membership };
}
