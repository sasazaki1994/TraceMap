# TraceMap

TraceMap is a Next.js-based cyber intelligence console for running AI-assisted investigation missions from research topics. It visualizes and stores findings as an Evidence Map, Unknown Map, Source Lineage, and Briefing Report while preserving traceable claims and sources.

MVP v2 focuses on:

- starting an Investigation Mission from a research topic
- tracing findings through the Evidence Map
- surfacing unresolved gaps in the Unknown Map
- labeling provenance in Source Lineage Lite
- previewing a reusable Briefing Report

TraceMap is developed spec-first. Product intent lives in `specs/`, observable acceptance criteria live in `acceptance/`, and the detailed product / AI-agent operating definition lives in `docs/ai/PROJECT_AGENT_GUIDE.md`.

## Stack

- Next.js App Router
- TypeScript
- Prisma
- PostgreSQL
- Vitest
- Playwright
- pnpm
- Vercel-ready deployment baseline

## Project Structure

```text
.
├─ acceptance/
├─ docs/
├─ e2e/
├─ prisma/
├─ specs/
├─ src/
│  ├─ app/
│  ├─ components/
│  ├─ features/
│  ├─ lib/
│  ├─ server/
│  └─ types/
├─ tests/
└─ .github/workflows/
```

## Prerequisites

- Node.js 20+
- pnpm 10+
- Docker Desktop or compatible Docker Engine

## Initial Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env
   ```

   PowerShell alternative:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Start PostgreSQL:

   ```bash
   docker compose up -d
   ```

4. Generate the Prisma client:

   ```bash
   pnpm db:generate
   ```

5. Initialize the schema:

   ```bash
   pnpm db:push
   ```

6. Install Playwright browsers:

   ```bash
   pnpm exec playwright install
   ```

## Run The App

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Health endpoint:

```text
http://localhost:3000/api/health
```

## Test Commands

- Unit tests:

  ```bash
  pnpm test
  ```

- E2E tests:

  ```bash
  pnpm test:e2e
  ```

- Lint:

  ```bash
  pnpm lint
  ```

- Typecheck:

  ```bash
  pnpm typecheck
  ```

## Database Commands

- Generate Prisma client:

  ```bash
  pnpm db:generate
  ```

- Push schema:

  ```bash
  pnpm db:push
  ```

- Create a local migration:

  ```bash
  pnpm db:migrate --name init
  ```

- Open Prisma Studio:

  ```bash
  pnpm db:studio
  ```

## Spec-Driven Development Notes

- Write product intent in `specs/`
- Store Gherkin-style acceptance criteria in `acceptance/`
- Add feature code under `src/features/`
- Keep shared primitives in `src/components/` and shared server logic in `src/server/`


## AIエージェント運用

このリポジトリでは、AIエージェント運用ルールの正本を `docs/ai/PROJECT_AGENT_GUIDE.md` に集約しています。

- Codex / Cursor: `AGENTS.md` を入口として参照し、詳細は共通ガイドへ誘導
- Claude Code: `CLAUDE.md` を入口として参照し、詳細は共通ガイドへ誘導
- Cursor Project Rule: `.cursor/rules/project.mdc` は薄いラッパーとして共通ガイド参照を強制

人間が運用ルールを更新する場合も、まず `docs/ai/PROJECT_AGENT_GUIDE.md` を更新し、必要最小限だけ各入口ファイルへ反映してください。

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on `pull_request` and `push` to `main` with a **PostgreSQL 16** service and mock provider defaults.

- Static checks: `corepack enable`, `pnpm install --frozen-lockfile`, `pnpm exec prisma generate`, `pnpm exec prisma validate`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`
- DB checks: `pnpm exec prisma migrate deploy`, `pnpm exec prisma migrate status`, and fresh DB migration verification (`tracemap_verify`)
- E2E checks: `pnpm exec playwright install --with-deps chromium` and `pnpm test:e2e`

CI uses `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tracemap?schema=public`, `ANSWER_GRAPH_PROVIDER=mock`, and `NODE_ENV=test`, so OpenAI API keys are not required for the default validation path.

## Current MVP Baseline

- Top page at `/`, run detail at `/runs/[id]`, read-only share view at `/share/[token]`
- Health route at `/api/health`
- Prisma schema for runs, snapshots, share links, MVP evidence tables (`claims`, `claim_source_snapshots`, `counterpoints`, `alerts`), run-local URL verification columns on `source_snapshots`, Source Cache / Fetch Snapshot v0.1 tables for URL-level fetch reuse, and Run Cache v0.1 entries for reusable normalized investigation payloads — mock runs seed multiple claims and one counterpoint for UI verification
- Investigation Mode MVP v2 frames user input as a research topic and keeps Mission Header, Investigation Timeline, Evidence Map, Unknown Map, Source Lineage Lite, and Briefing Report preview visible on run/share views without adding Unknown or Report tables
- Run Cache stores reusable normalized investigation payloads for fresh repeated topics while preserving run-local answer/source snapshots and evidence rows.
- Vitest and Playwright coverage; see `specs/` and `acceptance/` for behavior

## Optional: OpenAI answer graph (env-only)

By default, runs use the **mock** answer-graph provider. To call OpenAI from the same persistence path:

1. Set `TRACEMAP_ANSWER_GRAPH_PROVIDER=openai`.
2. Set `TRACEMAP_OPENAI_API_KEY` (or `OPENAI_API_KEY`).
3. Optionally set `TRACEMAP_OPENAI_MODEL` (default `gpt-4o-mini`) and `TRACEMAP_OPENAI_TIMEOUT_MS` (default `60000` ms).

If the key is missing or the API errors, the run ends as **failed** and `last_error_message` is set. This path does not add web search, retrieval/RAG, background jobs, or streaming — see `docs/architecture.md` and `docs/adr/openai-answer-graph-provider.md`.

**Source-grounded slice (OpenAI only):** the model must return at least **two** sources with **http** or **https** URLs (hostname required). Claims must reference those sources by id. If the model sets **`sufficient_grounding`** to **false** (cannot ground the answer), the run **fails** — it is not marked completed. Structural validation is the gate for **`completed`** runs. On persist, the server performs a **best-effort** HTTP check per http(s) URL and stores verification metadata on **`source_snapshots`**; unreachable URLs do **not** by themselves fail the run. Default provider remains **mock**; use `TRACEMAP_ANSWER_GRAPH_PROVIDER=openai` to enable this path.