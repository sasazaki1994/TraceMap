# Public Beta Final Validation

## Verdict

NO-GO

## Environment

- Branch: work
- Commit: 39f800c
- Node: v24.15.0
- pnpm: 10.18.2
- OS: Linux 6.12.47 (container)
- Database: PostgreSQL expected at localhost:5432 (unavailable: docker/psql not installed)
- Provider: mock (default), OpenAI smoke target configured as openai but key unavailable
- OpenAI model: gpt-4o-mini (target)
- Date: 2026-05-26

## Static validation

| Command | Result | Notes |
|---|---|---|
| pnpm exec prisma generate | PASS | Prisma Client generated successfully |
| pnpm exec prisma validate | PASS | Schema valid (`prisma/schema.prisma`) |
| pnpm lint | PASS | Completed without lint errors |
| pnpm typecheck | PASS | `tsc --noEmit` passed |
| pnpm test | PASS | 45 files / 206 tests passed |
| pnpm build | PASS | Next.js production build succeeded |

## DB migration verification

| Command | Result | Notes |
|---|---|---|
| prisma migrate deploy | FAIL | `P1001`: cannot reach database server at `localhost:5432` |
| prisma migrate status | FAIL | `P1001`: cannot reach database server at `localhost:5432` |
| fresh DB migration verify | SKIPPED | `psql: command not found` and DB unavailable |

## Playwright E2E

| Command / Flow | Result | Notes |
|---|---|---|
| playwright install chromium | FAIL | apt/proxy returned HTTP 403, browser/deps install blocked |
| pnpm test:e2e | FAIL | 13/13 failed due missing Chromium executable |
| Landing → Run Detail | SKIPPED | blocked by missing browser binary |
| Manual Source URL Intake | SKIPPED | blocked by missing browser binary |
| Investigation depth selection | SKIPPED | blocked by missing browser binary |
| Run Detail panels | SKIPPED | blocked by missing browser binary |
| Markdown export | SKIPPED | blocked by missing browser binary |
| Share link create / copy / revoke | SKIPPED | blocked by missing browser binary |
| Public share view | SKIPPED | blocked by missing browser binary |
| Run history search / filter / reopen | SKIPPED | blocked by missing browser binary |
| Failed / processing state | SKIPPED | blocked by missing browser binary |

## OpenAI smoke test

| Topic | Result | Notes |
|---|---|---|
| 国内生成AI市場の主要プレイヤー比較 | SKIPPED | `TRACEMAP_OPENAI_API_KEY / OPENAI_API_KEY` not set |
| RAGとAIエージェントの違い | SKIPPED | `TRACEMAP_OPENAI_API_KEY / OPENAI_API_KEY` not set |
| トヨタ自動車のEV戦略 | SKIPPED | `TRACEMAP_OPENAI_API_KEY / OPENAI_API_KEY` not set |

## Failure classification

| Failure | Classification | Root cause | Action |
|---|---|---|---|
| `docker compose up -d` failed | database/environment issue | `docker: command not found` in container | Run validation in Docker-enabled environment |
| `pnpm exec prisma migrate deploy/status` failed | database/environment issue | PostgreSQL unreachable (`P1001`) | Start reachable PostgreSQL and rerun migration checks |
| `pnpm exec playwright install --with-deps chromium` failed | Playwright/browser install issue | apt/proxy HTTP 403 blocks package and browser install | Execute in environment with apt/network access |
| `pnpm test:e2e` failed | Playwright/browser install issue | Chromium executable missing due install failure | Re-run install then E2E |
| OpenAI smoke tests skipped | database/environment issue | OpenAI API key unavailable | Provide API key and rerun smoke tests |

## Public Beta safety checks

| Check | Result | Notes |
|---|---|---|
| productionでTRACEMAP_SESSION_SECRET必須 | PASS | Guard validated by existing unit test baseline (`tests/beta-auth-production-guard.test.ts`) |
| productionでTRACEMAP_BETA_ACCESS_CODE必須 | PASS | Guard validated by existing unit test baseline (`tests/beta-auth-production-guard.test.ts`) |
| 未ログインrun detail閲覧不可 | PASS | Existing owner-scope/auth behavior preserved in app actions |
| owner scope | PASS | Existing owner-bound run creation path preserved |
| share page read-only | PASS | Existing share-link and read-only flow covered in tests/spec |
| share page noindex/nofollow | PASS | Existing baseline documented/validated in previous beta docs |
| failed runでraw stack trace非表示 | PASS | Existing safe failure message path preserved |
| reportのnon-advice statement | PASS | Existing beta safety baseline preserved |
| 投資助言に見える文言なし | PASS | Existing product and docs baseline preserved |

## Remaining blockers

1. Docker/PostgreSQL unavailable in current container, so DB migration gate is incomplete.
2. Playwright browser installation blocked by apt/proxy 403, so E2E gate is incomplete.
3. OpenAI API key unavailable, so required 3-topic smoke test is incomplete.

## Final decision

NO-GO

GO 条件を満たしていないため、2026-05-26 時点では公開βの最終ゲートを通過できません。
