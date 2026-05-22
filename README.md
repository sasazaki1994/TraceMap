# TraceMap

TraceMap は、生成AIの調査結果を **「主張（Claim）・情報源（Source）・根拠不足（Unknown）・出どころ（Lineage）」の関係**として可視化する、Cyber Intelligence Console 型の調査支援Webアプリです。  
汎用AIチャットの代替ではなく、**回答の根拠構造を追跡できること**を主目的にしています。

---

## 1. TraceMapとは

TraceMap は、調査テーマ（Research Topic）を入力すると Investigation Mission を実行し、結果を以下の成果物として提示します。

- **Evidence Map**: どの主張がどの情報源で支えられているか
- **Unknown Map**: 根拠不足・矛盾・追加調査が必要な点
- **Source Lineage**: 情報の一次性/二次性や伝播の関係
- **Briefing Report**: 再利用しやすい要約レポート

想定ユースケース:

- 企業分析
- 市場調査
- 技術調査
- 競合調査

> 重要: TraceMap は投資助言ツールではありません。買い推奨・売り推奨・目標株価の断定は行いません。

## 2. MVP v2でできること

- 調査テーマから Investigation Mission を開始
- Evidence Map で主張と情報源の対応を確認
- Unknown Map で未解決事項を可視化
- Source Lineage Lite で出どころを把握
- Briefing Report のプレビューを確認
- 実行結果を共有リンク（read-only）で参照

## 3. 技術スタック

- Next.js（App Router）
- TypeScript
- Prisma
- PostgreSQL
- Vitest
- Playwright
- pnpm
- Vercel（デプロイ前提）

## 4. ディレクトリ構成

```text
.
├─ acceptance/         # Gherkin/Cucumber風の受け入れ条件
├─ docs/               # 補助ドキュメント（運用/検証/アーキテクチャ）
├─ e2e/                # Playwright E2E
├─ prisma/             # schema / migration
├─ specs/              # 仕様（意図・背景・設計判断）
├─ src/
│  ├─ app/             # Next.js routes / server actions
│  ├─ components/      # 再利用UI
│  ├─ features/        # ユースケース単位機能
│  ├─ lib/             # 共通ユーティリティ
│  ├─ server/          # サーバーサイドロジック
│  └─ types/           # 型定義
├─ tests/              # unit/integration
└─ .github/workflows/  # CI
```

## 5. 前提環境

- Node.js 20+
- pnpm 10+
- Docker Desktop（または互換Docker Engine）

## 6. 初期セットアップ

1. 依存インストール

   ```bash
   pnpm install
   ```

2. 環境変数ファイル作成

   ```bash
   cp .env.example .env
   ```

3. PostgreSQL起動

   ```bash
   docker compose up -d
   ```

4. Prisma client生成

   ```bash
   pnpm db:generate
   ```

5. スキーマ反映

   ```bash
   pnpm db:push
   ```

6. Playwrightブラウザ導入

   ```bash
   pnpm exec playwright install
   ```

## 7. 開発サーバー起動

```bash
pnpm dev
```

- App: <http://localhost:3000>

## 8. ヘルスチェック

- <http://localhost:3000/api/health>

## 9. テストコマンド

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

## 10. DBコマンド

```bash
pnpm db:generate
pnpm db:push
pnpm db:migrate --name <name>
pnpm db:studio
```

Prisma schema の検証:

```bash
pnpm exec prisma validate
```

## 11. 仕様駆動開発の運用

TraceMap は **spec-first（Tsumikiベース）** で開発します。

- `specs/`: 仕様意図（なぜ/何を作るか）
- `acceptance/`: 観測可能な受け入れ条件（Gherkin/Cucumber風）
- 実装変更時は spec / acceptance / code / test の整合を保つ

## 12. AIエージェント運用

共通ルールの正本は `docs/ai/PROJECT_AGENT_GUIDE.md` です。

