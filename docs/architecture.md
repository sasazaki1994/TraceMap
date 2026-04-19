# TraceMap Bootstrap Notes

## Current Scope

- Single Next.js App Router application at repository root
- Prisma + PostgreSQL for persistence
- Vitest for unit tests
- Playwright for smoke-style E2E checks (CI runs against Postgres + migrated schema)
- Specs in `specs/`, Gherkin-style acceptance in `acceptance/`

### Mock slice layers (evidence)

- **Question → answer graph**: `analysis_runs`, `answer_snapshots` (including `graph_json`), `source_snapshots`; created by `createMockAnalysisRun` and shown on `/runs/[id]` (graph + sources + detail panel).
- **Claim / Counterpoint / Alert (read-only mock)**: `claims`, `counterpoints`, `alerts` on the **latest** `answer_snapshots` row (FK from claim/counterpoint/alert tables); `createMockAnalysisRun` inserts one of each with placeholder copy. `/runs/[id]` and `/share/[token]` map rows through `mapAnswerEvidenceForView` into `RunResultView`. No LLM or async pipeline.

## Directory Intent

- `src/app`: routes, layouts, route handlers
- `src/features`: feature-owned UI and orchestration
- `src/components`: shared presentational pieces
- `src/lib`: shared utilities and constants
- `src/server`: server-only utilities such as Prisma, health checks, and share-link creation
- `src/types`: cross-cutting types

## Implemented Baseline

- Question intake on `/` persists mock `analysis_runs` / `answer_snapshots` / `source_snapshots` and navigates to `/runs/[id]`
- Run page renders answer, mock `claims` / `counterpoints` / `alerts` (see `create-mock-run.ts`), SVG evidence graph from `graph_json`, then claims (with `graph_node_id` ↔ graph node labels and Answer/Question click highlight), and source detail panel
- Share links via `share_links` and read-only `/share/[token]` (same evidence sections as run page)
- Domain tables `claims`, `counterpoints`, `alerts` — populated by the mock run path; real pipelines TBD

## Next Steps

- AI orchestration and non-mock answer generation
- Background jobs for `queued` / `processing` analysis runs
- Richer evidence UX (graph integration for claims, filters) once real data exists
