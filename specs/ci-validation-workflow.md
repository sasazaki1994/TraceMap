# CI Validation Workflow

## Why

ローカル手動で確認できた検証手順（install / lint / typecheck / test / build / prisma validate）を、main 向けの push / pull_request ごとに再現するため。

## What

GitHub Actions の CI で以下を保証する。

1. install-and-static-checks
   - `corepack enable`
   - `pnpm install --frozen-lockfile`
   - `pnpm exec prisma generate`
   - `pnpm exec prisma validate`
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm test`
   - `pnpm build`
2. database-checks（PostgreSQL service 付き）
   - `pnpm exec prisma migrate deploy`
   - `pnpm exec prisma migrate status`
   - 可能な範囲で fresh DB (`tracemap_verify`) への migration 再検証
3. e2e（PostgreSQL service + Playwright Chromium）
   - `pnpm exec playwright install --with-deps chromium`
   - `pnpm test:e2e`

## Non-goals

- アプリ機能の追加・変更
- Prisma schema / migration の新規追加
- OpenAI provider 実装の変更

## Constraints

- Node.js は `package.json` の engines（20+）準拠
- pnpm は `packageManager`（10系）準拠
- CI では `ANSWER_GRAPH_PROVIDER=mock` を使い、OpenAI API key なしで検証可能にする
- `DATABASE_URL` を CI ジョブに明示する
