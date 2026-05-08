# Report Export Lite

## Purpose

Add a minimal Markdown reuse workflow so users can copy or download generated report previews directly from the run result UI.

## User value

- Users can quickly reuse generated report text in docs, chat, and internal notes.
- Teams can share report content without manual reformatting.
- The feature keeps TraceMap focused on evidence exploration while adding lightweight output portability.

## Scope

- Add client-side Copy Markdown and Download `.md` actions to:
  - Briefing Report panel
  - Company Research Report panel
- Use existing generated Markdown preview text without transforming report semantics.
- Show copy success/failure status in UI.
- Generate safe local download file names for `.md` exports.

## Non-goals

- No DB migration, no report table, and no persisted report markdown text.
- No PDF / PowerPoint / Notion export.
- No Markdown editor, approval workflow, comments, or collaboration layer.
- No changes to provider schema or OpenAI provider integration.
- No investment recommendation, buy/sell recommendation, or advisory language additions.

## Existing implementation constraints

- Report Export Lite reuses existing Markdown preview output.
- Export content must be the exact Markdown produced by `buildBriefingReport` and `buildCompanyResearchReport`.
- Existing Evidence Map / Unknown Map / Source Lineage / Source Quality / Share behaviors remain intact.
- Must work without server round-trips for copy/download operations.

## Data model strategy

- Client-side only implementation.
- No persistence of exported report text.
- No Prisma schema changes.

## UI requirements

- Briefing Report panel keeps existing test ids and adds:
  - `briefing-report-copy-button`
  - `briefing-report-download-button`
  - `briefing-report-copy-status`
- Company Research Report panel keeps existing test ids and adds:
  - `company-report-copy-button`
  - `company-report-download-button`
  - `company-report-copy-status`
- Action labels are explicit (`Copy Markdown`, `Download .md`).
- Copy status provides quick user feedback (`Copied` / `Copy failed`).

## Accessibility requirements

- Buttons remain keyboard accessible.
- Copy status uses polite live region semantics.
- Clipboard API unavailability must not break rendering.

## Test requirements

- Unit test safe filename helper behavior:
  - empty fallback
  - symbol sanitization
  - max length behavior
  - `.md` extension
  - Japanese text stability
- Existing tests for report builders/panels continue to pass.
- If E2E is updated, assert action test ids and copy status feedback.

## Acceptance references

- `acceptance/report-export-lite.feature`
- `acceptance/briefing-report.feature`
- `acceptance/company-research-report.feature`
