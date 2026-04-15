# TraceMap

TraceMap is a Next.js-based web app for exploring AI answers as traceable source networks instead of opaque text blobs.

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

GitHub Actions runs:

- install
- lint
- typecheck
- test

## Current MVP Baseline

- Top page at `/`
- Health route at `/api/health`
- Prisma schema for `analysis_runs`, `answer_snapshots`, `source_snapshots`, and `share_links`
- Sample Vitest and Playwright coverage
