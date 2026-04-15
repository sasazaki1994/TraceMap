# PROJECT_AGENT_GUIDE

このファイルは、TraceMap における AI エージェント運用ルールの **唯一の共通ソース（Single Source of Truth）** です。  
Codex / Cursor / Claude Code など、利用するツールが変わっても本ガイドを正として実装判断を行います。

## 1. プロダクト概要

TraceMap は、生成 AI の回答を「文章」ではなく「情報源ネットワーク」として可視化・探索する Web アプリです。  
ユーザーは回答と根拠のつながりを辿り、検証しやすい形で理解できます。

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
