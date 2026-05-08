# Company Research Report Mode

## Purpose

Provide a company-focused investigation output mode that organizes public information into a reusable research report preview while preserving TraceMap's evidence-first experience.

## User value

- Users can start from a company name or market topic and quickly get a structured research brief.
- Users can review growth/risk/competition context with linked evidence and unresolved unknowns.
- Teams can reuse the same run output for internal research discussion without turning TraceMap into an investment advisory product.

## Scope

- Add a Company Research Report spec/acceptance and MVP UI panel.
- Generate report markdown from existing run data (`answerContent`, claims, sources, alerts-derived unknowns, source lineage).
- Keep existing Mission Header, Evidence Map, Unknown Map, Source Lineage Lite, and Briefing Report visible.
- Keep form field `name="question"` and CTA `Start Investigation`.

## Non-goals

- No DB migration or new company/report tables.
- No rename of `AnalysisRun.question`.
- No PDF/PowerPoint/Notion export.
- No large OpenAI provider schema redesign.
- No buy/sell recommendation, target stock price assertion, or performance guarantee language.

## Research topic handling

- Input continues to use existing `AnalysisRun.question` as research topic storage.
- Topics may be company names, competitor comparisons, or market sub-themes.
- Company-specific view formatting is derived at render time from the run snapshot.

## Existing implementation constraints

- `AnalysisRun.question` is not renamed in this phase.
- Company-specific DB tables are not added.
- Company Research Report is generated on the view side from existing `answerContent`, `evidenceClaims`, `sources`, `evidenceAlerts`, and Source Lineage derived output.
- OpenAI provider large schema updates are deferred to a later phase.
- Mock provider and UI skeleton are prioritized first.
- Report is rendered as Markdown preview first.
- Preview supports lightweight client-side Copy Markdown and Download `.md` actions.
- PDF/PowerPoint/Notion integration is out of scope.
- Investment-advice-like language is prohibited.
- Bull/Bear framing is treated as research viewpoints based on public information, not investment judgment.
- Insufficient grounding and unresolved gaps must be visible in Unknown Map.

## Data model strategy

- Add UI-only types/helpers for `CompanyResearchReportInput` and generated markdown.
- Reuse existing persisted entities: run question, answer snapshot content, evidence claims, source snapshots, alerts.
- Derive unknowns and source lineage from existing helper outputs.

## UI requirements

- Landing page includes company-research example copy while preserving `name="question"` and `Start Investigation`.
- Run result includes `company-research-report-panel` and `company-research-report-markdown`.
- Company report panel includes Copy Markdown / Download `.md` actions for the visible markdown.
- Panel can be shown as a dedicated section below Briefing Report.
- Markdown includes: company/topic, executive summary, business overview, growth drivers, risk factors, competitive context, recent developments, evidence summary, unknowns, source lineage notes, and disclaimer.

## Provider requirements

- Mock payload should include company-research-like answer/claims/sources/alerts while keeping current schema compatibility.
- OpenAI provider keeps current validation behaviors (`sufficient_grounding`, URL validation, claim-source reference validation, failure semantics).
- Company report-specific provider schema is deferred to next phase; this phase can add TODO/safety notes only.

## Report structure

```md
# Company Research Report
## Company / Topic
## Executive Summary
## Business Overview
## Growth Drivers
## Risk Factors
## Competitive / Market Context
## Recent Developments
## Evidence Summary
## Unknowns / Open Questions
## Source Lineage Notes
## Research Disclaimer
```

## Compliance / safety requirements

- Must avoid investment advice language and deterministic investment actions.
- Must include neutral research disclaimer.
- Must surface unknowns and evidence limits rather than hiding uncertainty.

## Test requirements

- Unit tests for report builder include section presence, disclaimer behavior, and empty-data fallback.
- Existing run page integration keeps prior panels visible and adds company report panel.
- If UI automation is updated, assert `company-research-report-panel` and `company-research-report-markdown`.

## Acceptance references

- `acceptance/company-research-report.feature`
- `acceptance/investigation-mode.feature`
- `acceptance/unknown-map-and-source-lineage.feature`
- `acceptance/briefing-report.feature`
