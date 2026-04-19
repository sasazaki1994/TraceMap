# TraceMap Bootstrap Notes

## Current Scope

- Single Next.js App Router application at repository root
- Prisma + PostgreSQL for persistence
- Vitest for unit tests
- Playwright for smoke-style E2E checks (CI runs against Postgres + migrated schema)
- Specs in `specs/`, Gherkin-style acceptance in `acceptance/`

### Mock slice layers (evidence)

- **Question → answer graph**: `analysis_runs`, `answer_snapshots` (including `graph_json`), `source_snapshots`; created by `createAnalysisRunFromProvider` (server action from the landing form) and shown on `/runs/[id]` (graph + sources + detail panel).
- **Claim / Counterpoint / Alert (read-only mock)**: `claims`, `claim_source_snapshots`, `counterpoints`, `alerts` on the **latest** `answer_snapshots` row; the **mock** answer-graph provider inserts **multiple** claims, one counterpoint on the first claim, and one alert with placeholder copy. `/runs/[id]` and `/share/[token]` map rows through `mapAnswerEvidenceForView` into `RunResultView`. No external LLM in default config.

### AI boundary (mock slice → future real model)

The codebase separates **generation** from **persistence** so a real LLM can be added later without rewriting the Prisma write path:

- **Contract**: `AnswerGraphProvider` (`src/server/analysis/answer-graph-provider.ts`) — `generateAnswerGraph({ question })` returns `GenerateAnswerGraphResult` (`src/types/answer-graph-generation.ts`).
- **Write path**: `persistGeneratedAnswerGraph` (`src/server/analysis/persist-generated-answer-graph.ts`) takes a `GeneratedAnswerGraphPayload` and creates `answer_snapshots` / `source_snapshots` / optional evidence rows in one transaction. Before insert, it runs **optional URL verification** (`verifyPublicHttpUrl`) for http(s) URLs; results are stored on `source_snapshots` and **do not** flip runs to `failed` on network errors.
- **Orchestration**: `createAnalysisRunFromProvider` (`src/server/analysis/create-analysis-run-from-provider.ts`) updates `analysis_runs.status` (`queued` → `processing` → `completed` | `failed`), persists `last_error_message` on failure, and logs unexpected errors to the server console.
- **Providers today** (under `src/server/analysis/providers/`):
  - `mock` (default) — full mock parity (graph + sources + evidence).
  - `stub` — minimal graph, no LLM.
  - `openai` — real OpenAI Chat Completions + Structured Outputs (`src/server/analysis/providers/openai-answer-graph-provider.ts`). Enable with `TRACEMAP_ANSWER_GRAPH_PROVIDER=openai` **and** set `TRACEMAP_OPENAI_API_KEY` or `OPENAI_API_KEY`. Optional: `TRACEMAP_OPENAI_MODEL` (defaults to `gpt-4o-mini`), `TRACEMAP_OPENAI_TIMEOUT_MS` (defaults to `60000`). Missing key or API errors surface as `failed` runs with `last_error_message` via `GenerateAnswerGraphResult` `failure` (unchanged orchestration).

### Source-grounded slice (OpenAI provider)

Minimal vertical slice: no search index, jobs, or retrieval service — only structured model output plus **server-side validation** before `persistGeneratedAnswerGraph`.

**What we guarantee today (when the run completes successfully)**

- At least **two** `source_snapshots` rows with **http** or **https** URLs that pass a strict parse check (hostname required; no domain allowlist).
- Structured output includes **`sufficient_grounding`**: if the model sets it to `false`, the provider returns **`failure`** (run **`failed`**, `last_error_message` set) — we do **not** complete the run without grounding.
- Each **claim** in the model output lists **`supported_by_source_ids`** referencing `sources[].id`; each becomes a **`claims`** row with **`claim_source_snapshots`** rows for the link. **`graph_json`** is **version 2** with **claim** nodes; **`graph_node_id`** points at **`node_claim_*`**.
- **Counterpoint** and **alert** rows are still **one each** per answer snapshot; counterpoint attaches to the **first** claim.

**What we do not guarantee yet**

- That every URL is reachable or that HTTP status implies factual correctness — verification is **auxiliary metadata** only.
- Web search, file search, RAG, queues, or streaming.
- Stub still omits evidence and may have zero sources by design.

**Run UI**: `/runs/[id]` lists sources with label, type, URL, a short excerpt preview, and the detail panel shows full excerpt and link. Selecting a **claim** in the graph highlights linked sources.

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
- Run page renders answer, mock `claims` / `counterpoints` / `alerts` when the **mock** provider is selected (see `mock-answer-graph-provider.ts`), SVG evidence graph from `graph_json` (v1 legacy or **v2** with claim nodes), then claims (with `graph_node_id` ↔ graph node labels and graph click highlight), and source detail panel; failed runs show `last_error_message` in a status banner
- Share links via `share_links` and read-only `/share/[token]` (same evidence sections as run page when completed)
- Domain tables `claims`, `claim_source_snapshots`, `counterpoints`, `alerts` — populated by the mock / openai provider paths

## Next Steps

- Harden OpenAI path: retries, richer trust UX on verification fields, retrieval when a search stack exists
- Optional: background jobs if generation outlives HTTP request budgets (status enum already exists)
- Richer evidence UX (filters, claim highlighting on source rows) once real data exists

See also: `docs/adr/openai-answer-graph-provider.md`.
