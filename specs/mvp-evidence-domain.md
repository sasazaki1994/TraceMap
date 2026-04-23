# MVP evidence domain (claims, sources, edges, alerts, counterpoints)

## Summary

TraceMap MVP reasons about **sources** and how they connect to an **answer** using a **`graph_json`** DAG ([question-to-answer-graph](./question-to-answer-graph.md)). For **structured review** — audit trails, list UIs, and future AI extraction — the product also needs **first-class rows** for **claims**, **counterpoints**, and **alerts** attached to an `answer_snapshots` row.

## Decision: hybrid storage

| Concept | Storage | Rationale |
|---------|---------|-----------|
| **Sources** | `source_snapshots` (existing) | Provenance rows with URL/excerpt; optional **URL verification metadata** (best-effort HTTP, does not fail the run). |
| **Edges (visual)** | `answer_snapshots.graph_json` | Layout and quick highlights; already versioned. **v2** adds **claim** nodes and **source → claim → answer** edges. |
| **Claims** | `claims` table | Normalized statements; **multiple rows** per answer snapshot when the provider supplies multiple claims. |
| **Claim ↔ Source** | `claim_source_snapshots` | Many-to-many links between `claims` and `source_snapshots`, including support-kind metadata and optional supporting quote / contradiction note. |
| **Claim confidence** | `claim_confidences` | Explainable confidence breakdown per claim so reviewers can judge whether the answer is safe to use. |
| **Counterpoints** | `counterpoints` table | Each row challenges exactly one claim (`claim_id` FK) and stores a relationship taxonomy plus optional claim-graph node tie. Providers may attach **one or more** counterpoints per claim. |
| **Propagation chains** | `claim_propagation_chains` + `claim_propagation_chain_steps` | Ordered chain steps explain how source evidence becomes a claim and then an answer segment. |
| **Alerts** | `alerts` table | `answer_snapshot_id` plus optional **`claim_id`**. When `claim_id` is set, the alert is scoped to that claim; when null, it is **answer-wide** (legacy / shared caveat). |

Optional string **`graph_node_id`** on `claims` ties a claim row to a node `id` inside `graph_json` when both exist (no DB FK to JSON).

## Data model (Prisma)

- **`Claim`**: `answer_snapshot_id`, `summary`, optional `graph_node_id`.
- **`ClaimSourceSnapshot`**: `claim_id`, `source_snapshot_id` (unique pair), `support_kind`, `is_primary_source`, optional `supporting_quote`, optional `contradiction_note`.
- **`ClaimConfidence`**: one row per claim with explainable axes (`has_primary_source`, `independent_source_count`, `has_supporting_quote`, `recency_status`, `has_contradiction`) plus derived `score`, `level`, `summary`.
- **`SourceSnapshot`**: existing fields plus optional verification: `verification_status` (`verified` \| `unverified` \| `unreachable` \| `invalid`), `checked_at`, `http_status`, `final_url`, `content_type`.
- **`Counterpoint`**: `claim_id`, `summary`, `relationship_kind`, optional `graph_node_id`.
- **`ClaimPropagationChain`**: `claim_id`, `lens_rank_rigor`, `lens_rank_timeliness`, `lens_rank_practical`.
- **`ClaimPropagationChainStep`**: `claim_propagation_chain_id`, `position`, `step_kind`, `label`, `detail`, optional `source_snapshot_id`.
- **`Alert`**: `answer_snapshot_id`, optional `claim_id` (FK to `claims`), `level` (`info` | `warning` | `error`), `message`.

## Mock slice (current)

- The **mock** answer-graph provider (`src/server/analysis/providers/mock-answer-graph-provider.ts`), invoked via `createAnalysisRunFromProvider`, yields a payload that persistence writes as **two** `Claim` rows (with `graph_node_id` pointing at `node_claim_*` in **v3** `graph_json`), support relations with support-kind metadata, a confidence breakdown per claim, **claim-centric counterpoints with relationship kinds**, propagation chains, **per-claim `Alert` rows** (`claim_id` set), plus **one answer-wide `Alert`** (`claim_id` null, `warning`). The **stub** provider omits evidence rows (empty claims/alerts) by design.
- The **openai** provider (`src/server/analysis/providers/openai-answer-graph-provider.ts`) persists **one row per model claim**, links each to supporting sources via **`claim_source_snapshots`**, persists confidence rows, counterpoint relationships, propagation chains, and builds `graph_json` with source → claim edges. Structured output may include **per-claim** `counterpoints`, chains, and `alerts`; deterministic alert rules also add claim-scoped evidence alerts when support is weak or contradictory. If the model reports insufficient grounding (`sufficient_grounding: false`) or validation fails (e.g. fewer than two valid URLs), the run does not complete successfully.
- Run and share pages load these via `mapAnswerEvidenceForView` and render read-only sections in `RunResultView` (`data-testid` hooks: `run-alerts-section`, `run-alerts`, `run-alert`, `run-claim-support-list`, `run-claim-support-item`, `run-claim-confidence`, `run-claim-counterpoint`, `run-claim-chain`, `lens-switcher`, `source-detail-supporting-claims`, …).
- When a run has multiple `answer_snapshots`, the UI resolves **one latest answer snapshot at a time** and the rendered **sources list must come from that same snapshot**, not from run-wide aggregation. This keeps `graph_json`, `claims`, `claim_source_snapshots`, and source detail selection aligned.
- **Graph tie UX**: Claims with `graph_node_id` show a short “Graph: …” line (`run-claim-graph-link`). Clicking **Answer**, **Question**, **Claim**, **Counterclaim**, or **Interpretation** nodes in the SVG (`graph-node--interactive`) sets `selectedGraphNodeId` and adds linked-state classes on related blocks. When a **claim** is selected, supporting sources are outlined in the source list (`source-list-item--claim-linked`). Clicking a **source** node clears that graph selection (source list selection unchanged) and the source detail panel shows the supporting claims and chain steps for that source. Lens switching only changes ordering/emphasis, not graph identity.

## Out of scope (still)

- Retrieval/RAG pipelines and authoritative “URL truth” guarantees.
- Editing, moderation, or async job workflows.

## Related specs

- [question-to-answer-graph](./question-to-answer-graph.md) — graph_json schema and run UI.
