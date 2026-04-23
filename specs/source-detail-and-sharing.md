# Source detail and sharing

## Summary

Extends the run experience so viewers can **inspect source provenance** (already partly covered by [question-to-answer-graph](./question-to-answer-graph.md)) and **create read-only share links** for an analysis run so others can open the same snapshot without signing in.

This slice uses the existing `share_links` table and adds **server actions plus a public route**; it does not add LLM calls.

## Relationship to other specs

- Builds on: [question-to-answer-graph](./question-to-answer-graph.md) (run page UI, `source_snapshots`, `graph_json`).
- Visual styling follows: [visual-design-system-cyber](./visual-design-system-cyber.md).

## User stories

1. From `/runs/{id}`, the user can **create a share link** that points at the current run snapshot.
2. The app persists a `share_links` row with a unique `token` and optional `expires_at` (MVP: no expiry UI; `expires_at` may be null).
3. Visiting `/share/{token}` shows a **read-only** view: question, latest answer body, sources list, evidence graph, and source detail selection—same structure as the authenticated run page but without edit/share admin (MVP: no separate “admin”).
4. Expired links (when `expires_at` is set and in the past) show a clear **not found or expired** message.

## UI

| Area | Behavior |
|------|----------|
| Run page toolbar | Primary action **Share** opens share UI: create link, display URL to copy. |
| Share created | Shows full URL `/share/{token}`; stable hook `data-testid="share-url"` for tests. |
| Public share page | Mirrors run result layout (read-only); same test hooks as run page where applicable: `run-answer`, `run-graph`, `source-row`, `source-detail-panel`. |
| Source detail panel | Shows the selected source's supporting claims, support-kind labels, primary-source badge, and supporting quote when available. |
| Invalid token | Next.js `notFound()` or dedicated “expired” copy. |

## Data model

- **`share_links`**: `analysis_run_id`, `token` (unique), optional `expires_at`, `created_at`.
- Creating a link does **not** duplicate `answer_snapshots` or `source_snapshots`; the public page loads the run by token and resolves latest answer + sources like `/runs/[id]`.
- Claim-support relations and claim confidence rows are read through the same latest `answer_snapshot`; share pages must not compute a different graph/evidence view from the authenticated run page.

## Security (MVP)

- Tokens are unguessable (high-entropy random string).
- No authentication; possession of the URL grants read access until expiry (if any).

## Out of scope

- Revocation UI, analytics on opens, password-protected shares.
- OAuth or org-scoped sharing.

## Related acceptance

See `acceptance/source-detail-and-sharing.feature`.
