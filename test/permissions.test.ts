import argon2 from 'argon2';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { prisma } from '../src/db.js';

const PASSWORD = 'correct-horse-battery-staple';
const ALICE = '11111111-1111-4111-8111-111111111111';
const BOB = '22222222-2222-4222-8222-222222222222';
const CAROL = '33333333-3333-4333-8333-333333333333';
const DAVE_EMAIL = 'dave.matrix@example.com';

type Actor = 'owner' | 'editor' | 'viewer' | 'nonMember';
type Action = 'list' | 'create' | 'update' | 'delete' | 'archive';
type TaskAction = Exclude<Action, 'list' | 'create'>;

// Status codes for a task in the project named in the URL. Written by hand, not derived from
// src/auth/permissions.ts, so a change to the permission map must also change this table.
const expected: Record<Actor, Record<Action, number>> = {
  owner: { list: 200, create: 201, update: 200, delete: 204, archive: 200 },
  editor: { list: 200, create: 201, update: 200, delete: 204, archive: 403 },
  viewer: { list: 200, create: 403, update: 403, delete: 403, archive: 403 },
  nonMember: { list: 404, create: 404, update: 404, delete: 404, archive: 404 },
};

// Status codes when the URL names the matrix project but the task ID belongs to another project.
// A member with the permission gets 404. A member without it gets 403 before the task lookup.
const expectedCrossProject: Record<Actor, Record<TaskAction, number>> = {
  owner: { update: 404, delete: 404, archive: 404 },
  editor: { update: 404, delete: 404, archive: 403 },
  viewer: { update: 403, delete: 403, archive: 403 },
  nonMember: { update: 404, delete: 404, archive: 404 },
};

const actors = Object.keys(expected) as Actor[];
const actions = Object.keys(expected.owner) as Action[];
const taskActions = Object.keys(expectedCrossProject.owner) as TaskAction[];

function send(action: Action, token: string, projectId: string, taskId: string) {
  const base = `/projects/${projectId}/tasks`;
  const auth = `Bearer ${token}`;

  switch (action) {
    case 'list':
      return request(app).get(base).set('Authorization', auth);
    case 'create':
      return request(app).post(base).set('Authorization', auth).send({ title: 'Matrix task' });
    case 'update':
      return request(app).patch(`${base}/${taskId}`).set('Authorization', auth).send({ done: true });
    case 'delete':
      return request(app).delete(`${base}/${taskId}`).set('Authorization', auth);
    case 'archive':
      return request(app).post(`${base}/${taskId}/archive`).set('Authorization', auth);
  }
}

async function login(email: string) {
  const res = await request(app).post('/auth/login').send({ email, password: PASSWORD });
  expect(res.status).toBe(200);
  return res.body.token as string;
}

describe('task permission matrix', () => {
  const tokens = {} as Record<Actor, string>;
  let matrixProjectId: string;
  let otherProjectId: string;
  let daveId: string;

  beforeAll(async () => {
    const dave = await prisma.user.create({
      data: { email: DAVE_EMAIL, passwordHash: await argon2.hash(PASSWORD) },
    });
    daveId = dave.id;

    const matrixProject = await prisma.project.create({
      data: {
        name: 'Matrix',
        createdById: ALICE,
        members: {
          create: [
            { userId: ALICE, role: 'OWNER' },
            { userId: BOB, role: 'EDITOR' },
            { userId: CAROL, role: 'VIEWER' },
          ],
        },
      },
    });
    matrixProjectId = matrixProject.id;

    const otherProject = await prisma.project.create({
      data: { name: 'Other', createdById: ALICE },
    });
    otherProjectId = otherProject.id;

    tokens.owner = await login('alice@example.com');
    tokens.editor = await login('bob@example.com');
    tokens.viewer = await login('carol@example.com');
    tokens.nonMember = await login(DAVE_EMAIL);
  });

  afterAll(async () => {
    await prisma.project.deleteMany({ where: { id: { in: [matrixProjectId, otherProjectId] } } });
    await prisma.user.deleteMany({ where: { id: daveId } });
    await prisma.$disconnect();
  });

  describe.each(actors)('%s', (actor) => {
    it.each(actions)(`%s`, async (action) => {
      const task = await prisma.task.create({
        data: { projectId: matrixProjectId, title: 'Target' },
      });

      const countBefore = await prisma.task.count({ where: { projectId: matrixProjectId } });

      const res = await send(action, tokens[actor], matrixProjectId, task.id);

      expect(res.status).toBe(expected[actor][action]);

      if (res.status >= 400) {
        expect(await prisma.task.count({ where: { projectId: matrixProjectId } })).toBe(countBefore);
        expect(await prisma.task.findUnique({ where: { id: task.id } })).toMatchObject({
          done: false,
          archivedAt: null,
        });
      }
    });

    it.each(taskActions)('%s with a task ID from another project', async (action) => {
      const task = await prisma.task.create({
        data: { projectId: otherProjectId, title: 'Other target' },
      });

      const res = await send(action, tokens[actor], matrixProjectId, task.id);

      expect(res.status).toBe(expectedCrossProject[actor][action]);
      expect(await prisma.task.findUnique({ where: { id: task.id } })).toMatchObject({
        projectId: otherProjectId,
        done: false,
        archivedAt: null,
      });
    });
  });
});
