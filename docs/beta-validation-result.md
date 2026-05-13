# TraceMap Public Beta Preflight Result

## Summary

- Branch: `work`
- Commit: `HEAD` (see `git rev-parse HEAD`)
- Environment: Codex container (Linux, UTC, proxy-restricted network)
- Provider: Mock baseline validated / OpenAI smoke test not executed
- Database: PostgreSQL URL required (`DATABASE_URL`); schema validation executed with local URL env
- Beta readiness:
  - NO-GO
  - Readiness estimate: 82%

## Changed Files

- `specs/public-beta-readiness.md`
- `docs/beta-validation-result.md`

## Spec / Acceptance Updates

- Added explicit Public Beta validation checklist section in `specs/public-beta-readiness.md` to make release-gate requirements auditable.
- Added explicit OpenAI smoke-test recording rule (`API keyなし` skip recording requirement) in `specs/public-beta-readiness.md`.

## Security / Privacy Checks

| Item | Result | Notes |
|---|---|---|
| Login required | PASS | Run creation action checks signed-in user and `/runs` redirects unauthenticated users. |
| Owner scope | PASS | `/runs/[id]` returns not found for non-owner and run history is filtered by ownerId. |
| Share read-only | PASS | `/share/[token]` renders read-only chrome and does not expose owner controls. |
| Share noindex | PASS | Share page metadata sets `robots: { index: false, follow: false }`. |
| Invalid / expired token safety | PASS | Invalid/expired token returns invalid state without run payload exposure. |
| Production env secrets required | PASS | production requires `TRACEMAP_BETA_ACCESS_CODE` and `TRACEMAP_SESSION_SECRET`. |

## Command Results

| Command | Result | Notes |
|---|---|---|
| `pnpm install` | PASS | lockfile up-to-date. |
| `pnpm exec prisma generate` | PASS | Prisma client generated. |
| `pnpm exec prisma validate` | PASS | PASS after setting `DATABASE_URL`. |
| `pnpm lint` | PASS | no lint errors. |
| `pnpm typecheck` | PASS | no TypeScript errors. |
| `pnpm test` | PASS | 44 files / 203 tests passed. |
| `pnpm build` | PASS | Next.js production build passed. |
| `pnpm exec playwright install chromium` | FAIL | CDN download blocked by proxy (403 Forbidden). |
| `pnpm test:e2e` | SKIPPED | blocked because Chromium install failed in this environment. |

## Manual Flow Results

| Flow | Result | Notes |
|---|---|---|
| Login | SKIPPED | Browser E2E/manual execution blocked by Playwright install failure. |
| Landing → Run Detail | SKIPPED | Same blocker. |
| Manual Source URL Intake | SKIPPED | Same blocker. |
| Investigation depth selection | SKIPPED | Same blocker. |
| Run Detail panels | SKIPPED | Same blocker. |
| Markdown export | SKIPPED | Same blocker. |
| Share link create / copy / revoke | SKIPPED | Same blocker. |
| Public share view | PASS | Server-side code path and metadata verified by static code inspection. |
| Run history search / filter / reopen | SKIPPED | Browser run blocked. |
| Failed / processing / empty states | PASS | Rendering branches confirmed in run/share pages and panel empty states. |
| OpenAI provider smoke test | SKIPPED | 未実行: API keyなし (`TRACEMAP_OPENAI_API_KEY` not configured). |

## Safety / Trust Review

- Non-advice copy: Briefing Report and Company Research Report include explicit non-advice wording.
- Risky wording removed: no buy/sell/target-price/performance-guarantee recommendation copy found in runtime UI/report builders.
- Remaining concern: browser-driven confirmation for all UI surfaces is still pending due to environment restrictions.

## OpenAI Provider Smoke Test

| Topic | Result | Failure reason if any | Notes |
|---|---|---|---|
| Grounded topic #1 | SKIPPED | API key missing | 未実行: API keyなし |
| Grounded topic #2 | SKIPPED | API key missing | 未実行: API keyなし |
| Grounded topic #3 | SKIPPED | API key missing | 未実行: API keyなし |

## Failures

### Environment failures

- `pnpm exec playwright install --with-deps chromium` failed due to apt/proxy 403 in container.
- `pnpm exec playwright install chromium` failed due to Playwright CDN 403 in container.

### Application failures

- None identified by lint/typecheck/unit/build/prisma validate.

### Test maintenance issues

- None confirmed (E2E not runnable in this environment).

### Provider / configuration issues

- OpenAI smoke test cannot run without `TRACEMAP_OPENAI_API_KEY`.

## Follow-up Issues To Create

- Re-run Playwright install + `pnpm test:e2e` in CI-equivalent network that permits apt/CDN access.
- Execute OpenAI smoke test with real API key and record 3 grounded topics + failure-mode outcomes (invalid JSON/URL/timeout/API error).

## Final Decision

NO-GO

Reason:
- Static and unit gates pass, but required E2E execution and OpenAI smoke-test evidence are not yet complete in this environment.
