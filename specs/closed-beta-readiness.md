# Closed Beta Readiness v0.1

## Purpose
Closed Beta 前に、TraceMap を「AI回答」ではなく「根拠を追跡する調査コンソール」として第三者が理解できる状態へ整える。

## User value
- 調査テーマから Investigation を開始できる。
- Evidence Map / Unknown Map / Source Lineage / Briefing Report の接続を理解できる。
- 生成結果を Markdown として再利用できる。

## Scope
- Landing Page 文言を Investigation / Research topic 中心へ調整（`question` フィールド名は維持）。
- Run Page で Mission Header, Evidence Map, Unknown Map, Source Lineage, Briefing Report を一貫表示。
- Briefing Report Markdown の preview / copy / download を提供。
- Source Detail で関連 claim / supporting quote / support kind を確認可能にする。
- Unknown Map で category / severity 正規化 / 重複抑制 / suggested next action を表示。
- loading / empty / error state の β 最低品質を確保。

## Non-goals
- RAG 実装はしない
- background jobs はしない
- streaming はしない
- full-text crawling はしない
- billing / subscription はしない
- authentication / organization workspace はしない
- DB大改修はしない
- OpenAI provider schema の大改修はしない
- PDF / PowerPoint / Notion export はしない
- 投資助言、買い推奨、売り推奨に見える文言は入れない

## Existing implementation constraints
- `AnalysisRun.question` は rename しない。
- 既存フォームの `name="question"` を維持する。
- Unknown/Report 用の新規テーブル追加はしない（view model で派生）。
- OpenAI provider の既存 3 段パイプライン挙動は維持する。

## UI requirements
- Landing: 「Start Investigation」「Research topic」「Trace evidence」文脈を明確化。
- Run: `mission-header`, `evidence-map`, `unknown-map-panel`, `source-lineage-panel`, `briefing-report-panel` を表示。
- Briefing Report: `briefing-report-markdown`, `copy-briefing-report`, `download-briefing-report` を提供。
- Source Detail: `source-detail-panel`, `source-related-claim`, `source-supporting-quote` を表示。
- Unknown: `unknown-category`, `unknown-severity` を各アイテムで表示。

## Data requirements
- Unknown category: `evidence | freshness | source | contradiction | lineage | report`
- severity 正規化: `error->high`, `warning->medium`, `info->low`
- report 末尾に generatedAt / run reference を含める。
- download filename は安全な ASCII ベースに sanitize する。

## Test requirements
- unit: `build-unknowns`, `build-source-lineage`, `build-briefing-report`, `safe-markdown-file-name`
- behavior: 重複 unknown 抑制、source-claim 関連づけ、markdown 構成、filename 安全化
- project checks: lint / typecheck / test / build

## Acceptance references
- `acceptance/closed-beta-readiness.feature`
- 既存の `acceptance/public-beta-readiness.feature` と整合させる
