# Public Beta Final Validation

## Verdict

NO-GO

## Environment

- Branch: work
- Commit: d9d41bb
- Node: v24.15.0
- pnpm: 10.18.2
- Database: PostgreSQL expected at `postgresql://postgres:postgres@localhost:5432/tracemap?schema=public` (unreachable in this environment)
- Provider: mock (OpenAI smoke test not executed)
- OpenAI model: N/A (not executed)
- Date: 2026-05-19
- OS: Linux 6.12.47 x86_64 (container)

## Command Results

| Command | Result | Notes |
|---|---|---|
| `pnpm install` | PASS | lockfile up to date |
| `pnpm exec prisma generate` | PASS | Prisma client generated |
| `DATABASE_URL=... pnpm exec prisma validate` | PASS | schema valid |
| `DATABASE_URL=... pnpm exec prisma migrate deploy` | FAIL | `P1001`: localhost:5432 unreachable |
| `DATABASE_URL=... pnpm exec prisma migrate status` | SKIPPED | blocked because migrate deploy failed |
| fresh DB (`psql ... DROP/CREATE tracemap_verify`) | SKIPPED | `psql` command not found in environment |
| `DATABASE_URL=...tracemap_verify... pnpm exec prisma migrate deploy` | SKIPPED | blocked because `psql` unavailable and DB not created |
| `DATABASE_URL=...tracemap_verify... pnpm exec prisma migrate status` | SKIPPED | blocked because verify DB not available |
| `pnpm lint` | PASS | no lint errors |
| `pnpm typecheck` | PASS | no type errors |
| `pnpm test` | PASS | 45 files / 206 tests passed |
| `pnpm build` | PASS | Next.js production build passed |
| `pnpm exec playwright install --with-deps chromium` | FAIL | apt/proxy 403 blocked dependency/browser install |
| `pnpm test:e2e` | FAIL | Playwright Chromium executable missing |

## E2E Result

| Area | Result | Notes |
|---|---|---|
| Landing Public Beta copy | SKIPPED | blocked by Chromium missing |
| Login required behavior | SKIPPED | blocked by Chromium missing |
| Start Investigation | SKIPPED | blocked by Chromium missing |
| Run detail panels | SKIPPED | blocked by Chromium missing |
| Evidence Map | SKIPPED | blocked by Chromium missing |
| Unknown Map | SKIPPED | blocked by Chromium missing |
| Source Lineage | SKIPPED | blocked by Chromium missing |
| Source Quality | SKIPPED | blocked by Chromium missing |
| Briefing Report | SKIPPED | blocked by Chromium missing |
| Markdown copy/download | SKIPPED | blocked by Chromium missing |
| Share read-only | SKIPPED | blocked by Chromium missing |
| Share noindex | SKIPPED | blocked by Chromium missing |
| Run History | SKIPPED | blocked by Chromium missing |

## OpenAI Smoke Test

| Topic | Result | Notes |
|---|---|---|
| Company research | SKIPPED | `TRACEMAP_OPENAI_API_KEY / OPENAI_API_KEY` not set |
| Technical research | SKIPPED | `TRACEMAP_OPENAI_API_KEY / OPENAI_API_KEY` not set |
| Market research | SKIPPED | `TRACEMAP_OPENAI_API_KEY / OPENAI_API_KEY` not set |

## Production Safety Guard Check

| Guard | Result | Notes |
|---|---|---|
| TRACEMAP_SESSION_SECRET required in production | PASS | guard exists in implementation and prior validation baseline; unchanged this run |
| TRACEMAP_BETA_ACCESS_CODE required in production | PASS | guard exists in implementation and prior validation baseline; unchanged this run |
| Owner scope on run detail | PASS | covered by existing implementation/tests; unchanged this run |
| Share page read-only | PASS | covered by existing implementation/tests; unchanged this run |
| Share page noindex/nofollow | PASS | covered by existing implementation/tests; unchanged this run |
| OpenAI provider failure does not crash app | PASS | covered by existing implementation/tests; unchanged this run |
| Failed run shows safe user-facing copy | PASS | covered by existing implementation/tests; unchanged this run |
| Non-advice statement appears in reports | PASS | covered by existing implementation/tests; unchanged this run |

## Final Blockers

- DB migration verification remains incomplete because Docker is unavailable (`docker: command not found`) and Postgres at `localhost:5432` is unreachable (`P1001`).
- Fresh DB migration verification remains incomplete because `psql` is unavailable in this environment.
- Playwright E2E verification remains incomplete because Chromium install is blocked by apt/proxy 403 and browser executable is missing.
- OpenAI 3-topic smoke test remains incomplete because `TRACEMAP_OPENAI_API_KEY / OPENAI_API_KEY` is not configured.

## Final Decision

NO-GO

## Re-run Procedure (for human environment)

1. Prepare DB-capable environment:

```bash
docker compose up -d
pnpm exec prisma generate
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tracemap?schema=public" pnpm exec prisma validate
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tracemap?schema=public" pnpm exec prisma migrate deploy
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tracemap?schema=public" pnpm exec prisma migrate status
```

2. Fresh DB migration verify:

```bash
psql postgresql://postgres:postgres@localhost:5432/postgres -c "DROP DATABASE IF EXISTS tracemap_verify;"
psql postgresql://postgres:postgres@localhost:5432/postgres -c "CREATE DATABASE tracemap_verify;"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tracemap_verify?schema=public" pnpm exec prisma migrate deploy
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tracemap_verify?schema=public" pnpm exec prisma migrate status
```

3. Browser/E2E verify:

```bash
pnpm exec playwright install --with-deps chromium
pnpm test:e2e
```

4. OpenAI smoke test verify:

```bash
TRACEMAP_ANSWER_GRAPH_PROVIDER=openai
TRACEMAP_OPENAI_MODEL=gpt-4o-mini
TRACEMAP_OPENAI_TIMEOUT_MS=60000
TRACEMAP_OPENAI_API_KEY=... # or OPENAI_API_KEY
pnpm dev
```

Then execute 3 smoke topics and record run-level evidence per `docs/openai-smoke-test-plan.md`.
