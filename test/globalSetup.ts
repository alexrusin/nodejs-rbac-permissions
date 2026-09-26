import { execSync } from 'node:child_process';
import pg from 'pg';

export default async function setup() {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query('TRUNCATE TABLE "Task", "Project", "User" CASCADE');
  await client.end();

  execSync('npx prisma db seed', { stdio: 'inherit' });
}
