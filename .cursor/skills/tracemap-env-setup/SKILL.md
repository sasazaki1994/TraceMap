---
name: tracemap-env-setup
description: Prepare TraceMap Cloud Agent verification environment with Node 22+, pnpm 10.18.2, Playwright Chromium, and Prisma client generation. Use before running TraceMap lint/typecheck/test/build/e2e or Prisma commands in a fresh agent VM.
---

# TraceMap Environment Setup

Use this skill when a TraceMap task needs local verification and the agent VM
may not already have the required Node/pnpm/Playwright/Prisma environment.

## Target baseline

- Node.js 22 or newer.
- pnpm 10.18.2.
- Project dependencies installed.
- Prisma Client generated.
- Playwright Chromium installed.

## Steps

1. Check the current runtime:

   ```bash
   node --version
   pnpm --version
   ```

2. If Node is missing or older than 22, install/switch to Node 22+.
   In agent VMs where `n` is acceptable:

   ```bash
   npm install -g n
   n 22.11.0
   hash -r
   node --version
   ```

3. Enable the repository pnpm version:

   ```bash
   corepack enable
   corepack prepare pnpm@10.18.2 --activate
   pnpm --version
   ```

4. Install dependencies from the lockfile:

   ```bash
   pnpm install
   ```

5. Generate Prisma Client and validate the schema. If no real database is
   available, use a syntactically valid local PostgreSQL URL for commands that
   only need schema loading:

   ```bash
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tracemap_ci" pnpm exec prisma generate
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tracemap_ci" pnpm exec prisma validate
   ```

6. Install Playwright Chromium before E2E:

   ```bash
   pnpm exec playwright install --with-deps chromium
   ```

## Verification commands

After setup, run the requested subset or the full TraceMap verification set:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tracemap_ci" pnpm lint
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tracemap_ci" pnpm typecheck
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tracemap_ci" pnpm test
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tracemap_ci" pnpm build
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tracemap_ci" pnpm test:e2e
```

## Database-dependent commands

`prisma migrate deploy`, `prisma migrate status`, DB-backed E2E, and fresh DB
migration checks require a reachable PostgreSQL server. If Docker or Postgres
is unavailable in the VM, record the exact `P1001` or connection error instead
of treating it as an implementation failure.

## Notes

- Do not commit generated files such as `next-env.d.ts` changes unless they are
  intentionally part of the task.
- If installing runtime tools was required, mention that future Cloud Agents
  should use an environment setup agent to prebuild this baseline.
