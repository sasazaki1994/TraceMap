# PROJECT_AGENT_GUIDE

このファイルは、TraceMap における AI エージェント運用ルールの **唯一の共通ソース（Single Source of Truth）** です。  
Codex / Cursor / Claude Code など、利用するツールが変わっても本ガイドを正として実装判断を行います。

## 1. プロダクト概要

TraceMap は、ユーザーの調査テーマを AI が **Investigation Mission** として実行し、回答・主張・情報源・不明点・出どころを **Evidence Map / Unknown Map / Source Lineage / Briefing Report** として可視化・保存・共有する、Cyber Intelligence Console 型の調査支援 Web アプリです。

TraceMap は汎用 AI チャットではありません。調査テーマを入力し、根拠・不明点・情報源の来歴を追跡できる調査成果物として提示することを優先します。初期の重点領域は、企業分析、競合調査、市場調査です。

TraceMap は投資助言、買い推奨、売り推奨を行いません。企業・市場に関する調査結果を扱う場合も、Evidence Map / Unknown Map / Source Lineage / Briefing Report を通じて根拠と未確認点を示すことに留めます。

MVP v2 では、既存の Evidence Graph / Claim / Source / Alert / Counterpoint / Propagation Chain を維持しつつ、ユーザー向け概念を「質問への回答」から「調査テーマに対するミッション結果」へ寄せます。既存 DB の `AnalysisRun.question` や provider 名は直ちに rename せず、spec・acceptance・UI 表示を先に新方針へ同期します。

MVP v2 の安定化では、Unknown / Report 用の新規テーブルや Prisma migration は追加しません。Unknown Map / Source Lineage / Briefing Report は既存の run snapshot・claim・source・alert・confidence から派生する view model とし、OpenAI provider の大規模な Investigation Result schema 変更は次フェーズで扱います。

## 2. 技術スタック

- Next.js (App Router)
- TypeScript
- Prisma
- PostgreSQL
- Vitest
- Playwright
- Vercel（デプロイ基盤）

## 3. 開発方針

- 開発は **spec 起点**（SDD: Tsumiki フレームワーク）で進める
- acceptance spec は **Gherkin / Cucumber 風**で記述する
- 過剰設計を避け、MVP の価値に直結する実装を優先する
- 破壊的変更は避け、既存仕様との整合性を保つ
- 共通ルールは本ファイルに集約し、重複を最小化する

## 4. ディレクトリ構成の役割

- `specs/`: 機能仕様・設計意図（実装前提となる spec）
- `acceptance/`: 受け入れ条件（Gherkin 形式）
- `src/app/`: Next.js のルーティング・ページ・サーバーアクション
- `src/features/`: ユースケース単位の機能実装
- `src/components/`: 再利用 UI コンポーネント
- `src/server/`: サーバーサイドロジック（DB・ドメイン処理）
- `src/lib/`: 共有ユーティリティ
- `src/types/`: 型定義
- `tests/`: ユニット / 統合テスト
- `e2e/`: E2E テスト
- `prisma/`: Prisma schema / migration
- `docs/`: 補助ドキュメント

## 5. 実装ルール

- 既存ファイルがある場合は必ず内容を確認し、既存の意図・命名・設計を尊重する
- TypeScript の型安全を維持し、`any` の多用を禁止する（やむを得ない場合は理由を明記）
- 変更は小さく保ち、責務境界（app / features / server / lib）を崩さない
- 新規ルールを追加する場合は、まず本ファイルを更新してから各入口ファイルへ反映する
- ツール固有ファイル（`AGENTS.md` / `CLAUDE.md` / `.cursor/rules/project.mdc`）には詳細ルールを重複記載しない

## 6. テスト方針

- 変更内容に応じて、影響範囲の近いテストから優先して確認する
- 基本コマンド
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm test:e2e`（UI/導線に影響がある場合）
- 新規機能は、少なくとも spec / acceptance / 実装 / テストの整合性を満たす

## 7. spec / acceptance spec 更新ルール

- 振る舞い変更を伴う実装では、実装と同じ PR で `specs/` と `acceptance/` を更新する
- `specs/` には「なぜ・何を作るか」を記述し、`acceptance/` には検証可能なシナリオを記述する
- 実装が spec から逸脱する場合は、コードではなく先に spec を更新して合意を取る

## 8. 完了報告フォーマット

作業完了時は以下を必ず報告する。

1. 変更点サマリ（機能・修正の要点）
2. 追加/更新ファイル一覧
3. 実行コマンド一覧（実行していない場合は「未実行」と理由）
4. 未対応事項・既知課題（なければ「なし」）

---

運用上の最終判断基準は本ファイルとし、各ツールの入口ファイルはこのガイドへ誘導するラッパーとして扱います。
