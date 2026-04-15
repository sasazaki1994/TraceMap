# AGENTS.md

このファイルは Codex / Cursor 向けの入口です。  
詳細ルールは **`docs/ai/PROJECT_AGENT_GUIDE.md`** を参照してください。

## 最優先参照

- `docs/ai/PROJECT_AGENT_GUIDE.md`（共通ルールの正本）

## 最低限の運用要点

- spec 起点で開発し、必要に応じて `specs/` と `acceptance/` を更新する
- TypeScript の型安全を維持し、`any` の多用を避ける
- 過剰設計を避け、既存実装との整合性を優先する
- 完了時は、変更点・実行コマンド・未対応事項を報告する

矛盾時は `docs/ai/PROJECT_AGENT_GUIDE.md` を優先してください。
