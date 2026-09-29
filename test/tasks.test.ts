import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { prisma } from '../src/db.js';

const PASSWORD = 'correct-horse-battery-staple';
const PROJECT_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const PROJECT_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const TASK_A1 = 'aaaaaaaa-0000-4000-8000-000000000001';
const TASK_A2 = 'aaaaaaaa-0000-4000-8000-000000000002';
const TASK_B1 = 'bbbbbbbb-0000-4000-8000-000000000001';
const TASK_B2 = 'bbbbbbbb-0000-4000-8000-000000000002';

async function login(email: string) {
  const res = await request(app).post('/auth/login').send({ email, password: PASSWORD });
  expect(res.status).toBe(200);
  return res.body.token as string;
}

describe('tasks', () => {
  let aliceToken: string;
  let bobToken: string;
  let carolToken: string;

  beforeAll(async () => {
    aliceToken = await login('alice@example.com');
    bobToken = await login('bob@example.com');
    carolToken = await login('carol@example.com');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('lists the tasks in a project', async () => {
    const res = await request(app)
      .get(`/projects/${PROJECT_B}/tasks`)
      .set('Authorization', `Bearer ${bobToken}`);

    expect(res.status).toBe(200);
    expect(res.body.map((task: { title: string }) => task.title)).toEqual([
      'Set up push notifications',
      'Fix login screen layout',
    ]);
  });

  it('creates a task', async () => {
    const res = await request(app)
      .post(`/projects/${PROJECT_B}/tasks`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ title: 'Write release notes' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ projectId: PROJECT_B, title: 'Write release notes', done: false });
  });

  it('updates a task', async () => {
    const res = await request(app)
      .patch(`/projects/${PROJECT_B}/tasks/${TASK_B1}`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ done: true });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: TASK_B1, done: true });
  });

  it('deletes a task', async () => {
    const res = await request(app)
      .delete(`/projects/${PROJECT_B}/tasks/${TASK_B2}`)
      .set('Authorization', `Bearer ${bobToken}`);

    expect(res.status).toBe(204);
  });

  it("returns 404 when updating another project's task through this project", async () => {
    const res = await request(app)
      .patch(`/projects/${PROJECT_B}/tasks/${TASK_A1}`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ done: true });

    expect(res.status).toBe(404);
    const task = await prisma.task.findUniqueOrThrow({ where: { id: TASK_A1 } });
    expect(task.done).toBe(false);
  });

  it("returns 404 when deleting another project's task through this project", async () => {
    const res = await request(app)
      .delete(`/projects/${PROJECT_B}/tasks/${TASK_A2}`)
      .set('Authorization', `Bearer ${bobToken}`);

    expect(res.status).toBe(404);
    expect(await prisma.task.findUnique({ where: { id: TASK_A2 } })).not.toBeNull();
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get(`/projects/${PROJECT_B}/tasks`);

    expect(res.status).toBe(401);
  });

  it('returns 403 when a viewer creates a task', async () => {
    const res = await request(app)
      .post(`/projects/${PROJECT_B}/tasks`)
      .set('Authorization', `Bearer ${carolToken}`)
      .send({ title: 'Not allowed' });

    expect(res.status).toBe(403);
  });

  it('returns 403 when an editor archives a task', async () => {
    const res = await request(app)
      .post(`/projects/${PROJECT_B}/tasks/${TASK_B1}/archive`)
      .set('Authorization', `Bearer ${bobToken}`);

    expect(res.status).toBe(403);
  });

  it("returns 404 when archiving another project's task through this project", async () => {
    const res = await request(app)
      .post(`/projects/${PROJECT_A}/tasks/${TASK_B1}/archive`)
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(404);
  });

  it('archives a task and hides it from the list', async () => {
    const archive = await request(app)
      .post(`/projects/${PROJECT_A}/tasks/${TASK_A1}/archive`)
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(archive.status).toBe(200);
    expect(archive.body).toMatchObject({ id: TASK_A1, archivedAt: expect.any(String) });

    const again = await request(app)
      .post(`/projects/${PROJECT_A}/tasks/${TASK_A1}/archive`)
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(again.status).toBe(200);
    expect(again.body.archivedAt).toBe(archive.body.archivedAt);

    const list = await request(app)
      .get(`/projects/${PROJECT_A}/tasks`)
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(list.body.map((task: { id: string }) => task.id)).toEqual([TASK_A2]);
  });
});
