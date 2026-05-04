# Run Cache

## Purpose

Define Run Cache v0.1 for TraceMap. This slice reuses completed normalized
investigation payloads for fresh repeated topics while preserving the existing
run-local evidence model.

## User value

- Repeated investigations for the same or near-same topic can avoid unnecessary
  provider calls.
- Existing Evidence Map, Unknown Map, Source Lineage Lite, and Briefing Report
  preview continue to operate from run-local snapshots.
- Future cache-aware investigation modes can build on explicit run-level cache
  metadata without mixing responsibilities with Source Cache.

## Current baseline

- `TRACEMAP_ANSWER_GRAPH_PROVIDER=mock` remains the default.
- Providers return a `GeneratedAnswerGraphPayload` that is persisted by
  `persistGeneratedAnswerGraph`.
- Source Cache / Fetch Snapshot v0.1 reuses URL-level source metadata and still
  creates run-local `SourceSnapshot` rows.
- Run Cache is not yet implemented.

## Scope

- Add a `RunCacheEntry` table for completed normalized investigation payloads.
- Build a stable cache key from normalized topic, provider id, provider model,
  prompt version, schema version, output limits profile, and an optional future
  mode field.
- Reuse fresh cache entries instead of calling the provider.
- Store successful provider payloads after run persistence completes.
- Validate cached payloads before reuse.
- Keep cache lookup/store failures from failing an otherwise valid analysis run.

## Non-goals

- Run Cache does not store UI layout state.
- No Web Search implementation.
- No full RAG implementation.
- No background jobs.
- No streaming.
- No Fast / Standard / Deep mode implementation, though the key structure keeps
  room for a future mode value.
- No authentication, billing, subscription, team workspace, or paid SaaS plan
  features.
- No replacement of Evidence Map, Unknown Map, Source Lineage Lite, or Briefing
  Report preview.
- No change to the default mock provider behavior.

## Data model

`RunCacheEntry` stores:

- `cacheKey`: unique stable key.
- `normalizedTopic`: normalized research topic.
- `providerId` and nullable `providerModel`.
- `promptVersion`, `schemaVersion`, and `limitsProfile`.
- `payloadJson`: normalized investigation result compatible with
  `GeneratedAnswerGraphPayload`.
- Optional `sourceUrlHash` reserved for later source-set freshness work.
- `expiresAt`, `lastUsedAt`, and `hitCount` for freshness and reuse metadata.

The cache entry is not a run and is not a source snapshot. A cache hit still
creates a new `AnalysisRun` and new run-local `AnswerSnapshot`,
`SourceSnapshot`, `Claim`, `Alert`, and related evidence rows.

## Cache key policy

The key includes:

- normalized research topic
- provider id
- provider model
- prompt version
- schema version
- limits profile
- optional future mode

Topic normalization trims the topic, collapses repeated whitespace into one
space, and lowercases text without otherwise rewriting Japanese or other
non-ASCII content.

Default versions:

- prompt version: `investigation-v1`
- schema version: `answer-graph-v3`
- limits profile: `mvp-v1`

## Cache value policy

The cache value stores a normalized `GeneratedAnswerGraphPayload`-compatible
investigation result. It must not include DB ids or run-local source snapshot
ids. Source references remain placeholder-based using `__src_i__`.

Failed provider results are not cached. Insufficient grounding results are not
cached. Invalid provider output is not cached.

## Cache hit behavior

When a fresh valid cache entry exists:

- The provider is not called.
- A new `AnalysisRun` is still created.
- The cached payload is passed to `persistGeneratedAnswerGraph`.
- New run-local `AnswerSnapshot`, `SourceSnapshot`, `Claim`, `Alert`, and
  relation rows are created.
- Graph source nodes are rewritten from `__src_i__` placeholders to the new
  run-local `SourceSnapshot.id` values.
- Claim-source relations point to the new run-local source snapshots.
- Source verification and Source Cache resolution may run normally during
  persistence.

## Cache miss behavior

When no valid fresh entry exists:

- The selected provider is called.
- Provider failure marks the run failed and does not store a cache entry.
- Provider success is persisted through the existing persistence path.
- After successful run completion, the normalized payload is stored or refreshed
  in Run Cache.

## Stale cache behavior

Run Cache has a TTL. The default TTL is 24 hours and may be configured by
`TRACEMAP_RUN_CACHE_TTL_HOURS`. Non-positive or invalid values fall back to the
default.

Expired entries are treated as stale misses. A successful provider result
refreshes the cache entry for the same key.

## Provider integration

Run Cache sits above the provider boundary. The provider is resolved first so
the cache key can include provider id and provider model metadata. Cache hits
reuse cached normalized payloads; cache misses call
`provider.generateAnswerGraph`.

OpenAI validation, normalization, output limits, insufficient grounding
handling, and mock provider behavior remain provider responsibilities.

## Source Cache relationship

Run Cache and Source Cache have separate responsibilities:

- Source Cache is URL-level reuse for source verification and fetch metadata.
- Run Cache is investigation-level reuse keyed by topic, provider/model,
  prompt/schema version, and limits profile.

Run Cache does not replace `SourceSnapshot`. Source Cache may still be consulted
when a cached run payload is persisted, and Evidence Map continues to use
run-local source snapshots.

## Failure handling

- Cache lookup errors fall back to the normal provider path.
- Cache store errors do not change a completed run to failed.
- Invalid cached payloads are treated as misses and are not used.
- Provider failures, insufficient grounding results, and invalid output are not
  cached.

## Test requirements

- Stable cache key generation for equivalent inputs.
- Cache key changes when provider id, provider model, prompt version, schema
  version, or limits profile changes.
- Japanese topics remain intact after normalization.
- Cached payload parser accepts valid normalized payloads.
- Cached payload parser rejects invalid graph JSON, missing answer content,
  missing sources, unknown placeholders, and DB id style source references.
- Run cache service returns fresh hits, stale misses, missing misses, and
  invalid-payload misses.
- Hits update `hitCount` and `lastUsedAt`.
- Successful provider payloads can be stored with an expiry timestamp.
- Cache hits skip provider calls while still creating run-local snapshots.
- Cache lookup/store errors do not fail the run.

## Acceptance references

See `acceptance/run-cache.feature`.

## Future work

- Cache hit UI metadata on run detail/share pages.
- Cache key expansion for Fast / Standard / Deep modes.
- Source-set and source-content hash freshness policies.
- Web Search and retrieval-backed source discovery.
- Background jobs and streaming progress.
