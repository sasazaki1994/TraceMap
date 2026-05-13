# Public Beta Readiness v0.1

## Purpose
Define the minimum integrated product bar for releasing TraceMap as a third-party testable beta.

## User value
Users can complete an end-to-end investigation flow from topic intake to evidence-backed report preview without requiring OpenAI credentials.

## Scope
- Investigation intake from landing page
- Public Beta copy alignment (no mixed Closed Alpha / Closed Beta wording)
- Login-required beta posture across landing/login/actions copy
- Analysis run creation via AI or mock provider
- Run detail surfaces Mission Header, Investigation Timeline, Evidence Map, Unknown Map Lite, Source Lineage Lite, Source Quality/Freshness Lite
- Source detail drilldown for claim-source relations
- Briefing Report Markdown preview
- Markdown copy/download actions
- Share link read-only experience
- Share page noindex (`index: false`, `follow: false`)
- Run history / saved investigations page
- Empty / loading / error states for beta usability
- lint / typecheck / test / build verification

## Non-goals
- Billing, workspace, full RBAC, OAuth
- RAG, embeddings, reranking, background jobs, streaming
- Full crawling and document export (PDF/PPT/Notion)
- Large DB refactors or OpenAI provider schema rewrite

## Existing implementation constraints
- Keep existing Evidence Graph / Claim / Source / Alert / Counterpoint persistence path
- Preserve OpenAI provider grounding, URL validation, claim-source reference validation, and failed-run handling
- Avoid broad migration; derive new UI panels from existing snapshots

## Data model strategy
- Use existing tables: `AnalysisRun`, `AnswerSnapshot`, `SourceSnapshot`, `Claim`, `ClaimSourceSnapshot`, `Alert`, `Counterpoint`, `ClaimConfidence`, `ClaimPropagationChain`, `ShareLink`
- Unknown Map is derived from alerts/confidence/support signals
- Source Lineage and Quality are derived from source metadata and claim-source links

## UI requirements
- Landing text uses “Research topic” and “Start Investigation”
- Landing/login copy uses “Public Beta” wording and clear login-required messaging
- Run detail includes required beta data-testids:
  - `mission-header`, `mission-topic`, `investigation-timeline`, `investigation-step`, `evidence-map`
  - `unknown-map-panel`, `unknown-map-item`
  - `source-lineage-panel`, `source-lineage-item`
  - `source-quality-panel`, `source-quality-item`
  - `briefing-report-panel`, `briefing-report-markdown`
  - `copy-markdown-button`, `download-markdown-button`
  - `share-link-section`
- Run history includes `run-history-page`, `run-history-item`
- Evidence map test id is `evidence-map` (legacy `run-graph` may coexist during migration)
- Briefing export test ids are `copy-markdown-button` and `download-markdown-button` (legacy IDs may coexist)
- Briefing markdown includes a Beta Notice disclaimer and non-advice statement

## Beta completion checklist (v0.2 hardening)
- Mock provider only flow completes without OpenAI credentials.
- Landing → Start Investigation → Run detail panels render without blocking empty/loading/error states.
- Source detail drilldown shows source URL, verification, claim links, and quality caveats.
- Share link section is visible and read-only page clearly indicates shared mode.
- Run history supports status filter + query search and empty state messaging.

## Empty / Loading / Error baseline
- Empty collections must render explicit helper copy (claims/sources/unknowns/quality/lineage/history).
- Loading/submission states must disable primary actions to prevent duplicate actions.
- Failure states must show investigation/share/history-safe fallback copy, not raw stack traces.

## Provider requirements
- Mock provider must be sufficient for UI walkthroughs (claims/sources/alerts/counterpoints)
- OpenAI provider remains compatible with current structured output and does not auto-mark failed runs as completed
- OpenAI smoke test results must be recorded in validation docs; if no API key is available, record as "未実行: API keyなし"

## Test requirements
- Unit tests for unknowns, lineage, quality, and briefing report builders
- UI/E2E checks for mission/timeline/panels/export/share/run history
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm exec prisma validate` (and `pnpm test:e2e` when available)

## Public beta validation checklist
- Public Beta scope and Non-goals are explicitly documented
- Auth / Owner Scope behavior is verified
- Share link behavior is read-only + noindex
- Mock provider baseline flow is verified
- OpenAI provider smoke test result is documented (or API-key-missing skip is documented)
- Safety / Trust copy includes non-advice statement
- Validation commands and outcomes are recorded
- Manual flow checklist outcomes are recorded

## Acceptance references
- `acceptance/public-beta-readiness.feature`
- `acceptance/investigation-mode.feature`
- `acceptance/unknown-map-and-source-lineage.feature`
- `acceptance/source-quality-and-freshness.feature`
- `acceptance/briefing-report.feature`
- `acceptance/report-export-lite.feature`
- `acceptance/run-history-and-saved-investigations.feature`
