# Source Quality and Freshness Inspector v0.1

## Purpose
Surface source quality/freshness caveats in Run UI from existing snapshot/cache metadata.

## User value
Users can quickly identify reachable, stale, unknown, and weakly supported sources before reusing findings.

## Scope
- Derived `SourceQualitySignal` view model (no DB persistence).
- Source Lineage + Source Detail UI indicators.
- Unknown Map caveats from source quality.
- Briefing/Company reports include source quality summary/limits.

## Non-goals
- No DB migration.
- No definitive truth score.
- No investment/legal judgment score.

## Existing implementation constraints
Use existing `SourceSnapshot`, `SourceCacheEntry`, `SourceFetchSnapshot`, claim support metadata only.

## Data model strategy
`SourceQualitySignal` is computed at render time from existing `sources + evidenceClaims`.

## Source quality dimensions
- Quality level: strong / usable / limited / weak
- Reachability: reachable / unreachable / invalid / unchecked
- Freshness: fresh / stale / unknown
- Primary-source flag, linked claim count, quote presence

## Freshness rules
MVP rule: <=180 days fresh, >180 stale, no date unknown. Future domain-specific rules allowed.

## Reachability rules
- verified or HTTP 2xx/3xx => reachable
- unreachable => unreachable
- invalid => invalid
- else unchecked

## UI requirements
- Source Lineage shows quality/reachability/freshness/claims/date/http/content/final URL.
- Source Detail shows selected source quality + reasons + next actions.
- Never show non-verified source as verified.

## Unknown Map integration
`stale` / `unknown freshness` / `unreachable` / `invalid` / missing quote caveats can be emitted as Unknowns.
Limit per source to avoid noise.

## Report integration
- Briefing: add `## Source Quality Summary`
- Company report: add `## Evidence Quality / Limits`

## Test requirements
Unit tests for quality derivation, quality unknown mapping, and report integration.

## Acceptance references
- `acceptance/source-quality-and-freshness.feature`
- `acceptance/unknown-map-and-source-lineage.feature`
- `acceptance/briefing-report.feature`
