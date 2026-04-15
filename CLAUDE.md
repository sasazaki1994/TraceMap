# CLAUDE.md

Claude Code で作業する際の入口ドキュメントです。  
プロジェクト共通ルールは **`docs/ai/PROJECT_AGENT_GUIDE.md`** を正本として扱います。

## Read First

1. `docs/ai/PROJECT_AGENT_GUIDE.md`
2. 対象機能に対応する `specs/` と `acceptance/`

## Working Rules (Summary)

- Spec-Driven Development（Tsumiki）で進める
- 振る舞い変更時は `specs/` / `acceptance/` / 実装を同期する
- TypeScript の型安全を守り、`any` の多用をしない
- 既存構造（`src/app`, `src/features`, `src/server`, `src/lib`）の責務を維持する
- 過剰設計を避け、小さく検証可能な変更を優先する

## Completion Report

作業完了時は次を簡潔に報告する:

- 変更点
- 追加/更新ファイル
- 実行コマンド（未実行なら理由）
- 未対応事項

不明点や矛盾がある場合は、`docs/ai/PROJECT_AGENT_GUIDE.md` に合わせて判断してください。
