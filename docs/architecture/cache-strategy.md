# Cache Strategy

## Purpose

This document describes the Source Cache / Fetch Snapshot v0.1 baseline and Run
Cache v0.1 for TraceMap. Source URL cache tables, cache reads/writes, and fetch
snapshots are implemented for provider-returned URLs. Run Cache stores reusable
normalized investigation payloads for fresh repeated topics.

## Source cache

The source cache avoids repeatedly fetching the same public source URL across
investigation runs. It stores normalized URL metadata, fetch metadata, content
hashes, excerpts, and freshness state so Source Lineage and future retrieval
steps can reuse stable source metadata.

Source Cache v0.1 only handles URLs already returned by the configured answer
graph provider. It does not search the web, expand the source set, or run RAG.
`SourceSnapshot` remains the run-local evidence record used by Evidence Map and
claim-source relations. `SourceCacheEntry` is reusable URL-level metadata, and
`SourceFetchSnapshot` records each fetch attempt.

## Run cache

Run Cache v0.1 avoids repeating equivalent investigation work for the same
normalized mission topic, provider, provider model, prompt version, schema
version, and output limit profile when freshness requirements are still
satisfied. It caches a completed normalized investigation result compatible with
`GeneratedAnswerGraphPayload`, not UI layout state.

On a fresh cache hit, TraceMap still creates a new `AnalysisRun` and passes the
cached payload through the normal persistence path. This creates new run-local
`AnswerSnapshot`, `SourceSnapshot`, `Claim`, `Alert`, and relation rows and
rewrites source placeholders to the new `SourceSnapshot.id` values. Evidence Map
and claim-source relations therefore remain scoped to the current run.

Run Cache v0.1 uses:

- `TRACEMAP_RUN_CACHE_TTL_HOURS`, default `24`.
- Invalid or non-positive TTL values fall back to `24`.
- Failed provider results, insufficient grounding results, and invalid payloads
  are not cached.
- Invalid cached payloads are treated as misses.

## Cache key candidates

- Normalized mission topic.
- Provider id and provider model.
- Prompt/schema version.
- Output limit profile.
- Optional investigation mode when modes exist.
- Future source URL/content hashes when source-set freshness is introduced.
- Locale or domain-specific policy flags if introduced later.

## URL normalization policy

Source cache keys use a conservative normalized URL:

- Require `http` or `https`.
- Lowercase protocol and hostname.
- Remove default ports.
- Preserve path semantics.
- Sort query parameters conservatively.
- Drop common tracking parameters such as `utm_source`, `utm_medium`,
  `utm_campaign`, `utm_term`, `utm_content`, `fbclid`, and `gclid`.
- Keep the original URL for audit display.

URL normalization must not turn an invalid or fake URL into an accepted source.

## Content hash policy

Fetch snapshots store a SHA-256 content hash when fetched content bytes are
available. The reusable cache entry stores the latest hash, fetch timestamp,
HTTP status, final URL, content type, and latest error message.

## Freshness and stale detection

Source Cache v0.1 freshness uses a fixed TTL:

- `TRACEMAP_SOURCE_CACHE_TTL_HOURS`, default `24`.
- `latestFetchedAt` within the TTL is considered fresh.
- Failed or invalid entries are not treated as fresh.

Future freshness should combine:

- Source fetch timestamp.
- HTTP cache headers when available.
- Published or modified date extracted from the source.
- Investigation mode freshness budget.
- Domain-specific rules for time-sensitive market or company research.

Stale cache entries should remain auditable in Source Lineage but should trigger Unknown Map caveats or force refetch in stricter modes.

## Fast / Standard / Deep mode relationship

- Fast mode can prefer fresh-enough cached sources and small output limits.
- Standard mode can refetch stale entries and use balanced limits.
- Deep mode can require stricter freshness, broader source discovery, and background execution.

The current product still has fixed MVP output limits; it does not add mode selection.

## Implemented Source Cache tables

- `source_cache_entries`: normalized URL, original URL, latest final URL,
  latest HTTP status, latest content type, latest content hash, latest fetch
  timestamp, and latest error message.
- `source_fetch_snapshots`: requested URL, final URL, HTTP status, content type,
  content hash, bounded excerpt, error message, and fetch timestamp.

## Implemented Run Cache table

- `run_cache_entries`: cache key, normalized topic, provider/model metadata,
  prompt/schema version, output limit profile, optional future mode, normalized
  payload JSON, optional future source URL hash, expiry metadata, last-used time,
  and hit count.

Run Cache entries are not source cache entries and are not run snapshots.

## SSRF guard limitations

Source Fetch v0.1 blocks localhost, loopback, private IPv4 ranges, link-local
IPv4, metadata IP `169.254.169.254`, IPv6 loopback, and IPv6 private/link-local
style addresses before fetching. It does not perform DNS resolution before
fetch, so a public-looking hostname that resolves to a private IP is a known
future hardening item.

## Impact on TraceMap views

- Evidence Map: cached source ids still resolve to run-local `SourceSnapshot`
  rows before persistence so graph nodes remain stable per run.
- Unknown Map: stale, single-source, unreachable, or reused evidence should surface as caveats rather than hidden cache behavior.
- Source Lineage: v0.1 shows verification status, HTTP status, final URL,
  content type, and checked time. Future versions can show whether a source was
  freshly fetched, reused from cache, stale, or hash-changed since a prior run.
- Briefing Report: report generation should consume normalized run evidence and not depend on cache internals.

## Current status

Source Cache / Fetch Snapshot v0.1 is implemented for provider-returned URLs.
Run Cache v0.1 is implemented for reusable normalized investigation payloads.
Fast / Standard / Deep mode selection v0.1 is implemented at the landing/server-action/provider-input level.
Mode is included in Run Cache key.
Mode does not yet persist on `AnalysisRun`.
Source discovery breadth, full RAG, background Deep mode execution, and streaming remain future work.


## Source Quality & Freshness Inspector v0.1
- Source Cache / Fetch Snapshot metadata is reused to derive source quality signals in Source Lineage and Source Detail UI.
- stale / unreachable / invalid / unknown freshness can be surfaced as Unknown Map caveats.
- Source Quality is a research caution indicator, not a definitive truth/reliability score.
- MVP freshness rule is simple (180-day threshold) and can evolve to domain-specific rules later.
