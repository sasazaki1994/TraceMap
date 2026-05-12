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

## OpenAI support relations alignment

### Purpose
Align the OpenAI Structured Output schema with downstream support-relation persistence so claim-source evidence metadata can be generated under strict JSON schema mode.

### User value
- Claim evidence quality is more transparent because support kind, primary-source flags, supporting quotes, and contradiction notes can be returned and persisted.
- Source Quality and confidence signals are computed from richer per-source claim support metadata without changing the persisted schema.

### Scope
- Extend OpenAI structured schema to allow `claims[].support_relations`.
- Keep `support_relations[].source_id` aligned to `sources[].id` and `claims[].supported_by_source_ids`.
- Keep support relation shape aligned with existing `StructuredSupportRelation` (`support_kind`, `is_primary_source`, optional `supporting_quote`, optional `contradiction_note`).
- Update OpenAI system prompt to request support relations when available and prohibit fabricated quotes or over-claiming primary source authority.
- Preserve existing normalization and persistence pipeline behavior, while safely dropping invalid support relations that do not map to retained supported source ids.

### Non-goals
- No DB schema or migration changes.
- No run/result UI redesign.
- No provider migration to a different OpenAI API surface.

### Existing implementation constraints
- `TRACEMAP_ANSWER_GRAPH_PROVIDER=mock` remains default.
- `sufficient_grounding`, URL validation, minimum source count, and claim-source reference checks must remain unchanged.
- Investigation Depth Mode limits continue to bound max sources/claims/support payload size.

### Provider schema requirements
- `claims.items.properties.support_relations` is an array with maxItems equal to source limit.
- Required support relation fields are `source_id`, `support_kind`, `is_primary_source`.
- `support_kind` enum is `direct | supplemental | indirect`.
- Optional `supporting_quote` is capped by source excerpt max length.
- Optional `contradiction_note` is allowed.

### Validation requirements
- Legacy payloads without `support_relations` remain valid.
- Relation entries with unknown/trimmed-out source ids or ids not listed in retained `supported_by_source_ids` are dropped during normalization.
- Existing hard-failure rules for invalid source references in `supported_by_source_ids` remain unchanged.

### Persistence requirements
- Persisted claim support rows continue mapping to `ClaimSourceSnapshot` with support kind, primary-source flag, supporting quote, and contradiction note.
- Claim confidence and derived alert behavior continues using persisted support metadata.

### Test requirements
- Provider schema includes `support_relations` under claims.
- Valid support relations pass validation and reach generated payload supports.
- Invalid support relation source ids are safely dropped without breaking valid claims.
- Existing insufficient grounding / invalid URL / unknown claim source validation failures remain.

### Acceptance references
- `acceptance/real-investigation-pipeline.feature` scenarios for support relation schema and persistence alignment.
