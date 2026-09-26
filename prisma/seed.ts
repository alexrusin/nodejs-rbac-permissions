import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import argon2 from 'argon2';
import { PrismaClient } from '../src/generated/prisma/client.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const PASSWORD = 'correct-horse-battery-staple';

const users = [
  { id: '11111111-1111-4111-8111-111111111111', email: 'alice@example.com', role: 'ADMIN' },
  { id: '22222222-2222-4222-8222-222222222222', email: 'bob@example.com', role: 'EDITOR' },
  { id: '33333333-3333-4333-8333-333333333333', email: 'carol@example.com', role: 'VIEWER' },
] as const;

const projects = [
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    name: 'Website Redesign',
    createdById: '11111111-1111-4111-8111-111111111111',
  },
  {
    id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    name: 'Mobile App',
    createdById: '22222222-2222-4222-8222-222222222222',
  },
];

const tasks = [
  {
    id: 'aaaaaaaa-0000-4000-8000-000000000001',
    projectId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    title: 'Audit current pages',
  },
  {
    id: 'aaaaaaaa-0000-4000-8000-000000000002',
    projectId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    title: 'Draft new navigation',
  },
  {
    id: 'bbbbbbbb-0000-4000-8000-000000000001',
    projectId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    title: 'Set up push notifications',
  },
  {
    id: 'bbbbbbbb-0000-4000-8000-000000000002',
    projectId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    title: 'Fix login screen layout',
  },
];

async function main() {
  const passwordHash = await argon2.hash(PASSWORD, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: { email: user.email, role: user.role, passwordHash },
      create: { ...user, passwordHash },
    });
  }

  for (const project of projects) {
    await prisma.project.upsert({
      where: { id: project.id },
      update: { name: project.name, createdById: project.createdById },
      create: project,
    });
  }

  for (const task of tasks) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: { projectId: task.projectId, title: task.title, done: false },
      create: task,
    });
  }

  console.log(`Seeded ${users.length} users, ${projects.length} projects, ${tasks.length} tasks`);
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
