# TraceMap Bootstrap Notes

## Current Scope

- Single Next.js App Router application at repository root
- Prisma + PostgreSQL for persistence
- Vitest for unit tests
- Playwright for smoke-style E2E checks (CI runs against Postgres + migrated schema)
- Specs in `specs/`, Gherkin-style acceptance in `acceptance/`

### Mock slice layers (evidence)

- **Question → answer graph**: `analysis_runs`, `answer_snapshots` (including `graph_json`), `source_snapshots`; created by `createAnalysisRunFromProvider` (server action from the landing form) and shown on `/runs/[id]` (graph + sources + detail panel).
- **Claim / Counterpoint / Alert (read-only mock)**: `claims`, `counterpoints`, `alerts` on the **latest** `answer_snapshots` row (FK from claim/counterpoint/alert tables); the **mock** answer-graph provider inserts one of each with placeholder copy. `/runs/[id]` and `/share/[token]` map rows through `mapAnswerEvidenceForView` into `RunResultView`. No external LLM in default config.

### AI boundary (mock slice → future real model)

The codebase separates **generation** from **persistence** so a real LLM can be added later without rewriting the Prisma write path:

- **Contract**: `AnswerGraphProvider` (`src/server/analysis/answer-graph-provider.ts`) — `generateAnswerGraph({ question })` returns `GenerateAnswerGraphResult` (`src/types/answer-graph-generation.ts`).
- **Write path**: `persistGeneratedAnswerGraph` (`src/server/analysis/persist-generated-answer-graph.ts`) takes a `GeneratedAnswerGraphPayload` and creates `answer_snapshots` / `source_snapshots` / optional evidence rows in one transaction.
- **Orchestration**: `createAnalysisRunFromProvider` (`src/server/analysis/create-analysis-run-from-provider.ts`) updates `analysis_runs.status` (`queued` → `processing` → `completed` | `failed`), persists `last_error_message` on failure, and logs unexpected errors to the server console.
- **Providers today** (under `src/server/analysis/providers/`):
  - `mock` (default) — full mock parity (graph + sources + evidence).
  - `stub` — minimal graph, no LLM.
  - `openai` — real OpenAI Chat Completions + Structured Outputs (`src/server/analysis/providers/openai-answer-graph-provider.ts`). Enable with `TRACEMAP_ANSWER_GRAPH_PROVIDER=openai` **and** set `TRACEMAP_OPENAI_API_KEY` or `OPENAI_API_KEY`. Optional: `TRACEMAP_OPENAI_MODEL` (defaults to `gpt-4o-mini`), `TRACEMAP_OPENAI_TIMEOUT_MS` (defaults to `60000`). Missing key or API errors surface as `failed` runs with `last_error_message` via `GenerateAnswerGraphResult` `failure` (unchanged orchestration).
- **Not in scope yet**: job queues, streaming, web/file search, retrieval/RAG, and other providers beyond this minimal OpenAI slice.

## Directory Intent

- `src/app`: routes, layouts, route handlers
- `src/features`: feature-owned UI and orchestration
- `src/components`: shared presentational pieces
- `src/lib`: shared utilities and constants
- `src/server`: server-only utilities such as Prisma, health checks, and share-link creation
- `src/types`: cross-cutting types

## Implemented Baseline

- Question intake on `/` creates an `analysis_runs` row via `createAnalysisRunFromProvider`, persists snapshots, and navigates to `/runs/[id]`
- Run page renders answer, mock `claims` / `counterpoints` / `alerts` when the **mock** provider is selected (see `mock-answer-graph-provider.ts`), SVG evidence graph from `graph_json`, then claims (with `graph_node_id` ↔ graph node labels and Answer/Question click highlight), and source detail panel; failed runs show `last_error_message` in a status banner
- Share links via `share_links` and read-only `/share/[token]` (same evidence sections as run page when completed)
- Domain tables `claims`, `counterpoints`, `alerts` — populated by the mock provider path; a future real provider returns the same payload shape

## Next Steps

- Harden OpenAI path: retries, richer source/evidence modeling, retrieval when a search stack exists
- Optional: background jobs if generation outlives HTTP request budgets (status enum already exists)
- Richer evidence UX (graph integration for claims, filters) once real data exists

See also: `docs/adr/openai-answer-graph-provider.md`.
