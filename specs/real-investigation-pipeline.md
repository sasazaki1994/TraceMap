# Real Investigation Pipeline

## Purpose

Define the first real-investigation pipeline hardening slice for TraceMap. This moves the env-gated OpenAI provider beyond the mock-oriented MVP while preserving the existing Investigation Mode MVP v2 UI, persistence shape, and provider boundary.

## User value

- Users only see completed real-provider runs when the answer is grounded in enough real sources.
- Reviewers can trust that claims reference persisted source placeholders rather than model-invented ids.
- The existing Evidence Map, Unknown Map, Source Lineage Lite, and Briefing Report preview continue to work from the same run snapshot.
- Future source cache, run cache, and web search work can plug into clearer provider responsibilities.

## Current baseline

- `TRACEMAP_ANSWER_GRAPH_PROVIDER=mock` remains the default.
- The `openai` provider is enabled only by environment configuration.
- `AnalysisRun.question` remains the mission topic storage field and is not renamed.
- OpenAI currently uses one synchronous structured-output call and the existing `GeneratedAnswerGraphPayload` persistence path.
- Source URL reachability checks are best effort during persistence and do not replace structural validation.

## Scope

- Harden OpenAI provider validation before persistence.
- Normalize generated answer, source, claim, counterpoint, alert, and propagation-chain content.
- Cap source, claim, counterpoint, alert, and propagation step counts.
- Keep source / claim / evidence placeholder references internally consistent after normalization.
- Return provider failures instead of completed runs when required grounding cannot be guaranteed.
- Add focused unit coverage for limits, normalization, and OpenAI validation behavior.

## Non-goals

- Web search, full RAG, background jobs, and streaming are not implemented in this slice.
- No large DB schema change.
- No `AnalysisRun.question` rename.
- No replacement of Mission Header, Investigation Timeline, Evidence Map, Unknown Map, Source Lineage Lite, or Briefing Report preview.
- No broad OpenAI schema expansion beyond the current structured payload.
- No UI layout/style generation from the model.

## Provider architecture

The provider boundary remains:

1. `AnswerGraphProvider.generateAnswerGraph({ question })`
2. Provider-specific model call and structured payload parsing.
3. Provider validation and normalization.
4. Build `GeneratedAnswerGraphPayload`.
5. `persistGeneratedAnswerGraph` writes the normalized payload.

The OpenAI provider owns model-specific parsing and validation. Shared investigation limits and payload normalization live outside the provider so future Source Cache, Run Cache, Web Search, or additional providers can reuse them without rewriting persistence.

## OpenAI provider requirements

- `TRACEMAP_ANSWER_GRAPH_PROVIDER=mock` remains the default; `openai` is env-enabled.
- `sufficient_grounding=false` must return a failed provider result and must not be persisted as a completed answer snapshot.
- Invalid or fake source URLs are not accepted. Successful OpenAI outputs require parseable `http` or `https` URLs with a hostname.
- Fewer than two sources is a failure.
- Zero claims is a failure.
- A claim referencing a source id that does not exist is a failure.
- If normalization caps output and invalidates required evidence, the provider returns failure.
- Failure messages should be understandable to users and safe to store in `last_error_message`.
- Server logs must not include API keys or excessive raw confidential payloads.
- The structured schema must not ask the LLM for UI style, coordinates, colors, or layout fields.

## Source normalization requirements

- Source labels are trimmed.
- Source excerpts are trimmed and capped.
- Source count is capped before persistence.
- Source ids retained after capping define the valid source-reference set.
- Source URLs are trimmed and validated before success.
- Sources removed by the cap must not remain referenced by persisted claims.

## Claim-source validation requirements

- Claim summaries are trimmed and capped.
- Claim count is capped before persistence.
- Each retained claim must reference at least one retained source.
- Unknown source references fail validation.
- Claims that only reference sources removed by the source cap are removed or the payload fails.
- After normalization, the payload must still have at least two sources and at least one claim with consistent source references.

## Failure handling

OpenAI provider failures should be internally classifiable for diagnosis:

- `insufficient_grounding`
- `invalid_json`
- `invalid_source_url`
- `too_few_sources`
- `no_claims`
- `unknown_source_reference`
- `output_limit_invalidated_evidence`
- `provider_exception`

The DB enum does not change. These categories may be implemented as internal constants, return helpers, or mapped messages.

## Test requirements

- `sufficient_grounding=false` returns failure.
- Invalid URL returns failure.
- Fewer than two sources returns failure.
- Zero claims returns failure.
- Unknown source id returns failure and mentions the unknown id.
- Valid payload returns success.
- Normalized payload preserves claim-source reference integrity.
- Built `graphJson` parses with `answerGraphJsonSchema`.
- OpenAI prompt/schema does not require UI-only style, coordinate, or color fields.

## Acceptance references

See `acceptance/real-investigation-pipeline.feature`.

## Future work

- Source Cache and Run Cache tables.
- URL normalization and content-hash based source snapshots.
- Fast / Standard / Deep investigation modes.
- Web Search and retrieval-backed source discovery.
- Background job orchestration for longer-running investigations.
- Streaming progress updates after the synchronous slice is stable.
