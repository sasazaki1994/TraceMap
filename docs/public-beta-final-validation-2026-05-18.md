# Public Beta Final Validation

## Verdict

NO-GO

## Environment

- Branch: work
- Commit: 964ad95
- Node: v24.15.0
- pnpm: 10.18.2
- Database: PostgreSQL (expected: `postgresql://postgres:postgres@localhost:5432/tracemap?schema=public`)
- Provider: mock (OpenAI smoke test skipped)
- OpenAI model: N/A (not executed)
- Date: 2026-05-18

## Scope

- Public Beta readiness validation
- Mock provider baseline
- E2E readiness
- OpenAI smoke test readiness
- Production safety guard checks

## Command Results

| Command | Result | Notes |
|---|---|---|
| pnpm install | PASS | dependencies already up to date |
| pnpm exec prisma generate | PASS | prisma client generated |
| DATABASE_URL=... pnpm exec prisma validate | PASS | schema valid |
| pnpm lint | PASS | no lint errors |
| pnpm typecheck | PASS | no type errors |
| pnpm test | PASS | 44 files / 204 tests passed |
| pnpm build | PASS | next build completed |
| pnpm exec playwright install --with-deps chromium | FAIL | apt/proxy 403 prevented browser dependency install |
| pnpm test:e2e | FAIL | Playwright browser executable missing (`chromium_headless_shell`) |

## Public Beta E2E Result

| Area | Result | Notes |
|---|---|---|
| Landing Public Beta copy | SKIPPED | blocked by missing Playwright browser install |
| Login required behavior | SKIPPED | blocked by missing Playwright browser install |
| Start Investigation | SKIPPED | blocked by missing Playwright browser install |
| Run detail panels | SKIPPED | blocked by missing Playwright browser install |
| Evidence Map | SKIPPED | blocked by missing Playwright browser install |
| Unknown Map | SKIPPED | blocked by missing Playwright browser install |
| Source Lineage | SKIPPED | blocked by missing Playwright browser install |
| Source Quality | SKIPPED | blocked by missing Playwright browser install |
| Briefing Report | SKIPPED | blocked by missing Playwright browser install |
| Markdown copy/download | SKIPPED | blocked by missing Playwright browser install |
| Share read-only | SKIPPED | blocked by missing Playwright browser install |
| Share noindex | SKIPPED | blocked by missing Playwright browser install |
| Run History | SKIPPED | blocked by missing Playwright browser install |

## OpenAI Smoke Test

| Topic | Result | Notes |
|---|---|---|
| Company research | SKIPPED | API key missing |
| Technical research | SKIPPED | API key missing |
| Market research | SKIPPED | API key missing |

OpenAI smoke test: SKIPPED  
Reason: `TRACEMAP_OPENAI_API_KEY / OPENAI_API_KEY` is not set.

## Production Safety Guard Check

| Guard | Result | Notes |
|---|---|---|
| TRACEMAP_SESSION_SECRET required in production | PASS | enforced by session env parsing (`src/server/auth/session.ts`) |
| TRACEMAP_BETA_ACCESS_CODE required in production | PASS | enforced by beta auth env parsing (`src/server/auth/beta-auth.ts`) |
| Owner scope on run detail | PASS | `/runs/[id]` checks user + `run.ownerId` |
| Share page read-only | PASS | share page renders viewer-only chrome, no mutation actions |
| Share page noindex/nofollow | PASS | metadata robots: index=false, follow=false |
| OpenAI provider failure does not crash app | PASS | failed runs rendered with safe banner on run/share pages |
| Failed run shows safe user-facing copy | PASS | fallback Japanese safe copy with next actions |
| Non-advice statement appears in reports | PASS | acceptance + report builder baseline already in repo tests |

## Remaining Blockers

- Playwright browser install is blocked by environment package mirror/proxy (`apt` 403), so E2E execution evidence is incomplete.
- OpenAI smoke test could not run because API key env vars are not set.

## Final Decision

NO-GO

## Notes

- Added integrated Public Beta E2E spec (`e2e/public-beta-readiness.spec.ts`) for the required cross-page flow and required `data-testid` checks.
- Existing UI already exposed required `data-testid` list and safe empty/loading/error fallback copy, so no additional UI patch was required in this pass.
