# Source Intake / Fetch Pipeline v0.1

## Purpose
Investigation Mode の入力テキストに含まれる URL を provider 呼び出し前に intake し、URL 正規化・安全性検証・キャッシュ再利用・必要時 fetch を行ったうえで compact な source candidates を生成する。

## User value
- ユーザーが research topic に貼った URL を根拠候補として優先活用できる。
- 同じ URL の再調査時に cache を再利用して待ち時間とコストを抑制できる。
- unsafe URL をブロックし SSRF リスクを低減できる。

## Scope
- research topic から http/https URL 抽出
- URL 正規化（tracking params 除去、hash 除去、host/protocol 小文字化）
- unsafe URL の除外
- SourceCacheEntry / SourceFetchSnapshot を用いた fetch 結果の再利用
- provider input (`GenerateAnswerGraphInput`) への `sourceCandidates?: SourceCandidate[]` 追加
- mock / openai provider への compact source context 連携

## Non-goals
- 外部検索 API 追加
- 本格 RAG / embedding / reranker
- background job 化
- Prisma schema 変更や migration 追加
- 生 HTML 全文の LLM 入力

## Existing implementation constraints
- `AnalysisRun.question` と form field `question` は変更しない。
- provider schema の破壊的変更はしない。
- sourceCandidates が空でも既存 run 完了フローを維持する。

## Data model strategy
既存 model のみ利用する。
- `SourceCacheEntry.normalizedUrl` を lookup key とする。
- fetch 実行時 `SourceFetchSnapshot` を追加記録する。
- cache entry の `latest*` 列を更新する。
- provider 出力 persist 側では既存 verification metadata を SourceSnapshot へ保持する。

## Source cache strategy
- fresh 判定は既定 7 日。
- `TRACEMAP_SOURCE_CACHE_TTL_DAYS` が設定されていれば上書き。
- fresh cache があり fetch 成功履歴なら network fetch をスキップ。
- stale / missing のみ fetch 実行。

## Provider integration
- `createAnalysisRunFromProvider` で provider 呼び出し直前に source intake を挿入する。
- mock provider は sourceCandidates があれば先頭 1〜3 件を `sources` に反映。
- openai provider は prompt に compact source context (label/url/content_type/excerpt) を追加。

## Error handling
- URL 解析失敗や fetch 失敗は候補単位で吸収し run 全体は継続。
- fetch error は `fetchErrorMessage` と snapshot に保存。
- provider 側の通常失敗条件（sufficient_grounding 等）は従来どおり。

## Security constraints
fetch 対象は public http/https のみ。以下は block:
- localhost / private IPv4 / loopback / link-local / metadata IP
- loopback IPv6 / private・link-local IPv6
- file, ftp, data, javascript scheme

## Test requirements
- URL extraction / normalization / safety validation の unit test
- fetch-source の unit test（success/failure, script/style 除去）
- provider integration test（sourceCandidates 有無）
- openai prompt へ source context 追加確認

## Acceptance references
- `acceptance/source-intake-and-fetching.feature`
- 既存: `acceptance/real-investigation-pipeline.feature`
