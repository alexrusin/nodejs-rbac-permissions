# CLAUDE.md

Express 5 + Prisma 7 + PostgreSQL 18 API. Node 24, ESM, TypeScript strict.

## Commands

- `npm run db:up` starts Postgres in Docker
- `npm run generate` generates the Prisma client into `src/generated/prisma`
- `npm run migrate` creates and applies a migration
- `npm run seed` loads seed data (idempotent)
- `npm run reset` drops the dev database, reapplies migrations, and seeds
- `npm run dev` starts the server with tsx in watch mode
- `npm run typecheck`
- `npm run lint`
- `npm test` runs Vitest against the `rbac_demo_test` database using `.env.test`

## Layout

- `src/app.ts` builds the Express app and the error handler. It does not listen.
- `src/server.ts` starts the server
- `src/env.ts` parses environment variables with Zod
- `src/db.ts` exports the Prisma client
- `src/middleware/` has `authenticate.ts`
- `src/auth/` has the role-to-permission map, `authorize()`, `requirePermission()`, and `route()`
- `src/routes/` has one router per file, and each file names its router `router`
- Register every route with `route()` from `src/auth/route.ts`. It takes a required `permission`, which is a permission name or `PUBLIC`, and it adds `authenticate` and `requirePermission` itself. ESLint blocks `router.get`, `app.post`, and the other method calls in every other file.
- `src/generated/` is Prisma output. Don't edit it.
- `prisma/` has the schema, migrations, and `seed.ts`
- `prisma.config.ts` is the Prisma CLI config. It loads `.env` through dotenv.
- `test/` has the Vitest tests and the global setup
- `requests.http` has REST Client requests that use the seeded IDs
- `docker/init-test-db.sql` creates the test database
