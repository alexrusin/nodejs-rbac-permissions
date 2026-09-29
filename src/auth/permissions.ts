import type { Role } from '../generated/prisma/enums.js';

export type Permission =
  | 'project:read'
  | 'project:update'
  | 'project:delete'
  | 'member:manage'
  | 'task:read'
  | 'task:create'
  | 'task:update'
  | 'task:delete'
  | 'task:archive';

export const rolePermissions = {
  OWNER: [
    'project:read',
    'project:update',
    'project:delete',
    'member:manage',
    'task:read',
    'task:create',
    'task:update',
    'task:delete',
    'task:archive',
  ],
  EDITOR: ['project:read', 'task:read', 'task:create', 'task:update', 'task:delete'],
  VIEWER: ['project:read', 'task:read'],
} as const satisfies Record<Role, readonly Permission[]>;

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return (rolePermissions[role] as readonly Permission[]).includes(permission);
}
