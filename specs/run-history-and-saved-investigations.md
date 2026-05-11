# Run History and Saved Investigations UI v0.1

## Purpose
`/runs` に保存済み Investigation Mission を一覧表示し、過去の調査結果へ再訪する導線を提供する。

## User value
- 単発回答ではなく、調査成果を再利用できる archive 体験を作る。
- Run の状態・更新時刻・証拠量を俯瞰し、再確認対象を素早く選べる。

## Scope
- `/runs` 一覧ページ追加（新しい順、最大50件）。
- 表示項目: topic, status, created/updated, latest answer title, source/claim/alert/share link count, open detail link。
- status filter (`all`,`queued`,`processing`,`completed`,`failed`)。
- topic 検索（`q` query param, trim + max 100）。
- 空状態表示。
- failed run の `lastErrorMessage` 表示。
- Top (`/`) から `/runs` への導線。
- Run detail (`/runs/[id]`) から `/runs` への戻り導線。

## Non-goals
認証、owner scope、削除・編集、高度なページネーション、Share Link管理UI、DB変更、migration追加。

## Existing implementation constraints
- `AnalysisRun.question` は rename しない。
- 一覧は既存DBの派生表示のみ。
- `/runs/[id]` 既存詳細挙動を壊さない。
- Share Link は件数表示のみ（管理UI対象外）。

## Data model strategy
- `AnalysisRun` + latest `AnswerSnapshot(createdAt desc take:1)` を利用。
- count は `sourceSnapshots` / `claims` / `alerts` / `shareLinks` の既存 relation count を使う。
- Prisma query: `orderBy createdAt desc`, `take:50`。

## UI requirements
- heading: `Saved Investigations`
- subcopy: `Review previous investigation missions, inspect their evidence maps, and reuse briefing reports.`
- card label: `MISSION ARCHIVE`
- detail button: `Open Investigation`
- empty: `No saved investigations yet. Start a new investigation to build your evidence archive.`
- required test ids:
  - `run-history-page`
  - `run-history-heading`
  - `run-history-search`
  - `run-history-status-filter`
  - `run-history-list`
  - `run-history-item`
  - `run-history-item-topic`
  - `run-history-item-status`
  - `run-history-item-open`
  - `run-history-empty`
  - `start-new-investigation-link`
  - `run-history-error-message`

## Filtering/search requirements
- `status` が不正値なら `all` 扱い。
- `q` は trim 後に空文字なら検索なし。
- `q` は最大100文字まで。
- `AnalysisRun.question` に `contains` 部分一致。

## Test requirements
- unit: status parser, query normalizer。
- e2e: `/runs` 表示、empty/list state、top導線、run作成後一覧表示、Open Investigation遷移、filter/search UI表示。

## Acceptance references
- `acceptance/run-history-and-saved-investigations.feature`
