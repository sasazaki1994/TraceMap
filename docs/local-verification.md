# Local Verification Runbook

## Purpose

This runbook defines a reproducible local verification path for **TraceMap beta v0.1** from a fresh checkout, including command-based checks, manual beta flow verification, and a copy-pasteable result template for GitHub Issues/PRs.

## Scope

### In scope

- Local environment setup
- Prisma validation
- lint / typecheck / unit test / build
- Playwright E2E
- Manual beta flow checklist
- Result reporting

### Out of scope

- Product feature changes
- Provider schema changes
- Auth / Billing / Workspace
- RAG / background jobs / streaming
- PDF / PPT / Notion export

## Prerequisites

- Node.js 20+
- pnpm
- Docker / Docker Compose
- PostgreSQL through Docker Compose
- Playwright browser dependencies
- OpenAI API key is **not required** for default mock-provider validation

## Fresh checkout setup

```bash
git clone https://github.com/sasazaki1994/TraceMap.git
cd TraceMap
cp .env.example .env
docker compose up -d
pnpm install
pnpm db:generate
pnpm db:push
```

Notes:

- `DATABASE_URL` is required (follow `.env.example`).
- Keep the default provider path as mock for beta baseline validation.
- OpenAI provider smoke testing is handled separately in Issue #47 scope.

## Validation commands

Run in this order:

1. `pnpm exec prisma validate`
2. `pnpm lint`
3. `pnpm typecheck`
4. `pnpm test`
5. `pnpm build`
6. `pnpm exec playwright install --with-deps chromium`
7. `pnpm test:e2e`

These command names are aligned with `package.json` scripts and existing CLI invocations.

## Failure classification

When a check fails, classify it into one of the following buckets before filing follow-up issues.

### Environment failure

- Missing `DATABASE_URL`
- Docker / PostgreSQL not running
- Playwright browser not installed
- OS package / apt / proxy issue
- Missing dependency install

### Application failure

- TypeScript error
- Lint violation
- Unit test failure
- Build failure caused by source code
- E2E assertion failure caused by app behavior
- Route / selector / UI regression

### Test maintenance issue

- Selector drift
- Outdated E2E expectation
- Missing seed/setup in test

### Provider/configuration issue

- OpenAI API key missing while provider is set to openai
- Timeout
- Invalid provider env value

## Manual beta flow checklist

- **Landing → Run Detail**: Enter a research topic and confirm `Start Investigation` navigates to `/runs/[id]`.
- **Manual Source URL Intake**: Confirm `Optional source URLs` accepts one URL per line.
- **Investigation depth selection**: Confirm Fast / Standard / Deep are selectable and reflected in run context.
- **Run Detail panels**: Confirm Mission Header, Timeline, Evidence Map, Unknown Map, Source Lineage Lite, and Briefing Report preview render.
- **Markdown export**: Confirm Briefing / Company report copy/download actions are available.
- **Share link create / copy / revoke**: Confirm share link can be created, copied, and revoked from run detail.
- **Public share view**: Confirm `/share/[token]` displays read-only run content and blocks editing actions.
- **Run history search / filter / reopen**: Confirm runs list supports search/filter and re-opening a run detail.
- **Failed / processing state**: Confirm loading/failed states are visible and understandable for investigation progress.

## E2E notes

When Playwright fails (aligned with Issue #46), record:

- Exact command executed
- Whether browsers were installed
- Whether PostgreSQL / `DATABASE_URL` was healthy
- Whether failure looks like selector drift
- Whether failure indicates application bug
- Local vs CI difference (if any)

## Result report template

Use the following template directly in GitHub Issues/PRs.

```markdown
# TraceMap Beta Validation Result

## Summary

- Date:
- Branch:
- Commit:
- Environment:
- Node:
- pnpm:
- Database:
- Provider:

## Command Results

| Command | Result | Notes |
|---|---|---|
| `pnpm exec prisma validate` | PASS / FAIL / SKIPPED | |
| `pnpm lint` | PASS / FAIL / SKIPPED | |
| `pnpm typecheck` | PASS / FAIL / SKIPPED | |
| `pnpm test` | PASS / FAIL / SKIPPED | |
| `pnpm build` | PASS / FAIL / SKIPPED | |
| `pnpm exec playwright install --with-deps chromium` | PASS / FAIL / SKIPPED | |
| `pnpm test:e2e` | PASS / FAIL / SKIPPED | |

## Manual Flow Results

| Flow | Result | Notes |
|---|---|---|
| Landing → Run Detail | PASS / FAIL / SKIPPED | |
| Manual Source URL Intake | PASS / FAIL / SKIPPED | |
| Investigation depth selection | PASS / FAIL / SKIPPED | |
| Run Detail panels | PASS / FAIL / SKIPPED | |
| Markdown export | PASS / FAIL / SKIPPED | |
| Share link create / copy / revoke | PASS / FAIL / SKIPPED | |
| Public share view | PASS / FAIL / SKIPPED | |
| Run history search / filter / reopen | PASS / FAIL / SKIPPED | |
| Failed / processing state | PASS / FAIL / SKIPPED | |

## Failures

### Environment failures

- None / details

### Application failures

- None / details

### Test maintenance issues

- None / details

### Provider/configuration issues

- None / details

## Root Cause Notes

-

## Beta Readiness Estimate

- Previous estimate:
- Updated estimate:
- Reason:

## Follow-up Issues

-
```

## Troubleshooting

- **DATABASE_URL missing**: set `.env` from `.env.example` and restart command shell.
- **PostgreSQL not running**: run `docker compose up -d` and verify container health.
- **Prisma client not generated**: run `pnpm db:generate` and retry checks.
- **Playwright browser missing**: run `pnpm exec playwright install --with-deps chromium`.
- **Playwright OS dependency / proxy issue**: capture apt/proxy error logs and mark as environment failure.
- **OpenAI provider enabled without API key**: revert to mock provider for baseline, or set valid API key for OpenAI path.

## Related issues

- #45 Full local/CI validation checklist
- #46 Playwright E2E environment stabilization
- #47 OpenAI provider smoke test
- #48 Failed / processing / empty states polish
- #49 Local verification runbook and result template
