# Source Intake / Fetch Pipeline v0.1

## Purpose
Investigation Mode の入力テキストに含まれる URL を provider 呼び出し前に intake し、URL 正規化・安全性検証・キャッシュ再利用・必要時 fetch を行ったうえで compact な source candidates を生成する。

## User value
- ユーザーが research topic に貼った URL を根拠候補として優先活用できる。
- 同じ URL の再調査時に cache を再利用して待ち時間とコストを抑制できる。
- unsafe URL をブロックし SSRF リスクを低減できる。

## Scope
- research topic から http/https URL 抽出
- URL 正規化（tracking params 除去、hash 除去、host/protocol 小文字化、決定的順序維持）
- unsafe URL の除外
- SourceCacheEntry / SourceFetchSnapshot / SourceSnapshot を用いた fetch 結果の再利用
- provider input (`GenerateAnswerGraphInput`) への `sourceCandidates?: SourceCandidate[]` 追加
- mock / openai provider への compact source context 連携


## URL normalization rules
- scheme と host は lowercase 化する。
- hash fragment (`#...`) は常に削除する。
- tracking params は key/value ごと削除する（大文字小文字は区別しない）。
- canonical tracking keys: `gclid`, `fbclid`, `_ga`, `_gid`, `_gat`, `mc_cid`, `mc_eid`, `_openstat`。
- pattern rule: `^utm_` に一致する query key を削除する。
- 重複 key は非 tracking のみ保持し、元の出現順序を維持する（並び替えしない）。

## Non-goals
- 外部検索 API 追加
- 本格 RAG / embedding / reranker
- background job 化
- Prisma schema 変更や migration 追加
- raw full HTML is not passed to provider / LLM（生 HTML 全文は渡さない）

## Existing implementation constraints
- `AnalysisRun.question` と form field `question` は変更しない。
- provider schema の破壊的変更はしない。
- sourceCandidates が空でも既存 run 完了フローを維持する。

## Data model strategy
既存 model のみ利用する。
- `SourceCacheEntry`: URL 単位の最新状態キャッシュ（lookup key は `normalizedUrl`）。
- `SourceFetchSnapshot`: fetch 実行ごとの履歴（httpStatus/contentType/excerpt/hash/error など）。
- `SourceSnapshot`: provider が生成した source ノードの run 時点スナップショット。
- fetch 実行時は `SourceFetchSnapshot` を追加記録し、`SourceCacheEntry.latest*` を更新する。
- provider 出力 persist 側では verification metadata を `SourceSnapshot` に保持する。

## Source cache strategy
- fresh 判定は既定 7 日。
- `TRACEMAP_SOURCE_CACHE_TTL_DAYS` が設定されていれば上書き（整数のみ、0〜3650）。
- fresh cache があり fetch 成功履歴なら network fetch をスキップ。
- fetch 成功履歴は `httpStatus` が 200〜299 かつ本文長 > 0 を満たす場合のみ。
- stale / missing のみ fetch 実行。
- 404 は「存在しない」結果として TTL 内は再 fetch しない。
- 5xx / timeout / network error は失敗履歴として扱い、通常 TTL より短い再試行間隔（実装既定 1 時間）で再試行対象とする。

## Provider integration
- `createAnalysisRunFromProvider` で provider 呼び出し直前に source intake を挿入する。
- mock provider は sourceCandidates があれば先頭 1〜3 件を `sources` に反映。
- openai provider は prompt に compact source context (label/url/content_type/excerpt) を追加。
- openai 追記制約: `max_sources=5`、各 excerpt は 400 文字上限、超過時は末尾 `...[TRUNCATED]`。
- 複数候補は intake 順（正規化後重複排除済み）で優先し、上限超過時は末尾から除外する。

## Error handling
- URL 解析失敗や fetch 失敗は候補単位で吸収し run 全体は継続。
- fetch error は `fetchErrorMessage` と snapshot に保存。
- provider 側の通常失敗条件（sufficient_grounding 等）は従来どおり。

## Security constraints
fetch 対象は public http/https のみ。以下は block:
- localhost / private IPv4 / loopback / link-local / metadata IP
- loopback IPv6 / private・link-local IPv6
- file, ftp, data, javascript scheme
- redirect は最大 5 回まで追従可能。
- redirect 先 URL にも同一 block rule を毎回適用し、違反時は追従を中止する。
- DNS rebinding 対策として、redirect ごとに再解決した IP を再検査する方針を維持する。

## Test requirements
- URL extraction / normalization / safety validation の unit test
- fetch-source の unit test（success/failure, script/style 除去）
- cache hit / cache miss の unit/integration test（`SourceCacheEntry` / `SourceFetchSnapshot`）
- TTL expiry による stale 再 fetch テスト（`TRACEMAP_SOURCE_CACHE_TTL_DAYS` 反映）
- provider integration test（sourceCandidates 有無）
- openai prompt へ source context 追加確認

## Acceptance references
- `acceptance/source-intake-and-fetching.feature`
- 既存: `acceptance/real-investigation-pipeline.feature`


## TTL configuration validation
- `DEFAULT_TRACEMAP_SOURCE_CACHE_TTL_DAYS = 7`。
- `TRACEMAP_SOURCE_CACHE_TTL_DAYS` は整数のみ受理し、範囲は 0〜3650。
- 0 はキャッシュ無効（毎回 fetch）。
- 非数値・小数・負数・上限超過は default にフォールバックし warning log を出す。
- この検証は環境変数パース／設定初期化時に実施する。
