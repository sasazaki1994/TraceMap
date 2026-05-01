# Investigation Mode

## Purpose

TraceMap should treat user input as a **research topic** and execute it as an **Investigation Mission**, not only as a question-to-answer request. The run page should frame the completed result as an investigation console while preserving the existing Evidence Graph, claims, sources, alerts, counterpoints, propagation chains, and share flow.

## User value

- Users can start from an open-ended research topic.
- Users can understand what the AI mission produced, what evidence supports it, and what remains unresolved.
- Reviewers can reuse the same run snapshot through the existing share flow.

## Scope

- Update product-facing language from question/answer-first copy to research topic / investigation copy.
- Add a mission header and fixed investigation timeline to the run result experience.
- Keep the existing executive summary, evidence graph, claims, sources, counterpoints, and propagation chain surfaces visible.
- Integrate with Unknown Map, Source Lineage Lite, and Briefing Report preview specs.

## Non-goals

- Renaming persisted `AnalysisRun.question`.
- Renaming provider interfaces such as `AnswerGraphProvider`.
- Adding background job orchestration, streaming, or multi-step agent execution.
- Replacing the existing Evidence Graph or claim review UI.

## Existing implementation constraints

- `AnalysisRun.question` is not renamed in this phase.
- Unknown / Report tables are not added in this phase.
- Unknown Map is derived from alerts / confidence / source support.
- Briefing Report starts as a screen-side Markdown preview.
- Source Lineage Lite is derived from `sourceType` / `isPrimarySource` / `publishedAt`.
- Large OpenAI provider schema changes are deferred to a later phase.
- DB/API breaking changes are avoided; the form field can remain `name="question"`.

## Data model strategy

Investigation Mode reuses the current persistence model:

| Concept | Current storage |
|---------|-----------------|
| Mission topic | `analysis_runs.question` |
| Executive summary | `answer_snapshots.content` |
| Evidence Map | `answer_snapshots.graph_json`, `claims`, `claim_source_snapshots` |
| Unknown Map | `alerts`, `claim_confidences`, weak support state |
| Source Lineage Lite | `source_snapshots`, `claim_source_snapshots`, propagation chains |
| Briefing Report preview | Derived view model, not persisted |

## UI requirements

- Landing page labels should say **Research topic** and **Start Investigation** while keeping the underlying field name stable.
- Run page should show a mission header with:
  - Mission label
  - Research topic
  - Status banner when present
  - Answer title when present
- Run page should show a fixed investigation timeline:
  - COLLECTING SOURCES
  - EXTRACTING CLAIMS
  - LINKING EVIDENCE
  - DETECTING UNKNOWNS
  - BUILDING REPORT
- Existing Evidence Graph, claims, sources, share controls, counterpoints, and propagation chains remain available.

## Provider requirements

- Mock provider may adjust title/content/alert wording to sound like an Investigation Mission.
- Mock payload schema must remain compatible with `GeneratedAnswerGraphPayload`.
- OpenAI provider keeps current grounding validation, http/https URL validation, claim-source reference validation, and failure behavior.
- Investigation Result schema support for OpenAI is a next-phase task.

## Test requirements

- Unit coverage should validate helper-derived investigation view models.
- E2E coverage should confirm the landing page starts an investigation and run page displays:
  - `mission-header`
  - `investigation-timeline`
  - `run-answer`
  - `run-graph`
  - `unknown-map-panel`
  - `source-lineage-panel`
  - `briefing-report-panel`

## Acceptance references

See `acceptance/investigation-mode.feature`.
