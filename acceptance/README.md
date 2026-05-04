# Acceptance

`acceptance/` stores Gherkin-style scenarios that define observable product behavior.

## Purpose

- Capture behavior in a reviewable, plain-language format.
- Support Tsumiki-style spec-driven delivery with explicit acceptance criteria.
- Provide a stable checklist for manual QA, automation, and review tooling.

## Conventions

- One feature file per feature slice.
- Keep scenarios concrete and user-observable.
- Prefer business language over implementation details.

## Feature files

| Area | File |
|------|------|
| Investigation Mode | `investigation-mode.feature` |
| MVP evidence domain | Existing E2E coverage for claims / alerts / graph behavior |
| Source detail & sharing | `source-detail-and-sharing.feature` |
| Visual design (cyber) | `visual-design-system-cyber.feature` |
| Unknown Map and Source Lineage Lite | `unknown-map-and-source-lineage.feature` |
| Briefing Report | `briefing-report.feature` |
| Real Investigation Pipeline | `real-investigation-pipeline.feature` |
| Cost and Output Limits | `cost-and-output-limits.feature` |
| Source Cache and Fetch Snapshot | `source-cache-and-fetch-snapshot.feature` |
| Run Cache | `run-cache.feature` |
