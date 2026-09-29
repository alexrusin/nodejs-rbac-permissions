import type { IRouter, RequestHandler } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import type { Permission } from './permissions.js';
import { requirePermission } from './requirePermission.js';

export const PUBLIC = Symbol('PUBLIC');

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

interface RouteOptions {
  method: Method;
  path: string;
  permission: Permission | typeof PUBLIC;
  handler: RequestHandler;
}

// The only place that calls router.get, router.post and the other method functions.
// ESLint blocks those calls in every other file under src/.
export function route(router: IRouter, { method, path, permission, handler }: RouteOptions) {
  const guards = permission === PUBLIC ? [] : [authenticate, requirePermission(permission)];

  router[method](path, ...guards, handler);
}
