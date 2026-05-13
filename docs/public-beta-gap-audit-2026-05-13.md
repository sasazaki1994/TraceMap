# Public Beta Gap Audit (2026-05-13)

## 1. 現在満たしている項目
- Landing で Research topic 入力と調査開始導線がある（`Research topic`, `Start an Investigation`）。
- Landing / Login に Public Beta 文言がある。
- サインイン必須が UI とアクションで揃っている（未ログイン時ボタン無効・サインイン誘導、`/runs` はログイン必須）。
- mock provider 前提の導線が明示され、mock run 作成 E2E/テストが存在する。
- Run detail に required panel 群（Mission Header / Timeline / Evidence Map / Unknown Map Lite / Source Lineage Lite / Source Quality/Freshness Lite / Briefing Report / markdown copy/download / Share Link）が実装されている。
- Share page は read-only 前提で noindex/nofollow 設定済み。
- Run History / Saved Investigations が実装され、検索・status filter・リンク UI あり。
- Empty / Loading / Error の最低限状態が実装されている（Run 失敗/処理中バナー、Evidence map empty ヘルパー文、History empty state など）。
- Briefing report に Beta Notice と非助言文言が入っている。
- lint / typecheck / test / build は通過。

## 2. 不足している項目
- `pnpm exec prisma validate` が `DATABASE_URL` 未設定で未達。
- Public Beta readiness 専用の統合チェック（acceptance `public-beta-readiness.feature` を直接トレースする e2e spec）が弱く、既存 e2e に分散。
- Share page の「read-only」明示文言はコンポーネント依存で、仕様に対する直接 assertion が不足。

## 3. 公開β前に必須で直す項目
1. CI/ローカル検証で `DATABASE_URL` を与えた `prisma validate` 実行手順を確立。
2. `public-beta-readiness.feature` を 1 ファイルで横断検証する e2e を追加（最低: landing→run→share→history）。
3. Share page の read-only 表示文言に対する e2e assertion を追加。

## 4. 公開β後でよい項目
- Public Beta readiness のサブシナリオをより細かく分割（unknown/lineage/quality/export/share/history）。
- Empty/Loading/Error 文言の UX 文体統一と国際化。
- Source quality / freshness の説明 tooltip 強化。

## 5. 影響ファイル一覧
- Spec/Acceptance:
  - `specs/public-beta-readiness.md`
  - `acceptance/public-beta-readiness.feature`
- UI/Route:
  - `src/app/page.tsx`
  - `src/features/landing/components/question-intake.tsx`
  - `src/app/runs/[id]/page.tsx`
  - `src/features/run/components/run-result-view.tsx`
  - `src/features/run/components/mission-header.tsx`
  - `src/features/run/components/investigation-timeline.tsx`
  - `src/features/run/components/unknown-map-panel.tsx`
  - `src/features/run/components/source-lineage-panel.tsx`
  - `src/features/run/components/source-quality-panel.tsx`
  - `src/features/run/components/briefing-report-panel.tsx`
  - `src/features/run/components/run-share-controls.tsx`
  - `src/app/share/[token]/page.tsx`
  - `src/app/runs/page.tsx`
- Data model:
  - `prisma/schema.prisma`
- Test:
  - `e2e/investigation-mode.spec.ts`
  - `e2e/question-to-answer-graph.spec.ts`
  - `e2e/run-history.spec.ts`
  - `tests/build-briefing-report.test.ts`

## 6. 推奨PR分割
- PR1 (必須): Validation hardening
  - CI/README に `DATABASE_URL` 付き `prisma validate` 手順とチェック追加。
- PR2 (必須): Public Beta E2E consolidation
  - `public-beta-readiness` 横断シナリオの e2e 追加。
- PR3 (任意): UX copy hardening
  - read-only 明示文言 / empty/loading/error 文言統一。

## 7. 実行した検証コマンドと結果
- `pnpm lint` ✅
- `pnpm typecheck` ✅
- `pnpm test` ✅
- `pnpm build` ✅
- `pnpm exec prisma validate` ❌ (`DATABASE_URL` 未設定)

## 8. 次に流すべき実装プロンプト
「`acceptance/public-beta-readiness.feature` を満たす専用 E2E を追加してください。対象は landing→sign-in required behavior→mock run completion→run detail required panels→markdown copy/download buttons→share link read-only/noindex assertion→saved investigations list です。既存実装の大規模変更は禁止。最小変更で Playwright spec を追加し、必要なら軽微な data-testid 補強のみ許可します。完了後に lint/typecheck/test:test:e2e/build/prisma validate（DB URL あり）を実行し結果を報告してください。」
