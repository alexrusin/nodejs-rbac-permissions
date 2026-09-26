import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { prisma } from '../src/db.js';

const PASSWORD = 'correct-horse-battery-staple';
const PROJECT_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const TASK_B1 = 'bbbbbbbb-0000-4000-8000-000000000001';
const TASK_B2 = 'bbbbbbbb-0000-4000-8000-000000000002';

async function login(email: string) {
  const res = await request(app).post('/auth/login').send({ email, password: PASSWORD });
  expect(res.status).toBe(200);
  return res.body.token as string;
}

describe('tasks', () => {
  let bobToken: string;
  let carolToken: string;

  beforeAll(async () => {
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
});
