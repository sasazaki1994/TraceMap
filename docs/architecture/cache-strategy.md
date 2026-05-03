# Cache Strategy

## Purpose

This document sketches the future Source Cache and Run Cache strategy for TraceMap. It is design-only in this slice; no database tables, migrations, cache reads, or cache writes are implemented yet.

## Source cache

The source cache should avoid repeatedly fetching and parsing the same public source URL across investigation runs. It should store normalized URL metadata, fetch metadata, content hashes, extracted text snippets, and freshness state so Evidence Map, Source Lineage, and future retrieval steps can reuse stable source snapshots.

## Run cache

The run cache should avoid repeating equivalent investigation work for the same normalized mission topic, provider, mode, and source set when freshness requirements are still satisfied. It should cache a completed normalized investigation result, not UI layout state.

## Cache key candidates

- Normalized mission topic.
- Provider id and provider model.
- Investigation mode (`fast`, `standard`, `deep`) when modes exist.
- Normalized URL set and source content hashes.
- Prompt/schema version.
- Output limit profile.
- Locale or domain-specific policy flags if introduced later.

## URL normalization policy

Future source cache keys should use a conservative normalized URL:

- Require `http` or `https`.
- Lowercase protocol and hostname.
- Remove default ports.
- Preserve path semantics.
- Sort query parameters only when safe for the domain.
- Drop tracking parameters such as common `utm_*` fields where safe.
- Keep the original URL for audit display.

URL normalization must not turn an invalid or fake URL into an accepted source.

## Content hash policy

Source snapshots should be keyed by both normalized URL and a content hash when fetched content is available. Hashes should be computed from canonical extracted text or a stable fetch snapshot body, with fetch timestamp and content type stored separately. This lets TraceMap distinguish unchanged sources from updated content at the same URL.

## Freshness and stale detection

Freshness should combine:

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

The current slice only introduces fixed MVP output limits; it does not add mode selection.

## Candidate tables for a later phase

- `source_cache_entries`: normalized URL, canonical URL, latest content hash, freshness metadata.
- `source_fetch_snapshots`: fetched URL, final URL, status, headers, content hash, extracted text pointer or excerpt.
- `run_cache_entries`: normalized topic, provider/model/mode, prompt version, output limit profile, result snapshot pointer, expiry metadata.

These names are proposals only and are not implemented in this slice.

## Impact on TraceMap views

- Evidence Map: cached source ids should still resolve to run-local source placeholders before persistence so graph nodes remain stable per run.
- Unknown Map: stale, single-source, unreachable, or reused evidence should surface as caveats rather than hidden cache behavior.
- Source Lineage: lineage can show whether a source was freshly fetched, reused from cache, stale, or hash-changed since a prior run.
- Briefing Report: report generation should consume normalized run evidence and not depend on cache internals.

## Current status

Unimplemented. The current real-investigation slice only normalizes and validates provider output before persistence.
