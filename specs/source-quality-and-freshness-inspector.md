# Source Quality & Freshness Inspector v0.1

## Purpose
Source / Evidence の根拠品質を軽量に可視化し、TraceMap 利用者が「どの根拠を再確認すべきか」を判定しやすくする。

## User value
- 支持ソースごとに Quality / Freshness / Reachability を同一視点で確認できる。
- Weak / Stale / Unreachable / Unknown を Unknown Map に接続し、次アクションを即時に把握できる。
- Briefing Report に品質サマリーを含め、再利用時の注意点を明示できる。

## Scope
- Run の既存 `sources` / `evidenceClaims.supports` から SourceQualityInspection を派生生成する。
- Source Detail 相当の Source Quality Panel にバッジ・理由・推奨アクションを表示する。
- Source Lineage Lite / Unknown Map / Briefing Report に軽量反映する。
- DB migration なし・OpenAI provider schema 大改修なしで成立させる。

## Non-goals
- RAG / embeddings / reranking / crawler 拡張。
- 非同期ジョブ・streaming 化。
- 品質スコアを投資助言・法的判断・真偽確定として扱うこと。

## Existing implementation constraints
- Prisma schema は変更しない。
- 既存 evidence graph / unknown / lineage / report の導線を壊さない。
- OpenAI 3段パイプラインに破壊的変更を入れない。

## Data model strategy
- `SourceQualityInspection` を view model として追加。
- 入力は `RunSourceView[]` と `RunEvidenceClaim[]` を使用し、`any` は使わない。
- 利用可能フィールド (`sourceType`, `publishedAt`, `checkedAt`, `verificationStatus`, `httpStatus`, `finalUrl`, `contentType`, `isPrimarySource`, `supportingQuote`, `contradictionNote`) から導出。
- 不足データは `unknown` / `unchecked` 扱いにする。

## UI requirements
- Source Quality Panel で各 source の以下を表示:
  - Quality badge
  - Freshness badge
  - Reachability badge
  - Source type / Published date / Checked date / Primary indicator
  - Reason(s)
  - Suggested action (必要時)
- test id:
  - `source-quality-panel`
  - `source-quality-item`
  - `source-quality-badge`
  - `source-freshness-badge`
  - `source-reachability-badge`

## Quality classification rules
- `strong`: primary または official/gov/company/academic 系 type、publishedAt あり、quote/support あり。
- `usable`: sourceType と publishedAt があり、重大警告なし。
- `limited`: publishedAt 欠落、sourceType unknown、quote 欠落など情報不足。
- `weak`: invalid/unreachable、contradiction、根拠属性不足が重なるケース。

## Freshness classification rules
- 定数閾値:
  - `POSSIBLY_STALE_DAYS = 365`
  - `STALE_DAYS = 730`
- `fresh`: 比較的新しい、または official/reference 系。
- `possibly_stale`: 古めだが stale 閾値未満。
- `stale`: stale 閾値以上。
- `unknown`: publishedAt なし。

## Reachability classification rules
- `reachable`: httpStatus 200-399 もしくは verified。
- `unreachable`: httpStatus >= 400 もしくは unreachable。
- `invalid`: invalid URL もしくは invalid ステータス。
- `unchecked`: httpStatus / checkedAt が不足。

## Test requirements
- primary + publishedAt + quote が strong/usable 判定になる。
- publishedAt なしで freshness unknown。
- httpStatus >= 400 で unreachable。
- invalid URL で invalid。
- stale/weak source 由来 unknown が生成される。
- briefing report に Source Quality Summary / Notes が出力される。

## Acceptance references
- `acceptance/source-quality-and-freshness-inspector.feature`
- `acceptance/unknown-map-and-source-lineage.feature`
- `acceptance/briefing-report.feature`
