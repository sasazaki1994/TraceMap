# Briefing Report

## Purpose

Define the MVP v2 Briefing Report preview: a Markdown-formatted, shareable summary of an Investigation Mission result assembled from existing answer, claim, source, and unknown-map data.

## User value

- Users can reuse investigation output without manually copying scattered panels.
- Reviewers can see the executive summary, key claims, supporting sources, and unresolved unknowns in one text block.
- Shared run pages retain the same report preview without adding export infrastructure.

## Scope

- Build a Markdown preview on the run/share page.
- Include:
  - `# Briefing Report`
  - `## Executive Summary`
  - `## Key Claims`
  - `## Supporting Sources`
  - `## Unknowns / Open Questions`
  - `## Source Lineage Summary`
- Render the Markdown as readable preformatted text for MVP.
- Allow lightweight Markdown reuse from the preview via client-side copy and `.md` download actions.
- Generate the preview from `answerContent`, `evidenceClaims`, `sources`, and Unknown Map / Source Lineage helper output.

## Non-goals

- No persisted report table.
- No downloadable PDF, editor, comments, or approval workflow beyond lightweight `.md` copy/download.
- No Markdown parser dependency.
- No investment recommendation, buy/sell recommendation, or action language that could be read as financial advice.

## Existing implementation constraints

- `AnalysisRun.question` is not renamed in this slice.
- Unknown / Report tables are not added in this slice.
- Unknown Map is derived from alerts / confidence / source support.
- Briefing Report starts as a UI-side Markdown preview.
- Source Lineage Lite is derived from `sourceType`, `isPrimarySource`, and `publishedAt`.
- Large OpenAI provider schema changes are deferred to a later phase.
- Existing Evidence Graph, Claims, Sources, Share links, Counterpoints, and Propagation Chain sections remain visible.

## Data model strategy

- Use view helpers only:
  - `buildBriefingReport`
  - `buildUnknowns`
  - `buildSourceLineage`
- Do not persist report text.
- Keep Markdown deterministic so tests can assert section presence and key content.

## UI requirements

- The run page shows a Briefing Report panel.
- The panel uses:
  - `data-testid="briefing-report-panel"`
  - `data-testid="briefing-report-markdown"`
- The report preview must include summary, claims, sources, unknowns, and source lineage summary where data exists.
- The panel exposes Copy Markdown and Download `.md` actions for the currently displayed report text.
- Empty sections should use clear fallback text rather than hiding the whole report.

## Provider requirements

- Mock provider may make answer content more briefing-like.
- OpenAI provider keeps its existing answer schema and validation.
- A later Investigation Result schema can produce richer briefing sections, but MVP v2 must work with existing persisted rows.

## Test requirements

- Unit tests verify that the report Markdown includes expected headings and entries for summary, claims, sources, unknowns, and lineage.
- E2E tests verify `briefing-report-panel` and `briefing-report-markdown` appear on completed mock run pages.

## Acceptance references

See `acceptance/briefing-report.feature`.
