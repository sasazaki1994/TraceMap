# Source Discovery v0.1

## Purpose
Enable TraceMap to discover source candidates from a research topic even when the user does not provide manual URLs, while preserving the existing Source Intake / Fetch / Cache / Provider pipeline.

## User value
- Users can start an investigation from a plain research topic and still get evidence candidates.
- Manual URLs remain first-class and prioritized when present.
- Discovery can evolve from mock to real search providers without breaking provider integration.

## Scope
- Add `SourceDiscoveryProvider` boundary for pluggable source discovery.
- Add `disabled` and `mock` discovery providers.
- Add discovery hook from research topic (`question`) in source intake.
- Merge manual URLs and discovered URLs into one normalized, deduplicated intake list.
- Reuse existing source cache / fetch pipeline (`resolveSourceCacheForUrl`).
- Pass resulting `sourceCandidates` to answer graph providers.

## Non-goals
- Production external search API integration.
- RAG / embeddings / reranking.
- Background job orchestration.
- DB schema changes or Prisma migrations.
- Large UI redesign.
- Major OpenAI answer graph schema changes.
- Full-text crawling.
- Dedicated persistence table for search result history.

## Existing implementation constraints
- Keep `AnalysisRun.question` and form field `question` unchanged.
- Preserve existing Source Intake behavior for manual URLs.
- Keep run completion flow valid even when source discovery fails or yields no candidates.
- Do not bypass existing URL safety validation.

## Provider strategy
- Environment variable switch: `TRACEMAP_SOURCE_DISCOVERY_PROVIDER=disabled|mock`.
- Default is `disabled`.
- `mock` provider must return deterministic results from the research topic.
- Provider boundary is designed to allow future providers (e.g. web search backends) without changing intake contracts.

## Source candidate flow
1. Extract manual URLs from research topic.
2. Resolve source discovery provider.
3. If provider is enabled, discover additional URLs from the same topic.
4. Merge manual + discovered URLs (manual first).
5. Normalize, safety-check, dedupe by normalized URL.
6. Resolve cache/fetch metadata with `resolveSourceCacheForUrl`.
7. Build `SourceCandidate[]` and pass to answer graph provider input.

## Deduplication rules
- Deduplicate by normalized URL.
- Manual URL candidates are evaluated before discovered candidates.
- When duplicates exist, keep first occurrence (manual precedence).
- Do not fetch or process the same normalized URL more than once.

## Error handling
- Discovery provider failures do not fail the run.
- Per-URL cache/fetch failures do not fail the run.
- Discovery and URL failures are captured in `ignoredUrls` with reasons.
- Avoid excessive logging; never log secrets.

## Security constraints
- Discovery outputs are treated as untrusted input.
- All discovered URLs must pass existing normalization and safety checks.
- Unsafe URLs are ignored and recorded, not fetched.
- Existing SSRF guard behavior remains authoritative.

## Cost constraints
- `DEFAULT_DISCOVERY_MAX_RESULTS = 5`.
- `DEFAULT_SOURCE_CANDIDATE_MAX_RESULTS = 5`.
- Keep provider source context compact (no raw full HTML).
- Keep excerpt truncation behavior unchanged in answer graph providers.

## Test requirements
- Provider resolution defaults to disabled.
- Disabled provider yields no discovered candidates.
- Mock provider is deterministic and respects maxResults.
- Intake integration preserves manual URL-only behavior.
- Discovery can produce candidates when no manual URLs exist.
- Manual URLs are prioritized over discovered URLs.
- Duplicate URLs are deduplicated.
- Discovery failure does not fail intake.
- Unsafe discovered URLs are ignored.
- Provider integration remains valid when sourceCandidates is empty or discovered.

## Acceptance references
- `acceptance/source-discovery.feature`
- `acceptance/source-intake-and-fetching.feature`
