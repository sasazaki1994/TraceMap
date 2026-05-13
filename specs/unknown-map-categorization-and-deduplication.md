# Unknown Map Categorization & Deduplication v0.1

## Purpose
Upgrade Unknown Map from raw warning list into categorized, deduplicated investigation gaps.

## User value
Users can quickly identify unresolved evidence/source/freshness/contradiction gaps and next actions.

## Scope
- Categorize unknowns from alerts, claim confidence, source quality, and source drilldown.
- Add severity/reason/next action/signals.
- Merge duplicate unknowns before rendering.

## Non-goals
- DB migration or unknown table.
- Provider schema major rewrite.
- RAG/background/streaming/full-text expansion.

## Existing implementation constraints
- DBマイグレーションは今回行わない。
- Unknown Map は既存 alerts / claim confidence / source support / source quality / source drilldown から派生表示する。
- Unknown専用テーブルは今回追加しない。
- Source Quality の weak/limited/stale/unknown/unchecked/invalid/unreachable は Unknown 入力に使う。
- Source Detail の missing quote/weak support/contradiction note は Unknown 入力に使う。
- duplicate unknown は表示前に統合する。
- OpenAI provider 大規模 schema 変更は次フェーズ。

## Data model strategy
Use `InvestigationUnknown` extension with optional `signals` and reference ids.

## UI requirements
Unknown panel must show category/severity/text/reason/next action/related claim and source references/signals, and informative empty state.

## Provider requirements
No required provider changes for v0.1.

## Test requirements
Unit tests for categorization, severity ranking, dedup merge, and empty behavior.

## Acceptance references
- `acceptance/unknown-map-categorization-and-deduplication.feature`
