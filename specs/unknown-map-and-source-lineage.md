# Unknown Map and Source Lineage Lite

## Purpose

Define the MVP v2 read-only panels that explain unresolved investigation gaps and source provenance without adding new database tables.

## User value

Users can quickly see what remains uncertain, why the uncertainty exists, and which sources look primary, secondary, internal, dated, or unverified before reusing the investigation result.

## Scope

- Render an **Unknown Map** on run/share result views.
- Render **Source Lineage Lite** from the same run snapshot.
- Derive unknowns from existing answer-wide alerts, claim-scoped alerts, claim confidence, and claim support state.
- Derive lineage from existing source snapshots and claim-support relations.

## Non-goals

- No dedicated `Unknown`, `InvestigationGap`, `Report`, or lineage table.
- No new source verification guarantee beyond stored metadata and visible labels.
- No graph algorithm or propagation-chain redesign.
- No provider schema expansion for a complete Investigation Result object in this slice.

## Existing implementation constraints

- `AnalysisRun.question` is not renamed in this slice.
- Unknown / Report tables are not added.
- Unknown Map is derived from `alerts`, claim confidence, and source support state.
- Briefing Report remains a UI-side Markdown preview.
- Source Lineage Lite is derived from `sourceType`, `isPrimarySource`, and `publishedAt`.
- OpenAI provider large schema changes are deferred to a later phase.
- Existing Evidence Graph / Claim / Source / Alert / Counterpoint / Propagation Chain behavior must remain available.

## Data model strategy

| View concept | Existing source |
|--------------|-----------------|
| Unknown text | `alerts.message` or confidence-derived claim gap |
| Severity | `Alert.level` mapped to high / medium / low, plus confidence level |
| Reason | Rule-based explanation from alert or confidence axis |
| Suggested next action | Rule-based action such as checking primary sources or adding independent support |
| Lineage label | `SourceSnapshot.sourceType`, `ClaimSourceSnapshot.isPrimarySource`, `SourceSnapshot.publishedAt` |

## UI requirements

- Unknown Map panel uses `data-testid="unknown-map-panel"`.
- Each gap uses `data-testid="unknown-map-item"`.
- Each unknown shows text, reason, severity, and suggested next action.
- Source Lineage panel uses `data-testid="source-lineage-panel"`.
- Each source lineage row uses `data-testid="source-lineage-item"`.
- Primary or official-looking sources are visually distinguishable.
- Unknown or unverified sources must not be labeled as verified.

## Provider requirements

- Mock provider should keep emitting alerts and confidence-affecting support state that make Unknown Map useful.
- OpenAI provider must retain existing grounding validation, URL validation, claim-source validation, and failure semantics.
- Complete Investigation Result schema support is next phase work.

## Test requirements

- Unit tests cover alert-to-unknown conversion and severity mapping.
- Unit tests cover confidence/support-derived unknowns.
- Unit tests cover source-to-lineage derivation, including primary and unknown-date labels.
- E2E/UI tests should assert Unknown Map and Source Lineage panels render on completed mock runs.

## Acceptance references

See `acceptance/unknown-map-and-source-lineage.feature`.
