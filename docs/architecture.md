# TraceMap Bootstrap Notes

## Current Scope

- Single Next.js App Router application at repository root
- Prisma + PostgreSQL for persistence
- Vitest for unit tests
- Playwright for smoke-style E2E checks

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
