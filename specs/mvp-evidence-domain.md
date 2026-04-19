# MVP evidence domain (claims, sources, edges, alerts, counterpoints)

## Summary

TraceMap MVP reasons about **sources** and how they connect to an **answer** using a **`graph_json`** DAG ([question-to-answer-graph](./question-to-answer-graph.md)). For **structured review** — audit trails, list UIs, and future AI extraction — the product also needs **first-class rows** for **claims**, **counterpoints**, and **alerts** attached to an `answer_snapshots` row.

## Decision: hybrid storage

| Concept | Storage | Rationale |
|---------|---------|-----------|
| **Sources** | `source_snapshots` (existing) | Provenance rows with URL/excerpt. |
| **Edges (visual)** | `answer_snapshots.graph_json` | Layout and quick highlights; already versioned. |
| **Claims** | `claims` table | Normalized statements for retrieval, filters, and linking counterpoints. |
| **Counterpoints** | `counterpoints` table | Each challenges exactly one claim (`claim_id` FK). |
| **Alerts** | `alerts` table | Time-ordered warnings (quality, policy) per answer snapshot. |

Optional string **`graph_node_id`** on `claims` ties a claim row to a node `id` inside `graph_json` when both exist (no DB FK to JSON).

## Data model (Prisma)

- **`Claim`**: `answer_snapshot_id`, `summary`, optional `graph_node_id`.
- **`Counterpoint`**: `claim_id`, `summary`.
- **`Alert`**: `answer_snapshot_id`, `level` (`info` | `warning` | `error`), `message`.

## Mock slice (current)

- The **mock** answer-graph provider (`src/server/analysis/providers/mock-answer-graph-provider.ts`), invoked via `createAnalysisRunFromProvider`, yields a payload that persistence writes as **one** `Claim` (with optional `graph_node_id` pointing at `node_answer` in `graph_json`), **one** `Counterpoint` on that claim, and **one** `Alert` (`warning` level, synthetic copy). The **stub** provider omits evidence rows (empty claims/alerts) by design.
- Run and share pages load these via `mapAnswerEvidenceForView` and render read-only sections in `RunResultView` (`data-testid` hooks: `run-alerts-section`, `run-alerts`, `run-alert`, `run-alert-level`, `run-alert-message`, `run-claims-section`, `run-claims`, `run-claim`, `run-claim-item`, `run-claim-graph-link`, `run-counterpoints-section`, `run-counterpoint`, `run-counterpoint-item`).
- **Graph tie UX**: Claims with `graph_node_id` show a short “Graph: …” line (`run-claim-graph-link`). Clicking **Answer** or **Question** nodes in the SVG (`graph-node--interactive`) sets `selectedGraphNodeId` and adds `evidence-claim-block--linked-active` / `data-claim-matches-graph-node` on claims whose `graph_node_id` matches; clicking a **source** node clears that graph selection (source list selection unchanged).

## Out of scope (still)

- Real LLM / retrieval pipelines writing these rows (the **interface** for plugging one in exists; no vendor SDK is wired by default).
- Editing, moderation, or async job workflows.

## Related specs

- [question-to-answer-graph](./question-to-answer-graph.md) — graph_json schema and run UI.
