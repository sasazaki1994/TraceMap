# MVP evidence domain (claims, sources, edges, alerts, counterpoints)

## Summary

TraceMap MVP reasons about **sources** and how they connect to an **answer** using a **`graph_json`** DAG ([question-to-answer-graph](./question-to-answer-graph.md)). For **structured review** — audit trails, list UIs, and future AI extraction — the product also needs **first-class rows** for **claims**, **counterpoints**, and **alerts** attached to an `answer_snapshots` row.

## Decision: hybrid storage

| Concept | Storage | Rationale |
|---------|---------|-----------|
| **Sources** | `source_snapshots` (existing) | Provenance rows with URL/excerpt; optional **URL verification metadata** (best-effort HTTP, does not fail the run). |
| **Edges (visual)** | `answer_snapshots.graph_json` | Layout and quick highlights; already versioned. **v2** adds **claim** nodes and **source → claim → answer** edges. |
| **Claims** | `claims` table | Normalized statements; **multiple rows** per answer snapshot when the provider supplies multiple claims. |
| **Claim ↔ Source** | `claim_source_snapshots` | Many-to-many links between `claims` and `source_snapshots`. |
| **Counterpoints** | `counterpoints` table | Each challenges exactly one claim (`claim_id` FK). MVP keeps **one** counterpoint per answer, attached to the **first** claim. |
| **Alerts** | `alerts` table | Time-ordered warnings (quality, policy) per answer snapshot. |

Optional string **`graph_node_id`** on `claims` ties a claim row to a node `id` inside `graph_json` when both exist (no DB FK to JSON).

## Data model (Prisma)

- **`Claim`**: `answer_snapshot_id`, `summary`, optional `graph_node_id`.
- **`ClaimSourceSnapshot`**: `claim_id`, `source_snapshot_id` (unique pair).
- **`SourceSnapshot`**: existing fields plus optional verification: `verification_status` (`verified` \| `unverified` \| `unreachable` \| `invalid`), `checked_at`, `http_status`, `final_url`, `content_type`.
- **`Counterpoint`**: `claim_id`, `summary`.
- **`Alert`**: `answer_snapshot_id`, `level` (`info` | `warning` | `error`), `message`.

## Mock slice (current)

- The **mock** answer-graph provider (`src/server/analysis/providers/mock-answer-graph-provider.ts`), invoked via `createAnalysisRunFromProvider`, yields a payload that persistence writes as **two** `Claim` rows (with `graph_node_id` pointing at `node_claim_*` in **v2** `graph_json`), **one** `Counterpoint` on the **first** claim, and **one** `Alert` (`warning` level, synthetic copy). The **stub** provider omits evidence rows (empty claims/alerts) by design.
- The **openai** provider (`src/server/analysis/providers/openai-answer-graph-provider.ts`) persists **one row per model claim**, links each to supporting sources via **`claim_source_snapshots`**, and builds **graph_json v2** with **claim** nodes. If the model reports insufficient grounding (`sufficient_grounding: false`) or validation fails (e.g. fewer than two valid URLs), the run does not complete successfully.
- Run and share pages load these via `mapAnswerEvidenceForView` and render read-only sections in `RunResultView` (`data-testid` hooks: `run-alerts-section`, `run-alerts`, `run-alert`, `run-alert-level`, `run-alert-message`, `run-claims-section`, `run-claims`, `run-claim`, `run-claim-item`, `run-claim-graph-link`, `run-counterpoints-section`, `run-counterpoint`, `run-counterpoint-item`).
- **Graph tie UX**: Claims with `graph_node_id` show a short “Graph: …” line (`run-claim-graph-link`). Clicking **Answer**, **Question**, or **Claim** nodes in the SVG (`graph-node--interactive`) sets `selectedGraphNodeId` and adds `evidence-claim-block--linked-active` / `data-claim-matches-graph-node` on claims whose `graph_node_id` matches; when a **claim** is selected, supporting sources are outlined in the source list (`source-list-item--claim-linked`). Clicking a **source** node clears that graph selection (source list selection unchanged).

## Out of scope (still)

- Retrieval/RAG pipelines and authoritative “URL truth” guarantees.
- Editing, moderation, or async job workflows.

## Related specs

- [question-to-answer-graph](./question-to-answer-graph.md) — graph_json schema and run UI.