- Codex / Cursor: `AGENTS.md` から共通ガイドへ誘導
- Claude Code: `CLAUDE.md` から共通ガイドへ誘導
- Cursor Rule: `.cursor/rules/project.mdc` は薄いラッパー

運用ルールを更新する場合は、まず共通ガイドを更新し、入口ファイルは最小差分に保ってください。

## 13. CI

GitHub Actions（`.github/workflows/ci.yml`）は `pull_request` と `main` への `push` で実行されます。

- PostgreSQL 16 サービスを使用
- 静的検証: lint / typecheck / unit test / build / prisma validate
- DB検証: migrate deploy / migrate status / fresh DB migration verify
- E2E検証: Playwright Chromium + `pnpm test:e2e`

CI既定値:

- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tracemap?schema=public`
- `ANSWER_GRAPH_PROVIDER=mock`
- `NODE_ENV=test`

## 14. 現在のMVPベースライン

- 主要ルート: `/`、`/runs/[id]`、`/share/[token]`（read-only）
- Health API: `/api/health`
- Evidence系テーブル（claims / claim_source_snapshots / counterpoints / alerts）
- Source Cache / Fetch Snapshot / Run Cache による再利用基盤（MVP v2）
- Unknown/Report専用テーブルは追加せず、既存スナップショットから派生ビューとして表示

## 15. Source discovery provider

任意機能（環境変数で切替）:

- `TRACEMAP_SOURCE_DISCOVERY_PROVIDER=disabled`（既定）
- `mock`（固定候補）
- `brave`（Brave Search API、`TRACEMAP_BRAVE_SEARCH_API_KEY` 必須）

関連env:

- `TRACEMAP_BRAVE_SEARCH_ENDPOINT`
- `TRACEMAP_SOURCE_DISCOVERY_TIMEOUT_MS`

`brave` 選択時にAPIキー不足でもアプリはクラッシュせず、`ignoredUrls` に理由を残して続行します。

## 16. OpenAI answer graph provider

既定は `mock` provider です。OpenAIを使う場合:

1. `TRACEMAP_ANSWER_GRAPH_PROVIDER=openai`
2. `TRACEMAP_OPENAI_API_KEY`（または `OPENAI_API_KEY`）
3. 任意で `TRACEMAP_OPENAI_MODEL` / `TRACEMAP_OPENAI_TIMEOUT_MS`

OpenAI経路の要点:

- 構造検証を満たした場合のみ `completed`
- 必要な根拠が不足した場合は `failed`
- URL検証は best-effort（到達不能URLだけでは run を失敗させない）

## 17. Public Beta前の検証手順

1. 必須env設定
2. 静的検証
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm test`
   - `pnpm build`
   - `DATABASE_URL=... pnpm exec prisma validate`
3. ブラウザ検証
   - `pnpm exec playwright install --with-deps chromium`
   - `pnpm test:e2e`
4. OpenAI smoke test（3トピック）
5. GO/NO-GO ドキュメント更新
6. Public Beta / non-advice / source verification の文言確認

## 18. 投資助言ではないことの注意

TraceMap は調査支援ツールです。投資・法務・医療その他の専門助言を提供しません。  
出力は公開情報の整理結果であり、重要判断には一次情報の再確認が必要です。

## 19. 関連ドキュメント

- `docs/ai/PROJECT_AGENT_GUIDE.md`（AI運用ルールの正本）
- `docs/beta-validation.md`（ローカル検証手順と結果テンプレ）
- `docs/local-verification.md`（ローカル確認メモ）
- `docs/public-beta-launch-checklist.md`（β公開前チェック）
- `docs/public-beta-final-validation-template.md`（最終判定テンプレ）
- `docs/public-beta-operations.md`（運用フロー）
- `docs/openai-smoke-test-plan.md`（OpenAIスモークテスト計画）
- `docs/architecture.md`
- `docs/adr/openai-answer-graph-provider.md`
