# Source Quality and Freshness Inspector v0.1

## Purpose
Improve trust calibration in TraceMap by surfacing a lightweight, derived quality assessment per source without changing persisted evidence structures.

## User value
- Users can quickly estimate whether a source is likely reliable enough to reuse.
- Users can separate quality, freshness, and reachability signals instead of treating a source as simply "verified".
- Users can spot stale/unchecked evidence before sharing findings.

## Scope
- Add Source Quality/Freshness/Reachability view-model types.
- Add rule-based helper that derives source assessments from existing source snapshots and claim support metadata.
- Show assessments in run UI (source lineage/source list/quality panel) with reasons and warnings.
- Reuse helper output from Unknown Map / Briefing Report as minimal integration.
- Add mock provider sample coverage for diverse source quality patterns.
- Add unit tests for derivation rules.

## Non-goals
- Report export enhancements.
- Source detail drilldown expansion.
- Unknown Map major redesign.
- Manual source URL workflow enhancements.
- RAG / embeddings / reranking / background jobs / streaming / full-text crawling.

## Existing implementation constraints
- DB migration is out of scope for this phase.
- Existing Evidence Graph / Claim / Source / Alert / Counterpoint / confidence / lineage / briefing behavior must not be broken.
- OpenAI provider schema large-scale changes are deferred to the next phase.

## Data model strategy
- No new DB table.
- Derive `SourceQualityAssessment` from existing source fields (URL, status, timestamps, sourceType) and claim support fields (supportingQuote, contradictionNote, isPrimarySource).
- Unavailable metadata is treated as `unknown` (freshness) or `unchecked` (reachability).
- Unknown/unchecked sources must never be presented as verified.

## UI requirements
- Display, per source:
  - Quality: Strong / Usable / Limited / Weak
  - Freshness: Fresh / Stale / Unknown
  - Reachability: Reachable / Unreachable / Invalid / Unchecked
  - Reasons and warnings
- Do not rely on color-only distinction.
- Keep changes incremental and composable; avoid full page refactor.

## Provider requirements
- Mock provider should include representative source patterns (primary-like, quote-backed, missing publishedAt, stale, invalid/unchecked).
- OpenAI provider changes limited to minimal wording/TODO-level guidance; no schema-breaking updates.

## Rule set v0.1

### Reachability
- URL parse failure => `invalid`
- `httpStatus` 200–299 => `reachable`
- `httpStatus` 300–599 => `unreachable`
- Missing `httpStatus` or missing `checkedAt` => `unchecked`

### Freshness
- Missing `publishedAt` => `unknown`
- Older than 540 days from `now` => `stale`
- Within 540 days from `now` => `fresh`

### Quality
- `strong`: primary-like + reachable + fresh + supporting quote
- `usable`: primary-like OR supporting quote
- `limited`: freshness unknown OR reachability unchecked
- `weak`: invalid/unreachable OR contradiction warning present

## Test requirements
- Unit test coverage for reachability, freshness, quality prioritization, warnings, and deterministic `now` injection.
- UI should expose stable test IDs for quality/freshness/reachability labels and reason/warning rows.

## Acceptance references
- `acceptance/source-quality-and-freshness.feature`
- `acceptance/unknown-map-and-source-lineage.feature`
- `acceptance/briefing-report.feature`

## Foundation role
Source Quality in v0.1 is a foundation for improving Evidence Map / Source Lineage / Unknown Map / Briefing Report precision in later phases.
