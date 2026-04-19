# ADR: OpenAI answer-graph provider (minimal vertical slice)

## Context

TraceMap persists generated graphs via `persistGeneratedAnswerGraph` behind the `AnswerGraphProvider` boundary. Mock and stub providers existed; production needed an env-gated real implementation without queues, web search, or streaming.

## Decision

- Add `realOpenAiAnswerGraphProvider` in `src/server/analysis/providers/openai-answer-graph-provider.ts` using the OpenAI Chat Completions API with Structured Outputs (`response_format.type = json_schema`).
- Enable only when `TRACEMAP_ANSWER_GRAPH_PROVIDER=openai`. Default remains `mock`.
- API key: `TRACEMAP_OPENAI_API_KEY` or fallback `OPENAI_API_KEY`. Missing key returns `GenerateAnswerGraphResult` failure, which maps to `AnalysisRunStatus.failed` and `last_error_message`.
- Optional: `TRACEMAP_OPENAI_MODEL` (default `gpt-4o-mini`), `TRACEMAP_OPENAI_TIMEOUT_MS` (default `60000`).

## Out of scope (this ADR)

- Background jobs, streaming responses, web/file search tools, webhook ingestion, and retrieval/RAG pipelines.

## Consequences

- One synchronous HTTP call per run creation when OpenAI is selected; request timeouts are bounded by `TRACEMAP_OPENAI_TIMEOUT_MS`.
- OpenAI SDK usage is confined to the provider module; orchestration (`createAnalysisRunFromProvider`) is unchanged.

## Source-grounded slice (addendum)

Structured output includes **`sufficient_grounding`**. When `false`, the provider returns **`GenerateAnswerGraphFailure`** with a stable user-facing message so the run stays **`failed`** (not `completed`). Successful outputs require **at least two** sources, each **http** or **https** URL with a host (validated in code, no domain allowlist). Claims include **`supported_by_source_ids`** referencing `sources[].id`.

**Persistence**: each model claim becomes a **`claims`** row; **`claim_source_snapshots`** stores the many-to-many link to **`source_snapshots`**. **`graph_json`** uses **version 2**: nodes include **`claim`**, with edges **source → claim** and **claim → answer** (no direct source → answer in new graphs). **`graph_node_id`** on each claim points at **`node_claim_*`** in `graph_json`.

**Counterpoint / alert**: still **one** counterpoint and **one** alert per answer snapshot in the structured payload; the counterpoint is stored against the **first** claim.

**URL verification**: `persistGeneratedAnswerGraph` performs a **best-effort** HTTP probe (HEAD with GET fallback) per http(s) source URL and stores metadata on **`source_snapshots`**. Failures to reach a host do **not** fail the run; they set **`unreachable`** (or similar) instead of changing the structural success criteria.

There is no retrieval layer; structural validation remains the gate for **`completed`** runs.
