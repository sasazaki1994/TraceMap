# Cost and Output Limits

## Purpose

Define the MVP policy for bounding provider output size and cost exposure while keeping TraceMap's model output separate from UI rendering concerns.

## User value

- Users get concise investigation results instead of unbounded JSON or excessively long text.
- Reviewers can reason about predictable Evidence Map, Unknown Map, Source Lineage, and Briefing Report inputs.
- The default mock/free path remains lightweight.
- Future paid modes can expand depth deliberately rather than by accidental model verbosity.

## Scope

- Define fixed MVP limits for source, claim, edge-derived evidence, alert, counterpoint, propagation step, answer content, source excerpt, and claim summary output.
- Apply limits to OpenAI provider output before persistence.
- Preserve enough required evidence after normalization or fail safely.
- Keep the existing mock provider behavior stable.

## Non-goals

- No per-user quota tables.
- No billing product implementation tied to the mode switch in this slice.
- No UI redesign.
- No streaming or background queue.

## Output limit policy

The MVP must not allow providers to grow source, claim, or JSON payloads without bounds. The default policy is:

| Output kind | MVP maximum |
|-------------|-------------|
| Sources | 5 |
| Claims | 8 |
| Counterpoints per claim | 2 |
| Alerts per claim | 2 |
| Propagation steps per claim | 5 |
| Answer content | 4000 characters |
| Source excerpt | 1200 characters |
| Claim summary | 500 characters |

If a source cap removes sources that claims rely on, the normalized payload must either drop affected claims or fail. After normalization, a valid OpenAI payload still requires at least two sources, at least one claim, and consistent claim-source references.

Graph edges are derived from normalized sources, claims, counterpoints, and propagation steps. They are not independently requested from the LLM.

## Cost control strategy

- `TRACEMAP_ANSWER_GRAPH_PROVIDER=mock` remains the default and lightweight.
- Free / mock / default flows should not require OpenAI credentials or external calls.
- The OpenAI provider has output caps even when explicitly enabled by env.
- Provider prompts should ask for concise structured evidence, not exhaustive reports.
- Provider failures should happen before persistence when required evidence is missing after limits.

## UI/model separation

The LLM must produce investigation facts and evidence, not UI rendering instructions.

- Do not ask the LLM for coordinates.
- Do not ask the LLM for colors.
- Do not ask the LLM for UI style or layout fields.
- UI components derive visual layout from persisted graph/evidence data.

## Fast / Standard / Deep mode (MVP runtime profile)

Runtime mode is selected by `TRACEMAP_INVESTIGATION_MODE` (`fast` / `standard` / `deep`, default `standard`).
Mode controls normalization limits and source candidate budget:

- Fast: sources 3, claims 3, counterpoints 1, alerts 1, propagation steps 3, answer content 2000 chars, source excerpt 800 chars, claim summary 300 chars.
- Standard: sources 5, claims 8, counterpoints 2, alerts 2, propagation steps 5, answer content 4000 chars, source excerpt 1200 chars, claim summary 500 chars.
- Deep: sources 12, claims 16, counterpoints 3, alerts 3, propagation steps 7, answer content 7000 chars, source excerpt 1600 chars, claim summary 700 chars.

This slice does not yet add per-user billing/entitlement mode gating.

## Test requirements

- Sources are capped before persistence.
- Claims are capped before persistence.
- Source excerpts are trimmed and capped.
- Answer content is trimmed and capped.
- Claim summaries are trimmed and capped.
- Counterpoints, alerts, and propagation steps per claim are capped.
- Claim-source references remain valid after normalization.
- Required evidence loss after caps fails safely.

## Acceptance references

See `acceptance/cost-and-output-limits.feature`.
