# Public Beta RC Validation Report (2026-05-14)

## Verdict
Not Ready

## Summary
- Product copy is mostly aligned with Research topic / Investigation / Public Beta posture.
- Core mock-provider flow and required run detail panels are implemented.
- Share page is read-only and configured noindex/nofollow.
- Run history page supports list/filter/search/empty-state and links to run detail.
- Static checks and unit/build checks pass.
- Current environment cannot pass Prisma validation (`DATABASE_URL` missing) and cannot execute E2E (`playwright` browser binary missing), so release-candidate verification is incomplete.

## Passed
- Landing copy indicates non-chat investigation flow and Public Beta context.
- Start Investigation flow uses sign-in gate and disables action while pending.
- Run detail includes evidence map, unknown map, source lineage, source quality, briefing markdown preview, and markdown copy/download actions.
- Share section is visible with read-only messaging.
- Share page includes read-only badge and invalid/expired fallback UI.
- Share page metadata is configured with robots noindex/nofollow.
- Run history route renders saved investigations with status filter, query search, empty state, and detail links.

## Fixed in this pass
- Added this RC validation report and consolidated release-candidate readiness verdict and blockers.

## Remaining blockers
1. `pnpm exec prisma validate` fails due to missing `DATABASE_URL`.
2. `pnpm test:e2e` fails because Playwright chromium binary is not installed (`pnpm exec playwright install` required).
3. OpenAI smoke test not executed in this environment (no API key context provided).

## Non-blocking follow-ups
- Consolidate one end-to-end public-beta scenario that directly maps `acceptance/public-beta-readiness.feature`.
- Add CI-visible checklist artifact for OpenAI smoke result (executed vs skipped with reason).

## Commands
- `pnpm lint`: pass
- `pnpm typecheck`: pass
- `pnpm test`: pass (204 tests)
- `pnpm build`: pass
- `pnpm exec prisma validate`: fail (`DATABASE_URL` missing)
- `pnpm test:e2e`: fail (Playwright browser executable missing)

## OpenAI smoke test
- 未実行: API keyなし

## Public beta checklist
- Landing Public Beta copy: pass
- Login-required posture: pass
- Mock provider flow: pass
- Run detail panels: pass
- Markdown export: pass
- Share read-only: pass
- Share noindex: pass
- Run history: pass
- Beta Notice: pass
- Non-advice statement: pass
