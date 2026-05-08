# Run History and Saved Investigations UI v0.1

## Purpose

Add a lightweight Saved Investigations page at `/runs` so users can revisit past Investigation Missions without re-running analysis.

## User value

- Makes investigation output reusable, not one-shot.
- Lets users reopen existing run detail pages (`/runs/[id]`) to inspect Evidence Map / Unknown Map / Source Lineage / Briefing Report again.
- Surfaces failed runs as useful investigation logs instead of hiding them.

## Scope

- Add server-rendered run history page at `/runs`.
- List up to 50 `AnalysisRun` records ordered by latest created first.
- Show per-run metadata:
  - Research topic (`AnalysisRun.question`)
  - Status (`queued` / `processing` / `completed` / `failed`)
  - Created at / Updated at
  - Latest answer title (from latest `AnswerSnapshot`)
  - Source / claim / alert counts (from latest `AnswerSnapshot` relations)
  - Open link to `/runs/[id]`
  - Error summary from `lastErrorMessage` when failed
- Add navigation entry from landing page to `/runs`.
- Add acceptance scenarios and E2E checks for basic visibility and navigation.

## Non-goals

- Authentication, owner scope, workspaces, team sharing
- Billing / usage quota
- Run deletion, rename, pin/favorite, archive
- Pagination/search/filter APIs
- Share-link management changes
- RAG, background jobs, streaming, full-text crawling
- OpenAI provider change

## Existing implementation constraints

- Keep current Evidence Map / Unknown Map / Source Lineage / Briefing Report flows unchanged.
- Keep `/runs/[id]` detail route unchanged in behavior.
- Preserve existing style direction (cyber but readable).
- No `any`-based type bypasses.

## Data model strategy

- Reuse existing `AnalysisRun` and `AnswerSnapshot` tables.
- Reuse current relations from latest `AnswerSnapshot` to `sourceSnapshots`, `claims`, and `alerts`.
- No Prisma schema changes and no DB migration for this feature.

## UI requirements

- Route: `/runs`
- Page title: `Saved Investigations`
- Description: `Review previous investigation missions, reopen evidence maps, and reuse briefing reports.`
- Required states:
  - Empty state with CTA back to `/`
  - Non-empty list with status badge and compact metadata
- Status labels must render as uppercase:
  - `QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`
- Failed runs must display shortened `lastErrorMessage` and remain navigable.
- Required test ids:
  - `saved-investigations-page`
  - `saved-investigations-empty`
  - `saved-investigation-item`
  - `saved-investigation-topic`
  - `saved-investigation-status`
  - `saved-investigation-answer-title`
  - `saved-investigation-source-count`
  - `saved-investigation-claim-count`
  - `saved-investigation-alert-count`
  - `saved-investigation-open-link`
  - `saved-investigation-error`
  - navigation link: `saved-investigations-link`

## Query requirements

- Implement as Server Component.
- Use Prisma `analysisRun.findMany` with:
  - `orderBy: { createdAt: "desc" }`
  - `take: 50`
- Include only latest `answerSnapshots` row (`take: 1`, desc by `createdAt`).
- Fetch only lightweight fields for list rendering and relation counts; do not fetch answer body content or graph payload.

## Test requirements

- Update acceptance spec and index.
- Add E2E coverage for:
  - `/runs` route visibility
  - empty-state visibility
  - landing link to `/runs`
  - open link from list to `/runs/[id]`
- Existing tests must continue passing.

## Acceptance references

- `acceptance/run-history-and-saved-investigations.feature`
