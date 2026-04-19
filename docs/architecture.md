# TraceMap Bootstrap Notes

## Current Scope

- Single Next.js App Router application at repository root
- Prisma + PostgreSQL for persistence
- Vitest for unit tests
- Playwright for smoke-style E2E checks

### Mock slice layers (evidence)

- **Question → answer graph**: `analysis_runs`, `answer_snapshots` (including `graph_json`), `source_snapshots`; created by `createMockAnalysisRun` and shown on `/runs/[id]` (graph + sources + detail panel).
- **Claim / Counterpoint / Alert (read-only mock)**: `claims`, `counterpoints`, `alerts` on the same run; populated alongside the mock graph in `createMockAnalysisRun` and displayed as read-only sections on the run page. No LLM or async pipeline—placeholder text only.

## Directory Intent

- `src/app`: routes, layouts, route handlers
- `src/features`: feature-owned UI and orchestration
- `src/components`: shared presentational pieces
- `src/lib`: shared utilities and constants
- `src/server`: server-only utilities such as Prisma and health checks
- `src/types`: cross-cutting types

## Next Steps

- Add write path from question intake to `analysis_runs`
- Introduce answer graph read model and visualization layer
- Expand acceptance scenarios before adding AI orchestration
