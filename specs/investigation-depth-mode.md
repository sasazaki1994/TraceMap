# Investigation Depth Mode v0.1

## Purpose
Add a minimal, user-selectable investigation depth mode (Fast / Standard / Deep) from landing intake to generation pipeline.

## User value
- Fast: quick low-cost trial flow.
- Standard: balanced default mission.
- Deep: broader evidence output limits without changing sync execution model.

## Scope
- Landing intake mode selector (`name="mode"`).
- Server action reads and normalizes mode.
- Provider run creation path receives mode.
- Run cache key separates by mode.
- Mock/OpenAI provider paths use mode-based limits.

## Non-goals
- No DB migration.
- No `AnalysisRun.question` rename.
- No provider schema redesign.
- No background queue/streaming.
- No billing/team/pro plan work.

## Mode definitions
- Fast: up to 3 sources / 3 claims profile.
- Standard: up to 5 sources / 8 claims profile (default).
- Deep: up to 12 sources / 16 claims profile; still synchronous in MVP.

## Existing implementation constraints
- Keep Evidence Map / Unknown Map / Source Lineage / Briefing Report / Company Research Report compatible.
- Keep run cache and source cache structures.
- Keep OpenAI validation behavior (grounding, URL validation, claim-source validation, failure semantics).

## Data model strategy
- `AnalysisRun.question` remains unchanged.
- Mode is not persisted on `AnalysisRun` in this phase.
- Existing `RunCacheEntry.mode` is reused.

## UI requirements
- Add selector in landing intake with values: `fast | standard | deep`.
- Default selection is `standard` when user does not choose.
- Keep `name="question"` textarea intact.

## Server action requirements
- Read `formData.get("mode")`.
- Normalize with `resolveInvestigationMode`.
- Pass to `createAnalysisRunFromProvider(question, { mode })`.

## Provider requirements
- `createAnalysisRunFromProvider` accepts optional `{ mode }`.
- Resolve priority: options.mode > `TRACEMAP_INVESTIGATION_MODE` > `standard`.
- Pass resolved mode to cache key + provider input.

## Cache requirements
- Include resolved mode in run cache key input.
- Keep current limits profile strategy intact (`mvp-v1`).

## Test requirements
- Mode resolver default/invalid fallback = `standard`.
- Cache key differs by mode.
- Run creation passes resolved mode to cache key and provider input.
- Mock provider remains schema-valid under each mode.

## Acceptance references
- `acceptance/investigation-depth-mode.feature`
