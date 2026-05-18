# Public Beta Blocker Issue Drafts (2026-05-18)

GitHub CLI (`gh`) is unavailable in this environment, so issues could not be created directly from this session.
Use the following issue bodies to create 3 GitHub issues in `sasazaki1994/TraceMap`.

## Issue 1: DB migration verification blocker

# Public Beta Blocker: DB migration verification is incomplete

## Problem

Public Beta final validation is NO-GO because `prisma migrate deploy` could not be verified in the current environment.

Current known failure:
- `docker` command unavailable
- PostgreSQL could not be started locally
- `DATABASE_URL=... pnpm exec prisma migrate deploy` failed with P1001

## Required validation

Run in an environment where PostgreSQL is reachable:

```bash
docker compose up -d
pnpm exec prisma generate
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tracemap?schema=public" pnpm exec prisma validate
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tracemap?schema=public" pnpm exec prisma migrate deploy
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tracemap?schema=public" pnpm exec prisma migrate status
```

### Acceptance criteria

- PostgreSQL starts successfully
- Prisma validate passes
- Prisma migrate deploy passes
- Prisma migrate status reports clean state
- Result is recorded in final validation docs

### Non-goals

- Schema redesign
- New migrations unless strictly necessary
- DB refactor

## Issue 2: Playwright E2E verification blocker

# Public Beta Blocker: Playwright E2E verification is incomplete

## Problem

Public Beta final validation is NO-GO because Playwright browser installation failed in the current environment.

Current known failure:
- `pnpm exec playwright install --with-deps chromium` failed due to apt/proxy 403
- `pnpm exec playwright install chromium` failed due to CDN/proxy 403
- `pnpm test:e2e` failed because Chromium executable was missing

## Required validation

Run in an environment where Playwright Chromium can be installed:

```bash
pnpm install
docker compose up -d
pnpm exec prisma generate
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tracemap?schema=public" pnpm exec prisma migrate deploy
pnpm exec playwright install --with-deps chromium
pnpm test:e2e
```

### Required E2E focus

Confirm that `e2e/public-beta-readiness.spec.ts` passes.

It must cover:
- Landing Public Beta copy
- Login required behavior
- Start Investigation
- Run detail panels
- Evidence Map
- Unknown Map
- Source Lineage
- Source Quality
- Briefing Report
- Markdown copy/download
- Share read-only
- Share noindex
- Run History

### Acceptance criteria

- Playwright Chromium installs successfully
- `pnpm test:e2e` passes
- `e2e/public-beta-readiness.spec.ts` passes
- Result is recorded in final validation docs

### Non-goals

- UI redesign
- New product features
- Skipping flaky tests without fixing cause

## Issue 3: OpenAI smoke test blocker

# Public Beta Blocker: OpenAI 3-topic smoke test is incomplete

## Problem

Public Beta final validation is NO-GO because OpenAI smoke tests were skipped due to missing API key.

Current known status:
- `TRACEMAP_OPENAI_API_KEY / OPENAI_API_KEY` not set
- Company research smoke test skipped
- Technical research smoke test skipped
- Market research smoke test skipped

## Required environment

Set the following environment variables without committing secrets:

```bash
TRACEMAP_ANSWER_GRAPH_PROVIDER=openai
TRACEMAP_OPENAI_API_KEY=...
TRACEMAP_OPENAI_MODEL=gpt-4o-mini
TRACEMAP_OPENAI_TIMEOUT_MS=60000
```

### Required smoke topics

- Company research: トヨタ自動車のEV戦略について、成長要因・リスク・競合状況・未確認事項を公開情報ベースで根拠付きで整理する
- Technical research: RAGとAIエージェントの違いを、技術的主張・根拠・未確認点に分解して整理する
- Market research: 国内生成AI市場の主要プレイヤーを比較し、市場機会・リスク・不明点を公開情報ベースで整理する

### Acceptance criteria

For each topic:
- Run status is completed
- At least 2 sources are saved
- Source URLs are valid http/https
- At least 1 claim is saved
- Claims are linked to sources
- Evidence Map renders
- Unknown Map renders
- Source Lineage renders
- Source Quality renders
- Briefing Report renders
- No raw stack trace is visible
- No buy/sell recommendation or target price certainty appears
- Result is recorded in final validation docs

### Failure criteria

NO-GO if:
- API key missing causes app crash
- sufficient_grounding=false is treated as completed
- Invalid/fake source URL is persisted
- Claims are not linked to sources
- Raw provider error appears in UI
- Failed run UI is broken
- Report includes investment-advice-like wording

### Non-goals

- OpenAI provider schema rewrite
- RAG
- Web crawling
- Background jobs
