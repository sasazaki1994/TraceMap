# Source Detail Evidence Drilldown v0.1

## Purpose
Provide a deterministic source-centric drilldown so users can inspect how each source supports claims, where contradictions exist, and which unresolved gaps remain.

## User value
- Enables fast validation of “why this source matters” without re-reading full graph payloads.
- Makes weak/contradictory support explicit and actionable.
- Preserves traceability from source → claim → unknown map.

## Scope
- Build source drilldown view model from existing run evidence and source quality signals.
- Surface support kind, quote presence, contradiction notes, primary-source status, edge quality, and related unknowns.
- Keep logic rule-based and deterministic.

## Non-goals
- No DB migration.
- No new unknown/report persistence tables.
- No OpenAI provider schema overhaul.
- No RAG/embedding/reranking/background jobs/streaming/full-text crawling.

## Existing implementation constraints
- DBマイグレーションは今回行わない
- Source Quality は既存の source / claim support / fetch snapshot / cache snapshot / available metadata から派生表示する
- Unknown Map は alerts / claim confidence / source support / quote / primary source / source quality から派生表示する
- Briefing Report は画面側または feature helper で Markdown 生成する
- OpenAI provider の大規模 schema 変更は次フェーズ
- 取得できないメタデータは `unknown` として扱い、verified 扱いしない

## Input conditions
1. Run contains sources and claims with `supports` edges.
2. Source quality assessment exists (or is empty).
3. Unknown map entries may include related claim/source ids.
4. Missing fields are allowed and must degrade gracefully.

## Rule-based decision logic
1. **Supported claims collection**: filter claim supports by selected `sourceId`.
2. **Support kind**: use existing `RunClaimSupportKind` union (`direct`/`supplemental`/`indirect`) without widening.
3. **Edge quality**: consume `buildEvidenceEdgeQuality` output if present; fallback to `unknown`.
4. **Quote / contradiction**: render only when non-empty; omit otherwise.
5. **Primary source badge**: show only when `isPrimarySource === true`.
6. **Related unknowns**: include unknowns where `relatedSourceIds` contains selected source OR `relatedClaimIds` intersects supported claim ids.
7. **Unknown metadata**: never infer verified status from missing freshness/reachability; unknown remains unknown.

## Data model strategy
- View model only, no persistence.
- Use:
  - `RunEvidenceClaim` / `RunClaimSupportKind` from `src/types/run-evidence.ts`
  - `SourceQualitySignal` from `src/types/source-quality.ts`
  - `InvestigationUnknown` from `src/types/investigation.ts`
  - `EvidenceEdgeQuality` from `src/features/run/lib/build-evidence-edge-quality.ts`
- Validation boundary:
  - Runtime-safe filtering by ids.
  - Null/undefined quote/contradiction handled as absent.

## UI requirements
- Drilldown panel displays:
  - source title / url
  - source quality notes
  - supported claims list
  - support kind
  - supporting quote
  - contradiction note
  - primary source badge
  - related unknown items (severity/category/reason/action)
- Accessibility:
  - Text labels required (not color-only semantics).
  - Missing data shown as explicit fallback text or omitted safely.

## Provider requirements
- OpenAI provider remains backward compatible.
- No required schema additions; supporting quote/kind/primary-source quality is consumed if present.
- Validation boundaries remain unchanged in provider pipeline.

## Failure / edge-case behavior
- Source has no supports: return empty `supportedClaims` and show placeholder UI.
- Edge quality missing: show `unknown` quality for that support.
- Unknowns missing relations: related list becomes empty.
- Invalid URLs/metadata do not throw; drilldown still renders.

## Test requirements
- Unit tests should cover:
  1. support extraction per source id
  2. support kind type integrity (`RunClaimSupportKind`)
  3. contradiction + quote pass-through
  4. related unknown linking by source id
  5. related unknown linking by claim id intersection
  6. edge quality fallback to `unknown`
- Acceptance sync with `acceptance/source-detail-evidence-drilldown.feature` and unknown map scenarios.

## Acceptance references (traceability)
| Requirement | Acceptance scenario |
|---|---|
| Supported claim list shown per source | `source-detail-evidence-drilldown.feature` / "User opens a source detail view" |
| Support kind + quote rendering | `source-detail-evidence-drilldown.feature` / same scenario |
| Primary source status rendering | `source-detail-evidence-drilldown.feature` / same scenario |
| Contradiction note rendering | `source-detail-evidence-drilldown.feature` / same scenario |
| Related unknowns and dedup context | `unknown-map-categorization.feature` / dedup + relation scenarios |
