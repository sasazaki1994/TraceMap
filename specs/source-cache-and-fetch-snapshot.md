# Source Cache and Fetch Snapshot

## Purpose

Define Source Cache / Fetch Snapshot v0.1 for TraceMap. This slice improves
the quality of source verification, fetch metadata, and evidence provenance for
URLs that are already present in provider payloads.

## User value

- Users can distinguish verified, unreachable, invalid, and unverified sources.
- Repeated investigation runs avoid unnecessary fetches for recently checked
  public source URLs.
- Source detail and Source Lineage Lite expose stable verification metadata
  without changing the existing Evidence Map or Briefing Report workflow.
- Future retrieval, source freshness, and cache-aware investigation modes can
  build on explicit URL-level cache records.

## Current baseline

- Investigation Mode MVP v2 already persists run-local `SourceSnapshot` rows.
- Real Investigation Pipeline v0.1 validates OpenAI structural output before
  persistence and rejects fake or malformed source URLs.
- The OpenAI provider performs validation / normalization / output limiting
  before persistence.
- The mock provider remains the default through
  `TRACEMAP_ANSWER_GRAPH_PROVIDER=mock`.
- Existing source verification stores basic HTTP metadata on `SourceSnapshot`,
  but there is no URL-level source cache and no fetch-attempt history table.

## Scope

- Normalize provider-returned source URLs before source cache lookup.
- Store URL-level reusable metadata in `SourceCacheEntry`.
- Store each fetch attempt in `SourceFetchSnapshot`.
- Reuse fresh cache entries by normalized URL.
- Fetch missing or stale public URLs with a bounded, best-effort request.
- Store verification metadata on run-local `SourceSnapshot` rows.
- Display verification status, HTTP status, final URL, content type, and checked
  time in Source detail / Source Lineage Lite.
- Preserve provider excerpts; use fetch excerpts only when the provider excerpt
  is empty.

## Non-goals

- No web search or discovery of new sources.
- No full RAG, embeddings, or retrieval ranking.
- No background jobs, streaming, or async worker pipeline.
- No Run Cache implementation.
- No authentication, billing, subscription, team features, or paid SaaS plan
  limits.
- No UI layout state stored in source cache tables.
- No replacement of Evidence Map, Unknown Map, Source Lineage Lite, or Briefing
  Report preview.

## Data model

- `SourceSnapshot` remains the run-local evidence snapshot used by Evidence Map
  and claim-source relations.
- `SourceCacheEntry` stores URL-level reusable metadata keyed by normalized URL.
- `SourceFetchSnapshot` stores one fetch attempt for a cache entry.
- A `SourceSnapshot` may store nullable ids for the cache entry and fetch
  snapshot that informed its verification metadata.
- Claim-source relation evidence remains in the run snapshot even when cache
  metadata is reused.
- Source cache records do not store UI layout state.

## URL normalization policy

- Accept only `http` and `https` URLs.
- Lowercase protocol and hostname.
- Remove default ports.
- Remove hash fragments.
- Remove common tracking query parameters:
  - `utm_source`
  - `utm_medium`
  - `utm_campaign`
  - `utm_term`
  - `utm_content`
  - `fbclid`
  - `gclid`
- Sort remaining query parameters conservatively.
- Preserve path semantics and do not rewrite path casing or trailing slashes.
- Keep the original URL for audit display.
- Invalid or fake URLs must remain failures; normalization must not turn them
  into accepted sources.

## SSRF guard policy

- Do not fetch localhost hostnames.
- Do not fetch loopback, private, link-local, or metadata IPv4 addresses.
- Do not fetch IPv6 loopback or private/link-local style addresses.
- Metadata IP `169.254.169.254` is explicitly blocked.
- v0.1 does not perform DNS resolution before fetch, so hostnames that resolve
  to private IPs are a known limitation and future hardening item.

## Fetch policy

- Fetch only URLs that pass normalization and SSRF guard checks.
- Use bounded GET requests with timeout and max-byte limits.
- Default timeout: `TRACEMAP_SOURCE_FETCH_TIMEOUT_MS=8000`.
- Default max bytes: `TRACEMAP_SOURCE_FETCH_MAX_BYTES=200000`.
- Store `httpStatus`, `finalUrl`, `contentType`, `contentHash`, and an excerpt
  when available.
- Create excerpts for HTML and text responses.
- Do not store body excerpts for binary or unsupported content types.
- Compute content hashes with SHA-256 from the bounded response bytes.
- Return failures as structured results instead of throwing.
- Do not log API keys, secrets, or sensitive response bodies.

## Cache reuse policy

- Cache lookup uses `SourceCacheEntry.normalizedUrl`.
- A cache entry is fresh when `latestFetchedAt` is within
  `TRACEMAP_SOURCE_CACHE_TTL_HOURS` hours; default is 24 hours.
- Failed or invalid cache entries are not treated as fresh.
- Missing or stale entries trigger a new fetch attempt.
- Fetch results update the cache entry latest fields.
- Fetch failures do not fail the whole analysis run.

## SourceSnapshot integration

- `SourceSnapshot` continues to represent evidence for one run.
- `SourceSnapshot.verificationStatus` stores `verified`, `unverified`,
  `unreachable`, or `invalid`.
- `checkedAt`, `httpStatus`, `finalUrl`, and `contentType` are populated from
  cache or fetch metadata when available.
- `sourceCacheEntryId` and `sourceFetchSnapshotId` link back to cache/fetch
  records when available.
- Cache reuse does not remove or merge run-local source snapshots.

## Source Lineage / UI requirements

- Source detail shows verification status, HTTP status, final URL, content type,
  and checked time when available.
- Source Lineage Lite shows a compact verification summary while preserving the
  existing lineage and primary-source context.
- Cache reuse does not need to be shown unless it is later stored explicitly on
  the run-local snapshot.

## Failure handling

- Invalid URLs are recorded as invalid source verification metadata.
- Unsafe URLs are not fetched and are recorded as invalid or unreachable.
- Fetch timeout, network failure, or unsupported content must not crash the run.
- A fetch failure by itself must not mark the whole run as failed.
- Existing OpenAI structural validation remains the gate for completed real
  provider runs.

## Test requirements

- URL normalization covers supported protocols, lowercase normalization, default
  ports, hash removal, tracking query removal, query sorting, and invalid input.
- SSRF guard covers localhost, loopback/private/link-local/metadata addresses,
  and public host/IP allow cases.
- Fetch helper tests use mocked fetch and do not depend on external network.
- Source cache service tests cover fresh reuse, missing fetch, stale refetch,
  fetch failure, and normalized URL key behavior.
- Persistence/view tests verify that source verification metadata reaches
  `SourceSnapshot` and run/share view models.

## Acceptance references

See `acceptance/source-cache-and-fetch-snapshot.feature`.

## Future work

- DNS-resolution-based private IP detection.
- HTTP cache header support, ETag, Last-Modified, and freshness tuning.
- Run Cache keyed by normalized mission topic, provider/model, prompt version,
  output limits, and source content hashes.
- Web Search and RAG source discovery.
- Background jobs and streaming progress for longer investigations.
