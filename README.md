# RBAC demo API

A projects-and-tasks API built with Express 5, Prisma 7, and PostgreSQL 18. Users log in with email and password and get a JWT that lasts 15 minutes. A user's role belongs to a project membership, not to the user: OWNER, EDITOR, or VIEWER.

## Setup

You need Node 24 and Docker.

```bash
npm install
cp .env.example .env
```

Put a secret in `JWT_SECRET` in `.env`. This command prints 32 random bytes as base64url:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

Then start the database, generate the client, and load the seed data:

```bash
npm run db:up
npm run generate
npm run reset
npm run dev
```

The API listens on http://localhost:3000.

## Seed users

All three users have the password `correct-horse-battery-staple`.

| Email             | Website Redesign | Mobile App |
| ----------------- | ---------------- | ---------- |
| alice@example.com | OWNER            |            |
| bob@example.com   |                  | EDITOR     |
| carol@example.com | VIEWER           | VIEWER     |

Each project has two tasks.

## Routes

Each project route checks the caller's `ProjectMember` row for that project. `src/auth/permissions.ts` maps each role to its permissions. A user who is not a member gets 404. A member without the permission gets 403.

| Method | Path                                         | Permission     |
| ------ | -------------------------------------------- | -------------- |
| GET    | `/health`                                    | public         |
| POST   | `/auth/login`                                | public         |
| GET    | `/projects/:projectId`                       | `project:read` |
| GET    | `/projects/:projectId/tasks`                 | `task:read`    |
| POST   | `/projects/:projectId/tasks`                 | `task:create`  |
| PATCH  | `/projects/:projectId/tasks/:taskId`         | `task:update`  |
| DELETE | `/projects/:projectId/tasks/:taskId`         | `task:delete`  |
| POST   | `/projects/:projectId/tasks/:taskId/archive` | `task:archive` |

`requests.http` has a request for each of these. Open it in VS Code with the REST Client extension and run the three logins first.

## Tests

```bash
npm test
```

The tests run against the `rbac_demo_test` database. Docker creates it the first time the container starts. Vitest reads `.env.test`, and a global setup migrates, clears, and seeds that database before the run.
