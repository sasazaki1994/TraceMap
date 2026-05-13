# Source Detail Evidence Drilldown v0.1

## Purpose
Show how each source supports claims, with quote/support/contradiction context, to improve evidence verifiability.

## User value
Users can inspect source → claim support mapping directly in Source Detail before reusing findings.

## Scope
- Source drilldown view model and builder from existing run data.
- Source detail UI showing support kind, quote, contradiction note, primary-like status, quality, lineage, related unknowns.

## Non-goals
- DB migration or source-detail table.
- Evidence graph/layout overhaul.
- OpenAI schema major rewrite.

## Existing implementation constraints
- DBマイグレーションは今回行わない。
- Source Detail は既存 source/claim/support/source quality/unknowns から派生表示する。
- supporting quote がない場合は quote missing として扱う。
- contradiction note は通常 support と区別表示する。
- unchecked source を verified と表示しない。
- OpenAI provider 大規模 schema 変更は次フェーズ。

## Data model strategy
Use feature-level view models only; no persistence changes.

## UI requirements
Render title/URL, primary badge, quality summary, lineage summary, supported claims, quote, contradiction note, related unknowns, and empty state.

## Provider requirements
No required provider schema changes in this phase.

## Test requirements
Unit tests for support-kind normalization, source-quality/lineage/unknown linkage, missing quote warnings, and empty-state safety.

## Acceptance references
- `acceptance/source-detail-evidence-drilldown.feature`
