# Placeholder

## Purpose
Improve evidence accuracy UX with lightweight view-model driven enhancements.

## User value
Users can inspect quality, uncertainty, and export deterministic reports.

## Scope
Rule-based source quality, edge quality, unknown categorization, report template switching.

## Non-goals
No DB migration, no schema overhaul, no RAG/embedding/streaming jobs.

## Existing implementation constraints
- DBマイグレーションは今回行わない
- Source Quality は既存の source / claim support / fetch snapshot / cache snapshot / available metadata から派生表示する
- Unknown Map は alerts / claim confidence / source support / quote / primary source / source quality から派生表示する
- Briefing Report は画面側または feature helper で Markdown 生成する
- OpenAI provider の大規模 schema 変更は次フェーズ
- 取得できないメタデータは `unknown` として扱い、verified 扱いしない

## Data model strategy
Use TypeScript view models only.

## UI requirements
Add source quality badges/details, source drilldown, unknown category/severity/reason/action, report template select + copy/download markdown.

## Provider requirements
Keep OpenAI provider behavior and validation stable; only minimal wording/todo changes if needed.

## Test requirements
Add unit tests for rule-based helpers and report template coverage.

## Acceptance references
See corresponding acceptance/*.feature.
