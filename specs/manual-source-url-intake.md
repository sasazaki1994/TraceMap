# Manual Source URL Intake v0.1

## Purpose

Allow users to submit optional source URLs from the landing page so Investigation Mission runs can prioritize user-specified references in source intake without changing the core answer/evidence pipeline.

## User value

- Users can seed investigations with known high-signal references (official IR, press releases, public docs, papers, government data).
- Evidence Map traceability improves because user-intended sources are treated as first-class candidates.
- Invalid input is blocked early with clear form feedback, preventing broken runs.

## Scope

- Add optional multi-line URL input (`sourceUrls`) on landing intake form.
- Parse, validate, normalize, and deduplicate URLs in server action.
- Pass valid manual URLs through run creation options to source intake.
- Merge manual URLs with topic-extracted/discovered URLs, prioritizing manual URLs.
- Keep OpenAI provider schema unchanged; continue using existing `sourceCandidates` path.
- Keep existing Source Cache / Fetch Snapshot route for URL resolution.

## Non-goals

- RAG, embeddings, reranking, full-text crawling, PDF parsing.
- Background jobs, streaming response.
- New source tables, auth/workspace changes, upload flows.
- Large OpenAI provider schema redesign.

## Existing implementation constraints

- `AnalysisRun.question` is not renamed in this slice.
- `question` form field remains required and unchanged.
- Investigation mode selector behavior remains unchanged.
- Existing Evidence Map / Unknown Map / Source Lineage / Briefing Report / Report Export Lite must keep working.

## Data model strategy

- No Prisma schema changes and no DB migration.
- Manual URLs are transient form input passed via server-side options.
- Source candidate persistence continues via existing `source_snapshots` and source cache/fetch snapshot linkage.

## UI requirements

- Add textarea between Research topic and Investigation depth.
- Label: `Optional source URLs`.
- Help text: `Add one URL per line. TraceMap will prioritize these sources when building the evidence map.`
- Name: `sourceUrls`.
- `data-testid="manual-source-url-input"` for textarea input.
- `data-testid="manual-source-url-help"` for help text.
- `data-testid="manual-source-url-error"` for invalid URL validation message.
- Optional input, empty means existing behavior.
- Validation error can be shown near existing form error region.

## Server action requirements

- Read `sourceUrls` from `FormData`.
- Split by line, trim, drop empty lines.
- Validate as absolute `http(s)` URLs.
- Normalize and dedupe before forwarding.
- On invalid line(s), return form error and do not create run.
- Error message: `Source URLs must be valid http(s) URLs, one per line.`

## Source intake requirements

- Accept `manualSourceUrls` option in `buildSourceIntakeFromQuestion`.
- Merge URL inputs in this precedence order:
  1) manual source URLs,
  2) URLs extracted from question text,
  3) discovery provider URLs.
- Deduplicate by normalized URL while preserving higher-priority origin.
- Invalid URLs should be safely reported into `ignoredUrls` if they still reach intake.

## Provider requirements

- OpenAI provider schema remains unchanged.
- Manual URLs are surfaced only via existing `sourceCandidates` context.
- Optional prompt tweak may prefer user-provided candidates, but no large prompt inflation.

## Cache requirements

- Manual URLs can change output; avoid stale run-cache reuse.
- For v0.1 safety: skip run-cache lookup/store when `manualSourceUrls` are present.

## Test requirements

- Unit tests for manual URL parser/validator normalization + dedupe.
- Server action behavior for valid/invalid/manual-empty paths.
- Source intake merge priority and duplicate removal coverage.
- Existing tests remain green.

## Acceptance references

- `acceptance/manual-source-url-intake.feature`
